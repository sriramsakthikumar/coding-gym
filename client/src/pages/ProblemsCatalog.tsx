import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Shuffle,
  Star,
} from 'lucide-react';
import type { Problem, Language, ProgressSummary } from '../types';
import { api } from '../api';
import { computeRating } from '../utils/rating';

interface ProblemsCatalogProps {
  onOpenProblem: (id: string) => void;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  stats: ProgressSummary | null;
  onRefreshStats: () => void;
}

export const ProblemsCatalog: React.FC<ProblemsCatalogProps> = ({
  onOpenProblem,
  selectedLanguage,
  onLanguageChange,
  stats,
  onRefreshStats,
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'difficulty'>('id');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 30;

  const rating = computeRating(stats);

  useEffect(() => {
    loadProblems();
    setCurrentPage(1);
  }, [selectedLanguage, selectedDifficulty, selectedStatus, search]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedLanguage) params.language = selectedLanguage;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const data = await api.getProblems(params);
      setProblems(data || []);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSolved = async (e: React.MouseEvent, problem: Problem) => {
    e.stopPropagation();
    const isCurrentlySolved = problem.user_status === 'solved';
    const newStatus = isCurrentlySolved ? 'unsolved' : 'solved';

    // Optimistically update list
    setProblems((prev) =>
      prev.map((p) => (p.id === problem.id ? { ...p, user_status: newStatus } : p))
    );

    try {
      await api.setProblemStatus(problem.id, newStatus);
      onRefreshStats();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handlePickRandom = () => {
    if (problems.length > 0) {
      const randomProb = problems[Math.floor(Math.random() * problems.length)];
      onOpenProblem(randomProb.id);
    }
  };

  const resetFilters = () => {
    setSelectedDifficulty('all');
    setSelectedStatus('all');
    setSearch('');
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400/90 bg-emerald-950/30 border-emerald-800/40';
      case 'Medium':
        return 'text-amber-400/90 bg-amber-950/30 border-amber-800/40';
      case 'Hard':
        return 'text-rose-400/90 bg-rose-950/30 border-rose-800/40';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  // Sort logic
  const sortedProblems = useMemo(() => {
    return [...problems].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'difficulty') {
        const order: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
        return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
      }
      return a.order_index - b.order_index;
    });
  }, [problems, sortBy]);

  const totalPages = Math.ceil(sortedProblems.length / pageSize) || 1;
  const paginatedProblems = sortedProblems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const currentSolvedCount = problems.filter((p) => p.user_status === 'solved').length;

  return (
    <div className="space-y-3 animate-fade-in pb-10">
      {/* Header Banner & Rating Metric */}
      <div className="bg-[#131418] border border-[#22242c] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                100 Practice Problems ({selectedLanguage.toUpperCase()})
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight">
              Problem Catalog
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              Select any problem to practice. Mark solved or workout in the interactive editor.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Skill Rating Pill */}
            <div className="bg-[#181920] px-3.5 py-1.5 rounded-xl border border-[#262832] text-center">
              <span className="text-[9px] uppercase font-semibold text-zinc-500 block">
                Skill Rating
              </span>
              <div className="flex items-center justify-center gap-1 text-amber-400/90 font-medium text-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400/90" />
                <span>{rating.starRating}</span>
                <span className={`text-xs ml-0.5 font-normal ${rating.rankColor}`}>
                  ({rating.rankTitle})
                </span>
              </div>
            </div>

            {/* Solved Count */}
            <div className="bg-[#181920] px-3.5 py-1.5 rounded-xl border border-[#262832] text-center">
              <span className="text-[9px] uppercase font-semibold text-zinc-500 block">
                Solved
              </span>
              <div className="text-sm font-semibold font-mono text-emerald-400/90">
                {currentSolvedCount} <span className="text-xs text-zinc-500">/ {problems.length}</span>
              </div>
            </div>

            <button
              onClick={handlePickRandom}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border border-zinc-700 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5 text-zinc-300" />
              <span>Random</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-3 pt-3 border-t border-[#22242c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem title or topic..."
              className="w-full bg-[#181920] border border-[#262832] rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {/* Language */}
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-[#181920] border border-[#262832] rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-medium"
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="php">PHP</option>
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-[#181920] border border-[#262832] rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#181920] border border-[#262832] rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>

            {/* Sort & Reset */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-[#181920] border border-[#262832] rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-mono"
              >
                <option value="id">Order #</option>
                <option value="title">Title (A-Z)</option>
                <option value="difficulty">Difficulty</option>
              </select>

              <button
                onClick={resetFilters}
                title="Reset filters"
                className="p-1.5 bg-[#181920] hover:bg-zinc-800 border border-[#262832] text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Cards Table */}
      <div className="bg-[#131418] border border-[#22242c] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-14 text-center text-zinc-500 text-xs">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-400 mx-auto mb-2" />
            Loading catalog...
          </div>
        ) : paginatedProblems.length === 0 ? (
          <div className="text-center py-14 text-zinc-400 space-y-2.5">
            <BookOpen className="w-8 h-8 mx-auto text-zinc-600" />
            <h3 className="text-sm font-semibold text-zinc-200">No Matching Problems Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your filter settings or search query.
            </p>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#22242c]">
            {paginatedProblems.map((prob) => {
              const isProblemSolved = prob.user_status === 'solved';

              return (
                <div
                  key={prob.id}
                  onClick={() => onOpenProblem(prob.id)}
                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Direct Clickable Status Button */}
                    <button
                      onClick={(e) => handleToggleSolved(e, prob)}
                      title={isProblemSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium transition-all ${
                        isProblemSolved
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/40'
                          : 'bg-[#181920] text-zinc-500 border border-[#262832] hover:border-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {isProblemSolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-zinc-500 text-xs">
                          #{prob.order_index}
                        </span>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.2 rounded-md border ${getDifficultyBadge(
                            prob.difficulty
                          )}`}
                        >
                          {prob.difficulty}
                        </span>
                        <span className="text-xs text-zinc-400"> • {prob.topic}</span>
                      </div>

                      <h3 className="font-medium text-zinc-100 text-xs group-hover:text-zinc-300 transition-colors">
                        {prob.title}
                      </h3>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenProblem(prob.id)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition-colors"
                    >
                      <Play className="w-3 h-3 text-zinc-300 fill-zinc-300" />
                      <span>{isProblemSolved ? 'Workout Again' : 'Start Workout'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-2.5 bg-[#101115] border-t border-[#22242c] flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, sortedProblems.length)} of {sortedProblems.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-xl bg-[#181920] border border-[#262832] text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2.5 text-zinc-400 font-mono text-xs">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-xl bg-[#181920] border border-[#262832] text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
