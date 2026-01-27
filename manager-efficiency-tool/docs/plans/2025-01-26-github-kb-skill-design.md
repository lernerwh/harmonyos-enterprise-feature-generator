# GitHub-KB Skill 设计文档

## 概述

创建一个智能的 GitHub 知识库搜索 skill，通过上下文感知触发，自动在 GitHub 上搜索代码示例、文档、讨论和项目，并以分层方式呈现结果（摘要 → 详情 → 链接），为用户提供可执行的技术参考。

**核心特性**：
- 智能触发：根据对话上下文自动判断何时需要搜索
- 全面搜索：代码、文档、Issues、Discussions、仓库
- 分层呈现：摘要 → 详情 → 链接，用户可控信息粒度
- 知识缓存：保存搜索结果供后续复用
- 相关性排序：智能过滤和质量评分

---

## 整体架构

### 目录结构

```
github-kb/
├── SKILL.md                    # Skill 定义和触发条件
├── README.md                   # 使用文档
├── USAGE.md                    # 详细使用指南
├── src/
│   ├── searchers/              # 搜索器模块
│   │   ├── github-search.ts    # GitHub 搜索器
│   │   ├── code-search.ts      # 代码搜索器
│   │   └── semantic-analyzer.ts # 语义分析器
│   ├── filters/                # 结果过滤器
│   │   ├── relevance-filter.ts # 相关性过滤
│   │   └── quality-filter.ts   # 质量过滤
│   ├── formatters/             # 结果格式化器
│   │   ├── summary-formatter.ts # 摘要生成器
│   │   ├── detail-formatter.ts  # 详情提取器
│   │   └── card-formatter.ts    # 知识卡片生成器
│   ├── cache.ts                # 搜索缓存
│   └── types.ts                # 类型定义
└── utils/
    ├── github-api.ts           # GitHub API 封装
    ├── query-builder.ts        # 查询构建器
    └── context-analyzer.ts     # 上下文分析器
```

### 工作流程

1. 用户提问时，分析对话上下文判断是否需要搜索
2. 使用 AI 理解问题意图，提取关键信息
3. 智能选择搜索策略（代码/文档/Issues/仓库）
4. 并行执行多个 GitHub API 搜索
5. 过滤和排序结果，提取最相关的内容
6. 分层呈现：摘要 → 详情 → 链接
7. 保存到本地知识库供后续参考

### 技术选型

- **GitHub REST API**: 搜索仓库、Issues、Discussions
- **GitHub Code Search API v2**: 精确代码搜索
- **AI API**: 语义理解和查询优化
- **本地缓存**: JSON 文件或 SQLite
- **向量搜索**（可选）: 语义匹配

---

## 智能触发和上下文分析

### 触发条件

```yaml
---
name: github-kb
description: Use when searching GitHub for code examples, documentation, discussions, or solutions related to the user's question. Automatically triggers when context indicates missing information or when user asks about implementation patterns, best practices, or specific technical problems.
---
```

### 触发机制

**上下文感知触发**：
1. 检查对话历史是否已经包含相关答案
2. 识别问题类型（实现/调试/选型/最佳实践）
3. 判断当前信息是否足够回答问题
4. 避免重复搜索（检查最近是否搜索过类似问题）

**触发流程**：
```typescript
function shouldTriggerSearch(question: string, context: ConversationContext): boolean {
  // 1. 检查是否最近已经搜索过类似问题
  if (hasRecentSimilarSearch(question, context)) {
    return false;
  }

  // 2. 分析问题类型
  const questionType = analyzeQuestionType(question);

  // 3. 检查上下文是否已有答案
  const hasAnswerInContext = checkContextForAnswer(question, context);

  // 4. 决策：是否需要搜索
  return questionType === 'implementation' && !hasAnswerInContext;
}
```

**问题类型识别**：
- **实现类**："如何实现 X"、"怎么写 Y"
- **调试类**："为什么报错"、"如何修复"
- **选型类**："用什么库"、"哪个方案好"
- **最佳实践**："有什么建议"、"推荐做法"

---

## 搜索器实现

### GitHub 搜索器接口

```typescript
export class GitHubSearcher {
  async searchRepositories(query: string): Promise<Repository[]>
  async searchCode(query: string, language?: string): Promise<CodeSnippet[]>
  async searchIssues(query: string, language?: string): Promise<Issue[]>
  async searchDiscussions(query: string): Promise<Discussion[]>
}
```

