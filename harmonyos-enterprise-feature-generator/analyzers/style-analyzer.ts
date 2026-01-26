#!/usr/bin/env node

/**
 * 代码风格分析器
 * 功能：分析项目的代码风格，包括命名规范、导入方式、缩进等
 */

import * as fs from 'fs';
import * as path from 'path';

interface CodeStyle {
  naming: {
    components: string;      // PascalCase | camelCase
    functions: string;       // camelCase | PascalCase
    constants: string;       // UPPER_SNAKE_CASE | camelCase
    interfaces: string;      // PascalCase | camelCase
  };
  imports: {
    style: string;           // relative | absolute
    grouping: boolean;       // 是否分组导入
    sorting: boolean;        // 是否排序导入
  };
  indentation: {
    type: string;            // spaces | tabs
    size: number;            // 2 | 4
  };
  quotes: {
    type: string;            // single | double
  };
  semicolons: boolean;       // 是否使用分号
}

interface AnalysisResult extends CodeStyle {
  confidence: number;        // 置信度 (0-1)
  sampleSize: number;        // 样本数量
}

/**
 * 检测命名风格
 */
function detectNamingStyle(name: string): string {
  if (name.includes('_')) {
    return name === name.toUpperCase() ? 'UPPER_SNAKE_CASE' : 'snake_case';
  } else if (/^[A-Z]/.test(name)) {
    return 'PascalCase';
  } else {
    return 'camelCase';
  }
}

/**
 * 分析单个文件的命名风格
 */
