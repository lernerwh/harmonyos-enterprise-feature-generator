# 技能优化助手 (Skill Optimizer)

自动追踪 Claude Code 技能使用效果，提供实时优化建议和性能分析。

## 功能特性

- **自动追踪**: 记录每次技能调用的上下文和结果
- **多维度评分**: 综合成功率、用户满意度、效率等指标
- **智能建议**: 低成功率时推荐替代方案
- **性能分析**: 生成详细的性能报告和趋势分析
- **失败模式识别**: 自动识别常见失败模式
- **隐私保护**: 本地存储，仅保存指标数据

## 快速开始

```typescript
import { Collector, Analyzer, Suggester, SkillOptimizerDB } from 'skill-optimizer';

// 初始化数据库和组件
const db = new SkillOptimizerDB('~/.claude/skill-optimizer.db');
db.initTables();

const collector = new Collector();
const analyzer = new Analyzer(db);
const suggester = new Suggester(db, analyzer);

// 追踪技能调用
const sessionId = collector.startTracking(
  'my-skill',
  '用户的问题',
  '上下文摘要'
);

// 执行技能...

// 结束追踪并记录结果
collector.endTracking(sessionId, {
  success_rate: 0.85,
  user_rating: 4,
  turns: 3,
  follow_up_questions: 1,
  accepted_suggestions: 2
});

// 获取建议
const suggestion = suggester.checkBeforeSkillCall('my-skill', '上下文');
if (suggestion.should_suggest) {
  console.log(suggestion.message);
  console.log('替代方案:', suggestion.alternatives);
}

// 生成性能报告
const report = suggester.generatePerformanceReport('my-skill');
console.log(report);

// 导出指标
collector.exportMetricsToJson('my-skill', './metrics.json');
```

## 使用场景

### 场景 1: 在调用技能前检查性能

当用户询问或系统准备调用技能时，检查技能性能：

```
用户: "帮我用 harmonic-git-review 技能审查代码"

系统行为:
1. 检查 harmonic-git-review 的性能指标
2. 如果成功率 < 50% 或呈下降趋势，建议替代方案
3. 显示性能分数和建议
```

### 场景 2: 追踪技能执行过程

记录技能调用的完整生命周期：

```
开始追踪:
- 记录技能名称、会话 ID、用户问题、上下文
- 返回唯一的会话 ID

执行中:
- 技能正常执行

结束追踪:
- 记录成功率、用户评分、对话轮次
- 记录追问数量、接受建议数量
- 自动更新技能指标
```

### 场景 3: 生成性能报告

为技能开发者提供详细的性能分析：

```
# Performance Report: harmonic-git-review

## Overall Score
- **Score**: 75/100
- **Trend**: 📉 declining

## Detailed Metrics
- **Success Rate**: 65.0%
- **User Satisfaction**: 3.8/5.0
- **Efficiency**: 72.0%

## Call Statistics
- **Total Calls**: 23
- **Average Turns**: 5.2
- **Last Updated**: 2025-01-28 10:30:00

## Improvement Suggestions
1. Declining performance trend detected: Review recent changes
2. Moderate efficiency (72.0%): Reduce average conversation turns
```

### 场景 4: 分析失败模式

自动识别技能的常见问题：

```typescript
const patterns = analyzer.analyzeFailurePatterns('my-skill');
// 返回:
// [
//   'High average conversation turns indicate complexity',
//   'Excessive follow-up questions suggest incomplete responses'
// ]
```

## 数据结构

### SkillCall (技能调用)

```typescript
{
  id: number;
  skill_name: string;
  timestamp: string;
  session_id: string;
  context_summary: string;
  user_question: string;
}
```

### SkillResult (技能结果)

```typescript
{
  id: number;
  call_id: number;
  success_rate: number;        // 0-1
  user_rating?: number;        // 1-5
  turns: number;              // 对话轮次
  follow_up_questions: number; // 追问数量
  accepted_suggestions: number; // 接受建议数量
  timestamp: string;
}
```

### SkillMetrics (技能指标)

```typescript
{
  skill_name: string;
  total_calls: number;
  avg_success_rate: number;
  avg_rating: number;
  avg_turns: number;
  last_updated: string;
}
```

### SkillScore (综合评分)

```typescript
{
  skill_name: string;
  overall_score: number;      // 0-100
  success_rate: number;       // 0-1
  user_satisfaction: number;  // 1-5
  efficiency: number;         // 0-1
  trend: 'improving' | 'stable' | 'declining';
}
```

