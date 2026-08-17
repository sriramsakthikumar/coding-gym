import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowRight, X, Star } from 'lucide-react';

interface SolvedModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
  difficulty: string;
  pointsEarned: number;
  onNextProblem?: () => void;
}

export const SolvedModal: React.FC<SolvedModalProps> = ({
  isOpen,
  onClose,
  problemTitle,
  difficulty,
  pointsEarned,
  onNextProblem,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#a1a1aa', '#10b981', '#f59e0b', '#71717a'],
        });
      } catch (e) {
        // ignore if confetti canvas unavailable
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#181920] border border-[#282a35] rounded-2xl p-5 shadow-xl text-center">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 mb-2.5">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-zinc-100 mb-0.5">Problem Solved</h3>
        <p className="text-zinc-400 text-xs font-medium mb-3 line-clamp-1">{problemTitle}</p>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#101115] border border-[#262832] text-xs font-medium mb-5">
          <span className="text-emerald-400/90 font-mono">+{pointsEarned} pts</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 capitalize">{difficulty}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-400/90 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400/90" /> Rating Boost
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 rounded-xl border border-[#282a35] text-zinc-300 hover:bg-zinc-800 font-medium text-xs transition-colors"
          >
            Stay in Editor
          </button>
          {onNextProblem && (
            <button
              onClick={() => {
                onClose();
                onNextProblem();
              }}
              className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              Next Problem
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
