#!/bin/bash

# Skill Generator 性能测量脚本

echo "📊 测量 SKILL.md 文档大小"
echo "================================"

SKILL_MD="skills/skill-generator/SKILL.md"
REFERENCE_MD="skills/skill-generator/REFERENCE.md"

if [ -f "$SKILL_MD" ]; then
  LINES=$(wc -l < "$SKILL_MD")
  WORDS=$(wc -w < "$SKILL_MD")
  echo "✅ SKILL.md: $LINES 行, $WORDS 词"
else
  echo "❌ SKILL.md 不存在"
fi

if [ -f "$REFERENCE_MD" ]; then
  LINES=$(wc -l < "$REFERENCE_MD")
  WORDS=$(wc -w < "$REFERENCE_MD")
  echo "✅ REFERENCE.md: $LINES 行, $WORDS 词"
else
  echo "❌ REFERENCE.md 不存在"
fi

echo ""
echo "📈 优化目标:"
echo "  - SKILL.md 行数: ~300 行"
echo "  - 对话轮次减少: 5.3 → 2.5 (53%)"
echo "  - 成功率提升: 67% → 85% (27%)"
echo "  - 效率得分提升: 57% → 82% (44%)"
echo ""
