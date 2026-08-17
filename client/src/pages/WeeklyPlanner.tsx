import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  Target,
  Layers,
  Sparkles,
  Play,
  CheckCircle2
} from 'lucide-react';
import type { WeeklyPlanData } from '../types';
import { api } from '../api';

interface WeeklyPlannerProps {
  onOpenProblem: (problemId: string) => void;
}

type PlannerMode = 'combined' | 'java' | 'python' | 'php';

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onOpenProblem }) => {
  const [selectedMode, setSelectedMode] = useState<PlannerMode>('combined');
  const [plan, setPlan] = useState<WeeklyPlanData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [completedProblems, setCompletedProblems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPlan(selectedMode);
  }, [selectedMode]);

  const loadPlan = async (mode: PlannerMode) => {
    try {
      const data = await api.getWeeklyPlan(mode);
      if (data && data.days && data.days.length > 0) {
        setPlan(data);
      }
    } catch (err) {
      console.warn('Error loading weekly schedule:', err);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await api.generateWeeklyPlan(selectedMode);
      if (data && data.days) {
        setPlan(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleProblemDone = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedProblems((prev) => ({
      ...prev,
      [problemId]: !prev[problemId],
    }));
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

  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const modeDescriptions: Record<PlannerMode, string> = {
    combined: 'Balanced 7-Day Tri-Language Gym (Java, Python, & PHP rotated throughout the week).',
    java: 'Dedicated 7-Day Java Sprint focusing strictly on Java algorithms and data structures.',
    python: 'Dedicated 7-Day Python Sprint focusing strictly on Python problem solving patterns.',
    php: 'Dedicated 7-Day PHP Sprint focusing strictly on PHP algorithmic logic and data manipulation.',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Adaptive Schedule Generator
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Week of {plan?.weekStartDate || new Date().toISOString().split('T')[0]}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Weekly Learning Plan 📅
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl font-sans">
              {modeDescriptions[selectedMode]}
            </p>
          </div>

          {/* Regenerate Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Recalculating...' : 'Regenerate Adaptive Plan'}</span>
            </button>
          </div>
        </div>

        {/* Multi-Language Mode Switcher Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSelectedMode('combined')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedMode === 'combined'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Combined (All 3)</span>
            </button>

            <button
              onClick={() => setSelectedMode('java')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedMode === 'java'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Java Focus</span>
            </button>

            <button
              onClick={() => setSelectedMode('python')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedMode === 'python'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Python Focus</span>
            </button>

            <button
              onClick={() => setSelectedMode('php')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedMode === 'php'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>PHP Focus</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Targeting your uncompleted & weakest topics</span>
          </div>
        </div>
      </div>

      {/* 7-Day Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plan?.days.map((item) => {
          const isToday = item.day.toLowerCase() === currentDayName.toLowerCase();

          return (
            <div
              key={item.day}
              className={`border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                isToday
                  ? 'bg-slate-900 border-blue-500/80 ring-2 ring-blue-500/20 shadow-xl'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">{item.day}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        TODAY
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                      item.language
                    )}`}
                  >
                    {item.language}
                  </span>
                </div>

                {/* Focus Topic & Description */}
                <div className="space-y-1.5 mb-4">
                  <h3 className="font-bold text-slate-200 text-xs">{item.focusTopic}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Target Stats */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.targetProblems} problems</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.targetMinutes} mins</span>
                  </div>
                </div>

                {/* Recommended Exercises */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Exercises
                  </div>
                  {item.problems && item.problems.length > 0 ? (
                    item.problems.map((prob) => {
                      const isDone =
                        prob.user_status === 'solved' || !!completedProblems[prob.id];

                      return (
                        <div
                          key={prob.id}
                          onClick={() => onOpenProblem(prob.id)}
                          className={`p-2.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <button
                              onClick={(e) => toggleProblemDone(prob.id, e)}
                              className="text-slate-500 hover:text-emerald-400"
                              title="Toggle completed checkmark"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                              )}
                            </button>
                            <span className="text-xs font-medium group-hover:text-blue-400 line-clamp-1">
                              {prob.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getDifficultyBadge(
                                prob.difficulty
                              )}`}
                            >
                              {prob.difficulty}
                            </span>
                            <Play className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate-500">No exercises assigned.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
