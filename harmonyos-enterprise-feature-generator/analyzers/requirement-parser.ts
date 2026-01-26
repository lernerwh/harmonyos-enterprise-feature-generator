#!/usr/bin/env node

/**
 * 需求解析器
 * 功能：将自由文本需求转换为结构化的需求规范
 */

interface Requirement {
  moduleName: string;
  description: string;
  pages: Page[];
  dataModels: DataModel[];
  permissions: PermissionConfig;
  features: string[];
}

interface Page {
  name: string;
  type: 'list' | 'detail' | 'edit' | 'form' | 'dashboard' | 'custom';
  description: string;
  permissions?: string[];
}

interface DataModel {
  name: string;
  description: string;
  fields: Field[];
}

interface Field {
  name: string;
  type: string;
  description: string;
  required: boolean;
  editable: boolean;
}

interface PermissionConfig {
  mode: 'rbac' | 'abac' | 'simple';
  roles?: string[];
  permissions?: string[];
  rules?: string[];
}

/**
 * 解析需求文本
 */
function parseRequirement(text: string): Requirement {
  const requirement: Requirement = {
    moduleName: '',
    description: '',
    pages: [],
    dataModels: [],
    permissions: {
      mode: 'simple'
    },
    features: []
  };

  // 1. 提取模块名称
  requirement.moduleName = extractModuleName(text);

  // 2. 提取描述
  requirement.description = extractDescription(text);

  // 3. 解析页面
  requirement.pages = parsePages(text);

  // 4. 解析数据模型
  requirement.dataModels = parseDataModels(text);

  // 5. 解析权限配置
  requirement.permissions = parsePermissions(text);

  // 6. 提取功能列表
  requirement.features = extractFeatures(text);

  return requirement;
}

/**
 * 提取模块名称
 */
function extractModuleName(text: string): string {
  // 常见模式
  const patterns = [
    /(?:需要|添加|实现|创建)[\s\u4e00-\u9fa5]*([a-zA-Z\u4e00-\u9fa5]+)(?:管理|功能|模块|系统)/,
    /([a-zA-Z\u4e00-\u9fa5]+)(?:管理|功能|模块|系统)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 默认名称
  return 'Module';
}

/**
 * 提取描述
 */
function extractDescription(text: string): string {
  // 提取第一句话作为描述
  const firstSentence = text.match(/^(.+)。/);
  if (firstSentence) {
    return firstSentence[1].trim();
  }

  // 提取前100个字符
  return text.substring(0, 100).trim();
}

/**
 * 解析页面
 */
function parsePages(text: string): Page[] {
  const pages: Page[] = [];

  // 页面关键词映射
  const pageKeywords: Record<string, Page['type']> = {
    '列表': 'list',
    '详情': 'detail',
    '编辑': 'edit',
    '表单': 'form',
    '仪表盘': 'dashboard',
    '新增': 'edit',
    '创建': 'edit',
    '修改': 'edit',
    '查看': 'detail'
  };

  // 查找页面相关描述
  for (const [keyword, type] of Object.entries(pageKeywords)) {
    const regex = new RegExp(`([a-zA-Z\u4e00-\u9fa5]+)${keyword}(?:页|页面)`, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const name = match[1] + keyword;
      pages.push({
        name: name,
        type: type,
        description: `${keyword}页面`
      });
    }
  }

  // 如果没有找到明确页面，尝试推断
  if (pages.length === 0) {
    const moduleName = extractModuleName(text);
    pages.push(
      {
        name: moduleName + 'List',
        type: 'list',
        description: '列表页'
      },
      {
        name: moduleName + 'Detail',
        type: 'detail',
        description: '详情页'
      },
      {
        name: moduleName + 'Edit',
        type: 'edit',
        description: '编辑页'
      }
    );
  }

  return pages;
}

/**
 * 解析数据模型
 */
function parseDataModels(text: string): DataModel[] {
  const models: DataModel[] = [];

  // 查找实体描述
  const entityPatterns = [
    /([a-zA-Z\u4e00-\u9fa5]+)(?:实体|模型|对象)[\s\S]*?包含[：:]\s*([^\n]+)/,
    /([a-zA-Z\u4e00-\u9fa5]+)(?:实体|模型|对象)[\s\S]*?有[：:]\s*([^\n]+)/
  ];

  for (const pattern of entityPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const modelName = match[1];
      const fieldsText = match[2];

      const model: DataModel = {
        name: modelName,
        description: `${modelName}数据模型`,
        fields: parseFields(fieldsText)
      };

      models.push(model);
    }
  }

  // 如果没有找到明确模型，创建默认模型
  if (models.length === 0) {
    const moduleName = extractModuleName(text);
    models.push({
      name: moduleName,
      description: `${moduleName}数据模型`,
      fields: [
        { name: 'id', type: 'string', description: 'ID', required: true, editable: false },
        { name: 'name', type: 'string', description: '名称', required: true, editable: true }
      ]
    });
  }

  return models;
}

