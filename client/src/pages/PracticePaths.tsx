import { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronRight,
  Search,
  FoldVertical,
  UnfoldVertical
} from 'lucide-react';
import type { PathLevel, Language } from '../types';
import { api } from '../api';

interface PracticePathsProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onOpenProblem: (problemId: string) => void;
}

export const PracticePaths: React.FC<PracticePathsProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onOpenProblem,
}) => {
  const [levels, setLevels] = useState<PathLevel[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [searchTopic, setSearchTopic] = useState<string>('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  useEffect(() => {
    loadPath(selectedLanguage);
  }, [selectedLanguage]);

  const loadPath = async (lang: string) => {
    try {
      const res = await api.getPathForLanguage(lang);
      setLevels(res.levels || []);

      // Auto expand unlocked topics
      const expanded: Record<string, boolean> = {};
      res.levels.forEach((lvl) => {
        lvl.topics.forEach((t) => {
          if (t.isUnlocked) expanded[`${lvl.level}_${t.topic}`] = true;
        });
      });
      setExpandedTopics(expanded);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTopic = (key: string) => {
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    levels.forEach((lvl) => {
      lvl.topics.forEach((t) => {
        next[`${lvl.level}_${t.topic}`] = expand;
      });
    });
    setExpandedTopics(next);
  };

  const handleStartNextUnsolved = () => {
    for (const lvl of levels) {
      for (const t of lvl.topics) {
        for (const p of t.problems) {
          if (p.status !== 'solved') {
            onOpenProblem(p.id);
            return;
          }
        }
      }
    }
    // If all solved or none found, open first problem
    if (levels[0]?.topics[0]?.problems[0]) {
      onOpenProblem(levels[0].topics[0].problems[0].id);
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

  const totalProblemsInPath = levels.reduce(
    (acc, lvl) => acc + lvl.topics.reduce((tAcc, t) => tAcc + t.problems.length, 0),
    0
  );
  const totalSolvedInPath = levels.reduce((acc, lvl) => acc + (lvl.solvedProblems || 0), 0);
  const pathPct = Math.round((totalSolvedInPath / (totalProblemsInPath || 1)) * 100);

  const filteredLevels = levels.filter((lvl) => {
    if (selectedLevelFilter !== 'all' && lvl.level !== selectedLevelFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                100-Problem Progression Tree
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {selectedLanguage.toUpperCase()} Algorithmic Path 🗺️
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Progressive mastery from fundamentals through advanced logic, graph algorithms, and DP.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartNextUnsolved}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Next Unsolved</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {(['java', 'python', 'php'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Path Progress & Filter Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Path Completion</span>
                <span className="font-mono text-blue-400 font-bold">
                  {totalSolvedInPath} / {totalProblemsInPath} ({pathPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${pathPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Level Filter */}
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="fundamentals">Tier 1: Fundamentals</option>
                <option value="intermediate">Tier 2: Intermediate</option>
                <option value="advanced">Tier 3: Advanced</option>
              </select>

              {/* Topic Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="Filter topics..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Expand / Collapse All */}
              <button
                onClick={() => handleExpandAll(true)}
                title="Expand All"
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <UnfoldVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleExpandAll(false)}
                title="Collapse All"
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <FoldVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Levels Tree */}
      <div className="space-y-8">
        {filteredLevels.map((lvl) => (
          <div
            key={lvl.level}
            className={`border rounded-3xl p-6 transition-all ${
              lvl.isUnlocked
                ? 'bg-slate-900/80 border-slate-800 shadow-xl'
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            {/* Level Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    lvl.isUnlocked
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400'
                      : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}
                >
                  {lvl.isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base capitalize">
                      {lvl.level} Curriculum Tier
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {lvl.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lvl.totalProblems} algorithmic problems in {lvl.name}
                  </p>
                </div>
              </div>

              {/* Level Progress */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-white">
                    {lvl.solvedProblems} / {lvl.totalProblems} Solved
                  </span>
                </div>
              </div>
            </div>

            {/* Topics in Level */}
            <div className="mt-5 space-y-4">
              {lvl.topics
                .filter((t) =>
                  searchTopic.trim()
                    ? t.topic.toLowerCase().includes(searchTopic.toLowerCase())
                    : true
                )
                .map((topicItem) => {
                  const key = `${lvl.level}_${topicItem.topic}`;
                  const isExpanded = !!expandedTopics[key];
                  const topicSolved = topicItem.problems.filter((p) => p.status === 'solved').length;
                  const topicTotal = topicItem.problems.length;

                  return (
                    <div
                      key={topicItem.topic}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
                    >
                      {/* Topic Accordion Header */}
                      <div
                        onClick={() => toggleTopic(key)}
                        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm hover:text-blue-400 transition-colors">
                              {topicItem.topic}
                            </span>
                            <span className="text-xs text-slate-500 ml-2 font-mono">
                              ({topicSolved}/{topicTotal})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            {Math.round((topicSolved / (topicTotal || 1)) * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Problems List in Topic */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/60 divide-y divide-slate-800/40 bg-slate-900/30">
                          {topicItem.problems.map((prob) => {
                            const isSolved = prob.status === 'solved';

                            return (
                              <div
                                key={prob.id}
                                className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                      isSolved
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-800 text-slate-600'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </div>

                                  <div>
                                    <h4
                                      onClick={() => onOpenProblem(prob.id)}
                                      className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 cursor-pointer transition-colors"
                                    >
                                      {prob.title}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getDifficultyBadge(
                                      prob.difficulty
                                    )}`}
                                  >
                                    {prob.difficulty}
                                  </span>

                                  <button
                                    onClick={() => onOpenProblem(prob.id)}
                                    className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                                    title="Solve Problem"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
