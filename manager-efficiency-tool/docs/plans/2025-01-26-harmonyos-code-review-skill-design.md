# 鸿蒙应用代码审查 Skill 设计文档

## 概述

创建一个适用于鸿蒙应用复杂场景的代码审查 skill，采用三阶段渐进式架构，结合静态分析和 AI 理解，为 Merge Request/Pull Request 审查提供智能辅助。

**核心特性**：
- 渐进式处理：自动适配 1-50+ 文件的变更范围
- 三阶段流程：快速扫描 → 深度分析 → 生成报告
- 审查重点：ArkTS 特性 + 性能资源管理 + 鸿蒙 API
- 使用方式：辅助人工代码审查

---

## 整体架构

### 目录结构

```
harmonyos-code-review/
├── SKILL.md                    # Skill 定义和触发条件
├── README.md                   # 使用文档
├── USAGE.md                    # 详细使用指南
├── analyzers/                  # 分析器模块
│   ├── static-analyzer.ts      # 静态分析（AST + 规则）
│   ├── ai-analyzer.ts          # AI 语义分析
│   ├── diff-parser.ts          # Git diff 解析
│   └── architecture-analyzer.ts # 架构分析
├── rules/                      # 规则库
│   ├── arkts-rules.ts          # ArkTS 特性规则（100+）
│   ├── performance-rules.ts    # 性能规则（80+）
│   ├── api-rules.ts            # 鸿蒙 API 规则（70+）
│   └── security-rules.ts       # 安全规则（50+）
├── reporters/                  # 报告生成器
│   ├── markdown-reporter.ts    # Markdown 报告
│   ├── mr-commenter.ts         # MR 评论格式
│   └── console-reporter.ts     # 终端输出
├── utils/                      # 工具函数
│   ├── file-scanner.ts         # 文件扫描器
│   ├── ast-parser.ts           # AST 解析工具
│   └── priority-calculator.ts  # 优先级计算
└── templates/                  # 代码修复模板
    ├── performance-fix.ets     # 性能优化示例
    └── api-usage-fix.ets       # API 正确使用示例
```

### 工作流程

1. 用户在审查 MR 时调用 skill
2. 解析 MR 的 diff，识别变更范围
3. 根据变更大小自动选择分析深度
4. 执行三阶段分析（扫描 → 分析 → 报告）
5. 输出可执行的审查建议

---

## 第一阶段：快速静态扫描

### 目标

5-30 秒内完成快速检查，生成问题清单。

### 核心流程

#### 1. Diff 解析和范围检测

- 提取变更文件列表（.ets, .ts, .json）
- 识别变更类型：新增/修改/删除
- 计算变更行数和影响范围
- 智能判断：小改动(<100行) / 中等(100-500行) / 大型(>500行)

#### 2. AST 特征提取

使用 TypeScript Compiler API：
- 解析 ArkTS 组件结构
- 识别状态管理装饰器（@State/@Prop/@Link）
- 提取生命周期方法（aboutToAppear、aboutToDisappear）
- 检测系统 API 调用（权限、网络、分布式）
- 识别性能风险点（循环渲染、长列表、定时器）

#### 3. 规则引擎检查

**ArkTS 特性规则**（100+ 条）：
- @State 装饰器用于复杂对象（性能风险）
- 子组件修改父组件 @State 数据（架构违规）
- 缺少 aboutToDisappear 清理定时器/订阅
- 使用 ForEach 缺少 keyGenerator（渲染性能）
- @Watch 使用过于复杂逻辑

**性能规则**（80+ 条）：
- 在 build() 方法中进行复杂计算
- 长列表使用 LazyForEach 但未实现 IDataSource
- 缺少组件缓存（@Reusable）
- 图片资源未设置合适尺寸

**鸿蒙 API 规则**（70+ 条）：
- 权限使用前未检查（verifyAccessToken）
- 分布式能力调用缺少错误处理
- 网络请求未配置超时
- 使用废弃 API（版本兼容性）

**安全规则**（50+ 条）：
- 敏感数据未加密存储
- HTTPS 证书校验缺失
- 用户输入未过滤

#### 4. 优先级计算

