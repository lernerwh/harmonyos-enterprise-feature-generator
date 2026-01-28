# 技能优化助手 (Skill Optimizer) 设计文档

**日期:** 2025-01-28
**类型:** 技能设计
**状态:** 设计完成，待实现

---

## 概述

创建一个名为 `skill-optimizer` 的技能，它作为中间层技能，工作在 Claude Code 和其他技能之间。通过学习式优化，记录哪些提示词最有效，自动调整技能的优先级和推荐策略。

**核心特性：**
- 🔍 多维度评分：成功率、满意度、效率
- 💡 实时建议：低成功率时推荐替代方案
- 📊 混合数据收集：用户反馈 + 结果追踪 + 隐式信号
- 🤖 交互式建议：在技能调用时实时给出优化提示

---

## 一、整体架构

### 核心组件

#### 1. 数据收集器 (Data Collector)
在技能调用前后自动捕获数据：
- 记录技能名称、调用时间、对话上下文
- 追踪用户反馈（1-5星评分）
- 分析对话模式（是否重复提问、是否接受建议）

#### 2. 分析引擎 (Analysis Engine)
多维度评估技能表现：
- **成功率**：技能被采纳的比例
- **满意度**：用户评分和情绪分析
- **效率**：解决单个问题需要的对话轮次
- **适用性**：不同场景下的表现差异

#### 3. 建议生成器 (Suggestion Generator)
实时交互式建议：
- 检测到技能表现不佳时，主动提示替代方案
- 发现更好的技能组合时，建议用户尝试
- 提供技能使用的个性化排序

### 工作流程

```
用户请求 → 技能优化助手拦截 → 查询历史数据 →
生成实时建议 → 用户选择 → 调用目标技能 →
记录结果 → 更新数据库
```

---

## 二、数据存储与格式

### 存储位置
- **数据库**: `~/.claude/skill-optimizer.db` (SQLite)
- **可视化文件**: 每个技能目录下的 `.skill-metrics.json`

### 数据库表结构

#### skill_calls - 技能调用记录
```sql
CREATE TABLE skill_calls (
  id INTEGER PRIMARY KEY,
  skill_name TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT,
  context_summary TEXT,
  user_question TEXT
);
```

#### skill_results - 技能结果记录
```sql
CREATE TABLE skill_results (
  id INTEGER PRIMARY KEY,
  call_id INTEGER REFERENCES skill_calls(id),
  success_rate REAL,
  user_rating INTEGER,
  turns INTEGER,
  follow_up_questions INTEGER,
  accepted_suggestions INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### skill_metrics - 技能表现统计（聚合）
```sql
CREATE TABLE skill_metrics (
  skill_name TEXT PRIMARY KEY,
  total_calls INTEGER,
  avg_success_rate REAL,
  avg_rating REAL,
  avg_turns REAL,
  last_updated DATETIME
);
```

### .skill-metrics.json 格式
```json
{
  "skill_name": "harmonyos-code-review",
  "total_uses": 45,
  "avg_rating": 4.2,
  "success_rate": 0.78,
  "best_scenarios": ["code review", "bug detection"],
  "weak_scenarios": ["performance optimization"],
  "suggested_improvements": [
    "添加性能相关的检查规则",
    "增强异步代码审查能力"
  ]
}
```

---

## 三、评分算法

### 多维度评分机制

```typescript
interface SkillScore {
  skill_name: string;
  overall_score: number;      // 0-100 综合得分
  success_rate: number;       // 成功率权重 40%
  user_satisfaction: number;  // 满意度权重 35%
  efficiency: number;         // 效率权重 25%
  trend: 'improving' | 'stable' | 'declining';
}
```

### 计算公式

```typescript
function calculateSkillScore(skill_name: string): SkillScore {
  const calls = getRecentCalls(skill_name, 30);

  // 1. 成功率（40%）
  const success_rate = calls.filter(c => c.accepted).length / calls.length;

  // 2. 满意度（35%）
  const avg_rating = average(calls.map(c => c.rating || 3.5));
  const sentiment = analyzeSentiment(calls.map(c => c.follow_up));

  // 3. 效率（25%）
  const avg_turns = average(calls.map(c => c.turns));
  const efficiency = Math.max(0, 1 - (avg_turns - 1) / 10);

  return {
    skill_name,
    overall_score: success_rate * 40 + avg_rating * 35 + efficiency * 25,
    success_rate,
    user_satisfaction: avg_rating,
    efficiency,
    trend: analyzeTrend(skill_name)
  };
}
```

---

## 四、实时建议触发条件

### 1. 低成功率警告
技能最近 10 次成功率 < 50%

```
💡 提示：该技能在最近场景中成功率为 40%，
   建议尝试：alternative-skill（成功率 75%）
