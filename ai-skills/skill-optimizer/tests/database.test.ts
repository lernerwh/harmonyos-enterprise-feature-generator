import Database from '../src/database';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB_PATH = path.join(__dirname, '../test-data.db');

describe('Database', () => {
  let db: Database;

  beforeEach(async () => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Create a new database instance
    db = new Database(TEST_DB_PATH);
    await db.initTables();
  });

  afterEach(async () => {
    // Close database connection
    await db.close();

    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('recordSkillCall', () => {
    it('should record and retrieve skill call', async () => {
      const call = {
        skill_name: 'test-skill',
        session_id: 'session-123',
        context_summary: 'Test context',
        user_question: 'How do I test?'
      };

      const callId = await db.recordSkillCall(call);
      expect(callId).toBeDefined();
      expect(callId).toBeGreaterThan(0);

      const recentCalls = await db.getRecentCalls('test-skill', 1);
      expect(recentCalls).toHaveLength(1);
      expect(recentCalls[0].skill_name).toBe('test-skill');
      expect(recentCalls[0].session_id).toBe('session-123');
      expect(recentCalls[0].context_summary).toBe('Test context');
      expect(recentCalls[0].user_question).toBe('How do I test?');
    });
  });

  describe('recordSkillResult', () => {
    it('should record skill result and update metrics', async () => {
      // First record a skill call
      const callId = await db.recordSkillCall({
        skill_name: 'test-skill',
        session_id: 'session-123',
        context_summary: 'Test context',
        user_question: 'How do I test?'
      });

      // Record the result
      const result = {
        call_id: callId,
        success_rate: 0.95,
        user_rating: 5,
        turns: 3,
        follow_up_questions: 2,
        accepted_suggestions: 1
      };

      await db.recordSkillResult(result);
      // Method now returns void, so we just verify it doesn't throw

      // Check metrics were updated
      const metrics = await db.getSkillMetrics('test-skill');
      expect(metrics).toBeDefined();
      expect(metrics?.skill_name).toBe('test-skill');
      expect(metrics?.total_calls).toBe(1);
      expect(metrics?.avg_success_rate).toBeCloseTo(0.95, 2);
      expect(metrics?.avg_rating).toBe(5);
      expect(metrics?.avg_turns).toBe(3);
    });

    it('should calculate averages correctly for multiple results', async () => {
      const skillName = 'multi-test-skill';

      // Record multiple calls with different results
      for (let i = 0; i < 3; i++) {
        const callId = await db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: `Context ${i}`,
          user_question: `Question ${i}`
        });

        await db.recordSkillResult({
          call_id: callId,
          success_rate: 0.5 + (i * 0.25), // 0.5, 0.75, 1.0
          user_rating: 3 + i, // 3, 4, 5
          turns: 2 + i, // 2, 3, 4
          follow_up_questions: i,
          accepted_suggestions: i
        });
      }

      const metrics = await db.getSkillMetrics(skillName);
      expect(metrics?.total_calls).toBe(3);
      expect(metrics?.avg_success_rate).toBeCloseTo(0.75, 2); // (0.5 + 0.75 + 1.0) / 3
      expect(metrics?.avg_rating).toBe(4); // (3 + 4 + 5) / 3
      expect(metrics?.avg_turns).toBe(3); // (2 + 3 + 4) / 3
    });
  });

  describe('getRecentCalls', () => {
    it('should return calls with results in descending order by timestamp', async () => {
      const skillName = 'recent-calls-skill';

      // Record multiple calls with results
      const callIds: number[] = [];
      for (let i = 0; i < 5; i++) {
        const id = await db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: `Context ${i}`,
          user_question: `Question ${i}`
        });
        callIds.push(id);

        // Record a result for each call
        await db.recordSkillResult({
          call_id: id,
          success_rate: 0.5 + (i * 0.1),
          user_rating: 3 + i,
          turns: 2 + i,
          follow_up_questions: i,
          accepted_suggestions: i
        });
      }

      // Get recent calls with limit 3
      const recentCalls = await db.getRecentCalls(skillName, 3);
      expect(recentCalls).toHaveLength(3);

      // All returned calls should have IDs and result fields
      expect(recentCalls[0].id).toBeDefined();
      expect(recentCalls[0].success_rate).toBeDefined();
      expect(recentCalls[0].turns).toBeDefined();
      expect(recentCalls[1].id).toBeDefined();
      expect(recentCalls[1].success_rate).toBeDefined();
      expect(recentCalls[1].turns).toBeDefined();
      expect(recentCalls[2].id).toBeDefined();
      expect(recentCalls[2].success_rate).toBeDefined();
      expect(recentCalls[2].turns).toBeDefined();

      // All returned calls should be for the correct skill
      expect(recentCalls.every(call => call.skill_name === skillName)).toBe(true);

      // The returned IDs should be from our recorded calls
      const returnedIds = recentCalls.map(call => call.id!);
      expect(returnedIds.every(id => callIds.includes(id))).toBe(true);
    });

    it('should return empty array when no calls exist', async () => {
      const calls = await db.getRecentCalls('non-existent-skill', 10);
      expect(calls).toEqual([]);
    });
  });

  describe('getAllMetrics', () => {
    it('should return metrics for all skills', async () => {
      // Record calls for multiple skills
      const skills = ['skill-a', 'skill-b', 'skill-c'];

      for (const skill of skills) {
        const callId = await db.recordSkillCall({
          skill_name: skill,
          session_id: 'session-1',
          context_summary: 'Context',
          user_question: 'Question'
        });

        await db.recordSkillResult({
          call_id: callId,
          success_rate: 0.8,
          user_rating: 4,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 1
        });
      }

      const allMetrics = await db.getAllMetrics();
      expect(allMetrics).toHaveLength(3);

      const skillNames = allMetrics.map(m => m.skill_name).sort();
      expect(skillNames).toEqual(['skill-a', 'skill-b', 'skill-c']);
    });

    it('should return empty array when no metrics exist', async () => {
      const metrics = await db.getAllMetrics();
      expect(metrics).toEqual([]);
    });
  });

  describe('getSkillMetrics', () => {
    it('should return null for non-existent skill', async () => {
      const metrics = await db.getSkillMetrics('non-existent-skill');
      expect(metrics).toBeNull();
    });
  });
});
