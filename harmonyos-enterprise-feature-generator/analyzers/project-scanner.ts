#!/usr/bin/env node

/**
 * 项目扫描器
 * 功能：扫描鸿蒙项目结构，识别关键文件和目录
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProjectStructure {
  structure: {
    pages: string[];
    services: string[];
    components: string[];
    routes: string;
    resources: string;
  };
  existingModules: string[];
  entryPath: string;
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和隐藏目录
      if (item !== 'node_modules' && !item.startsWith('.')) {
        files.push(...scanDirectory(fullPath, extensions));
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

/**
 * 分析项目结构
 */
function analyzeProject(projectPath: string): ProjectStructure {
  const structure: ProjectStructure = {
    structure: {
      pages: [],
      services: [],
      components: [],
      routes: '',
      resources: ''
    },
    existingModules: [],
    entryPath: ''
  };

  // 查找 entry 目录
  const entryPath = findEntryDirectory(projectPath);
  if (!entryPath) {
    console.error('未找到 entry 目录');
    process.exit(1);
  }

  structure.entryPath = entryPath;

  // 扫描页面
  const pagesDir = path.join(entryPath, 'src', 'main', 'ets', 'pages');
  if (fs.existsSync(pagesDir)) {
    structure.structure.pages = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.ets'))
      .map(file => path.join(pagesDir, file));
  }

  // 扫描服务
  const servicesDir = path.join(entryPath, 'src', 'main', 'ets', 'services');
  if (fs.existsSync(servicesDir)) {
    structure.structure.services = fs.readdirSync(servicesDir)
      .filter(file => file.endsWith('.ets'))
      .map(file => path.join(servicesDir, file));
  }

  // 扫描组件
  const componentsDir = path.join(entryPath, 'src', 'main', 'ets', 'components');
  if (fs.existsSync(componentsDir)) {
    structure.structure.components = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.ets'))
      .map(file => path.join(componentsDir, file));
  }

  // 查找路由配置文件
  const routesPath = path.join(entryPath, 'src', 'main', 'resources', 'base', 'profile', 'main_pages.json');
  if (fs.existsSync(routesPath)) {
    structure.structure.routes = routesPath;
  }

  // 查找资源目录
  const resourcesPath = path.join(entryPath, 'src', 'main', 'resources');
  if (fs.existsSync(resourcesPath)) {
    structure.structure.resources = resourcesPath;
  }

  // 分析现有模块（基于页面名称）
  structure.existingModules = structure.structure.pages.map(page => {
    const name = path.basename(page, '.ets');
    // 移除常见的后缀（List, Detail, Edit 等）
    return name.replace(/(List|Detail|Edit)$/, '');
  });

  return structure;
}

/**
 * 查找 entry 目录
 */
function findEntryDirectory(projectPath: string): string | null {
  // 常见的 entry 目录位置
  const possiblePaths = [
    path.join(projectPath, 'entry'),
    path.join(projectPath, 'Entry'),
    path.join(projectPath, 'app', 'entry')
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  return null;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node project-scanner.ts <project-path>');
    process.exit(1);
  }

  const projectPath = args[0];

  if (!fs.existsSync(projectPath)) {
    console.error(`项目路径不存在: ${projectPath}`);
    process.exit(1);
  }

  try {
    const structure = analyzeProject(projectPath);
    console.log(JSON.stringify(structure, null, 2));
  } catch (error) {
    console.error('扫描项目失败:', error);
    process.exit(1);
  }
}

main();
