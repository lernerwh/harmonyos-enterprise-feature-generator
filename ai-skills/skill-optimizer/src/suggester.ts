import SkillOptimizerDB from './database';
import Analyzer from './analyzer';
import { Suggestion, SkillScore } from './types';

export default class Suggester {
  private db: SkillOptimizerDB;
  private analyzer: Analyzer;

  constructor(db: SkillOptimizerDB, analyzer: Analyzer) {
    this.db = db;
    this.analyzer = analyzer;
  }

  /**
   * Check if a skill call should be suggested against based on performance
   * @param skillName - Name of the skill being called
   * @param context - Context of the call (for future use)
   * @returns Suggestion object with recommendation
   */
  checkBeforeSkillCall(skillName: string, context: string): Suggestion {
    // Get skill score
    const score = this.analyzer.calculateSkillScore(skillName);

    // If no data, no suggestion
    if (!score) {
      return { should_suggest: false };
    }

    // Check for low success rate (< 50%)
    if (score.success_rate < 0.5) {
      const alternatives = this.getAlternativeSkills(skillName, context);
      return {
        should_suggest: true,
        type: 'warning',
        message: `⚠️ "${skillName}" has a low success rate (${(score.success_rate * 100).toFixed(1)}%). Consider alternatives.`,
        alternatives
      };
    }

    // Check for declining trend
    if (score.trend === 'declining') {
      const alternatives = this.getAlternativeSkills(skillName, context);
      return {
        should_suggest: true,
        type: 'warning',
        message: `📉 "${skillName}" is showing a declining performance trend. Consider alternatives.`,
        alternatives
      };
    }

    // Check for low overall score (< 50)
    if (score.overall_score < 50) {
      const alternatives = this.getAlternativeSkills(skillName, context);
      return {
        should_suggest: true,
        type: 'info',
        message: `ℹ️ "${skillName}" has a low overall score (${score.overall_score}/100). Better options may exist.`,
        alternatives
      };
    }

    return { should_suggest: false };
  }

  /**
   * Get alternative skills that perform better
   * @param skillName - Current skill name
   * @param context - Context for filtering (currently unused)
   * @returns Array of alternative skill names
   */
  private getAlternativeSkills(skillName: string, context: string): string[] {
    try {
      const bestSkills = this.analyzer.getBestSkills(context, 3);

      // Filter out the current skill and return top alternatives
      return bestSkills
        .filter(skill => skill.skill_name !== skillName)
        .slice(0, 2)
        .map(skill => `${skill.skill_name} (score: ${skill.overall_score})`);
    } catch (error) {
      // If we can't get alternatives, return generic suggestion
      return ['Consider reviewing the available skills'];
    }
  }

  /**
   * Generate a detailed performance report for a skill
   * @param skillName - Name of the skill to report on
   * @returns Markdown formatted report
   */
  generatePerformanceReport(skillName: string): string {
    const score = this.analyzer.calculateSkillScore(skillName);
    const metrics = this.db.getSkillMetrics(skillName);

    if (!score || !metrics) {
      return `# Performance Report: ${skillName}\n\nNo data available for this skill.\n`;
    }

    let report = `# Performance Report: ${skillName}\n\n`;

    // Overall Score Section
    report += `## Overall Score\n\n`;
    report += `- **Score**: ${score.overall_score}/100\n`;
    report += `- **Trend**: ${this.getTrendEmoji(score.trend)} ${score.trend}\n\n`;

    // Detailed Metrics
    report += `## Detailed Metrics\n\n`;
    report += `- **Success Rate**: ${(score.success_rate * 100).toFixed(1)}%\n`;
    report += `- **User Satisfaction**: ${score.user_satisfaction.toFixed(1)}/5.0\n`;
    report += `- **Efficiency**: ${(score.efficiency * 100).toFixed(1)}%\n\n`;

    // Call Statistics
    report += `## Call Statistics\n\n`;
    report += `- **Total Calls**: ${metrics.total_calls}\n`;
    report += `- **Average Turns**: ${metrics.avg_turns.toFixed(1)}\n`;
    report += `- **Last Updated**: ${metrics.last_updated || 'N/A'}\n\n`;

    // Improvement Suggestions
    const suggestions = this.generateImprovementSuggestions(skillName);
    if (suggestions.length > 0) {
      report += `## Improvement Suggestions\n\n`;
      suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}\n`;
      });
      report += '\n';
    }

    // Failure Patterns
    const patterns = this.analyzer.analyzeFailurePatterns(skillName);
    if (patterns.length > 0) {
      report += `## Failure Patterns\n\n`;
      patterns.forEach((pattern, index) => {
        report += `${index + 1}. ${pattern}\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * Generate improvement suggestions for a skill
   * @param skillName - Name of the skill to analyze
   * @returns Array of improvement suggestions
   */
  generateImprovementSuggestions(skillName: string): string[] {
    const score = this.analyzer.calculateSkillScore(skillName);
    const metrics = this.db.getSkillMetrics(skillName);
    const patterns = this.analyzer.analyzeFailurePatterns(skillName);

    const suggestions: string[] = [];

    if (!score || !metrics) {
      return suggestions;
    }

    // Success rate suggestions
    if (score.success_rate < 0.5) {
      suggestions.push(
        `Improve success rate (${(score.success_rate * 100).toFixed(1)}%): Review skill implementation for common failure cases`
      );
    } else if (score.success_rate < 0.7) {
      suggestions.push(
        `Moderate success rate (${(score.success_rate * 100).toFixed(1)}%): Analyze failure patterns to identify improvement opportunities`
      );
    }

    // User satisfaction suggestions
    if (score.user_satisfaction < 3.0) {
      suggestions.push(
        `Low user satisfaction (${score.user_satisfaction.toFixed(1)}/5.0): Gather user feedback and improve response quality`
      );
    } else if (score.user_satisfaction < 4.0) {
      suggestions.push(
        `Moderate satisfaction (${score.user_satisfaction.toFixed(1)}/5.0): Consider enhancing response clarity and completeness`
      );
    }

    // Efficiency suggestions
    if (score.efficiency < 0.5) {
      suggestions.push(
        `Low efficiency (${(score.efficiency * 100).toFixed(1)}%): Reduce average conversation turns (currently ${metrics.avg_turns.toFixed(1)}) by providing more comprehensive initial responses`
      );
    } else if (score.efficiency < 0.7) {
      suggestions.push(
        `Moderate efficiency (${(score.efficiency * 100).toFixed(1)}%): Aim to reduce follow-up questions and provide more direct answers`
      );
    }

    // Trend suggestions
    if (score.trend === 'declining') {
      suggestions.push(
        'Declining performance trend detected: Review recent changes and investigate potential issues'
      );
    }

    // Add failure patterns as suggestions
    patterns.forEach(pattern => {
      if (!suggestions.includes(pattern)) {
        suggestions.push(pattern);
      }
    });

    return suggestions;
  }

  /**
   * Get emoji for trend display
   */
  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '❓';
    }
  }
}
