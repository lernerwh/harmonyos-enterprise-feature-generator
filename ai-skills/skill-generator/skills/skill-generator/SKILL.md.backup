---
name: skill-generator
description: Meta-skill for generating complete AI skills with documentation, scripts, and tools. Use when creating new skills, automating repetitive tasks, or building custom functionality. Guides creation of sub-documents (plans, designs, APIs) and utility scripts (build, test, deploy).
---

# Skill Generator - 技能自动生成器

让 AI 自动创建完整技能体系的元技能，包括核心技能定义、子文档、脚本工具等。

## 触发条件

此 skill 在以下情况下自动触发:

1. **创建技能请求**: 用户明确要求创建新技能
   - "帮我创建一个xxx技能"
   - "写一个能做xxx的skill"
   - "生成一个新技能"

2. **重复性任务识别**: AI 识别到用户在执行重复性任务
   - 当同一个操作模式出现 3 次以上
   - 用户说"这个操作很频繁"
   - AI 判断任务可自动化

3. **功能扩展请求**: 用户想要添加新功能
   - "能不能让CLI学会xxx"
   - "如何实现xxx能力"

## 使用流程

```
用户需求 → 需求分析 → 技能设计 → 代码生成 → 文档创建 → 脚本工具 → 验证测试 → 注册
```

### Step 1: 需求收集

首先向用户确认以下信息:

```markdown
请确认新技能的信息:

1. **技能名称** (英文，kebab-case): 例如 `log-analyzer`
2. **功能描述**: 这个技能做什么？
3. **触发场景**: 什么时候自动触发？
4. **输入参数**: 需要哪些参数？
5. **工具权限**: 需要哪些工具？(Read/Write/Bash/WebSearch等)
```

### Step 2: 生成技能

使用以下模板生成新技能:

```markdown
## 新技能: [技能名称]

### 基本信息
- **名称**: [name]
- **描述**: [description]
- **版本**: 1.0.0

### 目录结构
```
[name]/
├── skills/[name]/
│   ├── SKILL.md          # 技能定义 (必需)
│   ├── README.md         # 使用说明 (必需)
│   ├── docs/             # 子文档目录
│   │   ├── PLAN.md       # 实施计划
│   │   ├── DESIGN.md     # 设计文档
│   │   ├── API.md        # API 文档
│   │   ├── TESTING.md    # 测试文档
│   │   └── CONTRIBUTING.md # 贡献指南
│   └── src/              # 源代码 (可选)
│       ├── index.ts
│       ├── types.ts
│       ├── core/
│       └── utils/
├── scripts/              # 脚本工具
│   ├── build.sh          # 构建脚本
│   ├── test.sh           # 测试脚本
│   ├── deploy.sh         # 部署脚本
│   └── setup.sh          # 安装脚本
├── tools/                # 工具集
│   ├── validators/       # 验证工具
│   ├── generators/       # 生成器
│   └── formatters/       # 格式化工具
├── tests/                # 测试文件
├── examples/             # 使用示例
├── .claude-plugin/
│   └── plugin.json
├── package.json
└── tsconfig.json
```

### SKILL.md 内容
[根据技能描述生成 frontmatter 和详细文档]

### README.md 内容
[包含使用示例、配置说明、限制等]
```

### Step 3: 创建子文档

根据技能复杂度，创建必要的子文档：

#### 3.1 实施计划 (PLAN.md)

```markdown
# [技能名称] 实施计划

## 概述
[技能的简要说明和目标]

## 实施阶段

### Phase 1: 基础框架
- [ ] 创建目录结构
- [ ] 编写 SKILL.md
- [ ] 编写 README.md
- [ ] 设置 package.json

### Phase 2: 核心功能
- [ ] 实现核心逻辑
- [ ] 添加类型定义
- [ ] 编写工具函数

### Phase 3: 测试与文档
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 完善文档

### Phase 4: 发布与维护
- [ ] 代码审查
- [ ] 发布到仓库
- [ ] 收集反馈

## 依赖项
- 外部依赖
- 其他技能
- 环境要求

## 时间估算
- Phase 1: X 天
- Phase 2: X 天
- Phase 3: X 天
- Phase 4: X 天

## 风险与挑战
1. [风险1]
2. [风险2]

## 成功指标
- [ ] 指标1
- [ ] 指标2
```

#### 3.2 设计文档 (DESIGN.md)

