import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Flame, Zap, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface XPModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpEarned: number;
  totalXp: number;
  level: number;
  streakDays: number;
  problemTitle: string;
  onNextProblem?: () => void;
}

export const XPModal: React.FC<XPModalProps> = ({
  isOpen,
  onClose,
  xpEarned,
  totalXp,
  level,
  streakDays,
  problemTitle,
  onNextProblem,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        });
      } catch (e) {
        // fallback if canvas not available
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentLevelXp = totalXp % 100;
  const levelProgress = currentLevelXp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-center overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-1">Problem Solved!</h3>
        <p className="text-slate-400 text-sm mb-6 line-clamp-1">{problemTitle}</p>

        {/* Rewards Box */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-lg">
              <Zap className="w-4 h-4 fill-amber-400" />
              +{xpEarned}
            </div>
            <span className="text-xs text-slate-400 mt-1">XP Earned</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-orange-400 font-bold text-lg">
              <Flame className="w-4 h-4 fill-orange-400" />
              {streakDays}d
            </div>
            <span className="text-xs text-slate-400 mt-1">Streak</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-purple-400 font-bold text-lg">
              <Award className="w-4 h-4" />
              Lvl {level}
            </div>
            <span className="text-xs text-slate-400 mt-1">Level</span>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40 mb-6 text-left">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
            <span>Level {level} Progress</span>
            <span className="text-blue-400">{levelProgress}/100 XP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(levelProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm transition-all"
          >
            Review Solution
          </button>
          {onNextProblem && (
            <button
              onClick={() => {
                onClose();
                onNextProblem();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
            >
              Next Problem
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
