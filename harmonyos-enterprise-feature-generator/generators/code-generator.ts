#!/usr/bin/env node

/**
 * 代码生成器
 * 功能：根据需求、代码风格和项目结构生成代码
 */

import * as fs from 'fs';
import * as path from 'path';
import { Requirement } from '../analyzers/requirement-parser';
import { CodeStyle } from '../analyzers/style-analyzer';
import { ProjectStructure } from '../analyzers/project-scanner';

interface GeneratorOptions {
  requirement: Requirement;
  style: CodeStyle;
  projectStructure: ProjectStructure;
  output: string;
}

/**
 * 主生成器类
 */
class CodeGenerator {
  private options: GeneratorOptions;
  private templatesPath: string;

  constructor(options: GeneratorOptions) {
    this.options = options;
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  /**
   * 生成所有代码
   */
  generate(): void {
    console.log('开始生成代码...');

    // 1. 生成页面
    this.generatePages();

    // 2. 生成服务
    this.generateServices();

    // 3. 生成权限代码
    this.generatePermissions();

    // 4. 生成工具类
    this.generateUtils();

    // 5. 更新路由配置
    this.updateRoutes();

    console.log('代码生成完成！');
  }

  /**
   * 生成页面
   */
  private generatePages(): void {
    const pagesDir = path.join(this.options.output, 'entry', 'src', 'main', 'ets', 'pages');

    // 确保目录存在
    if (!fs.existsSync(pagesDir)) {
      fs.mkdirSync(pagesDir, { recursive: true });
    }

    this.options.requirement.pages.forEach(page => {
      const templateFile = this.getTemplateFile(page.type);
      if (!templateFile) {
        console.warn(`未找到页面模板: ${page.type}`);
        return;
      }

      const content = this.loadAndProcessTemplate(templateFile, page);
      const outputFile = path.join(pagesDir, `${page.name}.ets`);

      fs.writeFileSync(outputFile, content);
      console.log(`生成页面: ${outputFile}`);
    });
  }

  /**
   * 生成服务
   */
  private generateServices(): void {
    const servicesDir = path.join(this.options.output, 'entry', 'src', 'main', 'ets', 'services');

    // 确保目录存在
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }

    // 为每个数据模型生成服务
    this.options.requirement.dataModels.forEach(model => {
      const templateFile = path.join(this.templatesPath, 'service-base.ets');
      const content = this.loadAndProcessTemplate(templateFile, { model });
      const outputFile = path.join(servicesDir, `${model.name}Service.ets`);

      fs.writeFileSync(outputFile, content);
      console.log(`生成服务: ${outputFile}`);
    });
  }

  /**
   * 生成权限代码
   */
  private generatePermissions(): void {
    const utilsDir = path.join(this.options.output, 'entry', 'src', 'main', 'ets', 'utils');

    // 确保目录存在
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    // 根据权限模式选择模板
    const permissionMode = this.options.requirement.permissions.mode;
    const templateFile = path.join(this.templatesPath, `permission-${permissionMode}.ets`);
    const content = this.loadAndProcessTemplate(templateFile, {});
    const outputFile = path.join(utilsDir, 'permission-check.ets');

    fs.writeFileSync(outputFile, content);
    console.log(`生成权限: ${outputFile}`);
  }

  /**
   * 生成工具类
   */
  private generateUtils(): void {
    const utilsDir = path.join(this.options.output, 'entry', 'src', 'main', 'ets', 'utils');

    // 确保目录存在
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    // 生成错误处理器
    const errorProcessorTemplate = path.join(this.templatesPath, 'error-processor.ets');
    const errorProcessorContent = fs.readFileSync(errorProcessorTemplate, 'utf-8');
    fs.writeFileSync(path.join(utilsDir, 'error-processor.ets'), errorProcessorContent);
    console.log('生成工具: error-processor.ets');

    // 生成日志工具
    const loggerTemplate = path.join(this.templatesPath, 'logger.ets');
    const loggerContent = fs.readFileSync(loggerTemplate, 'utf-8');
    fs.writeFileSync(path.join(utilsDir, 'logger.ets'), loggerContent);
    console.log('生成工具: logger.ets');
  }

  /**
   * 更新路由配置
   */
  private updateRoutes(): void {
    const routesFile = this.options.projectStructure.structure.routes;

    if (!routesFile || !fs.existsSync(routesFile)) {
      console.warn('路由配置文件不存在');
      return;
    }

    // 读取现有路由配置
    const routesContent = fs.readFileSync(routesFile, 'utf-8');
    const routes = JSON.parse(routesContent);

    // 添加新页面的路由
    this.options.requirement.pages.forEach(page => {
      const routePath = `pages/${page.name}`;
      if (!routes.includes(routePath)) {
        routes.push(routePath);
      }
    });

    // 写回文件
    fs.writeFileSync(routesFile, JSON.stringify(routes, null, 2));
    console.log(`更新路由配置: ${routesFile}`);
  }

