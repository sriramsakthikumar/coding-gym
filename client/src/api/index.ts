import type {
  Problem,
  ProgressSummary,
  SubmissionResponse,
  Submission,
  RevisionQueueData,
  PathLevel,
  RoadmapData,
  WeeklyPlanData
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `HTTP error ${response.status}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Problems
  getProblems: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'all') {
          query.set(k, String(v));
        }
      });
    }
    const qStr = query.toString();
    return request<Problem[]>(`/problems${qStr ? `?${qStr}` : ''}`);
  },

  getProblemById: (id: string) => {
    return request<Problem>(`/problems/${id}`);
  },

  getTopics: () => {
    return request<{ language: string; topic: string; level: string; total_problems: number; solved_count: number }[]>('/problems/topics');
  },

  // Execution
  runCode: (language: string, code: string, input: string = '') => {
    return request<{ stdout: string; stderr: string; executionTimeMs: number; exitCode: number; error?: string }>('/execute/run', {
      method: 'POST',
      body: JSON.stringify({ language, code, input }),
    });
  },

  submitCode: (problemId: string, language: string, code: string, isStruggled: boolean = false) => {
    return request<SubmissionResponse>('/execute/submit', {
      method: 'POST',
      body: JSON.stringify({ problemId, language, code, isStruggled }),
    });
  },

  // AI Gemini & LangChain Integration
  aiExplainProblem: (problemId: string) => {
    return request<{ explanation: string }>('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ problemId }),
    });
  },

  aiCheckCode: (problemId: string, code: string, language: string) => {
    return request<{ review: string }>('/ai/check-code', {
      method: 'POST',
      body: JSON.stringify({ problemId, code, language }),
    });
  },

  aiChat: (problemId: string, code: string, language: string, messages: { role: string; content: string }[]) => {
    return request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ problemId, code, language, messages }),
    });
  },

  aiGenerateEdgeCases: (problemId: string) => {
    return request<{ testCases: { input: string; expected_output: string; description: string }[] }>('/ai/edge-cases', {
      method: 'POST',
      body: JSON.stringify({ problemId }),
    });
  },

  // Submissions
  getSubmissionsByProblem: (problemId: string) => {
    return request<Submission[]>(`/submissions/problem/${problemId}`);
  },

  getRecentSubmissions: () => {
    return request<Submission[]>('/submissions/recent');
  },

  // Revision & Spaced Repetition
  getRevisionQueue: () => {
    return request<RevisionQueueData>('/revision/queue');
  },

  reviewProblem: (problemId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    return request<{ stage: number; nextReviewAt: string; days: number }>(`/revision/review/${problemId}`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  toggleStruggled: (problemId: string, isStruggled: boolean) => {
    return request<{ message: string }>(`/revision/toggle-flag/${problemId}`, {
      method: 'POST',
      body: JSON.stringify({ isStruggled }),
    });
  },

  // Progress & Stats
  getProgressStats: () => {
    return request<ProgressSummary>('/progress/stats');
  },

  updateDailyGoal: (daily_goal_problems: number, daily_goal_minutes: number) => {
    return request<{ message: string }>('/progress/goal', {
      method: 'PUT',
      body: JSON.stringify({ daily_goal_problems, daily_goal_minutes }),
    });
  },

  saveDraft: (problemId: string, code?: string, notes?: string) => {
    return request<{ message: string }>('/progress/save-draft', {
      method: 'POST',
      body: JSON.stringify({ problemId, code, notes }),
    });
  },

  sendHeartbeat: (problemId?: string, seconds: number = 10) => {
    return request<{ success: boolean }>('/progress/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ problemId, seconds }),
    });
  },

  setProblemStatus: (problemId: string, status: 'solved' | 'unsolved' | 'attempted') => {
    return request<{ success: boolean; status: string }>('/progress/status', {
      method: 'POST',
      body: JSON.stringify({ problemId, status }),
    });
  },

  // Practice Paths
  getPathForLanguage: (language: string) => {
    return request<{ language: string; levels: PathLevel[] }>(`/paths/${language}`);
  },

  // Career Roadmaps
  getRoadmap: (language: string) => {
    return request<RoadmapData>(`/roadmaps/${language}`);
  },

  // Weekly Planner
  getWeeklyPlan: (mode: string = 'combined') => {
    return request<WeeklyPlanData>(`/planner/weekly?mode=${encodeURIComponent(mode)}`);
  },

  generateWeeklyPlan: (mode: string = 'combined') => {
    return request<WeeklyPlanData>('/planner/generate', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },
};
