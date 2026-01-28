# 技能优化助手 (Skill Optimizer) 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 构建一个学习式技能优化系统，通过追踪技能使用效果（成功率、满意度、效率）并提供实时优化建议

**架构:** TypeScript + SQLite 数据库，作为 Claude Code 技能系统的中间层，在技能调用前后收集数据、分析模式、生成建议

**技术栈:**
- TypeScript (Node.js)
- better-sqlite3 (SQLite 数据库)
- date-fns (时间处理)
- lodash (数据处理)

---

## Task 1: 初始化项目结构

**Files:**
- Create: `ai-skills/skill-optimizer/package.json`
- Create: `ai-skills/skill-optimizer/tsconfig.json`
- Create: `ai-skills/skill-optimizer/.gitignore`
- Create: `ai-skills/skill-optimizer/README.md`

### Step 1: 创建 package.json

```bash
cat > ai-skills/skill-optimizer/package.json << 'EOF'
{
  "name": "skill-optimizer",
  "version": "1.0.0",
  "description": "技能优化助手 - 追踪技能使用效果并提供优化建议",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "tsc --watch"
  },
  "keywords": [
    "skill-optimizer",
    "performance-tracking",
    "recommendation-engine"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "better-sqlite3": "^9.0.0",
    "date-fns": "^3.0.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/jest": "^29.5.0",
    "@types/lodash": "^4.14.200",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  }
}
EOF
```

### Step 2: 创建 tsconfig.json

```bash
cat > ai-skills/skill-optimizer/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
```

### Step 3: 创建 .gitignore

```bash
cat > ai-skills/skill-optimizer/.gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
skill-optimizer.db
EOF
```

### Step 4: 创建 README.md

```bash
cat > ai-skills/skill-optimizer/README.md << 'EOF'
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
EOF
```

### Step 5: 提交

```bash
cd ai-skills/skill-optimizer
git add .
git commit -m "feat: 初始化项目结构和配置文件"
```

---

## Task 2: 数据库模块 (Database)

**Files:**
- Create: `ai-skills/skill-optimizer/src/database.ts`
- Create: `ai-skills/skill-optimizer/src/types.ts`
- Create: `ai-skills/skill-optimizer/tests/database.test.ts`

### Step 1: 定义类型

创建 `src/types.ts`:

```typescript
export interface SkillCall {
  id?: number;
  skill_name: string;
  timestamp?: string;
  session_id: string;
  context_summary: string;
  user_question: string;
}

export interface SkillResult {
  id?: number;
  call_id: number;
  success_rate: number;
  user_rating?: number;
  turns: number;
  follow_up_questions: number;
  accepted_suggestions: number;
  timestamp?: string;
}

export interface SkillMetrics {
  skill_name: string;
  total_calls: number;
  avg_success_rate: number;
  avg_rating: number;
  avg_turns: number;
  last_updated?: string;
}

export interface SkillScore {
  skill_name: string;
  overall_score: number;
  success_rate: number;
  user_satisfaction: number;
  efficiency: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Suggestion {
  should_suggest: boolean;
  message?: string;
  alternatives?: string[];
  type?: 'warning' | 'info' | 'optimization';
}
```

### Step 2: 编写数据库模块

创建 `src/database.ts`:

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { SkillCall, SkillResult, SkillMetrics } from './types';

const DB_PATH = path.join(os.homedir(), '.claude', 'skill-optimizer.db');

