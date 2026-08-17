import { useState, useEffect } from 'react';
import {
  Brain,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Layers,
  Sparkles,
  Search,
  Rotate3D,
  X
} from 'lucide-react';
import type { RevisionQueueData, RevisionItem } from '../types';
import { api } from '../api';

interface RevisionQueueProps {
  onOpenProblem: (problemId: string) => void;
  onRefreshStats: () => void;
}

export const RevisionQueue: React.FC<RevisionQueueProps> = ({
  onOpenProblem,
  onRefreshStats,
}) => {
  const [data, setData] = useState<RevisionQueueData | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'upcoming' | 'mastered'>('due');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Flashcard mode states
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const res = await api.getRevisionQueue();
      setData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRateReview = async (problemId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    try {
      await api.reviewProblem(problemId, rating);
      await loadQueue();
      onRefreshStats();

      // If in flashcard mode, move to next
      if (isFlashcardOpen) {
        setIsCardFlipped(false);
        setFlashcardIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
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

  const getStageBadge = (stage: number) => {
    const labels = ['Stage 1 (1d)', 'Stage 2 (3d)', 'Stage 3 (7d)', 'Stage 4 (14d)', 'Mastered (30d)'];
    const colors = [
      'bg-rose-500/10 text-rose-400 border-rose-500/30',
      'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    ];
    return { label: labels[stage] || 'Stage 0', color: colors[stage] || colors[0] };
  };

  const dueItems = [...(data?.overdue || []), ...(data?.dueToday || [])];
  let baseItems: RevisionItem[] = [];
  if (activeFilter === 'due') baseItems = dueItems;
  else if (activeFilter === 'upcoming') baseItems = data?.upcoming || [];
  else if (activeFilter === 'mastered') baseItems = data?.mastered || [];
  else baseItems = data?.all || [];

  const filteredItems = baseItems.filter((item) => {
    if (selectedLang !== 'all' && item.language !== selectedLang) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.topic.toLowerCase().includes(q);
    }
    return true;
  });

  const activeFlashcardItem = dueItems[flashcardIndex];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SuperMemo / Anki Spaced Repetition
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Revision & Recall Queue 🧠
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated intervals (1d ➔ 3d ➔ 7d ➔ 14d ➔ 30d) prevent the forgetting curve and lock
              problem solving patterns in your long-term memory.
            </p>
          </div>

          {/* Quick Metrics & Start Session Button */}
          <div className="flex items-center gap-3">
            {dueItems.length > 0 && (
              <button
                onClick={() => {
                  setFlashcardIndex(0);
                  setIsCardFlipped(false);
                  setIsFlashcardOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Review Session ({dueItems.length})</span>
              </button>
            )}

            <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Due Today</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {dueItems.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === 'due'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Due ({dueItems.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === 'upcoming'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Upcoming ({data?.summary?.upcomingCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveFilter('mastered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === 'mastered'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mastered ({data?.summary?.masteredCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({data?.summary?.total || 0})</span>
            </button>
          </div>

          {/* Search & Language Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Languages</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="php">PHP</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3">
            <Brain className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">Queue is Clear! 🎉</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No problems matching your active filter. As you practice or toggle "Add to Revision"
              in any problem, they will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => {
              const stageInfo = getStageBadge(item.interval_stage);
              const isOverdue = item.queue_status === 'overdue';
              const isDueToday = item.queue_status === 'due_today';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                          item.language
                        )}`}
                      >
                        {item.language}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                          item.difficulty
                        )}`}
                      >
                        {item.difficulty}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${stageInfo.color}`}
                      >
                        {stageInfo.label}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          OVERDUE
                        </span>
                      )}
                      {isDueToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          DUE TODAY
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onOpenProblem(item.problem_id)}
                      className="font-bold text-white text-sm hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Topic: <span className="text-slate-300 font-medium">{item.topic}</span> • Next
                      Review: {new Date(item.next_review_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions / Confidence Rating */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onOpenProblem(item.problem_id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Code Now</span>
                    </button>

                    {/* Quick Confidence Grading Buttons */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => handleRateReview(item.problem_id, 'again')}
                        title="Forgot / Reset to 1 Day"
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      >
                        Again
                      </button>
                      <button
                        onClick={() => handleRateReview(item.problem_id, 'hard')}
                        title="Hard (+1 day)"
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                      >
                        Hard
                      </button>
                      <button
                        onClick={() => handleRateReview(item.problem_id, 'good')}
                        title="Good (+1 Stage)"
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        Good
                      </button>
                      <button
                        onClick={() => handleRateReview(item.problem_id, 'easy')}
                        title="Mastered (+2 Stages)"
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                      >
                        Easy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Flashcard Guided Review Modal */}
      {isFlashcardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsFlashcardOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {activeFlashcardItem ? (
              <>
                <div className="flex items-center justify-between pr-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400">
                      Card {flashcardIndex + 1} of {dueItems.length}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                        activeFlashcardItem.language
                      )}`}
                    >
                      {activeFlashcardItem.language}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                      activeFlashcardItem.difficulty
                    )}`}
                  >
                    {activeFlashcardItem.difficulty}
                  </span>
                </div>

                {/* Flashcard Body */}
                <div
                  onClick={() => setIsCardFlipped((prev) => !prev)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 cursor-pointer min-h-[220px] flex flex-col justify-between transition-all group"
                >
                  {!isCardFlipped ? (
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Front: Problem & Objective
                      </span>
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {activeFlashcardItem.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2">
                        Topic: <span className="text-slate-300 font-medium">{activeFlashcardItem.topic}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-4 italic">
                        Click card to flip and review the algorithmic recall prompt 🔄
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider block mb-2">
                        Back: Recall Check
                      </span>
                      <div className="space-y-2 text-xs text-slate-300">
                        <p className="font-semibold text-white">How would you approach this?</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                          <li>Identify optimal data structure (Two Pointers / Stack / Hash Map)</li>
                          <li>Consider time & space complexity constraints</li>
                          <li>Check corner cases: empty input, negatives, boundaries</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-slate-900 mt-4">
                    <span>Click to flip</span>
                    <Rotate3D className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Grade Recall */}
                <div className="space-y-2">
                  <div className="text-center text-xs text-slate-400 font-medium">
                    Rate Your Memory Recall:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRateReview(activeFlashcardItem.problem_id, 'again')}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all"
                    >
                      Again
                      <span className="block text-[10px] text-slate-500 font-normal">1 Day</span>
                    </button>
                    <button
                      onClick={() => handleRateReview(activeFlashcardItem.problem_id, 'hard')}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all"
                    >
                      Hard
                      <span className="block text-[10px] text-slate-500 font-normal">3 Days</span>
                    </button>
                    <button
                      onClick={() => handleRateReview(activeFlashcardItem.problem_id, 'good')}
                      className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all"
                    >
                      Good
                      <span className="block text-[10px] text-slate-500 font-normal">7 Days</span>
                    </button>
                    <button
                      onClick={() => handleRateReview(activeFlashcardItem.problem_id, 'easy')}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                    >
                      Easy
                      <span className="block text-[10px] text-slate-500 font-normal">14 Days</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsFlashcardOpen(false);
                    onOpenProblem(activeFlashcardItem.problem_id);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch in Code Editor</span>
                </button>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-white text-lg">Review Session Complete! 🎉</h3>
                <p className="text-xs text-slate-400">
                  You've reviewed all problems due today. Great job keeping your memory fresh!
                </p>
                <button
                  onClick={() => setIsFlashcardOpen(false)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
