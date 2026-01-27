# GitHub-KB Skill 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个智能的 GitHub 知识库搜索 skill，通过上下文感知触发，自动在 GitHub 上搜索代码示例、文档和讨论

**Architecture:** 使用 GitHub REST API 和 Code Search API，结合 AI 语义理解，提供分层呈现的搜索结果

**Tech Stack:**
- TypeScript + Node.js
- GitHub REST API (octokit)
- GitHub Code Search API v2
- AI API（用于语义理解）
- JSON 文件缓存

---

## Phase 1: 项目基础框架

### Task 1: 创建项目结构和配置文件

**Files:**
- Create: `../github-kb/package.json`
- Create: `../github-kb/tsconfig.json`
- Create: `../github-kb/.gitignore`
- Create: `../github-kb/src/types.ts`
- Create: `../github-kb/src/cache.ts`

**Step 1: 创建 package.json**

```bash
cat > ../github-kb/package.json << 'EOF'
{
  "name": "github-kb",
  "version": "1.0.0",
  "description": "GitHub 知识库搜索 skill - 智能搜索代码示例、文档和讨论",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": [
    "github",
    "code-search",
    "knowledge-base",
    "claude-skill"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "typescript": "^5.3.0",
    "octokit": "^4.0.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
EOF
```

**Step 2: 创建 tsconfig.json**

```bash
cat > ../github-kb/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
```

**Step 3: 创建目录结构**

```bash
cd ../github-kb
mkdir -p src/searchers src/filters src/formatters utils
```

**Step 4: 创建 .gitignore**

```bash
cat > ../github-kb/.gitignore << 'EOF'
node_modules/
dist/
.env
*.log
.DS_Store
.cache/
EOF
```

**Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore src/
git commit -m "feat: 初始化 github-kb 项目结构

- 创建 package.json，定义项目依赖
- 创建 tsconfig.json，配置 TypeScript 编译选项
- 创建模块目录结构（searchers/filters/formatters/utils）
- 添加 .gitignore

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: 定义核心类型和接口

**Files:**
- Create: `../github-kb/src/types.ts`

**Step 1: 创建类型定义文件**

```typescript
/**
 * 搜索选项
 */
export interface SearchOptions {
  query: string;
  language?: string;
  type?: 'code' | 'repositories' | 'issues' | 'discussions' | 'all';
  maxResults?: number;
  sortBy?: 'relevance' | 'stars' | 'updated';
}

/**
 * 代码片段
 */
export interface CodeSnippet {
  name: string;
  path: string;
  repository: string;
  language: string;
  code: string;
  url: string;
  stars: number;
  updatedAt: string;
}

/**
 * 仓库信息
 */
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  updatedAt: string;
}

/**
 * Issue/Discussion
 */
export interface Issue {
  id: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  repository: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  type: 'code' | 'repository' | 'issue' | 'discussion';
  relevanceScore: number;
  data: CodeSnippet | Repository | Issue;
}

/**
 * 知识卡片
 */
export interface KnowledgeCard {
  id: string;
  type: 'github-code' | 'github-repo' | 'github-issue';
  title: string;
  summary: string;
  code?: string;
  metadata: {
    url: string;
    stars?: number;
    language?: string;
    updatedAt: string;
  };
  tags: string[];
  createdAt: Date;
}

/**
 * 缓存结构
 */
export interface KnowledgeCache {
  searchResults: Map<string, SearchResult[]>;
  codeSnippets: Map<string, CodeSnippet[]>;
  repositories: Map<string, Repository>;
  lastUpdated: number;
}
```

**Step 2: 验证并提交**

```bash
npx tsc --noEmit src/types.ts
git add src/types.ts
git commit -m "feat: 定义核心类型和接口

- 定义 SearchOptions、SearchResult 等输入输出类型
- 定义 CodeSnippet、Repository、Issue 数据模型
- 定义 KnowledgeCard 和 KnowledgeCache
- 定义完整的类型系统，支持搜索和缓存功能

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: GitHub API 集成

### Task 3: 实现 GitHub API 封装

**Files:**
- Create: `../github-kb/utils/github-api.ts`
- Create: `../github-kb/utils/query-builder.ts`

**核心代码**：(参见设计文档中的完整代码)

**提交信息**：
```
feat: 实现 GitHub API 封装和查询构建器

- 创建 GitHubAPI 类，封装常用搜索方法
- 创建 QueryBuilder 类，智能构建查询
- 支持代码、仓库、Issues 搜索
- 实现问题类型识别

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: 搜索器实现

### Task 4: 实现主搜索器

**Files:**
- Create: `../github-kb/src/searchers/github-search.ts`

**核心功能**：
- GitHubSearcher 类
- 并行搜索代码、仓库、Issues
- 相关性评分算法
- 结果排序和合并

**提交信息**：
```
feat: 实现主搜索器

- 创建 GitHubSearcher 类
- 支持代码、仓库、Issues 全面搜索
- 实现智能相关性评分算法
- 集成 QueryBuilder 和 GitHubAPI

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: 结果格式化器

### Task 5: 实现摘要生成器

**Files:**
- Create: `../github-kb/src/formatters/summary-formatter.ts`

**核心功能**：
- SummaryFormatter 类
- 生成搜索结果摘要
- 提取关键发现

**提交信息**：
```
feat: 实现摘要生成器

- 创建 SummaryFormatter 类
- 生成搜索结果摘要（总数、分类、关键发现）
- 提取代码示例、推荐项目、相关讨论
- 为用户提供快速概览

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 5: 文档和 Skill 定义

### Task 6: 创建 SKILL.md 和 README.md

**Files:**
- Create: `../github-kb/SKILL.md`
- Create: `../github-kb/README.md`

**核心内容**：
- SKILL.md：触发条件定义、使用场景、快速参考
- README.md：功能特性、安装配置、使用示例、技术架构

**提交信息**：
```
feat: 创建 SKILL.md 和 README.md

- 定义 skill 触发条件和使用场景
- 编写完整的使用文档和示例
- 说明技术架构和配置方法

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 实施计划总结

**完成进度**: Phase 1-5 完整实施计划

**技术栈**：
- TypeScript + Node.js
- GitHub REST API (octokit)
- GitHub Code Search API v2
- JSON 文件缓存

**成功标准**：
- ✅ 搜索响应时间 < 5 秒
- ✅ 结果相关性 > 85%
- ✅ 缓存命中率 > 40%
- ✅ 支持 10+ 种编程语言

**预计工作量**: 4-6 小时

**下一步**：
1. 准备实施环境
2. 按计划逐个执行任务
3. 测试和验证功能
4. 部署和文档完善