  /**
   * 获取模板文件
   */
  private getTemplateFile(pageType: string): string | null {
    const templateMap: Record<string, string> = {
      'list': 'page-list.ets',
      'detail': 'page-detail.ets',
      'edit': 'page-edit.ets',
      'form': 'page-edit.ets'
    };

    const templateName = templateMap[pageType];
    if (templateName) {
      return path.join(this.templatesPath, templateName);
    }

    return null;
  }

  /**
   * 加载并处理模板
   */
  private loadAndProcessTemplate(templateFile: string, context: any): string {
    let content = fs.readFileSync(templateFile, 'utf-8');

    // 替换占位符
    content = this.replacePlaceholders(content, context);

    // 应用代码风格
    content = this.applyCodeStyle(content);

    return content;
  }

  /**
   * 替换占位符
   */
  private replacePlaceholders(content: string, context: any): string {
    const moduleName = this.options.requirement.moduleName;

    // 基本占位符
    const replacements: Record<string, string> = {
      '{{moduleName}}': moduleName.toLowerCase(),
      '{{ModuleName}}': this.capitalize(moduleName),
      '{{PageName}}': context.name || '',
      '{{ServiceName}}': `${this.capitalize(moduleName)}Service`,
      '{{serviceName}}': `${this.camelCase(moduleName)}Service`,
      '{{DataType}}': this.capitalize(moduleName),
      '{{IdField}}': 'id',
      '{{DisplayField}}': 'name',
      '{{DetailPageName}}': `${moduleName}Detail`,
      '{{EditPageName}}': `${moduleName}Edit`,
      '{{PermissionKey}}': `${moduleName.toLowerCase()}_view`
    };

    // 执行替换
    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    // 数据模型字段占位符
    if (context.model) {
      const fields = context.model.fields || [];
      if (fields.length > 0) {
        const firstField = fields[0].name;
        const secondField = fields.length > 1 ? fields[1].name : 'description';
        const thirdField = fields.length > 2 ? fields[2].name : 'remark';

        content = content.replace(/{{Field1}}/g, this.capitalize(firstField));
        content = content.replace(/{{field1}}/g, this.camelCase(firstField));
        content = content.replace(/{{Field2}}/g, this.capitalize(secondField));
        content = content.replace(/{{field2}}/g, this.camelCase(secondField));
        content = content.replace(/{{Field3}}/g, this.capitalize(thirdField));
        content = content.replace(/{{field3}}/g, this.camelCase(thirdField));
      }
    }

    return content;
  }

  /**
   * 应用代码风格
   */
  private applyCodeStyle(content: string): string {
    const style = this.options.style;

    // 应用缩进
    if (style.indentation.type === 'spaces') {
      // 将制表符替换为空格
      content = content.replace(/\t/g, ' '.repeat(style.indentation.size));
    }

    // 应用引号风格（简单处理）
    if (style.quotes.type === 'single') {
      // 将双引号字符串替换为单引号（注意：只替换字符串字面量）
      // 这里简化处理，实际需要更复杂的解析
      // content = content.replace(/"([^"]*)"/g, "'$1'");
    }

    return content;
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 驼峰命名
   */
  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 6) {
    console.error('用法: node code-generator.ts --requirement <file> --style <file> --project-structure <file> --output <path>');
    process.exit(1);
  }

  const requirementIndex = args.indexOf('--requirement');
  const styleIndex = args.indexOf('--style');
  const structureIndex = args.indexOf('--project-structure');
  const outputIndex = args.indexOf('--output');

  if (requirementIndex < 0 || styleIndex < 0 || structureIndex < 0 || outputIndex < 0) {
    console.error('缺少必需参数');
    process.exit(1);
  }

  const requirementFile = args[requirementIndex + 1];
  const styleFile = args[styleIndex + 1];
  const structureFile = args[structureIndex + 1];
  const outputPath = args[outputIndex + 1];

  try {
    // 读取配置文件
    const requirement: Requirement = JSON.parse(fs.readFileSync(requirementFile, 'utf-8'));
    const style: CodeStyle = JSON.parse(fs.readFileSync(styleFile, 'utf-8'));
    const projectStructure: ProjectStructure = JSON.parse(fs.readFileSync(structureFile, 'utf-8'));

    // 创建生成器并生成代码
    const generator = new CodeGenerator({
      requirement,
      style,
      projectStructure,
      output: outputPath
    });

    generator.generate();
  } catch (error) {
    console.error('生成代码失败:', error);
    process.exit(1);
  }
}

main();