function analyzeFileNaming(content: string): {
  components: Map<string, number>;
  functions: Map<string, number>;
  constants: Map<string, number>;
  interfaces: Map<string, number>;
} {
  const components = new Map<string, number>();
  const functions = new Map<string, number>();
  const constants = new Map<string, number>();
  const interfaces = new Map<string, number>();

  // 匹配组件名 @Component struct ComponentName
  const componentRegex = /@Component\s*\n\s*struct\s+(\w+)/g;
  let match;
  while ((match = componentRegex.exec(content)) !== null) {
    const style = detectNamingStyle(match[1]);
    components.set(style, (components.get(style) || 0) + 1);
  }

  // 匹配函数名
  const functionRegex = /\s+(async\s+)?(\w+)\s*\(/g;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[2];
    // 排除关键字
    if (!['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
      const style = detectNamingStyle(name);
      functions.set(style, (functions.get(style) || 0) + 1);
    }
  }

  // 匹配常量 const NAME = ...
  const constantRegex = /const\s+(\w+)\s*=/g;
  while ((match = constantRegex.exec(content)) !== null) {
    const style = detectNamingStyle(match[1]);
    constants.set(style, (constants.get(style) || 0) + 1);
  }

  // 匹配接口名 interface InterfaceName
  const interfaceRegex = /interface\s+(\w+)/g;
  while ((match = interfaceRegex.exec(content)) !== null) {
    const style = detectNamingStyle(match[1]);
    interfaces.set(style, (interfaces.get(style) || 0) + 1);
  }

  return { components, functions, constants, interfaces };
}

/**
 * 分析导入语句
 */
function analyzeImports(content: string): {
  style: string;
  grouping: boolean;
  sorting: boolean;
} {
  const imports: string[] = [];
  const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  if (imports.length === 0) {
    return { style: 'relative', grouping: false, sorting: false };
  }

  // 检测相对导入还是绝对导入
  const relativeCount = imports.filter(imp => imp.startsWith('.')).length;
  const style = relativeCount > imports.length / 2 ? 'relative' : 'absolute';

  // 检测分组（通过空行分隔）
  const importLines = content.match(/import\s+.*?from\s+['"].+?['"]/g) || [];
  let groupingCount = 0;
  for (let i = 0; i < importLines.length - 1; i++) {
    const currentLineEnd = content.indexOf(importLines[i]) + importLines[i].length;
    const nextLineStart = content.indexOf(importLines[i + 1]);
    const linesBetween = content.substring(currentLineEnd, nextLineStart).split('\n').length - 1;
    if (linesBetween > 1) {
      groupingCount++;
    }
  }
  const grouping = groupingCount > 0;

  // 检测排序
  const sorted = [...imports].sort();
  const sorting = JSON.stringify(imports) === JSON.stringify(sorted);

  return { style, grouping, sorting };
}

/**
 * 分析缩进和格式
 */
function analyzeIndentationAndFormat(content: string): {
  indentation: { type: string; size: number };
  quotes: { type: string };
  semicolons: boolean;
} {
  const lines = content.split('\n');

  let spacesCount = 0;
  let tabsCount = 0;
  let singleQuotes = 0;
  let doubleQuotes = 0;
  let semicolons = 0;
  let semicolonPositions: number[] = [];

  lines.forEach(line => {
    // 统计缩进
    const leadingSpaces = line.match(/^\s*/)?.[0] || '';
    if (leadingSpaces.includes('\t')) {
      tabsCount++;
    } else if (leadingSpaces.length > 0) {
      spacesCount++;
    }

    // 统计引号（简单统计）
    singleQuotes += (line.match(/'/g) || []).length;
    doubleQuotes += (line.match(/"/g) || []).length;

    // 统计分号
    const semicolonMatch = line.match(/;/g);
    if (semicolonMatch) {
      semicolons += semicolonMatch.length;
      semicolonPositions.push(lines.indexOf(line));
    }
  });

  // 确定缩进类型
  const indentationType = tabsCount > spacesCount ? 'tabs' : 'spaces';

  // 确定缩进大小（针对空格）
  let indentationSize = 2;
  if (indentationType === 'spaces') {
    const indentedLines = lines.filter(line => line.trim().length > 0);
    if (indentedLines.length > 0) {
      const indents = indentedLines.map(line => {
        const match = line.match(/^\s*/);
        return match ? match[0].length : 0;
      }).filter(size => size > 0);

      if (indents.length > 0) {
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        indentationSize = indents.reduce(gcd);
      }
    }
  }

  // 确定引号类型
  const quotesType = singleQuotes > doubleQuotes ? 'single' : 'double';

  // 确定是否使用分号（简单判断：大部分行末有分号）
  const codeLines = lines.filter(line =>
    line.trim().length > 0 &&
    !line.trim().startsWith('//') &&
    !line.trim().startsWith('import') &&
    !line.trim().startsWith('export')
  );
  const semicolonUsage = codeLines.filter(line => line.trim().endsWith(';')).length;
  const semicolons = semicolonUsage > codeLines.length / 2;

  return {
    indentation: { type: indentationType, size: indentationSize },
    quotes: { type: quotesType },
    semicolons
  };
}

/**
 * 从 Map 中获取最常见的值
 */
function getMostCommon(map: Map<string, number>): string {
  let maxCount = 0;
  let mostCommon = '';

  map.forEach((count, key) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = key;
    }
  });

  return mostCommon || 'camelCase';
}

/**
 * 分析代码风格
 */
function analyzeCodeStyle(files: string[]): AnalysisResult {
  const namingData = {
    components: new Map<string, number>(),
    functions: new Map<string, number>(),
    constants: new Map<string, number>(),
    interfaces: new Map<string, number>()
  };

  const importData: {
    relative: number;
    absolute: number;
    grouping: number;
    sorting: number;
  } = {
    relative: 0,
    absolute: 0,
    grouping: 0,
    sorting: 0
  };

  const indentationData: {
    spaces: number;
    tabs: number;
    size2: number;
    size4: number;
  } = {
    spaces: 0,
    tabs: 0,
    size2: 0,
    size4: 0
  };

  const quotesData: {
    single: number;
    double: number;
  } = {
    single: 0,
    double: 0
  };

  let semicolonCount = 0;
  let totalFiles = 0;

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // 分析命名
      const naming = analyzeFileNaming(content);
      naming.components.forEach((count, style) => {
        namingData.components.set(style, (namingData.components.get(style) || 0) + count);
      });
      naming.functions.forEach((count, style) => {
        namingData.functions.set(style, (namingData.functions.get(style) || 0) + count);
      });
      naming.constants.forEach((count, style) => {
        namingData.constants.set(style, (namingData.constants.get(style) || 0) + count);
      });
      naming.interfaces.forEach((count, style) => {
        namingData.interfaces.set(style, (namingData.interfaces.get(style) || 0) + count);
      });

      // 分析导入
      const imports = analyzeImports(content);
      importData[imports.style]++;
      if (imports.grouping) importData.grouping++;
      if (imports.sorting) importData.sorting++;

      // 分析缩进和格式
      const format = analyzeIndentationAndFormat(content);
      if (format.indentation.type === 'spaces') indentationData.spaces++;
      else indentationData.tabs++;
      if (format.indentation.size === 2) indentationData.size2++;
      else if (format.indentation.size === 4) indentationData.size4++;

      if (format.quotes.type === 'single') quotesData.single++;
      else quotesData.double++;

      if (format.semicolons) semicolonCount++;

      totalFiles++;
    } catch (error) {
      console.error(`分析文件失败: ${file}`, error);
    }
  });

  // 构建结果
  const result: AnalysisResult = {
    naming: {
      components: getMostCommon(namingData.components),
      functions: getMostCommon(namingData.functions),
      constants: getMostCommon(namingData.constants),
      interfaces: getMostCommon(namingData.interfaces)
    },
    imports: {
      style: importData.relative > importData.absolute ? 'relative' : 'absolute',
      grouping: importData.grouping > totalFiles / 2,
      sorting: importData.sorting > totalFiles / 2
    },
    indentation: {
      type: indentationData.spaces > indentationData.tabs ? 'spaces' : 'tabs',
      size: indentationData.size2 > indentationData.size4 ? 2 : 4
    },
    quotes: {
      type: quotesData.single > quotesData.double ? 'single' : 'double'
    },
    semicolons: semicolonCount > totalFiles / 2,
    confidence: totalFiles > 0 ? Math.min(totalFiles / 10, 1) : 0,
    sampleSize: totalFiles
  };

  return result;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node style-analyzer.ts <project-path> [--sample-size <number>]');
    process.exit(1);
  }

  const projectPath = args[0];
  const sampleSizeIndex = args.indexOf('--sample-size');
  const sampleSize = sampleSizeIndex >= 0 ? parseInt(args[sampleSizeIndex + 1]) || 10 : 10;

  if (!fs.existsSync(projectPath)) {
    console.error(`项目路径不存在: ${projectPath}`);
    process.exit(1);
  }

  // 扫描所有 .ets 文件
  const scanDirectory = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && item !== 'node_modules' && !item.startsWith('.')) {
        files.push(...scanDirectory(fullPath));
      } else if (stat.isFile() && item.endsWith('.ets')) {
        files.push(fullPath);
      }
    });

    return files;
  };

  try {
    const allFiles = scanDirectory(projectPath);
    const files = allFiles.slice(0, sampleSize);

    if (files.length === 0) {
      console.error('未找到 .ets 文件');
      process.exit(1);
    }

    const style = analyzeCodeStyle(files);
    console.log(JSON.stringify(style, null, 2));
  } catch (error) {
    console.error('分析代码风格失败:', error);
    process.exit(1);
  }
}

main();
