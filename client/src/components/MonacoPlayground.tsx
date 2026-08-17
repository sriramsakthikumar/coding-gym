import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Code2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Terminal,
  Bot
} from 'lucide-react';
import type { Problem, SubmissionResponse } from '../types';
import { api } from '../api';

interface MonacoPlaygroundProps {
  problem: Problem;
  onSubmitted: (response: SubmissionResponse) => void;
  onOpenAITutor?: () => void;
}

type TabType = 'testcases' | 'console' | 'hints' | 'solution' | 'notes';

export const MonacoPlayground: React.FC<MonacoPlaygroundProps> = ({
  problem,
  onSubmitted,
  onOpenAITutor,
}) => {
  const [code, setCode] = useState<string>(problem.draft_code || problem.starter_code);
  const [customInput, setCustomInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('testcases');
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  
  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runOutput, setRunOutput] = useState<{ stdout: string; stderr: string; time: number; error?: string } | null>(null);
  const [lastSubmission, setLastSubmission] = useState<SubmissionResponse | null>(null);
  
  // Hints & notes
  const [unlockedHintsCount, setUnlockedHintsCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>(problem.notes || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when problem changes
  useEffect(() => {
    setCode(problem.draft_code || problem.starter_code);
    setNotes(problem.notes || '');
    setRunOutput(null);
    setLastSubmission(null);
    setUnlockedHintsCount(0);
    setActiveTestCaseIndex(0);
  }, [problem.id]);

  // Auto-save code and notes
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('Saving...');
        await api.saveDraft(problem.id, code, notes);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus('');
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [code, notes, problem.id]);

  // Handle Quick Run
  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setActiveTab('console');
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

  // Handle Submit & Evaluate
  const handleSubmit = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setActiveTab('testcases');
    try {
      const res = await api.submitCode(problem.id, problem.language, code, false);
      setLastSubmission(res);
      onSubmitted(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset code back to original starter template?')) {
      setCode(problem.starter_code);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const monacoLanguage =
    problem.language === 'python' ? 'python' : problem.language === 'php' ? 'php' : 'java';

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-mono text-xs font-semibold uppercase text-slate-300">
              {problem.language}
            </span>
          </div>
          {saveStatus && (
            <span className="text-[11px] font-mono text-slate-500 animate-fade-in">
              {saveStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ask AI Coach quick button */}
          <button
            onClick={() => onOpenAITutor?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-xs transition-all cursor-pointer"
            title="Open AI Problem Tutor in Left Panel"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Tutor</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
            title="Copy Code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="Reset Starter Code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Quick Run */}
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 min-h-[280px] relative">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: true,
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Output / Diagnostics Bottom Panel */}
      <div className="h-72 border-t border-slate-800 bg-slate-950 flex flex-col">
        {/* Panel Tabs */}
        <div className="flex items-center justify-between px-3 bg-slate-900/90 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('testcases')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'testcases'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Test Cases</span>
              {lastSubmission && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    lastSubmission.isPassed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {lastSubmission.evalResult.passedCount}/{lastSubmission.evalResult.totalCount}
                </span>
              )}
            </button>



            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'console'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console & Input</span>
            </button>

            <button
              onClick={() => setActiveTab('hints')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'hints'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hints ({problem.hints?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('solution')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'solution'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Optimal Solution</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'notes'
                  ? 'text-blue-400 border-blue-500 bg-slate-800/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Notes</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
          {/* TEST CASES TAB */}
          {activeTab === 'testcases' && (
            <div className="h-full flex flex-col">
              {lastSubmission?.evalResult ? (
                <div className="flex-1 flex flex-col gap-3">
                  {/* Case Switcher Tabs */}
                  <div className="flex items-center gap-2">
                    {lastSubmission.evalResult.results.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTestCaseIndex(idx)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          activeTestCaseIndex === idx
                            ? 'bg-slate-800 text-white border-slate-600'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {res.passed ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span>Case {idx + 1} {res.is_hidden ? '(Hidden)' : ''}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Test Case Details */}
                  {lastSubmission.evalResult.results[activeTestCaseIndex] && (
                    <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 overflow-y-auto">
                      <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              lastSubmission.evalResult.results[activeTestCaseIndex].passed
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {lastSubmission.evalResult.results[activeTestCaseIndex].passed
                              ? 'PASSED'
                              : 'FAILED'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {lastSubmission.evalResult.results[activeTestCaseIndex].execution_time_ms}ms
                          </span>
                        </div>
                      </div>

                      {lastSubmission.evalResult.results[activeTestCaseIndex].input && (
                        <div>
                          <div className="text-[11px] text-slate-400 mb-1">Input:</div>
                          <pre className="bg-slate-950 p-2 rounded text-slate-200">
                            {lastSubmission.evalResult.results[activeTestCaseIndex].input}
                          </pre>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-slate-400 mb-1">Expected Output:</div>
                          <pre className="bg-slate-950 p-2 rounded text-emerald-400">
                            {lastSubmission.evalResult.results[activeTestCaseIndex].expected_output}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 mb-1">Your Output:</div>
                          <pre
                            className={`bg-slate-950 p-2 rounded ${
                              lastSubmission.evalResult.results[activeTestCaseIndex].passed
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {lastSubmission.evalResult.results[activeTestCaseIndex].actual_output ||
                              '(No Output)'}
                          </pre>
                        </div>
                      </div>

                      {lastSubmission.evalResult.results[activeTestCaseIndex].stderr && (
                        <div>
                          <div className="text-[11px] text-rose-400 mb-1">Error / Stderr:</div>
                          <pre className="bg-rose-950/40 border border-rose-900/60 p-2 rounded text-rose-300 whitespace-pre-wrap">
                            {lastSubmission.evalResult.results[activeTestCaseIndex].stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 flex flex-col justify-center items-center h-full gap-2">
                  <Play className="w-8 h-8 text-slate-600" />
                  <p>Click "Submit" to test your solution against all professional test cases.</p>
                </div>
              )}
            </div>
          )}

          {/* CONSOLE / SCRATCHPAD TAB */}
          {activeTab === 'console' && (
            <div className="grid grid-cols-2 gap-3 h-full">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 mb-1 font-sans">Custom Input (stdin):</span>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter arguments or test input..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 resize-none font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1 font-sans">
                  <span>Output:</span>
                  {runOutput?.time !== undefined && <span>{runOutput.time}ms</span>}
                </div>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 overflow-y-auto font-mono text-slate-200">
                  {runOutput ? (
                    <>
                      {runOutput.stdout && <pre className="text-slate-200">{runOutput.stdout}</pre>}
                      {runOutput.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap mt-1">{runOutput.stderr}</pre>
                      )}
                      {!runOutput.stdout && !runOutput.stderr && (
                        <span className="text-slate-500">Program finished with no output.</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-600">Run code to see stdout/stderr here.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HINTS TAB */}
          {activeTab === 'hints' && (
            <div className="space-y-3">
              {problem.hints && problem.hints.length > 0 ? (
                <>
                  {problem.hints.map((hint, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        idx < unlockedHintsCount
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 blur-xs select-none'
                      }`}
                    >
                      <div className="font-semibold mb-1 flex items-center gap-1.5 text-xs text-amber-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Hint {idx + 1}</span>
                      </div>
                      <p className="text-xs leading-relaxed font-sans">
                        {idx < unlockedHintsCount ? hint : 'Hint locked. Click button below to reveal.'}
                      </p>
                    </div>
                  ))}

                  {unlockedHintsCount < problem.hints.length && (
                    <button
                      onClick={() => setUnlockedHintsCount((prev) => prev + 1)}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Unlock Next Hint ({unlockedHintsCount + 1}/{problem.hints.length})</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="text-slate-500">No hints available for this problem.</div>
              )}
            </div>
          )}

          {/* OPTIMAL SOLUTION TAB */}
          {activeTab === 'solution' && (
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-400 font-semibold text-xs">Verified Solution</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(problem.solution_code);
                      alert('Solution code copied!');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Solution</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded text-slate-300 font-mono overflow-x-auto text-xs">
                  {problem.solution_code}
                </pre>
              </div>

              {problem.explanation && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-slate-300 font-sans text-xs leading-relaxed">
                  <span className="font-semibold text-slate-200 block mb-1">Explanation:</span>
                  {problem.explanation}
                </div>
              )}
            </div>
          )}

          {/* MY NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="h-full flex flex-col">
              <span className="text-[11px] text-slate-400 mb-1 font-sans">
                Personal Notes (auto-saved):
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your intuition, complexity analysis, or reminders here..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none font-sans text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
