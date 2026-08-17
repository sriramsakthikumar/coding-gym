import { useState } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Clock,
  TrendingUp,
  Download,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { ProgressSummary } from '../types';

interface AnalyticsProps {
  stats: ProgressSummary | null;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [topicSearch, setTopicSearch] = useState<string>('');

  if (!stats) return null;

  const { profile, overall, byLanguage, byDifficulty, topicMastery } = stats;

  const difficultyColors = {
    Easy: '#34d399',
    Medium: '#fbbf24',
    Hard: '#f87171',
  };

  const filteredTopics = (topicMastery || []).filter((t) => {
    if (topicSearch.trim()) {
      return t.topic.toLowerCase().includes(topicSearch.toLowerCase());
    }
    return true;
  });

  const handleExportReport = () => {
    const report = `# 🏋️ CodeGym Practice & Algorithmic Analytics Report
Generated: ${new Date().toLocaleString()}

## 📊 Summary
- Total Problems Solved: ${overall.solvedProblems} / ${overall.totalProblems} (${overall.completionPct}%)
- Current Level: ${profile.level} (${profile.xp} XP)
- Active Streak: ${profile.streak_days} Days
- Practice Time: ${Math.round(overall.totalPracticeSeconds / 60)} Minutes

## 💻 Language Breakdown
${byLanguage.map((l) => `- ${l.language.toUpperCase()}: ${l.solved} / ${l.total} solved`).join('\n')}

## 🎯 Topic Mastery
${filteredTopics.map((t) => `- ${t.topic}: ${t.mastery_pct}% (${t.solved}/${t.total})`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codegym-progress-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Personal Progress Metrics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Skill & Activity Analytics 📈
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Track mastery progression across difficulty levels, algorithmic patterns, and daily habits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  timeRange === '7d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  timeRange === '30d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  timeRange === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                All Time
              </button>
            </div>

            <button
              onClick={handleExportReport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Completion</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {overall.completionPct}%
          </div>
          <p className="text-[11px] text-slate-500">
            {overall.solvedProblems} of {overall.totalProblems} algorithmic problems solved
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total XP & Level</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
            Level {profile.level}
          </div>
          <p className="text-[11px] text-slate-500">{profile.xp} total XP accumulated</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Streak</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
            {profile.streak_days} <span className="text-sm font-sans font-bold">Days</span>
          </div>
          <p className="text-[11px] text-slate-500">Daily practice habit consistency</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Time Practiced</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {Math.round(overall.totalPracticeSeconds / 60)}{' '}
            <span className="text-sm font-sans font-bold">Mins</span>
          </div>
          <p className="text-[11px] text-slate-500">Total verified in-editor problem solving</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Solved Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Solved by Language (Java vs Python vs PHP)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLanguage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="language" stroke="#64748b" tickFormatter={(v) => v.toUpperCase()} />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="solved" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Distribution Donut Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Difficulty Breakdown
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byDifficulty}
                  dataKey="total"
                  nameKey="difficulty"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {byDifficulty.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        difficultyColors[entry.difficulty as keyof typeof difficultyColors] ||
                        '#64748b'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2">
            {byDifficulty.map((d) => (
              <div key={d.difficulty} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      difficultyColors[d.difficulty as keyof typeof difficultyColors],
                  }}
                />
                <span className="text-slate-300">
                  {d.difficulty} ({d.solved}/{d.total})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Topic Mastery Explorer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base">Algorithmic Topic Mastery Explorer</h3>
            <p className="text-xs text-slate-400">
              Detailed proficiency percentage across every data structure and algorithm pattern.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Filter topics..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTopics.map((t, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">{t.topic}</span>
                <span className="font-mono text-xs font-bold text-blue-400">
                  {t.mastery_pct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${t.mastery_pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Solved: {t.solved}</span>
                <span>Total: {t.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
