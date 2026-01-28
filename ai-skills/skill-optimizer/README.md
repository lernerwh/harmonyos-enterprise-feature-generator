# 技能优化助手 (Skill Optimizer)

追踪 Claude Code 技能使用效果，提供实时优化建议。

## 功能

- 🔍 多维度评分：成功率、满意度、效率
- 💡 实时建议：低成功率时推荐替代方案
- 📊 数据可视化：导出技能性能报告
- 🔒 隐私保护：本地存储，仅存指标

## 安装

```bash
npm install
npm run build
```

## 使用

作为技能使用时，会自动追踪和分析。

## 数据存储

- 数据库: `~/.claude/skill-optimizer.db`
- 技能指标: 每个技能目录下的 `.skill-metrics.json`
