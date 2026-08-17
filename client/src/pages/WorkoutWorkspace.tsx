import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  FileCode,
  Lightbulb,
  BookOpen,
  Bot,
  History,
  Copy,
  Check,
  RotateCcw,
  Search,
  X,
  Play,
  Send,
  Terminal,
  Code2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { Problem, Language, SubmissionResponse, Submission } from '../types';
import { api } from '../api';
import { AIAssistant } from '../components/AIAssistant';
import { FormattedText } from '../components/FormattedText';
import { SolvedModal } from '../components/SolvedModal';

interface WorkoutWorkspaceProps {
  problemId: string;
  onSelectProblem: (id: string) => void;
  onBackToCatalog: () => void;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onRefreshStats: () => void;
}

type LeftTab = 'statement' | 'hints' | 'solution' | 'ai' | 'submissions';
type RightTab = 'testcases' | 'console' | 'custom_input';
type MobileView = 'problem' | 'code';

export const WorkoutWorkspace: React.FC<WorkoutWorkspaceProps> = ({
  problemId,
  onSelectProblem,
  onBackToCatalog,
  selectedLanguage,
  onLanguageChange,
  onRefreshStats,
}) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('statement');
  const [activeRightTab, setActiveRightTab] = useState<RightTab>('testcases');
  const [mobileView, setMobileView] = useState<MobileView>('problem');

  // Code state
  const [code, setCode] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSolutionCopied, setIsSolutionCopied] = useState<boolean>(false);

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runOutput, setRunOutput] = useState<{ stdout: string; stderr: string; time: number; error?: string } | null>(null);
  const [lastSubmission, setLastSubmission] = useState<SubmissionResponse | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);

  // Hints progressive reveal
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  // Celebration Modal
  const [showSolvedModal, setShowSolvedModal] = useState<boolean>(false);

  // Problem switcher modal / drawer
  const [showProblemPicker, setShowProblemPicker] = useState<boolean>(false);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  // Load problem details
  useEffect(() => {
    let isMounted = true;
    const loadProblem = async () => {
      setLoading(true);
      try {
        const data = await api.getProblemById(problemId);
        if (!isMounted) return;
        setProblem(data);
        setCode(data.draft_code || data.starter_code);
        setRunOutput(null);
        setLastSubmission(null);
        setRevealedHints([]);
        setActiveTestCaseIndex(0);

        // Fetch past submissions
        const subs = await api.getSubmissionsByProblem(problemId);
        if (isMounted) setSubmissions(subs || []);
      } catch (err) {
        console.error('Failed to load problem:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProblem();
    return () => {
      isMounted = false;
    };
  }, [problemId]);

  // Load all problems for quick switching
  useEffect(() => {
    api.getProblems({ language: selectedLanguage })
      .then((data) => setAllProblems(data || []))
      .catch(console.error);
  }, [selectedLanguage]);

  // Auto-save draft code
  useEffect(() => {
    if (!problem) return;
    const timer = setTimeout(async () => {
      try {
        setSaveStatus('Saving...');
        await api.saveDraft(problem.id, code);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus('');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [code, problem?.id]);

  // Direct toggle problem status (solved / unsolved)
  const handleToggleSolved = async () => {
    if (!problem) return;
    const isCurrentlySolved = problem.user_status === 'solved';
    const newStatus = isCurrentlySolved ? 'unsolved' : 'solved';

    setProblem({
      ...problem,
      user_status: newStatus,
    });

    try {
      await api.setProblemStatus(problem.id, newStatus);
      onRefreshStats();
      if (!isCurrentlySolved) {
        setShowSolvedModal(true);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Run code against custom scratchpad input
  const handleRunCode = async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsRunning(true);
    setActiveRightTab('console');
    setMobileView('code');
    try {
      const res = await api.runCode(problem.language, code, customInput);
      setRunOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        time: res.executionTimeMs,
        error: res.error,
      });
    } catch (err: any) {
      setRunOutput({
        stdout: '',
        stderr: err.message || 'Execution error',
        time: 0,
        error: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for full test evaluation
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setActiveRightTab('testcases');
    setMobileView('code');
    try {
      const res = await api.submitCode(problem.id, problem.language, code, false);
      setLastSubmission(res);
      if (res.isPassed) {
        setProblem((prev) => (prev ? { ...prev, user_status: 'solved' } : prev));
        setShowSolvedModal(true);
      }
      onRefreshStats();

      // Refresh submissions
      const subs = await api.getSubmissionsByProblem(problem.id);
      setSubmissions(subs || []);
    } catch (err: any) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to previous problem
  const handlePrevProblem = () => {
    if (!problem || allProblems.length === 0) return;
    const currentIndex = allProblems.findIndex((p) => p.id === problem.id);
    if (currentIndex > 0) {
      onSelectProblem(allProblems[currentIndex - 1].id);
    } else if (allProblems.length > 0) {
      onSelectProblem(allProblems[allProblems.length - 1].id);
    }
  };

  // Navigate to next problem
  const handleNextProblem = () => {
    if (!problem || allProblems.length === 0) return;
    const currentIndex = allProblems.findIndex((p) => p.id === problem.id);
    if (currentIndex >= 0 && currentIndex < allProblems.length - 1) {
      onSelectProblem(allProblems[currentIndex + 1].id);
    } else if (allProblems.length > 0) {
      onSelectProblem(allProblems[0].id);
    }
  };

  // Random problem
  const handleRandomProblem = () => {
    if (allProblems.length === 0) return;
    const randomItem = allProblems[Math.floor(Math.random() * allProblems.length)];
    onSelectProblem(randomItem.id);
  };

  const handleResetCode = () => {
    if (problem && window.confirm('Reset code to starter template? Your current edits will be cleared.')) {
      setCode(problem.starter_code);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopySolution = () => {
    if (problem?.solution_code) {
      setCode(problem.solution_code);
      setIsSolutionCopied(true);
      setTimeout(() => setIsSolutionCopied(false), 2000);
    }
  };

  // Filtered problems for quick picker
  const filteredPickerProblems = useMemo(() => {
    if (!pickerSearch.trim()) return allProblems;
    const q = pickerSearch.toLowerCase();
    return allProblems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.difficulty.toLowerCase().includes(q) ||
        String(p.order_index).includes(q)
    );
  }, [allProblems, pickerSearch]);

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

  const isSolved = problem?.user_status === 'solved';

  if (loading || !problem) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-zinc-400" />
          <span className="text-xs text-zinc-500 font-medium">Loading workout problem...</span>
        </div>
      </div>
    );
  }

  const monacoLanguage =
    problem.language === 'python' ? 'python' : problem.language === 'php' ? 'php' : 'java';

  return (
    <div className="space-y-2.5 pb-6 flex flex-col lg:h-[calc(100vh-75px)]">
      {/* Top Problem Navigation & Status Header */}
      <div className="bg-[#131418] border border-[#22242c] rounded-2xl p-2.5 sm:px-3.5 sm:py-2 shrink-0 shadow-xs space-y-2 lg:space-y-0">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          {/* Left: Back to Catalog & Problem Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Back to Catalog button */}
            <button
              onClick={onBackToCatalog}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-[#181920] hover:bg-zinc-800 rounded-xl border border-[#262832] transition-colors shrink-0"
              title="Back to Problem Catalog listing"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Problems</span>
            </button>

            {/* Quick Problem Navigation */}
            <div className="flex items-center bg-[#181920] rounded-xl border border-[#262832] p-0.5 shrink-0">
              <button
                onClick={handlePrevProblem}
                title="Previous Problem"
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowProblemPicker(true)}
                className="px-2 py-0.5 text-xs font-medium text-zinc-200 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 max-w-[130px] sm:max-w-[220px]"
                title="Jump to problem..."
              >
                <span className="text-zinc-500 font-mono text-[11px]">#{problem.order_index}</span>
                <span className="truncate">{problem.title}</span>
              </button>
              <button
                onClick={handleNextProblem}
                title="Next Problem"
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Difficulty Badge */}
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${getDifficultyBadge(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <span className="hidden md:inline text-xs text-zinc-400 font-normal truncate max-w-[180px]">
              • {problem.topic}
            </span>
          </div>

          {/* Right: Solved Toggle & Quick Random */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleRandomProblem}
              title="Random problem"
              className="p-1.5 bg-[#181920] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-[#262832] rounded-xl text-xs transition-colors hidden sm:flex items-center gap-1"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Random</span>
            </button>

            {/* Solved / Unsolved Status Button */}
            <button
              onClick={handleToggleSolved}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isSolved
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 shadow-xs'
                  : 'bg-[#181920] text-zinc-400 border-[#262832] hover:border-zinc-700 hover:text-zinc-200'
              }`}
              title="Click to toggle Solved/Unsolved status"
            >
              {isSolved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Solved</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Mark Solved</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Problem Info vs Code Editor) */}
        <div className="flex lg:hidden items-center bg-[#181920] p-0.5 rounded-xl border border-[#262832] gap-1">
          <button
            onClick={() => setMobileView('problem')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mobileView === 'problem'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Problem & Hints</span>
          </button>
          <button
            onClick={() => setMobileView('code')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              mobileView === 'code'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code & Tests</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Problem Statement / Right Editor & Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
        {/* Left Side: Learning Panel */}
        <div
          className={`lg:col-span-5 flex flex-col bg-[#131418] border border-[#22242c] rounded-2xl overflow-hidden shadow-xs min-h-0 ${
            mobileView === 'problem' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Learning Panel Tabs */}
          <div className="flex items-center gap-0.5 px-2 bg-[#101115] border-b border-[#22242c] shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveLeftTab('statement')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeLeftTab === 'statement'
                  ? 'text-zinc-100 border-zinc-400 bg-zinc-800/40'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-zinc-400" />
              <span>Statement</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('hints')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeLeftTab === 'hints'
                  ? 'text-amber-300 border-amber-500/80 bg-zinc-800/40'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Hints ({problem.hints?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('solution')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeLeftTab === 'solution'
                  ? 'text-emerald-300 border-emerald-500/80 bg-zinc-800/40'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400/80" />
              <span>Solution</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeLeftTab === 'ai'
                  ? 'text-zinc-100 border-zinc-400 bg-zinc-800/40'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-zinc-400" />
              <span>AI Coach</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('submissions')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeLeftTab === 'submissions'
                  ? 'text-zinc-100 border-zinc-400 bg-zinc-800/40'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>Runs ({submissions.length})</span>
            </button>
          </div>

          {/* Left Panel Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 text-zinc-300 text-xs min-h-[350px] lg:min-h-0">
            {/* Tab 1: Statement */}
            {activeLeftTab === 'statement' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Problem Description
                  </h3>
                  <div className="bg-[#181920] border border-[#262832] rounded-2xl p-3.5 sm:p-4 leading-relaxed text-zinc-200">
                    <FormattedText content={problem.description} />
                  </div>
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Examples
                    </h3>
                    {problem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-[#181920] border border-[#262832] rounded-xl p-3 space-y-2"
                      >
                        <div className="text-zinc-300 font-semibold text-xs flex items-center justify-between">
                          <span>Example {idx + 1}</span>
                        </div>

                        {/* Input Box */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                            Input:
                          </div>
                          <pre className="bg-[#101115] border border-[#22242c] p-2 rounded-lg text-zinc-300 font-mono whitespace-pre-wrap text-xs">
                            {ex.input || '(None)'}
                          </pre>
                        </div>

                        {/* Output Box */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                            Output:
                          </div>
                          <pre className="bg-[#101115] border border-[#22242c] p-2 rounded-lg text-emerald-400/90 font-mono font-medium text-xs">
                            {ex.output}
                          </pre>
                        </div>

                        {/* Explanation Box */}
                        {ex.explanation && (
                          <div className="space-y-1 pt-1.5 border-t border-[#262832]">
                            <div className="text-[10px] font-medium text-amber-400/90 uppercase tracking-wider">
                              Explanation:
                            </div>
                            <div className="bg-[#101115]/50 p-2.5 rounded-lg border border-[#22242c] text-zinc-300">
                              <FormattedText content={ex.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Hints (Progressive Reveal) */}
            {activeLeftTab === 'hints' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Step-by-Step Hints
                  </h3>
                  <span className="text-[10px] text-zinc-500">
                    Reveal hints one by one to avoid spoiling the solution
                  </span>
                </div>

                {(!problem.hints || problem.hints.length === 0) ? (
                  <div className="bg-[#181920] p-6 rounded-2xl border border-[#262832] text-center text-zinc-500">
                    No hints listed for this problem. Try asking the AI Coach!
                  </div>
                ) : (
                  problem.hints.map((hint, idx) => {
                    const isRevealed = revealedHints.includes(idx);
                    return (
                      <div
                        key={idx}
                        className="bg-[#181920] border border-[#262832] rounded-2xl p-3.5 space-y-2 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-400/90 text-xs flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Hint {idx + 1}
                          </span>
                          {!isRevealed ? (
                            <button
                              onClick={() => setRevealedHints([...revealedHints, idx])}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              Reveal Hint
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400/90 font-medium">Revealed</span>
                          )}
                        </div>

                        {isRevealed && (
                          <div className="pt-2 border-t border-[#262832] text-zinc-200 leading-relaxed animate-fade-in">
                            <FormattedText content={hint} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 3: Solution & Explanation */}
            {activeLeftTab === 'solution' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Official Reference Solution
                  </h3>
                  <button
                    onClick={handleCopySolution}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition-colors"
                    title="Load this solution directly into the code editor"
                  >
                    {isSolutionCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isSolutionCopied ? 'Loaded to Editor' : 'Load into Editor'}</span>
                  </button>
                </div>

                {/* Explanation */}
                {problem.explanation && (
                  <div className="bg-[#181920] p-3.5 rounded-2xl border border-[#262832] space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                      Approach & Algorithm Breakdown
                    </h4>
                    <div className="text-zinc-200 leading-relaxed">
                      <FormattedText content={problem.explanation} />
                    </div>
                  </div>
                )}

                {/* Solution Code */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                    Complete Code ({problem.language})
                  </h4>
                  <pre className="bg-[#181920] border border-[#262832] p-3.5 rounded-2xl text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed">
                    {problem.solution_code || '// Solution code not available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab 4: AI Tutor */}
            <div className={`h-full ${activeLeftTab === 'ai' ? 'block' : 'hidden'}`}>
              <AIAssistant problem={problem} currentCode={code} />
            </div>

            {/* Tab 5: Past Submissions */}
            {activeLeftTab === 'submissions' && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Past Workout Runs ({submissions.length})
                </h3>
                {submissions.length === 0 ? (
                  <div className="bg-[#181920] p-6 rounded-2xl border border-[#262832] text-center text-zinc-500">
                    No runs yet. Click "Submit" to evaluate your solution!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-[#181920] border border-[#262832] rounded-xl p-3 space-y-1 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold ${
                              sub.status === 'accepted' ? 'text-emerald-400/90' : 'text-rose-400/90'
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                          <span className="text-zinc-500 text-[10px]">
                            {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                          <span>Runtime: {sub.execution_time_ms}ms</span>
                          {sub.xp_earned > 0 && (
                            <span className="text-amber-400/90">+{sub.xp_earned} XP</span>
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
        <div
          className={`lg:col-span-7 h-full flex flex-col min-h-0 bg-[#131418] border border-[#22242c] rounded-2xl overflow-hidden shadow-xs ${
            mobileView === 'code' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Editor Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#101115] border-b border-[#22242c] gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-[#181920] border border-[#262832] text-zinc-300 text-xs font-medium uppercase rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-500"
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="php">PHP</option>
              </select>
              {saveStatus && (
                <span className="text-[10px] font-mono text-zinc-500">
                  {saveStatus}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-[#181920] hover:bg-zinc-800 rounded-lg border border-[#262832] transition-colors"
                title="Copy code"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleResetCode}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs text-zinc-400 hover:text-rose-400 bg-[#181920] hover:bg-zinc-800 rounded-lg border border-[#262832] transition-colors"
                title="Reset code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Run Code */}
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-medium text-zinc-200 bg-[#181920] hover:bg-zinc-800 border border-[#262832] rounded-lg transition-all disabled:opacity-50"
                title="Run in scratchpad"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400/80 fill-emerald-400/80" />
                <span>{isRunning ? '...' : 'Run'}</span>
              </button>

              {/* Submit & Test */}
              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1 px-3 sm:px-3.5 py-1 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-white rounded-lg shadow-xs transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Testing...' : 'Submit'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[220px] lg:min-h-[250px] relative">
            <Editor
              height="100%"
              language={monacoLanguage}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: true,
                tabSize: 4,
                automaticLayout: true,
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>

          {/* Diagnostics / Test Results Bottom Area */}
          <div className="h-56 sm:h-60 border-t border-[#22242c] bg-[#101115] flex flex-col shrink-0">
            {/* Panel Tabs */}
            <div className="flex items-center justify-between px-2 bg-[#131418] border-b border-[#22242c] overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setActiveRightTab('testcases')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                    activeRightTab === 'testcases'
                      ? 'text-zinc-100 border-zinc-400 bg-zinc-800/40'
                      : 'text-zinc-400 border-transparent hover:text-zinc-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Test Results</span>
                  {lastSubmission && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        lastSubmission.isPassed
                          ? 'bg-emerald-950/40 text-emerald-400/90 border border-emerald-850/40'
                          : 'bg-rose-950/40 text-rose-400/90 border border-rose-850/40'
                      }`}
                    >
                      {lastSubmission.isPassed ? 'PASSED' : 'FAILED'}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveRightTab('console')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                    activeRightTab === 'console'
                      ? 'text-zinc-100 border-zinc-400 bg-zinc-800/40'
                      : 'text-zinc-400 border-transparent hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Output Console</span>
                </button>

                <button
                  onClick={() => setActiveRightTab('custom_input')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                    activeRightTab === 'custom_input'
                      ? 'text-zinc-100 border-zinc-400 bg-zinc-800/40'
                      : 'text-zinc-400 border-transparent hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Custom Input</span>
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {/* Tab 1: Test Cases */}
              {activeRightTab === 'testcases' && (
                <div>
                  {lastSubmission ? (
                    <div className="space-y-2.5">
                      {/* Test Case Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {lastSubmission.evalResult.results.map((res, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveTestCaseIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                              activeTestCaseIndex === idx
                                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                : 'bg-[#181920] text-zinc-400 hover:text-zinc-200 border border-[#262832]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                res.passed ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <span>Case {idx + 1}</span>
                          </button>
                        ))}
                      </div>

                      {/* Active Test Case Detail */}
                      {(() => {
                        const curCase = lastSubmission.evalResult.results[activeTestCaseIndex];
                        if (!curCase) return null;
                        return (
                          <div className="bg-[#181920] border border-[#262832] rounded-xl p-3 space-y-2 font-mono text-xs">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-semibold ${
                                  curCase.passed ? 'text-emerald-400/90' : 'text-rose-400/90'
                                }`}
                              >
                                {curCase.passed ? 'Passed ✓' : 'Failed ✗'}
                              </span>
                              <span className="text-zinc-500 text-[10px]">
                                Runtime: {curCase.execution_time_ms}ms
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-400 uppercase font-medium">
                                  Input:
                                </span>
                                <pre className="bg-[#101115] border border-[#22242c] p-2 rounded-lg text-zinc-300 overflow-x-auto">
                                  {curCase.input || '(None)'}
                                </pre>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-400 uppercase font-medium">
                                  Expected Output:
                                </span>
                                <pre className="bg-[#101115] border border-[#22242c] p-2 rounded-lg text-emerald-400/90 overflow-x-auto">
                                  {curCase.expected_output}
                                </pre>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-zinc-400 uppercase font-medium">
                                Your Output:
                              </span>
                              <pre
                                className={`bg-[#101115] border border-[#22242c] p-2 rounded-lg overflow-x-auto ${
                                  curCase.passed ? 'text-emerald-300' : 'text-rose-300'
                                }`}
                              >
                                {curCase.actual_output || '(Empty)'}
                              </pre>
                            </div>

                            {curCase.error && (
                              <div className="text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40 text-[11px]">
                                {curCase.error}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500">
                      Click <strong className="text-zinc-300 font-medium">Submit</strong> to run your solution against test cases.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Console Output */}
              {activeRightTab === 'console' && (
                <div>
                  {runOutput ? (
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] pb-1 border-b border-[#262832]">
                        <span>Execution Output</span>
                        <span>{runOutput.time}ms</span>
                      </div>

                      {runOutput.stdout && (
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase">Stdout:</span>
                          <pre className="bg-[#181920] border border-[#262832] p-2.5 rounded-lg text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                            {runOutput.stdout}
                          </pre>
                        </div>
                      )}

                      {runOutput.stderr && (
                        <div>
                          <span className="text-[10px] text-rose-400 uppercase">Stderr / Error:</span>
                          <pre className="bg-rose-950/30 border border-rose-900/40 p-2.5 rounded-lg text-rose-300 overflow-x-auto whitespace-pre-wrap">
                            {runOutput.stderr}
                          </pre>
                        </div>
                      )}

                      {!runOutput.stdout && !runOutput.stderr && (
                        <div className="text-zinc-500 py-4 text-center">
                          Code executed successfully with no console output.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500">
                      Click <strong className="text-zinc-300 font-medium">Run Code</strong> to execute your code in the scratchpad.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Custom Input */}
              {activeRightTab === 'custom_input' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Provide custom stdin input for scratchpad run:</span>
                  </div>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input lines here..."
                    className="flex-1 w-full bg-[#181920] border border-[#262832] rounded-xl p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Quick Selector Modal */}
      {showProblemPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#181920] border border-[#282a35] rounded-2xl p-4 max-w-lg w-full space-y-3 shadow-xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-300" />
                <h3 className="font-semibold text-zinc-100 text-sm">Select Problem to Workout</h3>
              </div>
              <button
                onClick={() => setShowProblemPicker(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search problem title, topic, difficulty..."
                className="w-full bg-[#101115] border border-[#262832] rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                autoFocus
              />
            </div>

            {/* Problem List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#22242c] pr-1 space-y-0.5 max-h-[50vh]">
              {filteredPickerProblems.map((p) => {
                const isItemSolved = p.user_status === 'solved';
                const isSelected = p.id === problem.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProblem(p.id);
                      setShowProblemPicker(false);
                    }}
                    className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-800/80 border border-zinc-700 text-zinc-100'
                        : 'hover:bg-zinc-800/40 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                        {isItemSolved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">#{p.order_index}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-xs text-zinc-100">{p.title}</div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <span>{p.topic}</span>
                          <span>•</span>
                          <span className={p.difficulty === 'Easy' ? 'text-emerald-400/90' : p.difficulty === 'Medium' ? 'text-amber-400/90' : 'text-rose-400/90'}>
                            {p.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                      {p.language}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Solved Celebration Dialog */}
      <SolvedModal
        isOpen={showSolvedModal}
        onClose={() => setShowSolvedModal(false)}
        problemTitle={problem.title}
        difficulty={problem.difficulty}
        pointsEarned={problem.difficulty === 'Easy' ? 10 : problem.difficulty === 'Medium' ? 25 : 50}
        onNextProblem={handleNextProblem}
      />
    </div>
  );
};