```markdown
# [技能名称] 设计文档

## 系统架构

### 整体架构
```
[架构图或 ASCII 图]
```

### 模块划分
- **模块1**: 功能描述
- **模块2**: 功能描述

## 数据流

### 输入数据
```
[输入数据格式]
```

### 处理流程
```
[处理流程图]
```

### 输出数据
```
[输出数据格式]
```

## 核心算法

### 算法1: [名称]
**目的**: [说明]
**输入**: [参数]
**输出**: [返回值]
**复杂度**: [时间/空间复杂度]

```typescript
[伪代码或示例]
```

## 接口设计

### 对外接口
- `function1(params)`: 描述
- `function2(params)`: 描述

### 内部接口
- `_internalFunction()`: 描述

## 错误处理

| 错误类型 | 处理方式 | 用户提示 |
|---------|---------|---------|
| Error1 | 方式1 | 提示1 |
| Error2 | 方式2 | 提示2 |

## 性能考虑
- 优化点1
- 优化点2

## 安全考虑
- 安全风险1
- 防护措施1

## 扩展性
- 未来可能的扩展方向
```

#### 3.3 API 文档 (API.md)

```markdown
# [技能名称] API 文档

## 概述
[API 的总体说明]

## 类型定义

### Type1
```typescript
interface Type1 {
  property1: string;  // 说明
  property2: number;  // 说明
}
```

## 函数 API

### function1

执行XXX操作

**签名**:
```typescript
function function1(
  param1: string,    // 参数1说明
  param2: number     // 参数2说明
): Promise<Result>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| param1 | string | 是 | 参数说明 |
| param2 | number | 否 | 参数说明 |

**返回值**:
```typescript
interface Result {
  success: boolean;
  data?: DataType;
  error?: string;
}
```

**示例**:
```typescript
const result = await function1('value', 42);
console.log(result);
```

**错误**:
- `InvalidParamError`: 参数无效
- `NetworkError`: 网络错误

### function2

[同样格式...]

## 配置 API

### 配置项

```typescript
interface Config {
  option1: string;   // 选项1说明
  option2?: boolean; // 选项2说明 (可选)
}
```

## 事件 API (如果适用)

### Event1

触发条件: [说明]

**事件数据**:
```typescript
interface Event1Data {
  field1: string;
  field2: number;
}
```

## 使用示例

### 完整示例

```typescript
import { SkillAPI } from 'skill-name';

const api = new SkillAPI({
  option1: 'value'
});

// 调用 API
const result = await api.function1('param');

// 处理结果
if (result.success) {
  console.log(result.data);
}
```
```

#### 3.4 测试文档 (TESTING.md)

```markdown
# [技能名称] 测试文档

## 测试策略

### 测试类型
- **单元测试**: 测试独立函数和类
- **集成测试**: 测试模块间交互
- **端到端测试**: 测试完整流程

### 测试覆盖率目标
- 语句覆盖率: >= 80%
- 分支覆盖率: >= 75%
- 函数覆盖率: 100%

## 单元测试

### 测试框架
- Jest / Vitest / Mocha

### 测试文件结构
```
tests/
├── unit/
│   ├── core/
│   │   ├── module1.test.ts
│   │   └── module2.test.ts
│   └── utils/
│       └── helpers.test.ts
├── integration/
│   └── api.test.ts
└── e2e/
    └── workflow.test.ts
```

### 测试示例

```typescript
describe('function1', () => {
  it('should return success with valid input', async () => {
    const result = await function1('valid-input');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle invalid input', async () => {
    const result = await function1('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('InvalidParamError');
  });

  it('should throw on network error', async () => {
    // Mock network error
    await expect(function1('test')).rejects.toThrow('NetworkError');
  });
});
```

## 集成测试

### 测试场景
1. 场景1: 完整工作流
2. 场景2: 错误恢复

### 测试示例

```typescript
describe('Integration: API Workflow', () => {
  it('should complete full workflow', async () => {
    const api = new SkillAPI(config);
    const result = await api.executeWorkflow();
    expect(result).toBeDefined();
  });
});
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

## Mock 数据

### Mock 工具
- MSW (Mock Service Worker)
- Nock

### Mock 示例

```typescript
import { rest } from 'msw';

const handlers = [
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: [] }));
  })
];
```

## 测试数据管理

### Fixtures

```typescript
// fixtures/test-data.ts
export const mockData = {
  valid: { /* ... */ },
  invalid: { /* ... */ }
};
```

## 性能测试

```bash
# 运行性能测试
npm run test:perf
```

## 持续集成

### CI 配置
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```
```

#### 3.5 贡献指南 (CONTRIBUTING.md)

```markdown
# [技能名称] 贡献指南

## 如何贡献

### 报告问题
1. 检查是否已存在相同 issue
2. 使用问题模板创建新 issue
3. 提供详细的重现步骤

