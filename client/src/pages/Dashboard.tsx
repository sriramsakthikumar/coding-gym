import { useState } from 'react';
import {
  Play,
  Flame,
  Zap,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  BookOpen,
  GitBranch,
  Terminal,
  Shuffle,
  Settings2,
  Target
} from 'lucide-react';
import type { ProgressSummary, RevisionQueueData, Submission } from '../types';
import { StreakTracker } from '../components/StreakTracker';
import { TopicRadar } from '../components/TopicRadar';
import { api } from '../api';

interface DashboardProps {
  stats: ProgressSummary | null;
  revisionData: RevisionQueueData | null;
  recentSubmissions: Submission[];
  onNavigate: (tab: string, problemId?: string) => void;
  onSelectLanguage: (lang: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  revisionData,
  recentSubmissions,
  onNavigate,
  onSelectLanguage,
}) => {
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [goalProblems, setGoalProblems] = useState<number>(stats?.profile?.daily_goal_problems || 3);
  const [goalMinutes, setGoalMinutes] = useState<number>(stats?.profile?.daily_goal_minutes || 30);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);
  const [recentFilter, setRecentFilter] = useState<'all' | 'accepted' | 'failed'>('all');

  if (!stats) return null;

  const { profile, overall, today, topicMastery, lastWorkedProblem, byLanguage } = stats;
  const dueRevisionCount = (revisionData?.dueToday.length || 0) + (revisionData?.overdue.length || 0);

  const handleSaveGoal = async () => {
    setIsSavingGoal(true);
    try {
      await api.updateDailyGoal(Number(goalProblems), Number(goalMinutes));
      setShowGoalModal(false);
      stats.profile.daily_goal_problems = Number(goalProblems);
      stats.profile.daily_goal_minutes = Number(goalMinutes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleRandomPractice = async () => {
    try {
      const all = await api.getProblems({ status: 'unsolved', limit: 50 });
      if (all && all.length > 0) {
        const randomProb = all[Math.floor(Math.random() * all.length)];
        onNavigate('detail', randomProb.id);
      } else {
        onNavigate('problems');
      }
    } catch (e) {
      onNavigate('problems');
    }
  };

  const getLangBadge = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'java':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'python':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'php':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const filteredSubmissions = recentSubmissions.filter((s) => {
    if (recentFilter === 'accepted') return s.status === 'accepted';
    if (recentFilter === 'failed') return s.status !== 'accepted';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Gamification Summary */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                100% Offline Algorithmic Gym
              </span>
              <span className="text-xs text-slate-400">Level {profile.level} Gymnast</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Sharpen Your Algorithmic Thinking 🏋️
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Master Java, Python, and PHP through 300 rigorous algorithmic challenges with real
              test cases and Gemini AI logic tutoring.
            </p>

            {/* Quick Interactive Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleRandomPractice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Challenge</span>
              </button>

              <button
                onClick={() => setShowGoalModal(true)}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Customize Daily Goal</span>
              </button>
            </div>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Solved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {overall.solvedProblems}
                </span>
                <span className="text-xs text-slate-500"> / {overall.totalProblems}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total XP</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {profile.xp}
                </span>
                <span className="text-xs text-slate-500"> XP</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Streak</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-orange-400 font-mono">
                  {profile.streak_days}
                </span>
                <span className="text-xs text-slate-500"> Days</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Practice Time</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {Math.round(overall.totalPracticeSeconds / 60)}
                </span>
                <span className="text-xs text-slate-500"> Mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Due Revision Alert Banner */}
      {dueRevisionCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {dueRevisionCount} Problem{dueRevisionCount > 1 ? 's' : ''} Due for Spaced Repetition!
              </h3>
              <p className="text-xs text-slate-400">
                Review questions you struggled with to lock them into long-term memory.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('revision')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            Review Queue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Resume & Languages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Resume Card */}
          {lastWorkedProblem ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  ⚡ Jump Back In
                </span>
                <span className="text-xs text-slate-500">
                  Last active {new Date(lastWorkedProblem.last_attempted_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                        lastWorkedProblem.language
                      )}`}
                    >
                      {lastWorkedProblem.language}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                        lastWorkedProblem.difficulty
                      )}`}
                    >
                      {lastWorkedProblem.difficulty}
                    </span>
                    <span className="text-xs text-slate-400">• {lastWorkedProblem.topic}</span>
                  </div>
                  <h3 className="font-bold text-white text-base hover:text-blue-400 transition-colors">
                    {lastWorkedProblem.title}
                  </h3>
                </div>

                <button
                  onClick={() => onNavigate('detail', lastWorkedProblem.id)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Resume Practice
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center">
              <BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-base">Start Your First Challenge</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Pick a practice path or browse the 300 problem catalog.
              </p>
              <button
                onClick={() => onNavigate('problems')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-2"
              >
                Browse Problem Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3 Practice Paths Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-400" />
                Practice Paths (100 Questions Each)
              </h2>
              <button
                onClick={() => onNavigate('paths')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                View all paths <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['java', 'python', 'php'].map((lang) => {
                const stat = byLanguage.find((l) => l.language === lang) || {
                  total: 100,
                  solved: 0,
                  attempted: 0,
                };
                const pct = Math.round((stat.solved / (stat.total || 1)) * 100);

                const titles: Record<string, string> = {
                  java: 'Java Algorithms',
                  python: 'Python Problem Solving',
                  php: 'PHP Logic & Algorithms',
                };

                const desc: Record<string, string> = {
                  java: 'Two Pointers, Binary Search, DP, Trees, Bitwise',
                  python: 'Sliding Window, Stacks, Hash Maps, Recursion',
                  php: 'String Parsing, Prefix Sums, Greedy, Sorting',
                };

                return (
                  <div
                    key={lang}
                    onClick={() => {
                      onSelectLanguage(lang);
                      onNavigate('paths');
                    }}
                    className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                            lang
                          )}`}
                        >
                          {lang}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          {stat.solved}/{stat.total}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                        {titles[lang]}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{desc[lang]}</p>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progress</span>
                        <span className="font-mono text-blue-400">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Submissions with Interactive Filter */}
          {recentSubmissions && recentSubmissions.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Recent Submissions
                </h3>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setRecentFilter('all')}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                      recentFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRecentFilter('accepted')}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                      recentFilter === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    Accepted
                  </button>
                  <button
                    onClick={() => setRecentFilter('failed')}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                      recentFilter === 'failed' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
                    }`}
                  >
                    Failed
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {filteredSubmissions.slice(0, 6).map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onNavigate('detail', sub.problem_id)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          sub.status === 'accepted' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span className="font-medium text-slate-200 hover:text-blue-400">
                        {sub.title || sub.problem_id}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 rounded border ${getLangBadge(
                          sub.language
                        )}`}
                      >
                        {sub.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>{sub.execution_time_ms}ms</span>
                      {sub.xp_earned > 0 && (
                        <span className="text-amber-400 font-bold">+{sub.xp_earned} XP</span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(sub.submitted_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Streak & Topic Radar */}
        <div className="space-y-6">
          <StreakTracker profile={profile} today={today} activityHistory={stats.activityHistory} />
          <TopicRadar topics={topicMastery} />
        </div>
      </div>

      {/* Goal Customization Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Customize Daily Targets</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Daily Problem Target (Questions / Day)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={goalProblems}
                  onChange={(e) => setGoalProblems(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Daily Practice Time (Minutes / Day)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={goalMinutes}
                  onChange={(e) => setGoalMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={isSavingGoal}
                className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingGoal ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