### 搜索策略映射

| 问题类型 | 搜索目标 | 查询模式示例 |
|---------|---------|--------------|
| 实现类 | Code + Repositories | `language:typescript React hooks example` |
| 调试类 | Issues + Discussions | `useEffect cleanup error language:javascript` |
| 选型类 | Repositories | `state management stars:>1000 language:typescript` |
| 最佳实践 | Code + README | `async error handling best practices` |

### 搜索特性

- **精确语法**：支持 `language:`, `path:`, `stars:>` 等限定符
- **正则表达式**：支持代码模式匹配
- **组合查询**：同时搜索多个目标并合并结果
- **智能排序**：按相关性、时间、质量评分

---

## 结果过滤和分层呈现

### 三层过滤机制

**第一层：相关性过滤**
- 关键词匹配度（40%）
- 时间新鲜度（30%）
- 质量评分（30%）

**第二层：质量过滤**
- 过滤低质量内容（星标 < 10）
- 过滤陈旧代码（2 年未更新）
- 过滤无描述仓库
- 测试/示例代码优先

**第三层：安全过滤**
- 检查恶意代码
- 过滤敏感信息
- 验证代码安全性

### 分层呈现结构

**第一层：摘要**（3-5 个要点）
```
🔍 搜索 "React useEffect cleanup" 的结果：

📝 共找到 23 个相关结果
⭐ 推荐 3 个高质量示例
🔗 2 个官方文档
💬 5 个相关讨论

核心发现：
1. 官方推荐使用 cleanup 函数模式
2. 常见误区：依赖项为空时不执行
3. 最佳实践：返回 cleanup 函数
```

**第二层：详细内容**（可展开）
```
✅ React 官方文档 - useEffect 清理模式
📍 facebook/react/issues
⭐ 32k stars | 更新于 3 天前

摘要：官方推荐的 useEffect 清理函数使用模式

代码示例：
useEffect(() => {
  const subscription = source.subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [source]);

关键要点：
• cleanup 函数在 effect 重新执行前运行
• 适合订阅、定时器等清理场景
• 确保返回的函数是纯函数

🔗 查看完整文档 | 🔗 查看 Discussion
```

**第三层：原始链接**
- GitHub 仓库链接
- Issue/Discussion 链接
- 代码片段永久链接

---

## 知识库缓存

### 缓存结构

```typescript
interface KnowledgeCache {
  searchResults: Map<string, SearchResult[]>;
  codeSnippets: Map<string, CodeSnippet[]>;
  repositories: Map<string, RepositoryInfo>;
  lastUpdated: number;
}
```

### 缓存策略

- **时间失效**：24 小时后自动刷新
- **版本失效**：检测到新版本时更新
- **手动失效**：用户强制刷新
- **智能预热**：根据使用频率提前缓存热点内容

### 保存到知识库

```typescript
function saveToKnowledgeBase(results: SearchResult[]): void {
  const cards = results.map(r => ({
    id: generateId(),
    type: 'github-code',
    title: extractTitle(r),
    summary: summarizeResult(r),
    code: extractCode(r),
    metadata: {
      url: r.url,
      stars: r.stars,
      language: r.language,
      updatedAt: r.updatedAt
    },
    tags: extractTags(r),
    createdAt: new Date()
  }));

  knowledgeBase.save(cards);
}
```

---

## 技术实现要点

### 核心技术

- **GitHub REST API** (octokit)
- **GitHub Code Search API v2**
- **向量搜索**（可选）
- **本地存储**：JSON/SQLite

### 配置示例

```yaml
config:
  githubToken: process.env.GITHUB_TOKEN
  maxResults: 20
  cacheDuration: 86400 # 24 hours
  defaultLanguages: [javascript, typescript, python, rust]
  enableCache: true
```

### 错误处理

- **API 速率限制**：队列 + 重试机制
- **网络超时**：降级到缓存结果
- **空结果**：提供替代建议

---

## 成功标准

- ✅ 搜索响应时间 < 5 秒
- ✅ 结果相关性 > 85%
- ✅ 缓存命中率 > 40%
- ✅ 支持 10+ 种编程语言
- ✅ 覆盖代码、文档、Issues、Discussions

---

*设计文档创建时间：2025-01-26*
*设计方法：使用 superpowers:brainstorming skill*