### 提交代码
1. Fork 仓库
2. 创建特性分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m "Add feature"`
4. 推送分支: `git push origin feature/your-feature`
5. 创建 Pull Request

## 开发指南

### 环境设置
```bash
# 克隆仓库
git clone https://github.com/your-repo/skill-name.git

# 安装依赖
npm install

# 构建项目
npm run build
```

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 TypeScript 最佳实践
- 添加适当的注释和文档

### 提交信息规范
```
type(scope): subject

body

footer
```

**类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具

**示例**:
```
feat(api): add new function for data processing

- Add function1 for processing input data
- Add error handling for invalid inputs

Closes #123
```

### Pull Request 检查清单
- [ ] 代码通过所有测试
- [ ] 添加了必要的文档
- [ ] 遵循代码规范
- [ ] 更新了 CHANGELOG.md
- [ ] 所有 CI 检查通过

## 代码审查

### 审查要点
1. 代码质量
2. 测试覆盖率
3. 文档完整性
4. 性能影响

### 审查流程
1. 自动检查通过
2. 至少一名维护者审查
3. 解决所有审查意见
4. 合并到主分支

## 社区
- 讨论区: [链接]
- 问题反馈: [链接]
- 功能请求: [链接]
```

### Step 4: 创建脚本工具

根据技能需求，创建必要的脚本工具：

#### 4.1 构建脚本 (build.sh)

```bash
#!/bin/bash
set -e

echo "🔨 Building [skill-name]..."

# 清理旧的构建产物
rm -rf dist/

# 运行 TypeScript 编译
npm run build

# 复制静态资源
cp -r src/assets dist/ 2>/dev/null || true

# 生成版本信息
echo "Version: $(npm pkg get version)" > dist/VERSION.txt

echo "✅ Build completed successfully!"
```

#### 4.2 测试脚本 (test.sh)

```bash
#!/bin/bash
set -e

echo "🧪 Running tests for [skill-name]..."

# 运行单元测试
echo "Running unit tests..."
npm run test:unit

# 运行集成测试
echo "Running integration tests..."
npm run test:integration

# 生成覆盖率报告
echo "Generating coverage report..."
npm run test:coverage

echo "✅ All tests passed!"
```

#### 4.3 部署脚本 (deploy.sh)

```bash
#!/bin/bash
set -e

echo "🚀 Deploying [skill-name]..."

# 运行测试
npm test

# 构建项目
npm run build

# 发布到 npm (可选)
if [ "$1" == "--publish" ]; then
  echo "Publishing to npm..."
  npm publish
fi

# 推送到 git
echo "Pushing to git..."
git push origin main

echo "✅ Deployment completed!"
```

#### 4.4 安装脚本 (setup.sh)

```bash
#!/bin/bash
set -e

echo "🔧 Setting up [skill-name]..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"

# 安装依赖
echo "Installing dependencies..."
npm install

# 创建必要的目录
mkdir -p logs
mkdir -p temp

# 设置权限
chmod +x scripts/*.sh

# 检查环境变量
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
fi

echo "✅ Setup completed!"
echo "Run 'npm run dev' to start development"
```

#### 4.5 TypeScript 工具函数

创建 `tools/` 目录下的工具模块：

##### 验证工具 (tools/validators/)

```typescript
// tools/validators/index.ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be an object'] };
  }

  // 添加验证逻辑

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateParams(params: Record<string, unknown>): ValidationResult {
  // 实现参数验证
}
```

##### 生成器工具 (tools/generators/)

```typescript
// tools/generators/index.ts
export interface GenerateOptions {
  template: string;
  data: Record<string, unknown>;
}

export function generateCode(options: GenerateOptions): string {
  const { template, data } = options;

  // 实现代码生成逻辑
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] || '');
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
```

##### 格式化工具 (tools/formatters/)

```typescript
// tools/formatters/index.ts
export function formatOutput(data: unknown, format: 'json' | 'markdown' | 'text'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'markdown':
      return formatAsMarkdown(data);
    case 'text':
      return formatAsText(data);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function formatAsMarkdown(data: unknown): string {
  // 实现 Markdown 格式化
}

function formatAsText(data: unknown): string {
  // 实现文本格式化
}
```

### Step 5: 验证与注册

1. 检查生成的 SKILL.md 格式是否正确
2. 确认描述清晰且触发条件明确
3. 将技能添加到 ai-skills 仓库
4. 提交并推送到远程仓库

## 技能模板

### 基础模板