```
优先级 = 严重性 × 可信度 × 影响范围

严重性：Critical(9) > High(7) > Medium(5) > Low(3) > Info(1)
可信度：基于规则匹配强度（100% / 80% / 60%）
影响范围：核心模块 > 业务模块 > 边缘功能
```

#### 5. 输出问题清单

```markdown
## 快速扫描结果（12秒）
- 扫描文件：15个
- 发现问题：23个
  - 🔴 Critical: 2
  - 🟠 High: 7
  - 🟡 Medium: 11
  - 🔵 Low: 3

建议：进入深度分析处理 High/Critical 问题？
```

---

## 第二阶段：智能深度分析

### 目标

对 High/Critical 问题进行 AI 语义分析，提供架构评估和深度建议。

### 触发条件

- 存在 High/Critical 级别问题
- 用户主动选择进入深度分析
- 变更范围超过阈值（建议 500+ 行）

### 核心分析维度

#### 1. 架构健康度评估

- **分层架构检查**
  - UI 层是否包含业务逻辑
  - Service 层职责是否单一
  - Data 层是否直接被 UI 调用
- **依赖方向分析**
  - 是否存在循环依赖
  - 底层模块是否依赖上层
  - 第三方库使用是否合理
- **模块耦合度**
  - 组件间通信复杂度
  - 共享状态管理方式
  - 接口抽象程度

#### 2. 性能风险评估

- **渲染性能**
  - 状态更新频率预测
  - 不必要的重建检测
  - 大数据量处理方案
- **内存管理**
  - 订阅关系追踪（RxJS、事件总线）
  - 定时器和异步任务生命周期
  - 闭包导致的内存泄漏风险
  - 大对象生命周期管理
- **资源优化**
  - 图片资源加载策略
  - 网络请求并发控制
  - 数据缓存策略评估

#### 3. 鸿蒙特性合规性

- **权限使用合规性**
  - 权限申请时机是否合理
  - 权限使用范围是否最小化
  - 敏感权限是否有二次确认
- **系统能力调用**
  - 分布能力使用的场景适配
  - 安全组件（加密、密钥管理）使用
  - 后台任务限制遵守情况
- **版本兼容性**
  - API Level 差异处理
  - 新旧 API 迁移完整性
  - 降级方案是否完善

#### 4. 代码模式识别

- 常见反模式（God Component、Spaghetti Code）
- 代码异味（Long Method、Large Class）
- 设计模式误用
- 复杂度热点（圈复杂度 > 10）

#### 5. 生成深度建议

提供详细的问题分析、修复代码示例、影响评估和验证方法。

---

## 第三阶段：审查报告生成

### 目标

生成结构化、可执行的审查报告，支持多种输出格式。

### 报告生成流程

1. **问题整合和分类**
   - 去重：静态分析和 AI 分析发现的问题合并
   - 关联：同一问题的不同表现归类
   - 优先级重排：基于修复难度 × 影响范围重新排序
   - 依赖关系：识别需要优先修复的基础问题

2. **生成结构化报告**

报告包含以下部分：
- 📊 审查概览（MR 信息、变更范围、分析时间）
- 🎯 执行摘要（整体评估、关键发现、统计数据）
- 🔴 必须修复（Critical 问题，含详细修复方案）
- 🟠 强烈建议（High 优先级问题）
- 🟡 建议改进（Medium 问题）
- 📊 详细问题清单（表格形式）
- ✅ 优点（值得保持的优秀实践）
- 📈 代码质量趋势（与历史对比）
- 🔗 相关文档（参考链接）
- 📝 审查结论（建议操作、预计时间）

3. **多格式输出支持**

- **Markdown 格式**：完整的可读报告，默认格式
- **MR 评论格式**：适用于 GitLab/GitHub，自动生成带行号链接的评论
- **JSON 格式**：适用于 CI/CD 集成
- **终端简洁格式**：命令行快速查看

4. **可执行性增强**

每个问题都包含：
- 📍 精确位置：文件路径 + 行号
- 🔧 修复代码：可直接复制使用的代码片段
- 📚 参考文档：相关官方文档链接
- ✅ 验证方法：如何验证修复是否有效
- ⏱️ 时间估算：预计修复时间

---

## Skill 触发条件和核心接口

### Skill 定义

