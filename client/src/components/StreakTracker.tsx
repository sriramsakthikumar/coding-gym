import React from 'react';
import { Flame, Target, Clock, CheckCircle2 } from 'lucide-react';
import type { DailyStats, UserProfile } from '../types';

interface StreakTrackerProps {
  profile: UserProfile;
  today: DailyStats;
  activityHistory: DailyStats[];
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  profile,
  today,
  activityHistory,
}) => {
  const goalProblems = profile.daily_goal_problems || 3;
  const goalMinutes = profile.daily_goal_minutes || 30;
  const solvedToday = today.problems_solved || 0;
  const practiceMinsToday = Math.round((today.practice_seconds || 0) / 60);

  const problemProgressPct = Math.min(Math.round((solvedToday / goalProblems) * 100), 100);
  const timeProgressPct = Math.min(Math.round((practiceMinsToday / goalMinutes) * 100), 100);

  // Generate last 14 days grid
  const daysGrid = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const match = activityHistory.find((a) => a.date === dateStr);
    const count = match ? match.problems_solved : 0;
    const isToday = i === 13;
    return {
      date: dateStr,
      count,
      isToday,
      dayInitial: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Flame className="w-5 h-5 fill-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Daily Habit & Streak</h3>
            <p className="text-xs text-slate-400">
              {profile.streak_days > 0
                ? `${profile.streak_days} Day Streak Going Strong!`
                : 'Solve 1 problem to start your streak!'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-orange-400 font-mono">
            {profile.streak_days}
          </span>
          <span className="text-xs text-slate-500 ml-1 font-semibold">DAYS</span>
        </div>
      </div>

      {/* Target Progress Bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>Problems Solved Today</span>
            </span>
            <span className="font-mono text-slate-400">
              {solvedToday} / {goalProblems}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                problemProgressPct >= 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${problemProgressPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Practice Time</span>
            </span>
            <span className="font-mono text-slate-400">
              {practiceMinsToday} / {goalMinutes} min
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                timeProgressPct >= 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${timeProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 14-Day Activity Heatmap */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Last 14 Days Activity
        </div>
        <div className="flex justify-between gap-1">
          {daysGrid.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                title={`${item.date}: ${item.count} solved`}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                  item.count > 2
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold text-[10px]'
                    : item.count > 0
                    ? 'bg-emerald-500/40 border-emerald-500/60 text-white text-[10px]'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-600 text-[9px]'
                } ${item.isToday ? 'ring-2 ring-blue-500/70' : ''}`}
              >
                {item.count > 0 ? (
                  item.count > 2 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  ) : (
                    item.count
                  )
                ) : (
                  '•'
                )}
              </div>
              <span className="text-[9px] text-slate-500 font-mono">{item.dayInitial}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