```yaml
---
name: your-skill-name
description: Clear, concise description of when and why to use this skill
---

# Your Skill Name

技能的详细描述。

## 触发条件

1. **场景一**: 描述
2. **场景二**: 描述

## 使用方式

示例代码或命令

## 配置

需要的环境变量或配置项

## 限制

已知的限制或注意事项
```

### 高级模板 (带代码和完整文档)

对于需要代码实现的技能，使用完整结构:

```
your-skill/
├── skills/your-skill/
│   ├── SKILL.md          # 技能定义 (必需)
│   ├── README.md         # 使用说明 (必需)
│   ├── docs/             # 子文档目录
│   │   ├── PLAN.md       # 实施计划
│   │   ├── DESIGN.md     # 设计文档
│   │   ├── API.md        # API 文档
│   │   ├── TESTING.md    # 测试文档
│   │   └── CONTRIBUTING.md # 贡献指南
│   └── src/              # 源代码
│       ├── index.ts      # 主入口
│       ├── types.ts      # 类型定义
│       ├── core/         # 核心逻辑
│       │   ├── processor.ts
│       │   └── analyzer.ts
│       └── utils/        # 工具函数
│           ├── helpers.ts
│           └── constants.ts
├── scripts/              # 脚本工具
│   ├── build.sh          # 构建脚本
│   ├── test.sh           # 测试脚本
│   ├── deploy.sh         # 部署脚本
│   └── setup.sh          # 安装脚本
├── tools/                # 工具集
│   ├── validators/       # 验证工具
│   ├── generators/       # 生成器
│   └── formatters/       # 格式化工具
├── tests/                # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── examples/             # 使用示例
├── dist/                 # 编译输出
├── .claude-plugin/
│   └── plugin.json
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 输出格式

生成新技能后，提供以下信息:

```markdown
## ✅ 技能创建成功

**名称**: [skill-name]
**路径**: [path]
**描述**: [description]

### 已创建的文件:

#### 核心文件 (必需)
- ✅ SKILL.md - 技能定义和触发条件
- ✅ README.md - 使用说明和示例

#### 子文档 (可选)
- ✅ docs/PLAN.md - 实施计划
- ✅ docs/DESIGN.md - 设计文档
- ✅ docs/API.md - API 文档
- ✅ docs/TESTING.md - 测试文档
- ✅ docs/CONTRIBUTING.md - 贡献指南

#### 脚本工具 (可选)
- ✅ scripts/build.sh - 构建脚本
- ✅ scripts/test.sh - 测试脚本
- ✅ scripts/deploy.sh - 部署脚本
- ✅ scripts/setup.sh - 安装脚本

#### 工具集 (可选)
- ✅ tools/validators/ - 验证工具
- ✅ tools/generators/ - 生成器
- ✅ tools/formatters/ - 格式化工具

#### 源代码 (如果需要)
- ✅ src/index.ts - 主入口
- ✅ src/types.ts - 类型定义
- ✅ src/core/ - 核心逻辑
- ✅ src/utils/ - 工具函数

### 下一步:
1. 检查生成的文件是否正确
2. 根据需要修改 SKILL.md 和 README.md
3. 根据需要创建子文档 (PLAN.md, DESIGN.md, API.md 等)
4. 根据需要创建脚本工具 (build.sh, test.sh 等)
5. 如果有代码实现，运行 `npm install && npm run build`
6. 运行测试: `npm test`
7. 提交到 git: `git add . && git commit -m "Add [skill-name] skill"`
8. 推送到远程: `git push`

### 使用方式:
在 Claude Code 中直接使用该技能，或通过 `/[skill-name]` 调用
```

## 技能命名规范

- 使用小写字母和连字符: `log-analyzer`, `code-reviewer`
- 名称应简洁且描述性强
- 避免使用通用名称: `helper`, `tool` (太模糊)
- 推荐使用动词: `search-`, `analyze-`, `generate-`

## 常见技能类型

| 类型 | 示例名称 | 描述 |
|-----|---------|------|
| 搜索类 | `log-searcher`, `code-finder` | 搜索日志、代码等 |
| 分析类 | `error-analyzer`, `perf-checker` | 分析错误、性能等 |
| 生成类 | `test-generator`, `doc-builder` | 生成测试、文档等 |
| 操作类 | `git-cleaner`, `dep-updater` | 执行特定操作 |

## 安全考虑

生成技能时注意:

1. **权限最小化**: 只请求必要的工具权限
2. **输入验证**: 在 SKILL.md 中说明参数要求
3. **错误处理**: 在 README.md 中说明可能的错误
4. **沙箱执行**: 危险操作需要用户确认

## 示例

### 示例 1: 创建日志分析技能

```
用户: 帮我创建一个能分析应用日志的技能

