# 鸿蒙企业级应用功能生成器 Skill

**版本**: 1.0.0
**目标**: 从自由文本需求自动生成鸿蒙企业级应用功能代码

---

## 何时使用此 Skill

### 适用场景
当用户需要在**现有鸿蒙项目**中添加新功能模块时，使用此 skill。例如：
- "需要一个用户管理功能"
- "添加一个审批流程模块"
- "实现一个数据报表页面"
- "添加库存管理功能"

### 前提条件
1. 目标是**现有**鸿蒙项目（非新建项目）
2. 使用 ArkTS + ArkUI 技术栈
3. 需求以自由文本形式提供

### 不适用场景
- 新建项目（需要其他 skill）
- 非 HarmonyOS 应用
- 只需要生成代码片段（非完整功能）

---

## 核心工作流程

此 skill 遵循**四阶段流程**：

### 1️⃣ 需求理解阶段

**目标**: 将自由文本需求转换为结构化规范

**操作**:
- 使用 LLM 深度理解用户需求
- 识别功能模块、页面结构、数据实体、权限要求
- 输出结构化的 `requirement.json`

**关键问题**:
- 这个功能包含哪些页面？
- 需要什么数据实体和字段？
- 有什么权限要求？
- 有什么特殊的业务逻辑？

### 2️⃣ 项目分析阶段

**目标**: 扫描现有项目，学习代码风格和结构

**操作**:
- 使用 `project-scanner.ts` 扫描项目结构
- 使用 `style-analyzer.ts` 分析代码风格
- 输出 `structure.json` 和 `style.json`

**关键问题**:
- 项目的目录结构是怎样的？
- 现有的路由配置在哪里？
- 代码命名风格是什么（PascalCase/camelCase）？
- 导入语句的写法是怎样的？

### 3️⃣ 代码生成阶段

**目标**: 基于模板和项目风格生成完整代码

**操作**:
- 根据需求选择合适的模板（列表页/详情页/编辑页）
- 应用项目的代码风格
- 生成页面组件、服务层、权限代码、错误处理、日志

**关键问题**:
- 需要生成哪些页面？
- 使用什么权限管理模式（RBAC/ABAC/简单权限）？
- 如何处理错误和日志？

### 4️⃣ 集成配置阶段

**目标**: 将生成的代码集成到项目中

**操作**:
- 将代码放置到正确的目录
- 更新路由配置文件
- 更新权限配置
- 生成配置清单供用户审查

**关键问题**:
- 文件应该放在哪里？
- 如何更新路由配置？
- 需要更新哪些权限配置？

---

## 权限管理智能判断

根据需求文本自动判断权限模式：

| 判断依据 | 权限模式 |
|---------|---------|
| 提及"角色"、"用户组"、"管理员/普通用户"等角色词汇 | **RBAC**（基于角色的访问控制） |
| 提及复杂规则（多维度条件组合） | **ABAC**（基于属性的访问控制） |
| 简单的"只有XX可以访问"或页面级权限 | **简单权限** |

**生成的权限代码**：
- `PermissionCheck` 工具类
- 权限装饰器（如 `@RequireRole('admin')`）
- 权限常量定义
- 权限配置文件（`permissions.ets`）

---

## 状态管理方案

使用 **ArkUI 本地状态管理**（简单高效）：
- `@State`: 页面内部状态
- `@Prop`: 父子组件传参
- `@Provide/@Consume`: 跨层级状态共享

不引入复杂的状态管理库，保持轻量。

---

## 错误处理和日志系统

### 统一错误处理（ErrorProcessor）

**错误分类**：
- **网络错误**: 自动重试（可配置次数）
- **权限错误**: 跳转登录页或提示无权限
- **业务错误**: 显示友好提示
- **系统错误**: 记录日志并显示通用错误信息

**错误码规范**：
- `1xxx`: 用户相关错误
- `2xxx`: 权限相关错误
- `3xxx`: 网络相关错误
- `9xxx`: 系统错误

### 日志工具（Logger）

**日志级别**: DEBUG, INFO, WARN, ERROR

**输出策略**：
- 开发环境：控制台输出（带颜色）
- 生产环境：可选写入文件或上报

---

## 命令行工具使用

### 1. 扫描项目结构
```bash
node analyzers/project-scanner.ts <project-path> > structure.json
```

### 2. 分析代码风格
```bash
node analyzers/style-analyzer.ts <project-path> --sample-size 10 > style.json
```

### 3. 解析需求文本
```bash
node analyzers/requirement-parser.ts "需求文本" > requirement.json
```

### 4. 生成代码
```bash
node generators/code-generator.ts \
  --requirement requirement.json \
  --style style.json \
  --project-structure structure.json \
  --output <project-path>
```

---

## 输出文件示例

### structure.json
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

### style.json
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

### requirement.json
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

## 代码模板

### 可用模板

1. **page-list.ets** - 列表页模板
   - 支持搜索、筛选、分页
   - 下拉刷新、上拉加载
   - 空状态提示

2. **page-detail.ets** - 详情页模板
   - 数据展示
   - 操作按钮（编辑、删除）
   - 返回导航

3. **page-edit.ets** - 编辑页模板
   - 表单验证
   - 保存/取消操作
   - 错误提示

4. **service-base.ets** - 服务基类
   - API 调用封装
   - 数据缓存
   - 错误处理

5. **error-processor.ets** - 错误处理工具
6. **logger.ets** - 日志工具
7. **permission-rbac.ets** - RBAC 权限
8. **permission-simple.ets** - 简单权限

---

## 检查清单

在声称完成之前，确保：

### 需求理解
- [ ] 已识别所有功能模块
- [ ] 已识别所有页面和导航关系
- [ ] 已识别所有数据实体和字段
- [ ] 已识别权限要求

### 项目分析
- [ ] 已扫描项目结构
- [ ] 已分析代码风格
- [ ] 已找到路由配置文件
- [ ] 已找到现有权限配置

### 代码生成
- [ ] 已生成所有页面组件
- [ ] 已生成服务层代码
- [ ] 已生成权限检查代码
- [ ] 已生成错误处理和日志代码

### 集成配置
- [ ] 已将代码放置到正确目录
- [ ] 已更新路由配置
- [ ] 已更新权限配置
- [ ] 已生成配置清单供用户审查

---

## 重要提醒

⚠️ **不要猜测项目结构** - 必须先扫描项目，了解实际结构后再生成代码

⚠️ **不要假设代码风格** - 必须先分析代码风格，保持一致性

⚠️ **不要跳过权限配置** - 根据需求智能判断权限模式，生成相应代码

⚠️ **不要忘记错误处理** - 所有 API 调用和用户操作都必须有错误处理

⚠️ **不要忽略日志** - 重要操作必须记录日志

---

## 常见问题

**Q: 如果项目结构不符合预期怎么办？**
A: 先使用 `project-scanner.ts` 扫描项目，根据实际结构调整生成逻辑。

**Q: 如果代码风格不一致怎么办？**
A: 使用 `style-analyzer.ts` 分析代码风格，应用统一风格。

**Q: 如何处理复杂的权限需求？**
A: 根据需求文本判断权限模式（RBAC/ABAC/简单权限），选择对应的模板。

**Q: 生成的代码如何测试？**
A: 建议在真实鸿蒙项目中运行，验证功能和集成。

---

## 最后检查

在告诉用户"完成"之前，确认：
1. ✅ 所有必需文件已生成
2. ✅ 代码已集成到项目中
3. ✅ 配置已更新
4. ✅ 提供了清晰的配置清单
5. ✅ 用户知道如何验证功能
