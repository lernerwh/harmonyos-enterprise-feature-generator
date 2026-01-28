import SkillOptimizerDB from '../src/database';
import Collector from '../src/collector';
import fs from 'fs';
import path from 'path';

describe('Collector', () => {
  let collector: Collector;
  const testDbPath = path.join(__dirname, '../test-collector.db');
  const testExportPath = path.join(__dirname, '../test-export.json');

  beforeEach(() => {
    // Clean up test files
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testExportPath)) {
      fs.unlinkSync(testExportPath);
    }

    collector = new Collector(testDbPath);
    collector.initialize();
  });

  afterEach(() => {
    collector.close();
    // Clean up test files
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testExportPath)) {
      fs.unlinkSync(testExportPath);
    }
  });

  describe('startTracking', () => {
    it('should start tracking and return a session ID', () => {
      const sessionId = collector.startTracking(
        'test-skill',
        'What is TypeScript?',
        'Programming question'
      );

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = collector.startTracking('skill1', 'question1', 'context1');
      const sessionId2 = collector.startTracking('skill2', 'question2', 'context2');

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should store skill call data', () => {
      const sessionId = collector.startTracking(
        'test-skill',
        'How do I use TypeScript?',
        'TypeScript basics'
      );

      // Verify the call was recorded
      const metrics = collector.db.getSkillMetrics('test-skill');
      expect(metrics).toBeDefined();
    });
  });

  describe('endTracking', () => {
    it('should record results for a valid session', () => {
      const sessionId = collector.startTracking(
        'test-skill',
        'Test question',
        'Test context'
      );

      expect(() => {
        collector.endTracking(sessionId, {
          success_rate: 0.8,
          user_rating: 4,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 2
        });
      }).not.toThrow();
    });

    it('should throw error for invalid session ID', () => {
      expect(() => {
        collector.endTracking('invalid-session-id', {
          success_rate: 0.8,
          user_rating: 4,
          turns: 3,
          follow_up_questions: 1,
          accepted_suggestions: 2
        });
      }).toThrow();
    });

    it('should update metrics after recording results', () => {
      const sessionId = collector.startTracking(
        'metric-skill',
        'Question',
        'Context'
      );

      collector.endTracking(sessionId, {
        success_rate: 0.9,
        user_rating: 5,
        turns: 2,
        follow_up_questions: 0,
        accepted_suggestions: 3
      });

      const metrics = collector.db.getSkillMetrics('metric-skill');
      expect(metrics).toBeDefined();
      expect(metrics?.total_calls).toBe(1);
      expect(metrics?.avg_success_rate).toBe(0.9);
    });

    it('should handle missing optional fields', () => {
      const sessionId = collector.startTracking(
        'test-skill',
        'Question',
        'Context'
      );

      expect(() => {
        collector.endTracking(sessionId, {
          success_rate: 0.7,
          turns: 2,
          follow_up_questions: 1,
          accepted_suggestions: 1
        });
      }).not.toThrow();
    });
  });

  describe('analyzeConversation', () => {
    it('should analyze basic conversation metrics', () => {
      const conversation = [
        'User: How do I create a function in TypeScript?',
        'Assistant: You can create a function using the function keyword...',
        'User: Can you show me an example?',
        'Assistant: Sure! Here is an example...'
      ];

      const analysis = collector.analyzeConversation(conversation);

      expect(analysis).toBeDefined();
      expect(analysis.total_turns).toBe(4);
      expect(analysis.user_messages).toBe(2);
      expect(analysis.assistant_messages).toBe(2);
    });

    it('should calculate complexity score', () => {
      const simpleConversation = [
        'User: Hello',
        'Assistant: Hi there!'
      ];

      const complexConversation = [
        'User: How do I implement a complex TypeScript type system?',
        'Assistant: You need to understand generics, conditional types...',
        'User: Can you explain conditional types in detail?',
        'Assistant: Conditional types allow you to select types...',
        'User: What about infer keyword?',
        'Assistant: The infer keyword is used in conditional types...',
        'User: Can you show me a practical example?',
        'Assistant: Here is a complex example using infer...',
        'User: How does this integrate with mapped types?',
        'Assistant: Mapped types can be combined with conditional types...'
      ];

      const simpleAnalysis = collector.analyzeConversation(simpleConversation);
      const complexAnalysis = collector.analyzeConversation(complexConversation);

      expect(complexAnalysis.complexity_score).toBeGreaterThan(simpleAnalysis.complexity_score);
    });

    it('should detect follow-up questions', () => {
      const conversation = [
        'User: How do I use TypeScript?',
        'Assistant: TypeScript is a typed superset of JavaScript...',
        'User: What about type annotations?',
        'Assistant: Type annotations allow you to specify types...',
        'User: Can you show me examples?',
        'Assistant: Here are some examples...'
      ];

      const analysis = collector.analyzeConversation(conversation);

      expect(analysis.follow_up_questions).toBe(2);
    });

    it('should handle empty conversation', () => {
      const analysis = collector.analyzeConversation([]);

      expect(analysis.total_turns).toBe(0);
      expect(analysis.user_messages).toBe(0);
      expect(analysis.assistant_messages).toBe(0);
      expect(analysis.follow_up_questions).toBe(0);
    });

    it('should detect question patterns in user messages', () => {
      const conversation = [
        'User: How do I do this?',
        'Assistant: Here is the answer',
        'User: What about that?',
        'Assistant: That is different',
        'User: Can you help me?',
        'Assistant: Of course'
      ];

      const analysis = collector.analyzeConversation(conversation);

      expect(analysis.question_count).toBe(3);
    });
  });

  describe('exportMetricsToJson', () => {
    it('should export metrics to JSON file', () => {
      // Add some test data
      const sessionId = collector.startTracking(
        'export-skill',
        'Test question',
        'Test context'
      );

      collector.endTracking(sessionId, {
        success_rate: 0.85,
        user_rating: 4,
        turns: 3,
        follow_up_questions: 1,
        accepted_suggestions: 2
      });

      collector.exportMetricsToJson('export-skill', testExportPath);

      expect(fs.existsSync(testExportPath)).toBe(true);

      const content = fs.readFileSync(testExportPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.skill_name).toBe('export-skill');
      expect(data.total_calls).toBe(1);
      expect(data.avg_success_rate).toBe(0.85);
    });

    it('should handle skills with no data', () => {
      expect(() => {
        collector.exportMetricsToJson('no-data-skill', testExportPath);
      }).not.toThrow();

      expect(fs.existsSync(testExportPath)).toBe(true);

      const content = fs.readFileSync(testExportPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.skill_name).toBe('no-data-skill');
      expect(data.total_calls).toBe(0);
    });

    it('should include recent calls in export', () => {
      // Add multiple calls
      for (let i = 0; i < 3; i++) {
        const sessionId = collector.startTracking(
          'multi-call-skill',
          `Question ${i}`,
          `Context ${i}`
        );

        collector.endTracking(sessionId, {
          success_rate: 0.7 + (i * 0.1),
          user_rating: 4,
          turns: 2,
          follow_up_questions: 1,
          accepted_suggestions: 2
        });
      }

      collector.exportMetricsToJson('multi-call-skill', testExportPath);

      const content = fs.readFileSync(testExportPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.total_calls).toBe(3);
      expect(data.recent_calls).toBeDefined();
      expect(data.recent_calls.length).toBe(3);
    });

    it('should create valid JSON structure', () => {
      const sessionId = collector.startTracking(
        'structure-test',
        'Question',
        'Context'
      );

      collector.endTracking(sessionId, {
        success_rate: 0.8,
        user_rating: 4,
        turns: 3,
        follow_up_questions: 1,
        accepted_suggestions: 2
      });

      collector.exportMetricsToJson('structure-test', testExportPath);

      const content = fs.readFileSync(testExportPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data).toHaveProperty('skill_name');
      expect(data).toHaveProperty('total_calls');
      expect(data).toHaveProperty('avg_success_rate');
      expect(data).toHaveProperty('avg_rating');
      expect(data).toHaveProperty('avg_turns');
      expect(data).toHaveProperty('last_updated');
    });
  });
});