class SkillOptimizerDB {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_name TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_id TEXT,
        context_summary TEXT,
        user_question TEXT
      );

      CREATE TABLE IF NOT EXISTS skill_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_id INTEGER REFERENCES skill_calls(id),
        success_rate REAL,
        user_rating INTEGER,
        turns INTEGER,
        follow_up_questions INTEGER,
        accepted_suggestions INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skill_metrics (
        skill_name TEXT PRIMARY KEY,
        total_calls INTEGER DEFAULT 0,
        avg_success_rate REAL DEFAULT 0,
        avg_rating REAL DEFAULT 0,
        avg_turns REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_skill_calls_name ON skill_calls(skill_name);
      CREATE INDEX IF NOT EXISTS idx_skill_results_call_id ON skill_results(call_id);
    `);
  }

  // 记录技能调用
  recordSkillCall(call: SkillCall): number {
    const stmt = this.db.prepare(`
      INSERT INTO skill_calls (skill_name, session_id, context_summary, user_question)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(call.skill_name, call.session_id, call.context_summary, call.user_question);
    return result.lastInsertRowid as number;
  }

  // 记录技能结果
  recordSkillResult(result: SkillResult): void {
    const stmt = this.db.prepare(`
      INSERT INTO skill_results (call_id, success_rate, user_rating, turns, follow_up_questions, accepted_suggestions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      result.call_id,
      result.success_rate,
      result.user_rating,
      result.turns,
      result.follow_up_questions,
      result.accepted_suggestions
    );
    this.updateMetrics(result.call_id);
  }

  // 更新聚合指标
  private updateMetrics(callId: number): void {
    const callStmt = this.db.prepare('SELECT skill_name FROM skill_calls WHERE id = ?');
    const call = callStmt.get(callId) as { skill_name: string } | undefined;

    if (!call) return;

    const skillName = call.skill_name;

    const aggStmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_calls,
        AVG(sr.success_rate) as avg_success_rate,
        AVG(sr.user_rating) as avg_rating,
        AVG(sr.turns) as avg_turns
      FROM skill_results sr
      JOIN skill_calls sc ON sr.call_id = sc.id
      WHERE sc.skill_name = ?
    `);
    const agg = aggStmt.get(skillName) as {
      total_calls: number;
      avg_success_rate: number;
      avg_rating: number;
      avg_turns: number;
    } | undefined;

    if (!agg) return;

    const upsertStmt = this.db.prepare(`
      INSERT INTO skill_metrics (skill_name, total_calls, avg_success_rate, avg_rating, avg_turns, last_updated)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(skill_name) DO UPDATE SET
        total_calls = excluded.total_calls,
        avg_success_rate = excluded.avg_success_rate,
        avg_rating = excluded.avg_rating,
        avg_turns = excluded.avg_turns,
        last_updated = excluded.last_updated
    `);
    upsertStmt.run(skillName, agg.total_calls, agg.avg_success_rate || 0, agg.avg_rating || 0, agg.avg_turns || 0);
  }

  // 获取技能指标
  getSkillMetrics(skillName: string): SkillMetrics | null {
    const stmt = this.db.prepare('SELECT * FROM skill_metrics WHERE skill_name = ?');
    return stmt.get(skillName) as SkillMetrics | undefined;
  }

  // 获取最近的调用记录
  getRecentCalls(skillName: string, limit: number = 30): Array<SkillCall & SkillResult> {
    const stmt = this.db.prepare(`
      SELECT
        sc.*,
        sr.success_rate,
        sr.user_rating,
        sr.turns,
        sr.follow_up_questions,
        sr.accepted_suggestions
      FROM skill_calls sc
      LEFT JOIN skill_results sr ON sc.id = sr.call_id
      WHERE sc.skill_name = ?
      ORDER BY sc.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(skillName, limit) as Array<SkillCall & SkillResult>;
  }

  // 获取所有技能指标
  getAllMetrics(): SkillMetrics[] {
    const stmt = this.db.prepare('SELECT * FROM skill_metrics ORDER BY avg_success_rate DESC');
    return stmt.all() as SkillMetrics[];
  }

  close(): void {
    this.db.close();
  }
}

export const db = new SkillOptimizerDB();
```

### Step 3: 编写测试

创建 `tests/database.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '../src/database';
import { SkillCall, SkillResult } from '../src/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.claude', 'skill-optimizer.db');

describe('Database', () => {
  beforeEach(() => {
    // 清空数据库
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  afterEach(() => {
    db.close();
  });

  test('should record and retrieve skill call', () => {
    const call: SkillCall = {
      skill_name: 'test-skill',
      session_id: 'session-123',
      context_summary: 'Testing',
      user_question: 'Help me'
    };

    const callId = db.recordSkillCall(call);
    expect(callId).toBeGreaterThan(0);

    const calls = db.getRecentCalls('test-skill', 1);
    expect(calls).toHaveLength(1);
    expect(calls[0].skill_name).toBe('test-skill');
  });

  test('should record skill result and update metrics', () => {
    const call: SkillCall = {
      skill_name: 'test-skill',
      session_id: 'session-123',
      context_summary: 'Testing',
      user_question: 'Help me'
    };

    const callId = db.recordSkillCall(call);

    const result: SkillResult = {
      call_id: callId,
      success_rate: 0.8,
      user_rating: 4,
      turns: 3,
      follow_up_questions: 1,
      accepted_suggestions: 2
    };

    db.recordSkillResult(result);

    const metrics = db.getSkillMetrics('test-skill');
    expect(metrics).toBeDefined();
    expect(metrics?.total_calls).toBe(1);
    expect(metrics?.avg_success_rate).toBeCloseTo(0.8);
  });
});
```

### Step 4: 安装依赖

```bash
cd ai-skills/skill-optimizer
npm install
```

### Step 5: 运行测试验证

```bash
npm test
```

预期：测试通过

### Step 6: 提交

```bash
git add .
git commit -m "feat: 实现数据库模块和类型定义"
```

---

## Task 3: 分析引擎 (Analyzer)

**Files:**
- Create: `ai-skills/skill-optimizer/src/analyzer.ts`
- Create: `ai-skills/skill-optimizer/tests/analyzer.test.ts`

### Step 1: 编写分析引擎

创建 `src/analyzer.ts`:

```typescript
import { db } from './database';
import { SkillScore } from './types';
import _ from 'lodash';

export class Analyzer {
  /**
   * 计算技能综合得分
   */
  calculateSkillScore(skillName: string): SkillScore | null {
    const calls = db.getRecentCalls(skillName, 30);

    if (calls.length === 0) {
      return null;
    }

    // 过滤有结果的调用
    const validCalls = calls.filter(c => c.success_rate !== undefined);

    if (validCalls.length === 0) {
      return null;
    }

    // 1. 成功率 (40%)
    const successRate = _.mean(validCalls.map(c => c.success_rate || 0));

    // 2. 满意度 (35%)
    const ratings = validCalls.map(c => c.user_rating || 3.5);
    const avgRating = _.mean(ratings);

    // 3. 效率 (25%) - 对话轮次越少越好
    const avgTurns = _.mean(validCalls.map(c => c.turns || 1));
    const efficiency = Math.max(0, 1 - (avgTurns - 1) / 10);

    const overallScore = successRate * 40 + avgRating * 7 + efficiency * 25;

    return {
      skill_name: skillName,
      overall_score: Math.round(overallScore),
      success_rate: Math.round(successRate * 100) / 100,
      user_satisfaction: Math.round(avgRating * 10) / 10,
      efficiency: Math.round(efficiency * 100) / 100,
      trend: this.analyzeTrend(skillName)
    };
  }

  /**
   * 分析技能趋势
   */
  private analyzeTrend(skillName: string): 'improving' | 'stable' | 'declining' {
    const calls = db.getRecentCalls(skillName, 20);
    const validCalls = calls.filter(c => c.success_rate !== undefined);

    if (validCalls.length < 5) {
      return 'stable';
    }

    // 分为前后两半比较
    const mid = Math.floor(validCalls.length / 2);
    const firstHalf = validCalls.slice(0, mid);
    const secondHalf = validCalls.slice(mid);

    const firstAvg = _.mean(firstHalf.map(c => c.success_rate || 0));
    const secondAvg = _.mean(secondHalf.map(c => c.success_rate || 0));

    const diff = secondAvg - firstAvg;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * 获取最佳技能推荐
   */
  getBestSkills(context: string, limit: number = 3): Array<{ skill_name: string; score: number }> {
    const allMetrics = db.getAllMetrics();

    const scores = allMetrics
      .map(m => {
        const score = this.calculateSkillScore(m.skill_name);
        return score ? { skill_name: score.skill_name, score: score.overall_score } : null;
      })
      .filter((s): s is { skill_name: string; score: number } => s !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scores;
  }

  /**
   * 分析失败模式
   */
  analyzeFailurePatterns(skillName: string): string[] {
    const calls = db.getRecentCalls(skillName, 20);
    const failures = calls.filter(c => (c.success_rate || 0) < 0.5);

    const patterns: string[] = [];

    if (failures.length > calls.length * 0.5) {
      patterns.push('该技能整体成功率偏低');
    }

    const avgTurns = _.mean(failures.map(c => c.turns || 0));
    if (avgTurns > 5) {
      patterns.push('解决问题需要的对话轮次过多');
    }

    const avgFollowUps = _.mean(failures.map(c => c.follow_up_questions || 0));
    if (avgFollowUps > 2) {
      patterns.push('用户经常需要追问，说明建议不够清晰');
    }

    return patterns;
  }
}

export const analyzer = new Analyzer();
```

### Step 2: 编写测试

创建 `tests/analyzer.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { db } from '../src/database';
import { analyzer } from '../src/analyzer';
import { SkillCall, SkillResult } from '../src/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.claude', 'skill-optimizer.db');

describe('Analyzer', () => {
  beforeEach(() => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  test('should calculate skill score', () => {
    // 添加测试数据
    const call: SkillCall = {
      skill_name: 'test-skill',
      session_id: 'session-1',
      context_summary: 'Test',
      user_question: 'Help'
    };

    const callId = db.recordSkillCall(call);

    const result: SkillResult = {
      call_id: callId,
      success_rate: 0.8,
      user_rating: 4,
      turns: 3,
      follow_up_questions: 1,
      accepted_suggestions: 1
    };

    db.recordSkillResult(result);

    const score = analyzer.calculateSkillScore('test-skill');
    expect(score).toBeDefined();
    expect(score?.skill_name).toBe('test-skill');
    expect(score?.overall_score).toBeGreaterThan(0);
  });

  test('should detect improving trend', () => {
    const skillName = 'improving-skill';

    // 添加前期低成功率数据
    for (let i = 0; i < 5; i++) {
      const call: SkillCall = {
        skill_name: skillName,
        session_id: `session-${i}`,
        context_summary: 'Test',
        user_question: 'Help'
      };
      const callId = db.recordSkillCall(call);
      db.recordSkillResult({
        call_id: callId,
        success_rate: 0.3,
        turns: 6,
        follow_up_questions: 3,
        accepted_suggestions: 0
      });
    }

    // 添加后期高成功率数据
    for (let i = 5; i < 10; i++) {
      const call: SkillCall = {
        skill_name: skillName,
        session_id: `session-${i}`,
        context_summary: 'Test',
        user_question: 'Help'
      };
      const callId = db.recordSkillCall(call);
      db.recordSkillResult({
        call_id: callId,
        success_rate: 0.9,
        turns: 2,
        follow_up_questions: 0,
        accepted_suggestions: 2
      });
    }

    const score = analyzer.calculateSkillScore(skillName);
    expect(score?.trend).toBe('improving');
  });
});
```

### Step 3: 运行测试

```bash
npm test
```

### Step 4: 提交

```bash
git add .
git commit -m "feat: 实现分析引擎"
```

---

## Task 4: 建议生成器 (Suggester)

**Files:**
- Create: `ai-skills/skill-optimizer/src/suggester.ts`
- Create: `ai-skills/skill-optimizer/tests/suggester.test.ts`

### Step 1: 编写建议生成器

创建 `src/suggester.ts`:

```typescript
import { analyzer } from './analyzer';
import { db } from './database';
import { Suggestion } from './types';

export class Suggester {
  /**
   * 在技能调用前检查是否需要建议
   */
  checkBeforeSkillCall(skillName: string, context: string): Suggestion {
    const metrics = db.getSkillMetrics(skillName);

    if (!metrics || metrics.total_calls < 5) {
      // 数据不足，不提供建议
      return { should_suggest: false };
    }

    // 检查成功率
    if (metrics.avg_success_rate < 0.5) {
      const alternatives = this.getAlternativeSkills(skillName, context);

      return {
        should_suggest: true,
        type: 'warning',
        message: `⚠️ 该技能最近成功率仅 ${Math.round(metrics.avg_success_rate * 100)}%，是否尝试替代方案？`,
        alternatives: alternatives.map(a => a.skill_name)
      };
    }

    // 检查趋势
    const score = analyzer.calculateSkillScore(skillName);
    if (score?.trend === 'declining') {
      return {
        should_suggest: true,
        type: 'info',
        message: '📉 该技能效果正在下降，可能需要更新 SKILL.md'
      };
    }

    return { should_suggest: false };
  }

  /**
   * 获取替代技能
   */
  private getAlternativeSkills(currentSkill: string, context: string): Array<{ skill_name: string; score: number }> {
    const bestSkills = analyzer.getBestSkills(context, 5);
    return bestSkills.filter(s => s.skill_name !== currentSkill);
  }

  /**
   * 生成性能分析报告
   */
  generatePerformanceReport(skillName: string): string {
    const metrics = db.getSkillMetrics(skillName);
    const score = analyzer.calculateSkillScore(skillName);
    const patterns = analyzer.analyzeFailurePatterns(skillName);

    if (!metrics) {
      return `## ${skillName} 性能报告\n\n暂无数据`;
    }

    let report = `## ${skillName} 性能报告\n\n`;
    report += `### 概览\n\n`;
    report += `- **总调用次数**: ${metrics.total_calls}\n`;
    report += `- **平均成功率**: ${Math.round(metrics.avg_success_rate * 100)}%\n`;
    report += `- **平均评分**: ${metrics.avg_rating.toFixed(1)}/5.0\n`;
    report += `- **平均对话轮次**: ${metrics.avg_turns.toFixed(1)}\n\n`;

    if (score) {
      report += `### 综合评分\n\n`;
      report += `- **总分**: ${score.overall_score}/100\n`;
      report += `- **成功率**: ${score.success_rate}\n`;
      report += `- **满意度**: ${score.user_satisfaction}/5.0\n`;
      report += `- **效率**: ${score.efficiency}\n`;
      report += `- **趋势**: ${this.getTrendEmoji(score.trend)} ${score.trend}\n\n`;
    }

    if (patterns.length > 0) {
      report += `### 改进建议\n\n`;
      patterns.forEach((p, i) => {
        report += `${i + 1}. ${p}\n`;
      });
    }

    return report;
  }

  /**
   * 生成技能改进建议
   */
  generateImprovementSuggestions(skillName: string): string[] {
    const patterns = analyzer.analyzeFailurePatterns(skillName);
    const suggestions: string[] = [];

    patterns.forEach(p => {
      if (p.includes('成功率偏低')) {
        suggestions.push('检查 SKILL.md 中的提示词是否清晰准确');
        suggestions.push('考虑添加更多示例和使用场景');
      }
      if (p.includes('对话轮次过多')) {
        suggestions.push('优化技能输出结构，一次性提供完整信息');
        suggestions.push('添加常见问题的预判和解答');
      }
      if (p.includes('追问')) {
        suggestions.push('增强说明文档的详细程度');
        suggestions.push('添加更多代码示例');
      }
    });

    return suggestions;
  }

  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  }
}