```

### 2. 高效率推荐
发现更适合的技能

```
⚡ 优化：对于当前问题，skill-X 平均只需 2 轮对话，
   而当前技能平均需要 5 轮
```

### 3. 技能组合建议
发现互补技能

```
🔗 建议：结合使用 skill-A + skill-B 可以提升 30% 成功率
```

---

## 五、SKILL.md 结构

```markdown
---
name: skill-optimizer
description: 当分析技能使用模式、提供优化建议、或技能成功率较低时使用。自动跟踪技能效果并建议改进方案
---

# 技能优化助手 (Skill Optimizer)

## 概述
分析技能使用模式并提供实时优化建议。从多个维度跟踪技能效果，并在发现更好的替代方案时主动推荐。

## 何时使用

**自动触发场景：**
- 技能最近 10 次调用成功率 < 50%
- 用户询问"我该用哪个技能来处理 X？"
- 检测到重复的技能使用模式

**手动调用场景：**
- "分析我的技能使用情况"
- "如何改进 [技能名称]？"
- "显示技能性能统计"

## 使用模式

### 模式 1：技能选择指导
当用户寻求帮助时，检查最近的表现数据：
```
1. 查询相关技能的 skill_metrics
2. 按 overall_score 和上下文匹配度排序
3. 展示前 3 个并说明理由
```

### 模式 2：性能分析
分析技能为何表现不佳：
```
1. 审查最近的失败调用
2. 识别常见失败模式
3. 针对性地建议 SKILL.md 改进方案
4. 推荐替代方法
```

### 模式 3：反馈收集
技能调用后：
```
1. 监控对话流程
2. 检测成功/失败信号
3. 如不确定则请求评分
4. 更新 skill_metrics
```

## 数据收集原则

- 仅存储技能名称 + 指标（不含敏感内容）
- 仅本地存储（不同步云端）
- 用户可随时退出或删除数据
- 默认符合 GDPR 标准
```

---

## 六、实现细节

### 目录结构
```
ai-skills/skill-optimizer/
├── SKILL.md                    # 技能定义文件
├── README.md                   # 使用说明
├── src/
│   ├── collector.ts           # 数据收集器
│   ├── analyzer.ts            # 分析引擎
│   ├── suggester.ts           # 建议生成器
│   └── database.ts            # 数据库操作
├── templates/
│   ├── report-template.md     # 性能报告模板
│   └── improvement-template.md # 改进建议模板
└── package.json               # 依赖配置
```

### 核心工作流程

```typescript
// 1. 技能调用前拦截
async function beforeSkillCall(skillName: string, context: string) {
  const metrics = await getSkillMetrics(skillName);

  if (metrics.success_rate < 0.5) {
    return {
      shouldSuggest: true,
      message: `⚠️ 该技能最近成功率仅 ${metrics.success_rate * 100}%`,
      alternatives: getAlternativeSkills(skillName, context)
    };
  }
  return { shouldSuggest: false };
}

// 2. 技能调用后记录
async function afterSkillCall(callId: number, conversation: Conversation) {
  const result = analyzeConversation(conversation);
  await saveSkillResult(result);
  await updateSkillMetrics(skillName);
}

// 3. 实时建议生成
function generateSuggestion(skillName: string, metrics: SkillMetrics) {
  if (metrics.trend === 'declining') {
    return {
      type: 'warning',
      message: '该技能效果正在下降，建议更新 SKILL.md',
      action: 'suggest_improvements'
    };
  }
}
```

### 使用示例

```
用户：帮我审查这段 HarmonyOS 代码

Skill Optimizer 拦截：
→ 检测到 harmonyos-code-review 成功率 78%
→ ✅ 直接调用

---

用户：帮我设计一个新功能

Skill Optimizer 拦截：
→ 检测到多个可用技能
→ 💡 建议：对于功能设计，推荐使用 brainstorming
   （平均 3.2 轮对话，而 generic-planning 需要 5.1 轮）
```

---

## 七、技术依赖

- **数据库**: better-sqlite3 (SQLite)
- **分析**: lodash (数据处理)
- **日期**: date-fns (时间处理)
- **类型**: TypeScript

---

## 八、下一步

1. ✅ 设计文档完成
2. ⏳ 创建实现计划
3. ⏳ 设置 Git Worktree
4. ⏳ 实现 Core 功能
5. ⏳ 测试与优化

---

## 九、成功指标

- 技能选择准确率提升 30%
- 平均对话轮次减少 20%
- 用户满意度 > 4.0/5.0
- 零隐私泄露事件
