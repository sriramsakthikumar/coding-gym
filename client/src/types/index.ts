export type Language = 'java' | 'python' | 'php';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ProblemLevel = 'fundamentals' | 'intermediate' | 'advanced';
export type ProblemStatus = 'unsolved' | 'attempted' | 'solved';

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface Problem {
  id: string;
  language: Language;
  level: ProblemLevel;
  topic: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  starter_code: string;
  solution_code: string;
  examples: Example[];
  test_cases: TestCase[];
  hints: string[];
  explanation: string;
  order_index: number;
  user_status?: ProblemStatus;
  draft_code?: string;
  notes?: string;
  attempts_count?: number;
  success_count?: number;
  fail_count?: number;
  time_spent_seconds?: number;
  last_attempted_at?: string;
  solved_at?: string;
  revision_stage?: number;
  revision_next_review?: string;
  revision_struggled?: number;
}

export interface UserProfile {
  id: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  daily_goal_problems: number;
  daily_goal_minutes: number;
}

export interface DailyStats {
  date: string;
  problems_solved: number;
  practice_seconds: number;
  xp_earned: number;
}

export interface ProgressSummary {
  profile: UserProfile;
  overall: {
    totalProblems: number;
    solvedProblems: number;
    completionPct: number;
    totalPracticeSeconds: number;
  };
  today: DailyStats;
  byLanguage: { language: Language; total: number; solved: number; attempted: number }[];
  byDifficulty: { difficulty: Difficulty; total: number; solved: number }[];
  byLevel: { level: ProblemLevel; total: number; solved: number }[];
  activityHistory: DailyStats[];
  topicMastery: { topic: string; total: number; solved: number; mastery_pct: number }[];
  lastWorkedProblem: {
    id: string;
    title: string;
    language: Language;
    difficulty: Difficulty;
    topic: string;
    status: ProblemStatus;
    last_attempted_at: string;
  } | null;
}

export interface TestResultItem {
  test_case_index: number;
  input: string;
  expected_output: string;
  actual_output: string;
  stderr: string;
  passed: boolean;
  execution_time_ms: number;
  error?: string;
  is_hidden: boolean;
}

export interface EvaluationResult {
  allPassed: boolean;
  results: TestResultItem[];
  totalTimeMs: number;
  passedCount: number;
  totalCount: number;
}

export interface SubmissionResponse {
  submissionId: string;
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded';
  isPassed: boolean;
  xpEarned: number;
  totalXp: number;
  level: number;
  streakDays: number;
  evalResult: EvaluationResult;
}

export interface Submission {
  id: string;
  problem_id: string;
  language: string;
  code: string;
  status: string;
  output: any;
  error: string | null;
  execution_time_ms: number;
  xp_earned: number;
  submitted_at: string;
  title?: string;
  difficulty?: string;
  topic?: string;
}

export interface RevisionItem {
  id: string;
  problem_id: string;
  interval_stage: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  reviews_count: number;
  lapses_count: number;
  is_struggled: number;
  title: string;
  language: Language;
  difficulty: Difficulty;
  topic: string;
  level: ProblemLevel;
  user_status: ProblemStatus;
  queue_status: 'overdue' | 'due_today' | 'upcoming' | 'mastered';
  interval_days: number;
}

export interface RevisionQueueData {
  summary: {
    total: number;
    overdueCount: number;
    dueTodayCount: number;
    upcomingCount: number;
    masteredCount: number;
  };
  overdue: RevisionItem[];
  dueToday: RevisionItem[];
  upcoming: RevisionItem[];
  mastered: RevisionItem[];
  all: RevisionItem[];
}

export interface PathTopic {
  topic: string;
  isUnlocked: boolean;
  totalProblems: number;
  solvedProblems: number;
  completionPct: number;
  problems: {
    id: string;
    title: string;
    difficulty: Difficulty;
    status: ProblemStatus;
  }[];
}

export interface PathLevel {
  level: ProblemLevel;
  name: string;
  isUnlocked: boolean;
  totalProblems: number;
  solvedProblems: number;
  completionPct: number;
  topics: PathTopic[];
}

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  topics: string[];
  recommendedProblemIds: string[];
  problems: {
    id: string;
    title: string;
    difficulty: Difficulty;
    user_status?: ProblemStatus;
  }[];
  totalProblems: number;
  solvedCount: number;
  completionPct: number;
}

export interface RoadmapData {
  language: Language;
  title: string;
  description: string;
  stages: RoadmapStage[];
}

export interface PlannedDay {
  day: string;
  focusTopic: string;
  language: Language;
  topic: string;
  description: string;
  targetMinutes: number;
  targetProblems: number;
  problems: {
    id: string;
    title: string;
    language: Language;
    difficulty: Difficulty;
    topic: string;
    user_status?: ProblemStatus;
  }[];
}

export interface WeeklyPlanData {
  id: string;
  weekStartDate: string;
  days: PlannedDay[];
}
