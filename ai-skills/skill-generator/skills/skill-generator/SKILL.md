---
name: skill-generator
description: 快速创建新技能 - 3步完成技能生成。高级用法参考 REFERENCE.md。Use when creating new skills or automating repetitive tasks.
---

# Skill Generator - 快速开始

3分钟创建新技能。高级功能参考 REFERENCE.md。

## 快速流程

```
用户需求 → 选择模板 → 智能生成 → 完成
```

### Step 1: 核心信息 (仅需3个问题)

**模板选择** (推荐):
- `simple` - 简单技能 (~100行, 无代码)
- `tool` - 工具技能 (~200行, TypeScript代码)
- `full` - 完整技能 (~500行, 完整生态)

**必填信息**:
1. **技能名称** (英文, kebab-case): 例如 `log-analyzer`
2. **功能描述** (一句话): 这个技能做什么？

**示例**:
```
名称: log-analyzer
描述: 分析日志文件并提取关键错误信息
模板: simple (推荐)
```

## 智能模板推荐

根据描述自动推荐最适合的模板：

### 推荐规则

| 关键词 | 推荐模板 | 理由 |
|--------|----------|------|
| 分析、检查、验证、审查 | simple | 文档型，无需代码 |
| 工具、CLI、脚本、自动化 | tool | 需要 TypeScript |
| 系统、框架、平台、生态 | full | 需要完整工具链 |
| API、接口、数据、解析 | tool | 需要类型定义 |
| 测试、部署、CI/CD | full | 需要脚本工具 |

### 示例

- "日志分析" → **simple** (纯文档引导)
- "文件转换工具" → **tool** (需要代码处理)
- "监控系统" → **full** (完整生态)

如果 AI 推荐的模板不合适，用户可手动选择。

### Step 2: 智能生成

基于选择自动生成:

| 模板 | 文件数 | 代码 | 文档 | 耗时 |
|------|--------|------|------|------|
| simple | 2个 | 无 | SKILL.md + README.md | 1分钟 |
| tool | 4个 | TypeScript | + 类型定义 | 2分钟 |
| full | 8个 | 完整 | + 脚本工具 | 3分钟 |

**默认包含**:
- ✅ 基础目录结构
- ✅ package.json 配置
- ✅ 触发条件 (自动推断)
- ✅ 工具权限 (自动推断)
- ✅ 使用示例

### Step 3: 验证

```bash
# 检查生成的技能
cd [skill-name]
cat SKILL.md        # 查看技能定义
cat README.md       # 查看使用说明
```

## 模板详解

### Simple 模板

**适用场景**: 文档型技能、提示词优化、流程引导

**生成文件**:
```
[skill-name]/
├── skills/
│   └── [skill-name]/
│       ├── SKILL.md      # 技能定义 (~100行)
│       └── README.md     # 使用说明
├── .claude-plugin/
│   └── plugin.json
└── package.json
```

**特点**: 无需代码，纯 Markdown，立即可用

### Tool 模板

**适用场景**: 需要 TypeScript 代码的工具型技能

**生成文件**:
```
[skill-name]/
├── skills/
│   └── [skill-name]/
│       ├── SKILL.md
│       └── README.md
├── src/
│   ├── index.ts          # 入口
│   ├── types.ts          # 类型定义
│   └── core/             # 核心逻辑
├── .claude-plugin/
│   └── plugin.json
├── package.json
└── tsconfig.json
```

**特点**: TypeScript 基础框架，包含类型定义

### Full 模板

**适用场景**: 复杂系统、完整生态、生产级技能

**生成文件**: (包含 Simple + Tool + 以下)
```
├── scripts/              # 构建测试脚本
│   ├── build.sh
│   ├── test.sh
│   └── setup.sh
├── tools/                # 验证和生成工具
├── tests/                # 测试文件
└── examples/             # 使用示例
```

**特点**: 完整开发工具链，CI/CD 就绪

## 示例对话

### 示例 1: Simple 模板

**User**: 创建一个日志分析技能

**AI**: 好的！我将使用 **simple** 模板创建 `log-analyzer` 技能。

**请确认**:
1. 名称: `log-analyzer` ✓
2. 描述: 分析日志文件并提取关键错误信息 ✓
3. 模板: simple (1分钟) ✓

[生成中...]
✅ 完成！生成 2 个文件:
- SKILL.md (105行)
- README.md (52行)
- plugin.json
- package.json

**提示**: 编辑 SKILL.md 添加分析规则即可使用

---

### 示例 2: Tool 模板

**User**: 写一个JSON格式化工具技能

**AI**: 检测到需要代码处理，推荐 **tool** 模板。

**请确认**:
1. 名称: `json-formatter` ✓
2. 描述: 格式化和验证 JSON 文件 ✓
3. 模板: tool (包含 TypeScript) ✓

[生成中...]
✅ 完成！生成 4 个文件:
- SKILL.md
- README.md
- src/index.ts (类型定义)
- src/types.ts
- tsconfig.json

**提示**: 在 src/index.ts 实现格式化逻辑

---

### 示例 3: Full 模板

**User**: 创建一个完整的CI/CD监控技能

**AI**: 这是一个复杂系统，推荐 **full** 模板。

**请确认**:
1. 名称: `cicd-monitor` ✓
2. 描述: 监控 CI/CD 流水线并报告状态 ✓
3. 模板: full (完整工具链) ✓

[生成中...]
✅ 完成！生成 8 个文件:
- SKILL.md + README.md
- src/ (TypeScript 代码框架)
- scripts/ (build/test/deploy)
- tools/ (验证和生成工具)
- tests/ (测试框架)

**提示**: 运行 ./scripts/setup.sh 初始化开发环境

## 常见问题

**Q: 如何选择模板？**
A:
- 纯文档引导 → simple
- 需要代码处理 → tool
- 完整项目 → full

**Q: 生成的技能如何使用？**
A: 编辑完成后，将技能目录复制到 `~/.claude/skills/` 或项目的 `.claude/` 目录

**Q: 需要高级功能？**
A: 参考 REFERENCE.md 了解完整的5步流程、自定义配置、子文档生成等

**Q: 如何添加触发条件？**
A: Simple 模板自动生成基础触发条件，高级触发规则参考 REFERENCE.md

## 下一步

查看 REFERENCE.md 了解:
- 详细的5步生成流程
- 自定义子文档 (PLAN, DESIGN, API, TESTING, CONTRIBUTING)
- 高级触发条件配置
- 完整的脚本工具系统
- A/B 测试和性能优化

---

快速创建技能，节省时间。复杂需求参考 REFERENCE.md。