AI: 我来帮你创建一个日志分析技能。

[生成 skill: log-analyzer]
- SKILL.md: 定义触发条件和使用方式
- README.md: 使用说明和示例
- src/log-parser.ts: 日志解析逻辑
```

### 示例 2: 自动识别重复任务

```
用户: [第3次执行类似的git清理操作]

AI: 我注意到你经常需要清理git分支。要我创建一个
`git-cleaner` 技能来自动化这个操作吗？
```

## 文档与工具选择指南

根据技能的复杂度，选择合适的文档和工具：

### 简单技能 (无代码实现)

**适用场景**: 提示词级别的工作流程、简单的任务序列

**必需文件**:
- ✅ SKILL.md
- ✅ README.md

**可选文件**:
- docs/CONTRIBUTING.md (如果允许贡献)

**不需要**:
- ❌ 源代码
- ❌ 脚本工具
- ❌ 详细的设计文档

### 中等技能 (基础代码实现)

**适用场景**: 有简单逻辑、需要类型定义、工具函数

**必需文件**:
- ✅ SKILL.md
- ✅ README.md
- ✅ src/index.ts
- ✅ src/types.ts

**推荐文件**:
- docs/API.md (如果提供 API)
- docs/TESTING.md (如果有测试)
- scripts/build.sh (如果需要编译)
- scripts/test.sh (如果需要测试)

**可选文件**:
- src/utils/
- docs/DESIGN.md (如果架构复杂)
- tools/validators/ (如果有参数验证)

### 复杂技能 (完整项目)

**适用场景**: 多模块、复杂逻辑、需要长期维护

**必需文件**:
- ✅ SKILL.md
- ✅ README.md
- ✅ 所有子文档:
  - docs/PLAN.md
  - docs/DESIGN.md
  - docs/API.md
  - docs/TESTING.md
  - docs/CONTRIBUTING.md
- ✅ 完整的源代码结构
- ✅ 所有脚本工具:
  - scripts/build.sh
  - scripts/test.sh
  - scripts/deploy.sh
  - scripts/setup.sh
- ✅ 工具集:
  - tools/validators/
  - tools/generators/
  - tools/formatters/
- ✅ 完整的测试套件

## 子文档优先级

根据技能类型，确定子文档的优先级：

| 文档 | 简单技能 | 中等技能 | 复杂技能 | 说明 |
|-----|---------|---------|---------|------|
| PLAN.md | ❌ | 🔶 | ✅ | 实施计划，复杂技能必需 |
| DESIGN.md | ❌ | 🔶 | ✅ | 设计文档，复杂技能必需 |
| API.md | ❌ | ✅ | ✅ | API 文档，有代码时推荐 |
| TESTING.md | ❌ | ✅ | ✅ | 测试文档，有测试时推荐 |
| CONTRIBUTING.md | ❌ | 🔶 | ✅ | 贡献指南，开源项目推荐 |

图例: ✅ 必需 | 🔶 可选 | ❌ 不需要

## 脚本工具优先级

根据技能需求，确定脚本工具的优先级：

| 脚本 | 纯提示词 | TypeScript | 需要编译 | 需要测试 | 需要部署 |
|-----|---------|-----------|---------|---------|---------|
| build.sh | ❌ | 🔶 | ✅ | 🔶 | 🔶 |
| test.sh | ❌ | 🔶 | 🔶 | ✅ | 🔶 |
| deploy.sh | ❌ | ❌ | 🔶 | 🔶 | ✅ |
| setup.sh | ❌ | ✅ | ✅ | ✅ | ✅ |

## 快速参考

### 只需要 SKILL.md + README.md
- 简单的提示词技能
- 工作流程自动化
- 没有代码实现

### 需要添加 API.md
- 提供 TypeScript API
- 有对外接口
- 需要类型定义

### 需要添加 DESIGN.md
- 多个模块协作
- 复杂的数据流
- 需要架构设计

### 需要添加 TESTING.md
- 有单元测试
- 有集成测试
- 需要持续集成

### 需要添加脚本工具
- 需要编译 (build.sh)
- 有测试套件 (test.sh)
- 需要部署流程 (deploy.sh)
- 需要环境配置 (setup.sh)

### 需要添加 tools/ 目录
- 需要参数验证 (validators/)
- 需要代码生成 (generators/)
- 需要格式化输出 (formatters/)

## 相关技能

- **code-reviewer**: 审查生成的代码质量
- **test-generator**: 为新技能生成测试
