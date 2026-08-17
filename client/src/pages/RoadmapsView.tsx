import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  HelpCircle,
  X
} from 'lucide-react';
import type { RoadmapData, RoadmapStage, Language } from '../types';
import { api } from '../api';

interface RoadmapsViewProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onOpenProblem: (problemId: string) => void;
}

export const RoadmapsView: React.FC<RoadmapsViewProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onOpenProblem,
}) => {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [completedStages, setCompletedStages] = useState<Record<string, boolean>>({});
  const [selectedStage, setSelectedStage] = useState<RoadmapStage | null>(null);
  
  // AI Concept Quiz state
  const [isQuizzing, setIsQuizzing] = useState<boolean>(false);
  const [quizContent, setQuizContent] = useState<string>('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);

  useEffect(() => {
    loadRoadmap(selectedLanguage);
  }, [selectedLanguage]);

  const loadRoadmap = async (lang: string) => {
    try {
      const data = await api.getRoadmap(lang);
      setRoadmap(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStageCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedStages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartAiQuiz = async (stage: RoadmapStage) => {
    setIsQuizzing(true);
    setIsGeneratingQuiz(true);
    setQuizContent('');
    try {
      const res = await api.aiChat(
        stage.problems[0]?.id || `${selectedLanguage}-001`,
        '',
        selectedLanguage,
        [
          {
            role: 'user',
            content: `Generate a 3-question conceptual quiz on "${stage.title}" (${stage.description}) in ${selectedLanguage.toUpperCase()}. Include 1 multiple choice, 1 complexity question, and 1 edge-case question. Provide answers at the very bottom.`,
          },
        ]
      );
      setQuizContent(res.reply);
    } catch (err: any) {
      setQuizContent(`⚠️ Failed to generate quiz: ${err.message}`);
    } finally {
      setIsGeneratingQuiz(false);
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

  const stagesList = roadmap?.stages || [];
  const totalCount = stagesList.length || 1;
  const completedCount = Object.values(completedStages).filter(Boolean).length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Career Roadmap
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {roadmap?.title || 'Algorithmic Mastery Roadmap'} 🗺️
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {roadmap?.description || 'Step-by-step career path to master algorithmic problem solving.'}
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
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

        {/* Dynamic Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
              <span>Roadmap Milestone Progress</span>
              <span className="font-mono text-blue-400">
                {completedCount} / {totalCount} Stages Completed ({progressPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stages Stepper */}
      <div className="space-y-4">
        {stagesList.map((stage, idx) => {
          const isCompleted = !!completedStages[stage.id];

          return (
            <div
              key={stage.id}
              onClick={() => setSelectedStage(stage)}
              className={`border rounded-3xl p-5 sm:p-6 transition-all cursor-pointer group shadow-lg ${
                isCompleted
                  ? 'bg-slate-900/60 border-emerald-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step Number Badge */}
                  <div
                    onClick={(e) => toggleStageCompleted(stage.id, e)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-105 ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}
                    title="Click to toggle completed"
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        Stage {idx + 1}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      {stage.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {stage.description}
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {stage.topics.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-medium px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Interactive Tools */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartAiQuiz(stage);
                    }}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Quiz Me</span>
                  </button>

                  <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all">
                    <span>View Exercises</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Interactive Drawer / Modal */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Stage Details
              </span>
              <h3 className="font-bold text-white text-lg">{selectedStage.title}</h3>
              <p className="text-xs text-slate-400">{selectedStage.description}</p>
            </div>

            {/* Recommended Problems */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Recommended Coding Practice
              </h4>
              <div className="space-y-2">
                {selectedStage.problems.map((prob) => (
                  <div
                    key={prob.id}
                    onClick={() => {
                      setSelectedStage(null);
                      onOpenProblem(prob.id);
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-slate-200 group-hover:text-blue-400 font-medium">
                        {prob.title}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getDifficultyBadge(
                        prob.difficulty
                      )}`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={(e) => {
                  toggleStageCompleted(selectedStage.id, e);
                  setSelectedStage(null);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {completedStages[selectedStage.id]
                  ? 'Mark as Incomplete'
                  : 'Mark Stage Completed ✅'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Concept Quiz Modal */}
      {isQuizzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsQuizzing(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Gemini Concept Knowledge Check</h3>
                <p className="text-[11px] text-slate-400">Quick 3-question conceptual quiz</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
              {isGeneratingQuiz ? (
                <div className="text-center py-8 text-slate-400 space-y-2 animate-pulse">
                  <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
                  <p>Gemini is synthesizing targeted conceptual questions...</p>
                </div>
              ) : (
                quizContent
              )}
            </div>

            <button
              onClick={() => setIsQuizzing(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Close Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
