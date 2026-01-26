# 使用指南

## 目录

1. [环境要求](#环境要求)
2. [安装](#安装)
3. [快速开始](#快速开始)
4. [详细说明](#详细说明)
5. [最佳实践](#最佳实践)
6. [故障排除](#故障排除)

## 环境要求

- Node.js 16+
- 一个现有鸿蒙项目（ArkTS + ArkUI）

## 安装

```bash
# 克隆仓库
git clone https://github.com/lernerwh/harmonyos-enterprise-feature-generator.git

# 进入目录
cd harmonyos-enterprise-feature-generator

# 安装依赖（如果有）
npm install
```

## 快速开始

### 场景 1：生成用户管理功能

```bash
# 1. 分析你的项目
node analyzers/project-scanner.ts /path/to/your/harmonyos/project > structure.json

# 2. 分析代码风格
node analyzers/style-analyzer.ts /path/to/your/harmonyos/project --sample-size 10 > style.json

# 3. 解析需求
node analyzers/requirement-parser.ts "需要一个用户管理功能，包含列表、详情、编辑页面，支持增删改查操作" > requirement.json

# 4. 生成代码
node generators/code-generator.ts \
  --requirement requirement.json \
  --style style.json \
  --project-structure structure.json \
  --output /path/to/your/harmonyos/project
```

### 场景 2：生成审批流程功能（RBAC 权限）

```bash
node analyzers/requirement-parser.ts "需要一个审批流程功能，员工可以提交申请，部门经理和总经理可以审批，只有管理员可以删除记录" > requirement.json

node generators/code-generator.ts \
  --requirement requirement.json \
  --style style.json \
  --project-structure structure.json \
  --output /path/to/your/harmonyos/project
```

### 场景 3：生成数据报表功能（简单权限）

```bash
node analyzers/requirement-parser.ts "需要一个数据报表功能，展示销售数据统计，支持按日期范围筛选，可以导出Excel，只有授权用户可以访问" > requirement.json

node generators/code-generator.ts \
  --requirement requirement.json \
  --style style.json \
  --project-structure structure.json \
  --output /path/to/your/harmonyos/project
```

## 详细说明

### 1. 项目扫描器 (project-scanner.ts)

扫描项目结构，识别关键文件和目录。

**输入**：项目路径

**输出**：JSON 格式的项目结构

```json
{
  "structure": {
    "pages": ["entry/src/main/ets/pages/UserList.ets"],
    "services": ["entry/src/main/ets/services/UserService.ets"],
    "components": [],
    "routes": "entry/src/main/resources/base/profile/main_pages.json",
    "resources": "entry/src/main/resources"
  },
  "existingModules": ["User"],
  "entryPath": "/path/to/entry"
}
```

### 2. 代码风格分析器 (style-analyzer.ts)

分析项目的代码风格，包括命名规范、导入方式、缩进等。

**输入**：项目路径

**输出**：JSON 格式的代码风格配置

```json
{
  "naming": {
    "components": "PascalCase",
    "functions": "camelCase",
    "constants": "UPPER_SNAKE_CASE",
    "interfaces": "PascalCase"
  },
  "imports": {
    "style": "relative",
    "grouping": true,
    "sorting": false
  },
  "indentation": {
    "type": "spaces",
    "size": 2
  },
  "quotes": {
    "type": "double"
  },
  "semicolons": true,
  "confidence": 0.8,
  "sampleSize": 10
}
```

**参数**：
- `--sample-size`: 分析的文件数量（默认 10）

### 3. 需求解析器 (requirement-parser.ts)

将自由文本需求转换为结构化的需求规范。

**输入**：需求文本

**输出**：JSON 格式的需求规范

```json
{
  "moduleName": "用户管理",
  "description": "需要一个用户管理功能",
  "pages": [
    {"name": "用户列表", "type": "list", "description": "列表页"},
    {"name": "用户详情", "type": "detail", "description": "详情页"},
    {"name": "用户编辑", "type": "edit", "description": "编辑页"}
  ],
  "dataModels": [
    {
      "name": "User",
      "description": "User数据模型",
      "fields": [
        {"name": "id", "type": "string", "description": "id", "required": true, "editable": false},
        {"name": "name", "type": "string", "description": "name", "required": true, "editable": true}
      ]
    }
  ],
  "permissions": {
    "mode": "simple",
    "permissions": ["查看", "编辑", "删除"]
  },
  "features": []
}
```

### 4. 代码生成器 (code-generator.ts)

根据需求、代码风格和项目结构生成代码。

**输入**：
- `--requirement`: 需求规范文件（requirement.json）
- `--style`: 代码风格文件（style.json）
- `--project-structure`: 项目结构文件（structure.json）
- `--output`: 输出路径（项目根目录）

**输出**：生成的代码文件

## 最佳实践

### 1. 编写清晰的需求描述

好的需求描述应该包含：
- ✅ 功能名称
- ✅ 页面列表
- ✅ 数据字段
- ✅ 权限要求
- ✅ 业务逻辑

**好的例子**：
```
需要一个库存管理功能，包含：
1. 库存列表页：展示商品名称、库存数量、单价，支持搜索和筛选
2. 库存详情页：展示商品的详细信息、库存历史记录
3. 入库/出库页面：填写商品、数量、备注等信息
只有管理员和仓库管理员可以操作，其他人员只能查看
```

**不好的例子**：
```
做一个库存管理
```

### 2. 检查生成的代码

生成代码后，需要检查：
- [ ] 页面路由是否正确
- [ ] 服务类 API 路径是否正确
- [ ] 权限配置是否符合需求
- [ ] 字段映射是否正确
- [ ] 业务逻辑是否完整

### 3. 测试功能

在真实鸿蒙项目中运行测试：
- [ ] 页面是否能正常打开
- [ ] 数据是否能正确加载
- [ ] 权限检查是否生效
- [ ] 错误处理是否正确
- [ ] 日志是否正常输出

### 4. 版本控制

建议使用 git 管理代码：
```bash
# 生成前提交
git add .
git commit -m "feat: 生成代码前"

# 生成代码
node generators/code-generator.ts ...

# 检查生成的代码
git diff

# 如有问题，可以回滚
git checkout .

# 或创建新分支
git checkout -b feature/user-management
```

## 故障排除

### 问题 1：找不到 entry 目录

**错误信息**：`未找到 entry 目录`

**解决方法**：
- 确认项目是否是标准鸿蒙项目结构
- 检查是否存在 `entry/` 或 `Entry/` 目录
- 如果目录名不同，手动修改 `project-scanner.ts` 中的 `findEntryDirectory` 方法

### 问题 2：代码风格分析失败

**错误信息**：`未找到 .ets 文件`

**解决方法**：
- 确认项目路径是否正确
- 增加 `--sample-size` 参数
- 手动检查项目中是否有 `.ets` 文件

### 问题 3：生成的代码无法编译

**可能原因**：
- 模板占位符替换不正确
- 代码风格应用有问题
- API 路径不正确

**解决方法**：
- 检查 `requirement.json` 中的字段是否正确
- 手动调整生成的代码
- 提交 Issue，附上错误信息和生成的代码

### 问题 4：权限检查不生效

**可能原因**：
- 权限模式判断错误
- 权限初始化未调用
- 用户 ID 获取失败

**解决方法**：
- 检查 `requirement.json` 中的 `permissions` 配置
- 确认在应用启动时调用了权限初始化方法
- 实现获取当前用户 ID 的逻辑

## 进阶使用

### 自定义模板

1. 复制 `templates/` 目录下的模板文件
2. 修改模板内容和占位符
3. 更新 `generators/code-generator.ts` 中的模板路径

### 添加新的分析规则

编辑 `analyzers/requirement-parser.ts`，添加自定义的解析逻辑。

### 集成到构建流程

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "generate": "node generators/code-generator.ts --requirement requirement.json --style style.json --project-structure structure.json --output ./"
  }
}
```

使用：
```bash
npm run generate
```

## 联系方式

如有问题，请提交 Issue 或 Pull Request。
