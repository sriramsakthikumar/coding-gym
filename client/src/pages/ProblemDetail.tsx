import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  History,
  FileCode,
  Bot
} from 'lucide-react';
import type { Problem, SubmissionResponse, Submission } from '../types';
import { api } from '../api';
import { MonacoPlayground } from '../components/MonacoPlayground';
import { AIAssistant } from '../components/AIAssistant';
import { XPModal } from '../components/XPModal';
import { FormattedText } from '../components/FormattedText';

interface ProblemDetailProps {
  problemId: string;
  onBack: () => void;
  onRefreshStats: () => void;
  onNavigateProblem: (nextId: string) => void;
}

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  problemId,
  onBack,
  onRefreshStats,
  onNavigateProblem,
}) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'ai' | 'history'>('description');
  
  // Celebration modal state
  const [showXPModal, setShowXPModal] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
  const [isStruggled, setIsStruggled] = useState<boolean>(false);

  useEffect(() => {
    loadProblemData();
  }, [problemId]);

  const loadProblemData = async () => {
    setLoading(true);
    try {
      const data = await api.getProblemById(problemId);
      setProblem(data);
      setIsStruggled(!!data.revision_struggled);

      const subs = await api.getSubmissionsByProblem(problemId);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Heartbeat practice timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (problemId) {
        api.sendHeartbeat(problemId, 10).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [problemId]);

  const handleSubmitted = (res: SubmissionResponse) => {
    setSubmissionResult(res);
    if (res.isPassed) {
      setShowXPModal(true);
    }
    // Refresh problem data & global user stats
    loadProblemData();
    onRefreshStats();
  };

  const handleToggleStruggle = async () => {
    const newStatus = !isStruggled;
    setIsStruggled(newStatus);
    try {
      await api.toggleStruggled(problemId, newStatus);
    } catch (e) {
      console.error(e);
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

  if (loading || !problem) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-12 flex flex-col h-[calc(100vh-80px)]">
      {/* Top Header Workspace Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getLangBadge(
                  problem.language
                )}`}
              >
                {problem.language}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                  problem.difficulty
                )}`}
              >
                {problem.difficulty}
              </span>
              <span className="text-xs text-slate-400 font-medium">• {problem.topic}</span>
              {problem.user_status === 'solved' && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-white tracking-tight mt-0.5">{problem.title}</h1>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Spaced repetition struggle toggle */}
          <button
            onClick={handleToggleStruggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isStruggled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Flag for priority spaced repetition review"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isStruggled ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isStruggled ? 'In Revision Queue' : 'Add to Revision'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Description/AI on Left, Playground on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Side: Statement, AI Assistant, & Submissions */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Left Panel Tabs */}
          <div className="flex items-center gap-1 px-3 bg-slate-950/80 border-b border-slate-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeLeftTab === 'description'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Statement</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeLeftTab === 'ai'
                  ? 'text-indigo-400 border-indigo-500 bg-indigo-950/30'
                  : 'text-indigo-300/70 border-transparent hover:text-indigo-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Tutor (Gemini)</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeLeftTab === 'history'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions ({submissions.length})</span>
            </button>
          </div>

          {/* Left Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-300">
            <div className={`h-full ${activeLeftTab === 'ai' ? 'block' : 'hidden'}`}>
              <AIAssistant problem={problem} currentCode={problem.draft_code || problem.starter_code} />
            </div>

            {activeLeftTab === 'description' && (
              <>
                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Algorithmic Problem Description
                  </h3>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                    <FormattedText content={problem.description} />
                  </div>
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Example Walkthrough
                    </h3>
                    {problem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                      >
                        <div className="text-blue-400 font-bold text-xs flex items-center justify-between">
                          <span>Example {idx + 1}</span>
                        </div>

                        {/* Input Box */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Input:
                          </div>
                          <pre className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-mono whitespace-pre-wrap text-xs leading-relaxed">
                            {ex.input || '(None)'}
                          </pre>
                        </div>

                        {/* Output Box */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Expected Output:
                          </div>
                          <pre className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-emerald-400 font-mono font-bold text-xs">
                            {ex.output}
                          </pre>
                        </div>

                        {/* Explanation Box */}
                        {ex.explanation && (
                          <div className="space-y-1 pt-2 border-t border-slate-800/80">
                            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                              Step-by-Step Breakdown:
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                              <FormattedText content={ex.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Level & Topic details */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">Curriculum Level: </span>
                    <span className="capitalize text-slate-300 font-semibold">{problem.level}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Topic: </span>
                    <span className="text-slate-300 font-semibold">{problem.topic}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Attempts: </span>
                    <span className="text-slate-300 font-mono">{problem.attempts_count || 0}</span>
                  </div>
                </div>
              </>
            )}

            {activeLeftTab === 'history' && (
              /* Submissions History */
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Past Submissions
                </h3>
                {submissions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No submissions recorded yet for this problem.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              sub.status === 'accepted' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(sub.submitted_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                          <span>Runtime: {sub.execution_time_ms}ms</span>
                          {sub.xp_earned > 0 && (
                            <span className="text-amber-400">+{sub.xp_earned} XP</span>
                          )}
                        </div>

                        {sub.error && (
                          <div className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-900/40">
                            {sub.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Monaco Code Editor Playground */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0">
          <MonacoPlayground
            problem={problem}
            onSubmitted={handleSubmitted}
            onOpenAITutor={() => setActiveLeftTab('ai')}
          />
        </div>
      </div>

      {/* XP Celebration Modal */}
      {submissionResult && (
        <XPModal
          isOpen={showXPModal}
          onClose={() => setShowXPModal(false)}
          xpEarned={submissionResult.xpEarned}
          totalXp={submissionResult.totalXp}
          level={submissionResult.level}
          streakDays={submissionResult.streakDays}
          problemTitle={problem.title}
          onNextProblem={() => {
            const currentNum = problem.order_index;
            const prefix = problem.id.split('-')[0];
            const nextId = `${prefix}-${String(currentNum + 1).padStart(3, '0')}`;
            onNavigateProblem(nextId);
          }}
        />
      )}
    </div>
  );
};
