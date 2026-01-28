import { v4 as uuidv4 } from 'uuid';
import SkillOptimizerDB from './database';
import { SkillResult } from './types';

export interface ConversationAnalysis {
  total_turns: number;
  user_messages: number;
  assistant_messages: number;
  follow_up_questions: number;
  question_count: number;
  complexity_score: number;
}

export interface TrackingResult {
  success_rate: number;
  user_rating?: number;
  turns: number;
  follow_up_questions: number;
  accepted_suggestions: number;
}

export default class Collector {
  public db: SkillOptimizerDB;
  private activeSessions: Map<string, number> = new Map();

  constructor(dbPath?: string) {
    this.db = new SkillOptimizerDB(dbPath || './skill-optimizer.db');
  }

  /**
   * Initialize the database tables
   */
  initialize(): void {
    this.db.initTables();
  }

  /**
   * Start tracking a skill call
   * @param skillName - Name of the skill being called
   * @param userQuestion - The user's question
   * @param contextSummary - Summary of the context
   * @returns Session ID for tracking
   */
  startTracking(
    skillName: string,
    userQuestion: string,
    contextSummary: string
  ): string {
    // Generate unique session ID
    const sessionId = uuidv4();

    // Record the skill call
    const callId = this.db.recordSkillCall({
      skill_name: skillName,
      session_id: sessionId,
      context_summary: contextSummary,
      user_question: userQuestion
    });

    // Store the mapping
    this.activeSessions.set(sessionId, callId);

    return sessionId;
  }

  /**
   * End tracking a skill call and record results
   * @param sessionId - Session ID from startTracking
   * @param result - Result metrics
   */
  endTracking(sessionId: string, result: TrackingResult): void {
    const callId = this.activeSessions.get(sessionId);

    if (!callId) {
      throw new Error(`Invalid session ID: ${sessionId}`);
    }

    // Record the result
    this.db.recordSkillResult({
      call_id: callId,
      success_rate: result.success_rate,
      user_rating: result.user_rating,
      turns: result.turns,
      follow_up_questions: result.follow_up_questions,
      accepted_suggestions: result.accepted_suggestions
    });

    // Clean up the session
    this.activeSessions.delete(sessionId);
  }

  /**
   * Analyze a conversation to extract metrics
   * @param conversation - Array of conversation messages
   * @returns Conversation analysis metrics
   */
  analyzeConversation(conversation: string[]): ConversationAnalysis {
    const analysis: ConversationAnalysis = {
      total_turns: conversation.length,
      user_messages: 0,
      assistant_messages: 0,
      follow_up_questions: 0,
      question_count: 0,
      complexity_score: 0
    };

    if (conversation.length === 0) {
      return analysis;
    }

    let totalLength = 0;
    const questionWords = ['how', 'what', 'where', 'when', 'why', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does'];

    conversation.forEach((message, index) => {
      const lowerMessage = message.toLowerCase();
      totalLength += message.length;

      // Count user and assistant messages
      if (lowerMessage.startsWith('user:')) {
        analysis.user_messages++;

        // Check for questions
        const hasQuestionMark = message.includes('?');
        const hasQuestionWord = questionWords.some(word => lowerMessage.includes(word));

        if (hasQuestionMark || hasQuestionWord) {
          analysis.question_count++;
        }

        // Check for follow-up questions (not the first user message)
        if (index > 0 && (hasQuestionMark || hasQuestionWord)) {
          analysis.follow_up_questions++;
        }
      } else if (lowerMessage.startsWith('assistant:')) {
        analysis.assistant_messages++;
      }
    });

    // Calculate complexity score based on multiple factors
    const avgMessageLength = totalLength / conversation.length;
    const complexityFromLength = Math.min(avgMessageLength / 200, 1);
    const complexityFromTurns = Math.min(conversation.length / 10, 1);
    const complexityFromQuestions = Math.min(analysis.question_count / 5, 1);

    analysis.complexity_score = Math.round(
      ((complexityFromLength + complexityFromTurns + complexityFromQuestions) / 3) * 100
    ) / 100;

    return analysis;
  }

  /**
   * Export skill metrics to a JSON file
   * @param skillName - Name of the skill to export
   * @param outputPath - Path to the output JSON file
   */
  exportMetricsToJson(skillName: string, outputPath: string): void {
    const metrics = this.db.getSkillMetrics(skillName);
    const recentCalls = this.db.getRecentCalls(skillName, 50);

    const exportData: any = {
      skill_name: skillName,
      exported_at: new Date().toISOString()
    };

    if (metrics) {
      exportData.total_calls = metrics.total_calls;
      exportData.avg_success_rate = metrics.avg_success_rate;
      exportData.avg_rating = metrics.avg_rating;
      exportData.avg_turns = metrics.avg_turns;
      exportData.last_updated = metrics.last_updated;
    } else {
      // No data available
      exportData.total_calls = 0;
      exportData.avg_success_rate = 0;
      exportData.avg_rating = 0;
      exportData.avg_turns = 0;
      exportData.last_updated = null;
    }

    // Include recent calls
    exportData.recent_calls = recentCalls.map(call => ({
      timestamp: call.timestamp,
      context_summary: call.context_summary,
      user_question: call.user_question,
      success_rate: call.success_rate,
      user_rating: call.user_rating,
      turns: call.turns,
      follow_up_questions: call.follow_up_questions,
      accepted_suggestions: call.accepted_suggestions
    }));

    // Write to file
    const fs = require('fs');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}
