import type { ProgressSummary } from '../types';

export interface RatingDetails {
  score: number;
  maxScore: number;
  starRating: number; // 0.0 to 5.0
  rankTitle: string;
  rankColor: string;
  solvedCount: number;
  totalCount: number;
  completionPct: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
}

export function computeRating(stats: ProgressSummary | null): RatingDetails {
  if (!stats) {
    return {
      score: 0,
      maxScore: 6500,
      starRating: 0.0,
      rankTitle: 'Novice',
      rankColor: 'text-slate-400',
      solvedCount: 0,
      totalCount: 300,
      completionPct: 0,
      easySolved: 0,
      easyTotal: 100,
      mediumSolved: 0,
      mediumTotal: 120,
      hardSolved: 0,
      hardTotal: 80,
    };
  }

  const easyStats = stats.byDifficulty?.find((d) => d.difficulty === 'Easy') || { total: 100, solved: 0 };
  const medStats = stats.byDifficulty?.find((d) => d.difficulty === 'Medium') || { total: 120, solved: 0 };
  const hardStats = stats.byDifficulty?.find((d) => d.difficulty === 'Hard') || { total: 80, solved: 0 };

  const easySolved = easyStats.solved || 0;
  const mediumSolved = medStats.solved || 0;
  const hardSolved = hardStats.solved || 0;

  const easyTotal = easyStats.total || 100;
  const mediumTotal = medStats.total || 120;
  const hardTotal = hardStats.total || 80;

  // Easy: 10 pts, Medium: 25 pts, Hard: 50 pts
  const score = easySolved * 10 + mediumSolved * 25 + hardSolved * 50;
  const maxScore = easyTotal * 10 + mediumTotal * 25 + hardTotal * 50 || 8000;

  const solvedCount = stats.overall?.solvedProblems ?? (easySolved + mediumSolved + hardSolved);
  const totalCount = stats.overall?.totalProblems ?? ((easyTotal + mediumTotal + hardTotal) || 300);
  const completionPct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // Star rating 1.0 to 5.0
  let starRating = 1.0;
  if (score > 0) {
    starRating = Math.min(5.0, Number((1.0 + (score / (maxScore * 0.4)) * 4.0).toFixed(1)));
  }

  // Rank determination
  let rankTitle = 'Novice';
  let rankColor = 'text-slate-400';

  if (score >= 2500 || solvedCount >= 100) {
    rankTitle = 'Grandmaster';
    rankColor = 'text-amber-300';
  } else if (score >= 1200 || solvedCount >= 50) {
    rankTitle = 'Master';
    rankColor = 'text-purple-400';
  } else if (score >= 600 || solvedCount >= 25) {
    rankTitle = 'Expert';
    rankColor = 'text-blue-400';
  } else if (score >= 200 || solvedCount >= 10) {
    rankTitle = 'Practitioner';
    rankColor = 'text-emerald-400';
  } else if (score >= 50 || solvedCount >= 3) {
    rankTitle = 'Apprentice';
    rankColor = 'text-cyan-400';
  }

  return {
    score,
    maxScore,
    starRating,
    rankTitle,
    rankColor,
    solvedCount,
    totalCount,
    completionPct,
    easySolved,
    easyTotal,
    mediumSolved,
    mediumTotal,
    hardSolved,
    hardTotal,
  };
}
