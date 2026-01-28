import SkillOptimizerDB from './database';
import { SkillScore, SkillMetrics } from './types';
import _ from 'lodash';

export default class Analyzer {
  private db: SkillOptimizerDB;

  constructor(db: SkillOptimizerDB) {
    this.db = db;
  }

  /**
   * Calculate comprehensive score for a skill
   * @param skillName - Name of the skill to analyze
   * @returns SkillScore object or null if insufficient data
   */
  calculateSkillScore(skillName: string): SkillScore | null {
    // Get last 30 calls with results
    const calls = this.db.getRecentCalls(skillName, 30);

    // Filter calls that have results (success_rate is defined)
    const validCalls = calls.filter(call => call.success_rate !== undefined);

    if (validCalls.length === 0) {
      return null;
    }

    // Calculate success rate (40% weight)
    const avgSuccessRate = _.meanBy(validCalls, 'success_rate') || 0;
    const successScore = avgSuccessRate * 40;

    // Calculate user satisfaction (35% weight)
    // Default rating is 3.5 if not provided
    const ratings = validCalls.map(call => call.user_rating || 3.5);
    const avgRating = _.mean(ratings);
    const satisfactionScore = avgRating * 7;

    // Calculate efficiency (25% weight)
    // Based on average turns: more turns = lower efficiency
    const avgTurns = _.meanBy(validCalls, 'turns') || 1;
    const efficiency = Math.max(0, 1 - (avgTurns - 1) / 10);
    const efficiencyScore = efficiency * 25;

    // Calculate overall score
    const overallScore = successScore + satisfactionScore + efficiencyScore;

    // Analyze trend
    const trend = this.analyzeTrend(skillName);

    return {
      skill_name: skillName,
      overall_score: Math.round(overallScore),
      success_rate: avgSuccessRate,
      user_satisfaction: avgRating,
      efficiency: Math.round(efficiency * 100) / 100,
      trend
    };
  }

  /**
   * Analyze performance trend over recent calls
   * @param skillName - Name of the skill to analyze
   * @returns Trend direction: 'improving', 'stable', or 'declining'
   */
  private analyzeTrend(skillName: string): 'improving' | 'stable' | 'declining' {
    // Get last 20 calls
    const calls = this.db.getRecentCalls(skillName, 20);
    const validCalls = calls.filter(call => call.success_rate !== undefined);

    // Need at least 5 data points to analyze trend
    if (validCalls.length < 5) {
      return 'stable';
    }

    // Split into two halves
    const midPoint = Math.floor(validCalls.length / 2);
    const recentHalf = validCalls.slice(0, midPoint); // Most recent calls (at the beginning)
    const olderHalf = validCalls.slice(midPoint); // Older calls (at the end)

    // Calculate average success rate for each half
    const recentAvg = _.meanBy(recentHalf, 'success_rate') || 0;
    const olderAvg = _.meanBy(olderHalf, 'success_rate') || 0;

    // Calculate difference (recent - older)
    const diff = recentAvg - olderAvg;

    if (diff > 0.1) {
      return 'improving';
    } else if (diff < -0.1) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Get best performing skills for a given context
   * @param context - Context description (currently unused, for future filtering)
   * @param limit - Maximum number of skills to return
   * @returns Array of SkillScore objects ordered by overall score
   */
  getBestSkills(context: string, limit: number = 3): SkillScore[] {
    // Get all skill metrics
    const allMetrics = this.db.getAllMetrics();

    // Calculate score for each skill
    const scores: SkillScore[] = allMetrics
      .map(metrics => this.calculateSkillScore(metrics.skill_name))
      .filter((score): score is SkillScore => score !== null);

    // Sort by overall score descending
    const sorted = _.orderBy(scores, ['overall_score'], ['desc']);

    // Return top N
    return _.slice(sorted, 0, limit);
  }

  /**
   * Analyze common failure patterns for a skill
   * @param skillName - Name of the skill to analyze
   * @returns Array of pattern descriptions
   */
  analyzeFailurePatterns(skillName: string): string[] {
    // Get last 20 calls
    const calls = this.db.getRecentCalls(skillName, 20);
    const validCalls = calls.filter(call => call.success_rate !== undefined);

    // Find failures (success rate < 0.5)
    const failures = validCalls.filter(call => call.success_rate < 0.5);

    if (failures.length === 0) {
      return [];
    }

    const patterns: string[] = [];

    // Analyze average turns for failures
    const avgTurns = _.meanBy(failures, 'turns') || 0;
    if (avgTurns > 7) {
      patterns.push('High average conversation turns indicate complexity or unclear responses');
    }

    // Analyze follow-up questions
    const avgFollowUps = _.meanBy(failures, 'follow_up_questions') || 0;
    if (avgFollowUps > 3) {
      patterns.push('Excessive follow-up questions suggest initial responses are incomplete');
    }

    // Analyze accepted suggestions
    const avgAccepted = _.meanBy(failures, 'accepted_suggestions') || 0;
    if (avgAccepted < 1) {
      patterns.push('Low suggestion acceptance rate indicates recommendations are not helpful');
    }

    // Analyze user ratings for failures
    const ratings = failures.map(f => f.user_rating || 3.5);
    const avgRating = _.mean(ratings);
    if (avgRating < 2.5) {
      patterns.push('Poor user ratings correlate with failures, indicating user dissatisfaction');
    }

    // Analyze success rate distribution
    const avgSuccessRate = _.meanBy(failures, 'success_rate') || 0;
    if (avgSuccessRate < 0.3) {
      patterns.push('Very low success rate suggests fundamental issues with skill implementation');
    }

    // If no specific patterns found but failures exist
    if (patterns.length === 0) {
      patterns.push('Multiple failures detected but no clear pattern - may need qualitative analysis');
    }

    return patterns;
  }
}
