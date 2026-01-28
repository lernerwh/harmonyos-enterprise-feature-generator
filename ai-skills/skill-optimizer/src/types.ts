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
