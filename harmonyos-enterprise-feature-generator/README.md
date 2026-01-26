# 鸿蒙企业级应用功能生成器

从自由文本需求自动生成鸿蒙企业级应用功能代码。

## 功能特点

- 🎯 **需求理解**: 从自由文本需求自动提取功能模块、页面结构、数据模型
- 📊 **项目分析**: 自动扫描项目结构，学习代码风格
- 🔧 **代码生成**: 生成完整的页面、服务、权限、错误处理、日志代码
- 🎨 **风格一致**: 自动学习和应用项目的代码风格
- 🔐 **权限管理**: 智能判断权限模式（RBAC/ABAC/简单权限）

## 快速开始

### 1. 准备工作

确保你已经有一个鸿蒙项目，使用 ArkTS + ArkUI 技术栈。

### 2. 使用流程

```bash
# 1. 扫描项目结构
node analyzers/project-scanner.ts /path/to/your/project > structure.json

# 2. 分析代码风格
node analyzers/style-analyzer.ts /path/to/your/project --sample-size 10 > style.json

# 3. 解析需求文本
node analyzers/requirement-parser.ts "需要一个用户管理功能，包含列表、详情、编辑页面" > requirement.json

# 4. 生成代码
node generators/code-generator.ts \
  --requirement requirement.json \
  --style style.json \
  --project-structure structure.json \
  --output /path/to/your/project
```

### 3. 示例

假设你的需求是："需要一个用户管理功能，包含列表、详情、编辑页面，支持增删改查，只有管理员可以删除用户"

```bash
node analyzers/requirement-parser.ts "需要一个用户管理功能，包含列表、详情、编辑页面，支持增删改查，只有管理员可以删除用户" > requirement.json
```

生成的 `requirement.json`：

```json
{
  "moduleName": "用户管理",
  "description": "需要一个用户管理功能",
  "pages": [
    {
      "name": "用户列表",
      "type": "list",
      "description": "列表页"
    },
    {
      "name": "用户详情",
      "type": "detail",
      "description": "详情页"
    },
    {
      "name": "用户编辑",
      "type": "edit",
      "description": "编辑页"
    }
  ],
  "dataModels": [
    {
      "name": "User",
      "description": "User数据模型",
      "fields": [
        {
          "name": "id",
          "type": "string",
          "description": "id",
          "required": true,
          "editable": false
        },
        {
          "name": "name",
          "type": "string",
          "description": "name",
          "required": true,
          "editable": true
        }
      ]
    }
  ],
  "permissions": {
    "mode": "rbac",
    "roles": ["管理员"],
    "permissions": ["查看", "删除", "编辑"]
  },
  "features": []
}
```

## 项目结构

```
harmonyos-enterprise-feature-generator/
├── SKILL.md                           # Skill 文档
├── README.md                          # 本文件
├── templates/                         # 代码模板
│   ├── page-list.ets                  # 列表页模板
│   ├── page-detail.ets                # 详情页模板
│   ├── page-edit.ets                  # 编辑页模板
│   ├── service-base.ets               # 服务基类
│   ├── error-processor.ets            # 错误处理工具
│   ├── logger.ets                     # 日志工具
│   ├── permission-rbac.ets            # RBAC 权限
│   └── permission-simple.ets          # 简单权限
├── analyzers/                         # 分析工具
│   ├── project-scanner.ts             # 项目扫描器
│   ├── style-analyzer.ts              # 代码风格分析器
│   └── requirement-parser.ts          # 需求解析器
└── generators/                        # 生成器
    └── code-generator.ts              # 代码生成器
```

## 支持的页面类型

- **list**: 列表页（支持搜索、筛选、分页、下拉刷新、上拉加载）
- **detail**: 详情页（展示详细信息、操作按钮）
- **edit**: 编辑页（表单验证、保存/取消操作）
- **form**: 表单页（同编辑页）
- **dashboard**: 仪表盘（待实现）
- **custom**: 自定义页面（待实现）

## 权限模式

### RBAC（基于角色的访问控制）

当需求中提及"角色"、"管理员"、"用户组"等词汇时自动选择。

示例：
```
"需要一个用户管理功能，只有管理员和经理可以访问"
```

### ABAC（基于属性的访问控制）

当需求中提及复杂的规则条件时自动选择。

示例：
```
"审批流程：部门经理可以审批金额小于1万的申请，总经理可以审批所有申请"
```

### 简单权限

默认模式，适用于简单的页面级权限控制。

示例：
```
"需要一个数据报表功能，只有授权用户可以查看"
```

## 生成的代码特性

### 1. 完整的错误处理

- 网络错误：自动重试
- 权限错误：跳转登录页或提示无权限
- 业务错误：显示友好提示
- 系统错误：记录日志并显示通用错误信息

### 2. 统一的日志系统

- 支持多级别日志（DEBUG, INFO, WARN, ERROR）
- 开发环境控制台输出（带颜色）
- 生产环境可选文件输出

### 3. 权限检查

- 装饰器支持（`@RequireRole`, `@RequirePermission`）
- 运行时权限检查
- 支持多种权限模式

### 4. 代码风格一致性

- 自动学习项目代码风格
- 应用统一的命名规范
- 保持缩进、引号等格式一致

## 注意事项

1. **项目要求**：
   - 必须是现有鸿蒙项目
   - 使用 ArkTS + ArkUI 技术栈
   - 有标准的目录结构（entry/src/main/ets/...）

2. **备份代码**：
   - 在生成代码前，建议先备份项目
   - 或使用 git 管理代码，方便回滚

3. **人工审查**：
   - 生成的代码需要人工审查和调整
   - 特别是业务逻辑部分可能需要手动实现

4. **测试验证**：
   - 生成代码后需要在真实环境中测试
   - 验证功能和集成是否正常

## 常见问题

### Q: 如何自定义代码模板？

A: 可以修改 `templates/` 目录下的模板文件，模板使用占位符语法，如 `{{ModuleName}}`。

### Q: 如何添加新的页面类型？

A:
1. 在 `templates/` 目录下创建新的模板文件
2. 在 `generators/code-generator.ts` 的 `getTemplateFile` 方法中添加映射
3. 在 `analyzers/requirement-parser.ts` 的 `parsePages` 方法中添加识别逻辑

### Q: 如何修改权限模式判断逻辑？

A: 编辑 `analyzers/requirement-parser.ts` 中的 `parsePermissions` 方法。

### Q: 生成的代码风格不对怎么办？

A: 增加 `style-analyzer.ts` 的样本数量（`--sample-size` 参数），或手动调整生成的代码。

## 开发计划

- [ ] 支持更多页面类型（dashboard、custom 等）
- [ ] 支持自定义模板
- [ ] 支持交互式配置
- [ ] 添加更多权限模式
- [ ] 支持单元测试代码生成
- [ ] 集成到 Claude Code Skill 系统

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
