import { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Play,
  RotateCcw,
  Shuffle,
  Eye,
  X
} from 'lucide-react';
import type { Problem, Language } from '../types';
import { api } from '../api';
import { FormattedText } from '../components/FormattedText';

interface ProblemsListProps {
  onOpenProblem: (id: string) => void;
  initialLanguage?: Language;
}

export const ProblemsList: React.FC<ProblemsListProps> = ({
  onOpenProblem,
  initialLanguage,
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>(initialLanguage || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'difficulty'>('id');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  useEffect(() => {
    loadProblems();
    setCurrentPage(1);
  }, [selectedLang, selectedDifficulty, selectedLevel, selectedStatus, search]);

  const loadProblems = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedLang !== 'all') params.language = selectedLang;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (selectedLevel !== 'all') params.level = selectedLevel;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const data = await api.getProblems(params);
      setProblems(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickRandom = () => {
    const pool = problems.length > 0 ? problems : [];
    if (pool.length > 0) {
      const randomProb = pool[Math.floor(Math.random() * pool.length)];
      onOpenProblem(randomProb.id);
    }
  };

  const resetFilters = () => {
    setSelectedLang('all');
    setSelectedDifficulty('all');
    setSelectedLevel('all');
    setSelectedStatus('all');
    setSearch('');
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

  // Sort logic
  const sortedProblems = [...problems].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'difficulty') {
      const order: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
    }
    return a.order_index - b.order_index;
  });

  const totalPages = Math.ceil(sortedProblems.length / pageSize) || 1;
  const paginatedProblems = sortedProblems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const solvedCount = problems.filter((p) => p.user_status === 'solved').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                300 Real Problem-Solving Challenges
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Problem Catalog 📚
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Filter by language, topic, curriculum tier, and solve status.
            </p>
          </div>

          {/* Quick Metrics & Surprise Me */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePickRandom}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Surprise Me</span>
            </button>

            <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Catalog Solved</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {solvedCount} <span className="text-xs text-slate-500">/ {problems.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Facet Interactive Filter Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, algorithm topic..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Language */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Languages (300)</option>
              <option value="java">Java (100)</option>
              <option value="python">Python (100)</option>
              <option value="php">PHP (100)</option>
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Level */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="fundamentals">Fundamentals (1-35)</option>
              <option value="intermediate">Intermediate (36-70)</option>
              <option value="advanced">Advanced (71-100)</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="unsolved">Unsolved</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="id">Sort: Order #</option>
              <option value="title">Sort: Title (A-Z)</option>
              <option value="difficulty">Sort: Difficulty</option>
            </select>

            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Problems Table / List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {paginatedProblems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">No Matching Problems Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your filter settings or search query.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {paginatedProblems.map((prob) => {
              const isSolved = prob.user_status === 'solved';
              const isAttempted = prob.user_status === 'attempted';

              return (
                <div
                  key={prob.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Status Circle */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSolved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isAttempted
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isSolved ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-[10px] font-mono">{prob.order_index}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                            prob.language
                          )}`}
                        >
                          {prob.language}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                            prob.difficulty
                          )}`}
                        >
                          {prob.difficulty}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">• {prob.topic}</span>
                      </div>

                      <h3
                        onClick={() => onOpenProblem(prob.id)}
                        className="font-bold text-white text-sm group-hover:text-blue-400 cursor-pointer transition-colors"
                      >
                        {prob.title}
                      </h3>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setPreviewProblem(prob)}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenProblem(prob.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isSolved ? 'Review' : 'Solve'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, sortedProblems.length)} of {sortedProblems.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-3 text-slate-400 font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Problem Preview Modal */}
      {previewProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setPreviewProblem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                    previewProblem.language
                  )}`}
                >
                  {previewProblem.language}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                    previewProblem.difficulty
                  )}`}
                >
                  {previewProblem.difficulty}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg">{previewProblem.title}</h3>
              <p className="text-xs text-slate-400 font-medium">Topic: {previewProblem.topic}</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-sans text-slate-200">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </h4>
                <FormattedText content={previewProblem.description} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewProblem(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = previewProblem.id;
                  setPreviewProblem(null);
                  onOpenProblem(id);
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Open in Playground</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