/**
 * 解析字段
 */
function parseFields(text: string): Field[] {
  const fields: Field[] = [];

  // 分割字段描述
  const fieldItems = text.split(/[,，、;；]/);

  fieldItems.forEach(item => {
    const trimmed = item.trim();
    if (!trimmed) return;

    // 解析字段名称和类型
    const match = trimmed.match(/([a-zA-Z\u4e00-\u9fa5]+)(?:[:：]\s*([a-zA-Z]+))?/);
    if (match) {
      const name = match[1];
      const type = match[2] || inferFieldType(name);

      fields.push({
        name: name,
        type: type,
        description: name,
        required: false,
        editable: true
      });
    }
  });

  return fields;
}

/**
 * 推断字段类型
 */
function inferFieldType(fieldName: string): string {
  const name = fieldName.toLowerCase();

  if (name.includes('id') || name.includes('编号')) {
    return 'string';
  } else if (name.includes('time') || name.includes('date') || name.includes('时间') || name.includes('日期')) {
    return 'Date';
  } else if (name.includes('num') || name.includes('count') || name.includes('数量') || name.includes('数字')) {
    return 'number';
  } else if (name.includes('price') || name.includes('amount') || name.includes('价格') || name.includes('金额')) {
    return 'number';
  } else if (name.includes('is') || name.includes('has') || name.includes('是否')) {
    return 'boolean';
  }

  return 'string';
}

/**
 * 解析权限配置
 */
function parsePermissions(text: string): PermissionConfig {
  const config: PermissionConfig = {
    mode: 'simple'
  };

  // 检测 RBAC 模式
  if (text.includes('角色') || text.includes('管理员') || text.includes('普通用户')) {
    config.mode = 'rbac';

    // 提取角色
    const roles: string[] = [];
    const rolePatterns = [
      /管理员/g,
      /经理/g,
      /普通用户/g,
      /访客/g
    ];

    rolePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const role = match[0];
        if (!roles.includes(role)) {
          roles.push(role);
        }
      }
    });

    config.roles = roles;
  }

  // 检测 ABAC 模式
  if (text.includes('部门') && text.includes('金额')) {
    config.mode = 'abac';
    config.rules = ['部门', '金额'];
  }

  // 提取权限
  const permissions: string[] = [];
  const permissionKeywords = ['查看', '创建', '编辑', '删除', '审批', '导出'];

  permissionKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      permissions.push(keyword);
    }
  });

  if (permissions.length > 0) {
    config.permissions = permissions;
  }

  return config;
}

/**
 * 提取功能列表
 */
function extractFeatures(text: string): string[] {
  const features: string[] = [];

  // 常见功能模式
  const patterns = [
    /支持([\u4e00-\u9fa5]+)/g,
    /可以([\u4e00-\u9fa5]+)/g,
    /实现([\u4e00-\u9fa5]+)/g,
    /包含([\u4e00-\u9fa5]+)/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const feature = match[1];
      if (!features.includes(feature)) {
        features.push(feature);
      }
    }
  });

  return features;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node requirement-parser.ts "需求文本"');
    process.exit(1);
  }

  const requirementText = args.join(' ');

  try {
    const requirement = parseRequirement(requirementText);
    console.log(JSON.stringify(requirement, null, 2));
  } catch (error) {
    console.error('解析需求失败:', error);
    process.exit(1);
  }
}

main();
