import Database from 'better-sqlite3';
import { SkillCall, SkillResult, SkillMetrics } from './types';

export default class SkillOptimizerDB {
  private db: Database.Database;

  constructor(dbPath: string = './skill-optimizer.db') {
    this.db = new Database(dbPath);
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
  }

  initTables(): void {
    // Create skill_calls table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_name TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_id TEXT NOT NULL,
        context_summary TEXT NOT NULL,
        user_question TEXT NOT NULL
      )
    `);

    // Create skill_results table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_id INTEGER NOT NULL,
        success_rate REAL NOT NULL,
        user_rating INTEGER,
        turns INTEGER NOT NULL,
        follow_up_questions INTEGER NOT NULL,
        accepted_suggestions INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (call_id) REFERENCES skill_calls(id)
      )
    `);

    // Create skill_metrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_metrics (
        skill_name TEXT PRIMARY KEY,
        total_calls INTEGER NOT NULL DEFAULT 0,
        avg_success_rate REAL NOT NULL DEFAULT 0,
        avg_rating REAL NOT NULL DEFAULT 0,
        avg_turns REAL NOT NULL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_skill_calls_name ON skill_calls(skill_name)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_skill_calls_timestamp ON skill_calls(timestamp DESC)
    `);
  }

  recordSkillCall(call: Omit<SkillCall, 'id' | 'timestamp'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO skill_calls (skill_name, session_id, context_summary, user_question)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      call.skill_name,
      call.session_id,
      call.context_summary,
      call.user_question
    );

    return result.lastInsertRowid as number;
  }

  recordSkillResult(result: Omit<SkillResult, 'id' | 'timestamp'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO skill_results (call_id, success_rate, user_rating, turns, follow_up_questions, accepted_suggestions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.call_id,
      result.success_rate,
      result.user_rating || null,
      result.turns,
      result.follow_up_questions,
      result.accepted_suggestions
    );

    // Get the skill_name from the call
    const callStmt = this.db.prepare('SELECT skill_name FROM skill_calls WHERE id = ?');
    const call = callStmt.get(result.call_id) as { skill_name: string } | undefined;

    if (call) {
      this.updateMetrics(call.skill_name);
    }
  }

  private updateMetrics(skillName: string): void {
    // Calculate new metrics from all results for this skill
    const metricsStmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_calls,
        AVG(sr.success_rate) as avg_success_rate,
        AVG(sr.user_rating) as avg_rating,
        AVG(sr.turns) as avg_turns
      FROM skill_results sr
      INNER JOIN skill_calls sc ON sr.call_id = sc.id
      WHERE sc.skill_name = ?
    `);

    const metrics = metricsStmt.get(skillName) as {
      total_calls: number;
      avg_success_rate: number;
      avg_rating: number;
      avg_turns: number;
    } | undefined;

    if (metrics && metrics.total_calls > 0) {
      const upsertStmt = this.db.prepare(`
        INSERT INTO skill_metrics (skill_name, total_calls, avg_success_rate, avg_rating, avg_turns, last_updated)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(skill_name) DO UPDATE SET
          total_calls = excluded.total_calls,
          avg_success_rate = excluded.avg_success_rate,
          avg_rating = excluded.avg_rating,
          avg_turns = excluded.avg_turns,
          last_updated = CURRENT_TIMESTAMP
      `);

      upsertStmt.run(
        skillName,
        metrics.total_calls,
        metrics.avg_success_rate,
        metrics.avg_rating || 0,
        metrics.avg_turns
      );
    }
  }

  getSkillMetrics(skillName: string): SkillMetrics | null {
    const stmt = this.db.prepare(`
      SELECT skill_name, total_calls, avg_success_rate, avg_rating, avg_turns, last_updated
      FROM skill_metrics
      WHERE skill_name = ?
    `);

    const row = stmt.get(skillName) as SkillMetrics | undefined;
    return row || null;
  }

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

    const rows = stmt.all(skillName, limit) as Array<SkillCall & SkillResult>;
    return rows;
  }

  getAllMetrics(): SkillMetrics[] {
    const stmt = this.db.prepare(`
      SELECT skill_name, total_calls, avg_success_rate, avg_rating, avg_turns, last_updated
      FROM skill_metrics
      ORDER BY skill_name
    `);

    const rows = stmt.all() as SkillMetrics[];
    return rows;
  }

  close(): void {
    this.db.close();
  }
}
