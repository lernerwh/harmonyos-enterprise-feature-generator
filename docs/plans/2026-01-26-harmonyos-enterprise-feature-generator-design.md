# 鸿蒙企业级应用功能生成器 Skill 设计文档

**日期**: 2026-01-26
**设计目标**: 从自由文本需求自动生成鸿蒙企业级应用功能代码

---

## 1. 概述

**Skill 名称**: `harmonyos-enterprise-feature-generator`

这个 skill 用于从自由文本需求自动生成鸿蒙企业级应用的功能代码。它会：
- 自动分析项目并学习代码风格，保持一致性
- 智能判断权限管理模式（RBAC/ABAC/简单权限）
- 生成完整的功能代码结构（页面、服务、路由、权限、错误处理、日志）

**核心原则**: 需求理解 → 项目分析 → 代码生成 → 集成配置

---

## 2. 核心功能

### 2.1 需求分析阶段
接收自由文本需求描述，使用 LLM 理解并结构化需求，识别：
- 功能模块列表
- 页面结构和导航关系
- 数据实体和字段
- 权限要求
- 业务逻辑

输出：结构化的需求规范 JSON

### 2.2 项目分析阶段
扫描现有项目代码：
- 目录结构（pages/, services/, components/ 等）
- 现有模块和路由配置
- 代码风格（命名规范、导入方式、注释风格等）

输出：项目结构 JSON + 代码风格配置 JSON

### 2.3 代码生成阶段
基于模板和项目风格生成：
- ArkTS 页面组件（使用 ArkUI 装饰器）
- 服务层（数据访问、API 调用）
- 权限检查代码（根据判断的模式）
- 错误处理封装（统一的 ErrorProcessor 类）
- 日志工具（Logger 类）

### 2.4 集成配置阶段
- 将生成的代码放置到正确目录
- 更新路由配置（main_pages.json 或 router_map.json）
- 更新权限配置
- 生成配置清单供用户审查

---

## 3. 目标应用类型

**企业级鸿蒙应用**，包含：
- 复杂权限管理（RBAC/ABAC/简单权限）
- 多模块组织
- 后台服务集成
- 完善的错误处理和日志

**技术栈**: ArkTS + ArkUI（声明式 UI）

**使用场景**: 在现有项目基础上添加新功能模块

---

## 4. 权限管理智能判断

根据需求文本自动判断权限模式：

| 判断依据 | 权限模式 |
|---------|---------|
| 提及"角色"、"用户组"、"管理员/普通用户"等角色词汇 | **RBAC**（基于角色的访问控制） |
| 提及复杂规则（多维度条件组合，如"部门经理且金额大于1万"） | **ABAC**（基于属性的访问控制） |
| 简单的"只有XX可以访问"或页面级权限 | **简单权限** |

**生成的权限代码**：
- 统一的 PermissionCheck 工具类
- 权限装饰器（如 @RequireRole('admin')）
- 权限常量定义
- 权限配置文件（permissions.ets）

---

## 5. 状态管理方案

使用 **ArkUI 本地状态管理**（简单高效）：
- `@State`: 页面内部状态
- `@Prop`: 父子组件传参
- `@Provide/@Consume`: 跨层级状态共享

不引入复杂的状态管理库，保持轻量。

---

## 6. 错误处理和日志系统

### 6.1 统一错误处理（ErrorProcessor）

**错误分类**：
- 网络错误：自动重试（可配置次数）
- 权限错误：跳转登录页或提示无权限
- 业务错误：显示友好提示
- 系统错误：记录日志并显示通用错误信息

**错误码规范**：
- 1xxx：用户相关错误（1001-用户不存在）
- 2xxx：权限相关错误（2001-无权限访问）
- 3xxx：网络相关错误
- 9xxx：系统错误

### 6.2 日志工具（Logger）

**日志级别**：DEBUG, INFO, WARN, ERROR

**输出策略**：
- 开发环境：控制台输出（带颜色）
- 生产环境：可选写入文件或上报

**日志内容**：时间戳、级别、模块名、信息、堆栈（仅错误）

---

## 7. 何时使用此 Skill

**适用场景**：
- "需要一个用户管理功能"
- "添加一个审批流程模块"
- "实现一个数据报表页面"
- 其他类似的功能添加需求

**前提条件**：
- 目标是现有鸿蒙项目（非新建项目）
- 使用 ArkTS + ArkUI 技术栈
- 需求以自由文本形式提供

