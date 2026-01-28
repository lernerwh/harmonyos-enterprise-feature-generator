import SkillOptimizerDB from '../src/database';
import Analyzer from '../src/analyzer';
import Suggester from '../src/suggester';
import { SkillCall, SkillResult } from '../src/types';
import fs from 'fs';
import path from 'path';

describe('Suggester', () => {
  let db: SkillOptimizerDB;
  let analyzer: Analyzer;
  let suggester: Suggester;
  const testDbPath = path.join(__dirname, '../test-suggester.db');

  beforeEach(() => {
    // Clean up test database if exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = new SkillOptimizerDB(testDbPath);
    db.initTables();
    analyzer = new Analyzer(db);
    suggester = new Suggester(db, analyzer);
  });

  afterEach(() => {
    db.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('checkBeforeSkillCall', () => {
    it('should return no suggestion for new skills', () => {
      const result = suggester.checkBeforeSkillCall('new-skill', 'test context');
      expect(result.should_suggest).toBe(false);
    });

    it('should suggest alternatives for low success rate (< 50%)', () => {
      // Add some calls with low success rate
      const callId = db.recordSkillCall({
        skill_name: 'failing-skill',
        session_id: 'session-1',
        context_summary: 'test context',
        user_question: 'test question'
      });

      db.recordSkillResult({
        call_id: callId,
        success_rate: 0.3,
        user_rating: 2,
        turns: 8,
        follow_up_questions: 4,
        accepted_suggestions: 0
      });

      const result = suggester.checkBeforeSkillCall('failing-skill', 'test context');
      expect(result.should_suggest).toBe(true);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('low success rate');
    });

    it('should detect declining trend', () => {
      // Add multiple calls with declining success
      for (let i = 0; i < 10; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'declining-skill',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        // Declining from 0.9 to 0.4
        const successRate = 0.9 - (i * 0.05);
        db.recordSkillResult({
          call_id: callId,
          success_rate: successRate,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 1
        });
      }

      const result = suggester.checkBeforeSkillCall('declining-skill', 'test context');
      expect(result.should_suggest).toBe(true);
      expect(result.message).toContain('declining');
    });

    it('should not suggest for skills with good performance', () => {
      // Add calls with good success rate
      for (let i = 0; i < 5; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'good-skill',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.85,
          user_rating: 4,
          turns: 2,
          follow_up_questions: 0,
          accepted_suggestions: 2
        });
      }

      const result = suggester.checkBeforeSkillCall('good-skill', 'test context');
      expect(result.should_suggest).toBe(false);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate report for skill with data', () => {
      // Add test data
      for (let i = 0; i < 5; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'test-skill',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.75,
          user_rating: 4,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 2
        });
      }

      const report = suggester.generatePerformanceReport('test-skill');

      expect(report).toContain('# Performance Report');
      expect(report).toContain('test-skill');
      expect(report).toContain('Overall Score');
      expect(report).toContain('Success Rate');
      expect(report).toContain('User Satisfaction');
      expect(report).toContain('Efficiency');
      expect(report).toContain('Trend');
    });

    it('should handle skills with no data', () => {
      const report = suggester.generatePerformanceReport('no-data-skill');
      expect(report).toContain('No data available');
    });

    it('should include improvement suggestions in report', () => {
      // Add low-performing data
      for (let i = 0; i < 5; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'needs-improvement',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.4,
          user_rating: 2,
          turns: 8,
          follow_up_questions: 4,
          accepted_suggestions: 0
        });
      }

      const report = suggester.generatePerformanceReport('needs-improvement');
      expect(report).toContain('Improvement Suggestions');
    });
  });

  describe('generateImprovementSuggestions', () => {
    it('should generate suggestions for low success rate', () => {
      // Add low success rate data
      for (let i = 0; i < 5; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'low-success',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.3,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 1
        });
      }

      const suggestions = suggester.generateImprovementSuggestions('low-success');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('success'))).toBe(true);
    });

    it('should generate suggestions for high turns', () => {
      // Add data with high turns
      for (let i = 0; i < 5; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'high-turns',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.6,
          turns: 10,
          follow_up_questions: 2,
          accepted_suggestions: 1
        });
      }

      const suggestions = suggester.generateImprovementSuggestions('high-turns');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('turn'))).toBe(true);
    });

    it('should return empty array for skills with no data', () => {
      const suggestions = suggester.generateImprovementSuggestions('no-data');
      expect(suggestions).toEqual([]);
    });

    it('should generate multiple types of suggestions', () => {
      // Add data with multiple issues
      for (let i = 0; i < 5; i++) {
        const callId = db.recordSkillCall({
          skill_name: 'multi-issue',
          session_id: `session-${i}`,
          context_summary: 'test context',
          user_question: 'test question'
        });

        db.recordSkillResult({
          call_id: callId,
          success_rate: 0.4,
          user_rating: 2,
          turns: 8,
          follow_up_questions: 4,
          accepted_suggestions: 0
        });
      }

      const suggestions = suggester.generateImprovementSuggestions('multi-issue');
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
    });
  });
});
