#!/usr/bin/env node

/**
 * A/B 测试执行脚本
 * 用于 skill-generator 优化验证
 */

const fs = require('fs');
const path = require('path');

const config = JSON.parse(
  fs.readFileSync('test-results/ab-test-config.json', 'utf8')
);

function recordMetrics(group, sessionId, metrics) {
  const record = {
    group,
    sessionId,
    timestamp: new Date().toISOString(),
    ...metrics
  };

  const filename = `test-results/ab-test-${group}.jsonl`;
  fs.appendFileSync(filename, JSON.stringify(record) + '\n');

  console.log(`✅ 记录 ${group} 组数据: ${sessionId}`);
}

function analyzeResults() {
  console.log('\n📊 A/B 测试结果分析\n');
  console.log('='.repeat(60));

  const groups = ['A', 'B'];

  groups.forEach(group => {
    const filename = `test-results/ab-test-${group}.jsonl`;

    if (!fs.existsSync(filename)) {
      console.log(`\n${group} 组: 无数据\n`);
      return;
    }

    const lines = fs.readFileSync(filename, 'utf8').trim().split('\n');
    const records = lines.map(line => JSON.parse(line));

    const avgTurns = records.reduce((sum, r) => sum + r.turns, 0) / records.length;
    const successRate = records.filter(r => r.success).length / records.length;
    const avgRating = records.reduce((sum, r) => sum + (r.rating || 0), 0) / records.length;

    console.log(`\n${group} 组 (${config.groups[group].name}):`);
    console.log(`  样本数: ${records.length}`);
    console.log(`  平均对话轮次: ${avgTurns.toFixed(1)}`);
    console.log(`  成功率: ${(successRate * 100).toFixed(1)}%`);
    console.log(`  用户满意度: ${avgRating.toFixed(1)}/5.0`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

// CLI 接口
const args = process.argv.slice(2);
const command = args[0];

if (command === 'record') {
  const group = args[1];
  const sessionId = args[2];
  const turns = parseInt(args[3]);
  const success = args[4] === 'true';
  const rating = parseFloat(args[5]) || 0;

  recordMetrics(group, sessionId, { turns, success, rating });
} else if (command === 'analyze') {
  analyzeResults();
} else {
  console.log(`
用法:
  node scripts/run-ab-test.js record <A|B> <sessionId> <turns> <success> <rating>
  node scripts/run-ab-test.js analyze

示例:
  node scripts/run-ab-test.js record A session-123 2 true 4.5
  node scripts/run-ab-test.js analyze
  `);
}