**不适用场景**：
- 新建项目（需要其他 skill）
- 非 HarmonyOS 应用
- 只需要生成代码片段（非完整功能）

---

## 8. 实现架构

### 8.1 目录结构

```
harmonyos-enterprise-feature-generator/
  SKILL.md                           # 主要文档
  templates/                          # 代码模板
    page-list.ets                     # 列表页模板
    page-detail.ets                   # 详情页模板
    page-edit.ets                     # 编辑页模板
    service-base.ets                  # 服务基类
    error-processor.ets               # 错误处理
    logger.ets                        # 日志工具
    permission-rbac.ets               # RBAC 权限
    permission-simple.ets             # 简单权限
  analyzers/                          # 分析工具
    project-scanner.ts                # 项目扫描器
    style-analyzer.ts                 # 代码风格分析器
    requirement-parser.ts             # 需求解析器
  generators/                         # 生成器
    code-generator.ts                 # 代码生成器
    file-writer.ts                    # 文件写入器
    config-updater.ts                 # 配置更新器
```

### 8.2 命令行工具

**工具调用流程**：

```bash
# 1. 分析项目结构
node analyzers/project-scanner.ts <project-path> > structure.json

# 2. 分析代码风格
node analyzers/style-analyzer.ts <project-path> --sample-size 10 > style.json

# 3. 解析需求文本
node analyzers/requirement-parser.ts "需求文本" > requirement.json

# 4. 生成代码
node generators/code-generator.ts \
  --requirement requirement.json \
  --style style.json \
  --project-structure structure.json \
  --output <project-path>
```

**工具输出示例**：

`structure.json`:
```json
{
  "structure": {
    "pages": ["entry/src/main/ets/pages/UserList.ets"],
    "services": ["entry/src/main/ets/services/UserService.ets"],
    "routes": "entry/src/main/resources/base/profile/main_pages.json"
  },
  "existingModules": ["UserManagement", "Auth"]
}
```

`style.json`:
```json
{
  "naming": {
    "components": "PascalCase",
    "functions": "camelCase",
    "constants": "UPPER_SNAKE_CASE"
  },
  "imports": {
    "style": "relative",
    "grouping": true
  },
  "indentation": {
    "type": "spaces",
    "size": 2
  }
}
```

`requirement.json`:
```json
{
  "moduleName": "UserManagement",
  "pages": [
    {"name": "UserList", "type": "list"},
    {"name": "UserEdit", "type": "edit"}
  ],
  "permissions": {"mode": "rbac", "roles": ["admin"]},
  "dataModels": [
    {
      "name": "User",
      "fields": [
        {"name": "id", "type": "string"},
        {"name": "name", "type": "string"},
        {"name": "email", "type": "string"}
      ]
    }
  ]
}
```

---

## 9. 工作流程图

```dot
digraph workflow {
    rankdir=LR;
    node [shape=box, style=rounded];

    start [label="接收自由文本需求"];
    parse_req [label="需求解析器\n结构化需求"];
    scan_proj [label="扫描项目结构"];
    analyze_style [label="分析代码风格"];
    generate [label="生成代码"];
    integrate [label="集成到项目"];
    done [label="完成"];

    start -> parse_req;
    start -> scan_proj;
    scan_proj -> analyze_style;
    parse_req -> generate;
    analyze_style -> generate;
    generate -> integrate;
    integrate -> done;
}
```

---

## 10. 后续步骤

### 测试策略（TDD 方式）

1. **RED 阶段**：创建测试场景
   - 准备一个真实的鸿蒙项目样本
   - 提供自由文本需求
   - 不使用 skill，观察 Claude 的行为（可能会生成不完整的代码、风格不一致）

2. **GREEN 阶段**：实现 skill
   - 编写 SKILL.md 文档
   - 实现命令行工具
   - 验证 Claude 使用 skill 后生成的代码符合要求

3. **REFACTOR 阶段**：优化
   - 处理边界情况
   - 关闭漏洞

### 实施计划

1. 创建 skill 目录结构
2. 编写 SKILL.md 文档
3. 实现分析器工具
4. 实现生成器工具
5. 准备代码模板
6. 编写测试场景
7. 验证和迭代

---

**设计完成时间**: 2026-01-26
**下一步**: 准备实施？使用 `superpowers:writing-plans` 创建详细实施计划