export const suggester = new Suggester();
```

### Step 2: 编写测试

创建 `tests/suggester.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { db } from '../src/database';
import { suggester } from '../src/suggester';
import { SkillCall, SkillResult } from '../src/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.claude', 'skill-optimizer.db');

describe('Suggester', () => {
  beforeEach(() => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  test('should suggest alternatives for low success rate skill', () => {
    const skillName = 'low-success-skill';

    // 添加低成功率数据
    for (let i = 0; i < 5; i++) {
      const call: SkillCall = {
        skill_name: skillName,
        session_id: `session-${i}`,
        context_summary: 'Test',
        user_question: 'Help'
      };
      const callId = db.recordSkillCall(call);
      db.recordSkillResult({
        call_id: callId,
        success_rate: 0.3,
        turns: 5,
        follow_up_questions: 2,
        accepted_suggestions: 0
      });
    }

    const suggestion = suggester.checkBeforeSkillCall(skillName, 'test context');
    expect(suggestion.should_suggest).toBe(true);
    expect(suggestion.type).toBe('warning');
    expect(suggestion.message).toContain('30%');
  });

  test('should generate performance report', () => {
    const skillName = 'report-skill';

    const call: SkillCall = {
      skill_name: skillName,
      session_id: 'session-1',
      context_summary: 'Test',
      user_question: 'Help'
    };
    const callId = db.recordSkillCall(call);
    db.recordSkillResult({
      call_id: callId,
      success_rate: 0.8,
      user_rating: 4,
      turns: 3,
      follow_up_questions: 1,
      accepted_suggestions: 2
    });

    const report = suggester.generatePerformanceReport(skillName);
    expect(report).toContain('性能报告');
    expect(report).toContain('总调用次数');
    expect(report).toContain('80%');
  });
});
```

### Step 3: 运行测试

```bash
npm test
```

### Step 4: 提交

```bash
git add .
git commit -m "feat: 实现建议生成器"
```

---

## Task 5: 数据收集器 (Collector)

**Files:**
- Create: `ai-skills/skill-optimizer/src/collector.ts`
- Create: `ai-skills/skill-optimizer/tests/collector.test.ts`

### Step 1: 编写数据收集器

创建 `src/collector.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import { SkillCall, SkillResult } from './types';

export interface ConversationContext {
  sessionId: string;
  skillName: string;
  userQuestion: string;
  turns: number;
  followUpQuestions: number;
  acceptedSuggestions: number;
}

export class Collector {
  private activeCalls: Map<string, number> = new Map();

  /**
   * 开始追踪技能调用
   */
  startTracking(skillName: string, userQuestion: string, contextSummary: string): string {
    const sessionId = uuidv4();
    const callId = db.recordSkillCall({
      skill_name: skillName,
      session_id: sessionId,
      context_summary: contextSummary,
      user_question: userQuestion
    });

    this.activeCalls.set(sessionId, callId);
    return sessionId;
  }

  /**
   * 结束追踪并保存结果
   */
  endTracking(sessionId: string, result: Omit<SkillResult, 'call_id'>): void {
    const callId = this.activeCalls.get(sessionId);
    if (!callId) {
      console.warn(`No active call found for session: ${sessionId}`);
      return;
    }

    db.recordSkillResult({
      ...result,
      call_id: callId
    });

    this.activeCalls.delete(sessionId);
  }

  /**
   * 分析对话并提取指标
   */
  analyzeConversation(conversation: string[]): {
    turns: number;
    followUpQuestions: number;
    acceptedSuggestions: number;
    successRate: number;
  } {
    const turns = conversation.length;
    const followUpQuestions = conversation.filter(c => c.includes('?')).length - 1;
    const acceptedSuggestions = this.countAcceptedSuggestions(conversation);
    const successRate = this.estimateSuccessRate(conversation);

    return {
      turns,
      followUpQuestions: Math.max(0, followUpQuestions),
      acceptedSuggestions,
      successRate
    };
  }

  /**
   * 估算成功率
   */
  private estimateSuccessRate(conversation: string[]): number {
    const lastMessage = conversation[conversation.length - 1].toLowerCase();

    // 积极信号
    if (lastMessage.includes('谢谢') || lastMessage.includes('解决了') || lastMessage.includes('完美')) {
      return 1.0;
    }

    // 消极信号
    if (lastMessage.includes('不行') || lastMessage.includes('没用') || lastMessage.includes('换')) {
      return 0.0;
    }

    // 中性
    const followUpRatio = conversation.filter(c => c.includes('?')).length / conversation.length;
    return Math.max(0, 1 - followUpRatio * 0.3);
  }

  /**
   * 统计接受的建议数量
   */
  private countAcceptedSuggestions(conversation: string[]): number {
    let count = 0;
    const keywords = ['好的', '可以', '采纳', '就用', '这个'];

    conversation.forEach((msg, i) => {
      if (i > 0 && keywords.some(k => msg.includes(k))) {
        count++;
      }
    });

    return count;
  }

  /**
   * 导出技能指标到 JSON
   */
  exportMetricsToJson(skillName: string, outputPath: string): void {
    const metrics = db.getSkillMetrics(skillName);

    if (!metrics) {
      throw new Error(`No metrics found for skill: ${skillName}`);
    }

    const fs = require('fs');
    const data = {
      skill_name: skillName,
      total_uses: metrics.total_calls,
      avg_rating: metrics.avg_rating,
      success_rate: metrics.avg_success_rate,
      last_updated: metrics.last_updated
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }
}

export const collector = new Collector();
```

### Step 2: 添加 uuid 依赖

```bash
npm install uuid @types/uuid
```

### Step 3: 编写测试

创建 `tests/collector.test.ts`:

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { collector } from '../src/collector';
import { db } from '../src/database';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.claude', 'skill-optimizer.db');

describe('Collector', () => {
  beforeEach(() => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  test('should track skill call from start to end', () => {
    const sessionId = collector.startTracking('test-skill', 'Help me', 'Testing');

    expect(sessionId).toBeDefined();

    collector.endTracking(sessionId, {
      success_rate: 0.8,
      user_rating: 4,
      turns: 3,
      follow_up_questions: 1,
      accepted_suggestions: 2
    });

    const metrics = db.getSkillMetrics('test-skill');
    expect(metrics).toBeDefined();
    expect(metrics?.total_calls).toBe(1);
  });

  test('should analyze conversation', () => {
    const conversation = [
      '如何使用这个技能？',
      '这是使用方法...',
      '好的，谢谢！'
    ];

    const analysis = collector.analyzeConversation(conversation);

    expect(analysis.turns).toBe(3);
    expect(analysis.successRate).toBeGreaterThan(0);
  });
});
```

### Step 4: 运行测试

```bash
npm test
```

### Step 5: 提交

```bash
git add .
git commit -m "feat: 实现数据收集器"
```

---

## Task 6: SKILL.md 文件

**Files:**
- Create: `ai-skills/skill-optimizer/SKILL.md`

### Step 1: 创建 SKILL.md

```bash
cat > ai-skills/skill-optimizer/SKILL.md << 'EOF'
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

1. 查询相关技能的 skill_metrics
2. 按 overall_score 和上下文匹配度排序
3. 展示前 3 个并说明理由

**示例：**
```
用户：我该如何实现这个功能？

Skill Optimizer：
根据历史数据，推荐以下技能：
1. brainstorming (平均 3.2 轮对话，成功率 85%)
2. generic-planning (平均 5.1 轮对话，成功率 72%)
3. frontend-design (仅适用于前端场景)
```

### 模式 2：性能分析

分析技能为何表现不佳：

1. 审查最近的失败调用
2. 识别常见失败模式
3. 针对性地建议 SKILL.md 改进方案
4. 推荐替代方法

**示例：**
```
用户：帮我分析 harmonyos-code-review 的性能

Skill Optimizer：
## harmonyos-code-review 性能报告

### 概览
- 总调用次数: 45
- 平均成功率: 78%
- 平均评分: 4.2/5.0
- 平均对话轮次: 3.8

### 综合评分
- 总分: 82/100
- 成功率: 78%
- 满意度: 4.2/5.0
- 效率: 0.65
- 趋势: 📈 improving

### 改进建议
1. 添加性能相关的检查规则
2. 增强异步代码审查能力
```

### 模式 3：反馈收集

技能调用后：

1. 监控对话流程
2. 检测成功/失败信号
3. 如不确定则请求评分
4. 更新 skill_metrics

## 数据收集原则

- 仅存储技能名称 + 指标（不含敏感内容）
- 仅本地存储（不同步云端）
- 用户可随时退出或删除数据
- 默认符合 GDPR 标准

## 常见问题

**Q: 如何查看所有技能的性能？**
```
使用命令: collector.exportMetricsToJson(skillName, path)
或查询数据库: SELECT * FROM skill_metrics
```

**Q: 如何重置某个技能的数据？**
```
DELETE FROM skill_calls WHERE skill_name = 'xxx';
DELETE FROM skill_metrics WHERE skill_name = 'xxx';
```

**Q: 数据存储在哪里？**
```
~/.claude/skill-optimizer.db
```
EOF
```

### Step 2: 提交

```bash
git add SKILL.md
git commit -m "docs: 添加 SKILL.md 文件"
```

---

## Task 7: 导出模块索引

**Files:**
- Create: `ai-skills/skill-optimizer/src/index.ts`

### Step 1: 创建索引文件

```bash
cat > ai-skills/skill-optimizer/src/index.ts << 'EOF'
export { db } from './database';
export { analyzer } from './analyzer';
export { suggester } from './suggester';
export { collector, type ConversationContext } from './collector';
export * from './types';
EOF
```

### Step 2: 编译

```bash
npm run build
```

### Step 3: 提交

```bash
git add .
git commit -m "feat: 添加模块导出索引"
```

---

## Task 8: 推送到远程仓库

### Step 1: 查看远程仓库

```bash
cd /workspace/developer_workspace/ai-skills
git remote -v
```

### Step 2: 推送到远程

```bash
git push origin master
```

---

## 总结

实施完成后，技能优化助手将具备以下能力：

✅ **数据收集** - 自动追踪技能调用和结果
✅ **多维分析** - 成功率、满意度、效率三维评分
✅ **智能建议** - 实时推荐替代方案
✅ **性能报告** - 生成详细的技能分析报告
✅ **隐私保护** - 本地存储，仅存指标

**下一步：**
1. 在实际使用中测试和优化
2. 根据反馈调整评分算法
3. 添加更多分析维度