```yaml
---
name: harmonyos-code-review
description: Use when reviewing HarmonyOS app Merge Requests/Pull Requests, especially when changes involve ArkTS components, performance optimization, or system API usage
---
```

### 触发场景

- 开发者在 Code Review 过程中需要智能辅助
- MR/PR 包含 ArkTS/TypeScript 代码变更
- 需要检查性能、安全、架构等问题
- 审查大型重构或跨模块变更
- 需要生成结构化审查报告

### 何时使用

- ✅ 审查团队成员提交的 MR
- ✅ 自我审查代码后再提交
- ✅ 评估重构方案的影响
- ✅ 检查性能回归
- ✅ 验证鸿蒙 API 使用合规性

### 何时不使用

- ❌ 纯文档或配置文件变更
- ❌ 简单的 typo 修正
- ❌ 已经过完整审查的代码

### 核心接口设计

```typescript
/**
 * 执行代码审查
 */
async function reviewCodeReview(options: ReviewOptions): Promise<ReviewReport>

interface ReviewOptions {
  // 输入源（三选一）
  mrUrl?: string;              // GitLab/GitHub MR URL
  diffFile?: string;           // Git diff 文件路径
  fileChanges?: FileChange[];  // 直接提供文件变更

  // 分析深度
  depth?: 'quick' | 'standard' | 'deep'; // 默认: standard

  // 审查重点（可选，默认全部）
  focus?: ReviewFocus[];

  // 输出格式
  output?: 'markdown' | 'json' | 'console' | 'mr-comment';

  // 输出路径
  outputPath?: string;
}

interface ReviewFocus {
  category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture';
  rules?: string[]; // 指定启用的规则ID，不指定则使用默认
}
```

### 使用示例

```typescript
// 示例 1: 从 GitLab URL 审查
const report1 = await reviewCodeReview({
  mrUrl: 'https://gitlab.com/project/-/merge_requests/123',
  depth: 'standard',
  output: 'markdown',
  outputPath: './review-report.md'
});

// 示例 2: 快速审查 diff 文件
const report2 = await reviewCodeReview({
  diffFile: './changes.diff',
  depth: 'quick',
  focus: [
    { category: 'performance' },
    { category: 'arkts' }
  ],
  output: 'console'
});

// 示例 3: 深度架构审查
const report3 = await reviewCodeReview({
  mrUrl: 'https://github.com/repo/pull/456',
  depth: 'deep',
  focus: [
    { category: 'architecture' },
    { category: 'performance' }
  ],
  output: 'mr-comment' // 直接评论到 PR
});
```

---

## 实现技术栈

- **TypeScript Compiler API**：AST 解析和代码分析
- **ESLint/StyleCheck**：规则引擎基础
- **Git 工具**：diff 解析和变更追踪
- **AI API**：语义理解和深度分析（可选）
- **Markdown/JSON**：报告生成

---

## 开发计划

### 阶段 1：核心框架搭建
- [ ] 创建项目结构和基础文件
- [ ] 实现 diff 解析器
- [ ] 实现静态分析器框架
- [ ] 实现报告生成器基础

### 阶段 2：规则库实现
- [ ] ArkTS 特性规则（100+）
- [ ] 性能优化规则（80+）
- [ ] 鸿蒙 API 规则（70+）
- [ ] 安全检查规则（50+）

### 阶段 3：深度分析
- [ ] 架构分析器
- [ ] 性能风险评估
- [ ] AI 集成接口

### 阶段 4：完善和优化
- [ ] 完善报告模板
- [ ] 添加测试用例
- [ ] 性能优化
- [ ] 文档完善

---

## 成功标准

- ✅ 能够处理 1-50+ 文件的 MR
- ✅ 快速扫描在 30 秒内完成
- ✅ 深度分析在 3 分钟内完成
- ✅ 检出准确率达到 85%+
- ✅ 误报率控制在 15% 以下
- ✅ 提供可执行的修复建议
- ✅ 支持主流 Git 平台（GitLab/GitHub）

---

## 相关资源

- [鸿蒙开发官方文档](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/application-dev-guide-V5)
- [ArkTS 语言规范](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/arkts-get-started-V5)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- 项目内相关 skill：`harmonyos-enterprise-feature-generator`

---

*设计文档创建时间：2025-01-26*
*设计方法：使用 superpowers:brainstorming skill*
