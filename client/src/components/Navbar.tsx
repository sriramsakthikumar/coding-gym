import React, { useState } from 'react';
import {
  ListFilter,
  Dumbbell,
  Star,
  Shuffle,
  ChevronDown,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import type { Language, ProgressSummary } from '../types';
import type { User } from '../services/authService';
import { computeRating } from '../utils/rating';
import { Logo } from './Logo';

interface NavbarProps {
  activeTab: 'workout' | 'catalog';
  onTabChange: (tab: 'workout' | 'catalog') => void;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  stats: ProgressSummary | null;
  onPickRandom: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  selectedLanguage,
  onLanguageChange,
  stats,
  onPickRandom,
  currentUser,
  onOpenAuth,
}) => {
  const [showRatingDetails, setShowRatingDetails] = useState<boolean>(false);
  const rating = computeRating(stats);

  const languages: { id: Language; label: string }[] = [
    { id: 'java', label: 'Java' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#131418]/95 backdrop-blur-md border-b border-[#22242c] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 gap-2 sm:gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => onTabChange('workout')}
            className="cursor-pointer group shrink-0"
          >
            <Logo size="md" />
          </div>

          {/* Primary View Switcher */}
          <nav className="flex items-center bg-[#181920] p-0.5 rounded-xl border border-[#262832]">
            <button
              onClick={() => onTabChange('workout')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'workout'
                  ? 'text-zinc-100 bg-zinc-800 border border-zinc-700/80 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden sm:inline">Workout Workspace</span>
              <span className="inline sm:hidden">Workout</span>
            </button>

            <button
              onClick={() => onTabChange('catalog')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'text-zinc-100 bg-zinc-800 border border-zinc-700/80 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden sm:inline">Problem Catalog</span>
              <span className="inline sm:hidden">Catalog</span>
            </button>
          </nav>

          {/* Language Switcher (Desktop / Tablet) */}
          <div className="hidden md:flex items-center bg-[#181920] p-0.5 rounded-xl border border-[#262832] gap-0.5 text-xs">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => onLanguageChange(lang.id)}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                  selectedLanguage === lang.id
                    ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700/80'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Right Section: Rating & Solved Tracking + Random + User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onPickRandom}
              title="Practice a random problem"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-[#181920] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-medium border border-[#262832] transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random</span>
            </button>

            {/* Rating & Solved Badge with Dropdown details */}
            <div className="relative">
              <button
                onClick={() => setShowRatingDetails(!showRatingDetails)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-[#181920] border border-[#262832] hover:border-zinc-700 text-xs transition-colors cursor-pointer"
                title="Click for skill rating breakdown"
              >
                {/* Star Rating */}
                <div className="flex items-center gap-1 text-amber-400/90 font-medium">
                  <Star className="w-3 h-3 fill-amber-400/90" />
                  <span>{rating.starRating}</span>
                </div>

                <div className="w-[1px] h-3 bg-zinc-800" />

                {/* Solved Count */}
                <div className="flex items-center gap-1 text-emerald-400/90 font-medium font-mono text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{rating.solvedCount}</span>
                  <span className="text-zinc-500 text-[10px] hidden xs:inline">/ {rating.totalCount}</span>
                </div>

                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {/* Rating Popup Card */}
              {showRatingDetails && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRatingDetails(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-64 bg-[#181920] border border-[#282a35] rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-[#282a35] pb-2">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                          Skill Rating
                        </span>
                        <div className="text-sm font-bold text-zinc-100 flex items-center gap-1 mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400/90 text-amber-400/90" />
                          <span>{rating.starRating} / 5.0</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                          Rank
                        </span>
                        <div className={`font-semibold mt-0.5 ${rating.rankColor}`}>
                          {rating.rankTitle}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-zinc-400 text-[11px]">
                        <span>Solved Progress</span>
                        <span className="font-mono text-zinc-300">
                          {rating.solvedCount} / {rating.totalCount} ({rating.completionPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(rating.completionPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* By Difficulty Breakdown */}
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400/90 font-medium">Easy (10 pts)</span>
                        <span className="font-mono text-zinc-300">
                          {rating.easySolved} / {rating.easyTotal}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400/90 font-medium">Medium (25 pts)</span>
                        <span className="font-mono text-zinc-300">
                          {rating.mediumSolved} / {rating.mediumTotal}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400/90 font-medium">Hard (50 pts)</span>
                        <span className="font-mono text-zinc-300">
                          {rating.hardSolved} / {rating.hardTotal}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#282a35] text-center text-[10px] text-zinc-400">
                      Total Score: <span className="font-semibold text-zinc-200">{rating.score} pts</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Account / Sign In Button */}
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 bg-[#181920] hover:bg-zinc-800 text-zinc-200 border border-[#262832] hover:border-zinc-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                title={`Signed in as ${currentUser.username}`}
              >
                <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-100 uppercase">
                  {currentUser.username.charAt(0)}
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate">{currentUser.username}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Language Switcher Sub-bar */}
        <div className="flex md:hidden overflow-x-auto py-1 gap-1 border-t border-[#22242c] no-scrollbar justify-center">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => onLanguageChange(lang.id)}
              className={`px-3 py-0.5 rounded-lg text-xs font-medium transition-all ${
                selectedLanguage === lang.id
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