## 评分算法

### 综合评分 (Overall Score)

```
总分 = 成功分数 + 满意度分数 + 效率分数

成功分数 = 平均成功率 × 40 (权重 40%)
满意度分数 = 平均评分 × 7 (权重 35%)
效率分数 = 效率值 × 25 (权重 25%)

效率值 = max(0, 1 - (平均轮次 - 1) / 10)
```

### 趋势分析

将最近 20 次调用分为两半，比较平均成功率：

```
差值 = 近期平均 - 早期平均

差值 > 0.1: improving (上升)
差值 < -0.1: declining (下降)
否则: stable (稳定)
```

## 建议生成规则

### 触发条件

1. **低成功率**: 成功率 < 50%
2. **下降趋势**: trend = 'declining'
3. **低综合分**: overall_score < 50

### 建议类型

- `warning`: 警告，建议替代方案
- `info`: 信息，提示优化空间
- `optimization`: 优化建议

## 数据存储

### 数据库位置

```
~/.claude/skill-optimizer.db
```

### 表结构

**skill_calls**: 技能调用记录
- id, skill_name, timestamp, session_id
- context_summary, user_question

**skill_results**: 技能结果记录
- id, call_id, success_rate, user_rating
- turns, follow_up_questions, accepted_suggestions
- timestamp

**skill_metrics**: 技能汇总指标
- skill_name (PRIMARY KEY)
- total_calls, avg_success_rate, avg_rating, avg_turns
- last_updated

## 隐私保护

- **本地存储**: 所有数据存储在本地数据库
- **仅存指标**: 不存储用户对话内容，仅存储上下文摘要
- **匿名化**: 不记录用户身份信息
- **可控性**: 用户可随时删除数据库

## API 参考

### Collector

```typescript
// 初始化
collector.initialize(): void

// 开始追踪
startTracking(skillName, userQuestion, contextSummary): string
// 返回 sessionId

// 结束追踪
endTracking(sessionId, result): void
// result: { success_rate, user_rating?, turns, follow_up_questions, accepted_suggestions }

// 分析对话
analyzeConversation(messages: string[]): ConversationAnalysis
// 返回对话统计和复杂度评分

// 导出指标
exportMetricsToJson(skillName, outputPath): void
```

### Analyzer

```typescript
// 计算综合评分
calculateSkillScore(skillName): SkillScore | null

// 获取最佳技能
getBestSkills(context, limit?): SkillScore[]

// 分析失败模式
analyzeFailurePatterns(skillName): string[]
```

### Suggester

```typescript
// 调用前检查
checkBeforeSkillCall(skillName, context): Suggestion
// 返回 { should_suggest, message?, alternatives?, type? }

// 生成性能报告
generatePerformanceReport(skillName): string
// 返回 Markdown 格式报告

// 生成改进建议
generateImprovementSuggestions(skillName): string[]
```

## 最佳实践

### 1. 始终追踪技能调用

```typescript
const sessionId = collector.startTracking(...);
try {
  // 执行技能
} finally {
  collector.endTracking(sessionId, ...);
}
```

### 2. 客观评估成功率

基于任务完成度评估，而非主观感受：

- **1.0**: 完全满足需求，无需额外操作
- **0.7-0.9**: 基本满足需求，需要少量调整
- **0.4-0.6**: 部分满足需求，需要大量修改
- **0.1-0.3**: 几乎不满足需求
- **0.0**: 完全失败

### 3. 记录用户评分

在合适时机主动询问用户满意度：

```
"这次帮助是否有效？请评分 1-5 分"
```

### 4. 定期查看性能报告

每周或每月生成报告，识别需要优化的技能。

### 5. 关注下降趋势

即使绝对分数尚可，下降趋势也值得关注。

## 故障排查

### 问题: 数据库未初始化

```bash
# 确保调用 initialize()
collector.initialize();
```

### 问题: sessionId 无效

确保 `startTracking` 和 `endTracking` 使用相同的 sessionId。

### 问题: 评分为 null

新技能或数据不足时会返回 null，需要至少一次成功的调用记录。

## 开发路线图

- [ ] Web UI 仪表板
- [ ] 自动优化建议实施
- [ ] 跨技能性能对比
- [ ] 技能依赖关系分析
- [ ] 实时性能监控
- [ ] 导出为 CSV/Excel
- [ ] 性能预警通知

## 贡献

欢迎提交问题和改进建议！

## 许可证

MIT
