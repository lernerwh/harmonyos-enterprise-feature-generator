import SkillOptimizerDB from '../src/database';
import Analyzer from '../src/analyzer';
import * as fs from 'fs';
import * as path from 'path';

describe('Analyzer', () => {
  let db: SkillOptimizerDB;
  let analyzer: Analyzer;
  const testDbPath = path.join(__dirname, '../test-analyzer.db');

  beforeEach(() => {
    // Clean up test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = new SkillOptimizerDB(testDbPath);
    db.initTables();
    analyzer = new Analyzer(db);
  });

  afterEach(() => {
    db.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('calculateSkillScore', () => {
    it('should calculate skill score with all metrics', () => {
      // Create test data with known metrics
      const skillName = 'test-skill';
      for (let i = 0; i < 30; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.8,
          user_rating: 4,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 2
        });
      }

      const score = analyzer.calculateSkillScore(skillName);

      expect(score).not.toBeNull();
      expect(score?.skill_name).toBe(skillName);
      expect(score?.success_rate).toBeCloseTo(0.8, 1);
      expect(score?.user_satisfaction).toBe(4);

      // Calculate expected values
      // Success rate: 0.8 * 40 = 32
      // Satisfaction: 4 * 7 = 28
      // Efficiency: Math.max(0, 1 - (3 - 1) / 10) = Math.max(0, 0.8) = 0.8
      // Efficiency score: 0.8 * 25 = 20
      // Overall: 32 + 28 + 20 = 80
      expect(score?.efficiency).toBeCloseTo(0.8, 1);
      expect(score?.overall_score).toBeCloseTo(80, 0);
      expect(score?.trend).toBe('stable');
    });

    it('should return null for skill with no data', () => {
      const score = analyzer.calculateSkillScore('non-existent-skill');
      expect(score).toBeNull();
    });

    it('should handle missing user ratings (default to 3.5)', () => {
      const skillName = 'test-skill-no-rating';
      for (let i = 0; i < 30; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.7,
          user_rating: undefined,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 1
        });
      }

      const score = analyzer.calculateSkillScore(skillName);

      expect(score).not.toBeNull();
      expect(score?.user_satisfaction).toBe(3.5);
    });

    it('should calculate efficiency correctly for various turn counts', () => {
      const skillName = 'test-skill-turns';
      for (let i = 0; i < 30; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        // Mix of turn counts
        const turns = i % 3 === 0 ? 1 : i % 3 === 1 ? 5 : 10;
        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.8,
          user_rating: 4,
          turns: turns,
          follow_up_questions: 0,
          accepted_suggestions: 1
        });
      }

      const score = analyzer.calculateSkillScore(skillName);
      expect(score).not.toBeNull();
      expect(score?.efficiency).toBeGreaterThan(0);
      expect(score?.efficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeTrend', () => {
    it('should detect improving trend', () => {
      const skillName = 'improving-skill';
      for (let i = 0; i < 20; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        // First half: 0.6 success rate, Second half: 0.8 success rate
        const successRate = i < 10 ? 0.6 : 0.8;
        db.recordSkillResult({
          call_id: callId,
          success_rate: successRate,
          user_rating: 4,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 1
        });
      }

      const score = analyzer.calculateSkillScore(skillName);
      expect(score?.trend).toBe('improving');
    });

    it('should detect declining trend', () => {
      const skillName = 'declining-skill';
      for (let i = 0; i < 20; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        // First half: 0.8 success rate, Second half: 0.6 success rate
        const successRate = i < 10 ? 0.8 : 0.6;
        db.recordSkillResult({
          call_id: callId,
          success_rate: successRate,
          user_rating: 4,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 1
        });
      }

      const score = analyzer.calculateSkillScore(skillName);
      expect(score?.trend).toBe('declining');
    });

    it('should detect stable trend', () => {
      const skillName = 'stable-skill';
      for (let i = 0; i < 20; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        // Consistent 0.7 success rate
        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.7,
          user_rating: 4,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 1
        });
      }

      const score = analyzer.calculateSkillScore(skillName);
      expect(score?.trend).toBe('stable');
    });

    it('should return stable for insufficient data', () => {
      const skillName = 'insufficient-data-skill';
      for (let i = 0; i < 3; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.8,
          user_rating: 4,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 1
        });
      }

      const score = analyzer.calculateSkillScore(skillName);
      expect(score?.trend).toBe('stable');
    });
  });

  describe('getBestSkills', () => {
    beforeEach(() => {
      // Create multiple skills with different performance levels
      // High performer
      for (let i = 0; i < 30; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'high-performer',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.9,
          user_rating: 5,
          turns: 1,
          follow_up_questions: 0,
          accepted_suggestions: 3
        });
      }

      // Medium performer
      for (let i = 0; i < 30; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'medium-performer',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.7,
          user_rating: 3,
          turns: 5,
          follow_up_questions: 2,
          accepted_suggestions: 1
        });
      }

      // Low performer
      for (let i = 0; i < 30; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'low-performer',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.5,
          user_rating: 2,
          turns: 10,
          follow_up_questions: 5,
          accepted_suggestions: 0
        });
      }
    });

    it('should get best skills ordered by score', () => {
      const bestSkills = analyzer.getBestSkills('test context', 3);

      expect(bestSkills.length).toBe(3);
      expect(bestSkills[0].skill_name).toBe('high-performer');
      expect(bestSkills[1].skill_name).toBe('medium-performer');
      expect(bestSkills[2].skill_name).toBe('low-performer');
    });

    it('should respect limit parameter', () => {
      const bestSkills = analyzer.getBestSkills('test context', 2);
      expect(bestSkills.length).toBe(2);
    });

    it('should return empty array when no skills exist', () => {
      // Create a fresh database with no data
      const emptyDbPath = path.join(__dirname, '../test-empty.db');
      if (fs.existsSync(emptyDbPath)) {
        fs.unlinkSync(emptyDbPath);
      }

      const emptyDb = new SkillOptimizerDB(emptyDbPath);
      emptyDb.initTables();
      const emptyAnalyzer = new Analyzer(emptyDb);

      const bestSkills = emptyAnalyzer.getBestSkills('test context');

      emptyDb.close();
      if (fs.existsSync(emptyDbPath)) {
        fs.unlinkSync(emptyDbPath);
      }

      expect(bestSkills.length).toBe(0);
    });
  });

  describe('analyzeFailurePatterns', () => {
    it('should analyze failure patterns', () => {
      const skillName = 'failing-skill';
      for (let i = 0; i < 20; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        // Mix of success and failure
        const successRate = i % 2 === 0 ? 0.3 : 0.7;
        db.recordSkillResult({
          call_id: callId,
          success_rate: successRate,
          user_rating: successRate < 0.5 ? 2 : 4,
          turns: 8,
          follow_up_questions: 3,
          accepted_suggestions: 0
        });
      }

      const patterns = analyzer.analyzeFailurePatterns(skillName);

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should return empty array for skill with no failures', () => {
      const skillName = 'perfect-skill';
      for (let i = 0; i < 20; i++) {
        const callId = db.recordSkillCall({
          skill_name: skillName,
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.9,
          user_rating: 5,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 3
        });
      }

      const patterns = analyzer.analyzeFailurePatterns(skillName);
      expect(patterns.length).toBe(0);
    });

    it('should return empty array for non-existent skill', () => {
      const patterns = analyzer.analyzeFailurePatterns('non-existent-skill');
      expect(patterns.length).toBe(0);
    });
  });
});
