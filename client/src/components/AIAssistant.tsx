import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Search,
  MessageSquare,
  Lightbulb,
  Send,
  RotateCcw,
  Bug,
  Zap,
  Trash2
} from 'lucide-react';
import type { Problem } from '../types';
import { api } from '../api';
import { FormattedText } from './FormattedText';

interface AIAssistantProps {
  problem: Problem;
  currentCode: string;
}

type AITab = 'explain' | 'checker' | 'chat' | 'edgecases';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ problem, currentCode }) => {
  const [activeTab, setActiveTab] = useState<AITab>('explain');

  // Storage Keys for persistent memory
  const storageKeyExplain = `codegym_ai_explain_${problem.id}`;
  const storageKeyReview = `codegym_ai_review_${problem.id}`;
  const storageKeyChat = `codegym_ai_chat_${problem.id}`;
  const storageKeyEdge = `codegym_ai_edge_${problem.id}`;
  
  // States for AI operations
  const [explanation, setExplanation] = useState<string>(() => {
    return localStorage.getItem(storageKeyExplain) || '';
  });
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const [codeReview, setCodeReview] = useState<string>(() => {
    return localStorage.getItem(storageKeyReview) || '';
  });
  const [isCheckingCode, setIsCheckingCode] = useState<boolean>(false);

  const [edgeCases, setEdgeCases] = useState<{ input: string; expected_output: string; description: string }[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyEdge);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isGeneratingCases, setIsGeneratingCases] = useState<boolean>(false);

  // Chat states
  const defaultChatMessage: ChatMessage = {
    role: 'assistant',
    content: `👋 Hi! I am your AI Coach powered by Gemini.\n\nI can explain **${problem.title}** in simple everyday words, review your draft code for bugs, or answer any questions you have.`,
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyChat);
      return saved ? JSON.parse(saved) : [defaultChatMessage];
    } catch {
      return [defaultChatMessage];
    }
  });
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Load from localStorage when problem.id changes
  useEffect(() => {
    const savedExp = localStorage.getItem(`codegym_ai_explain_${problem.id}`) || '';
    const savedRev = localStorage.getItem(`codegym_ai_review_${problem.id}`) || '';
    setExplanation(savedExp);
    setCodeReview(savedRev);

    try {
      const savedEdge = localStorage.getItem(`codegym_ai_edge_${problem.id}`);
      setEdgeCases(savedEdge ? JSON.parse(savedEdge) : []);
    } catch {
      setEdgeCases([]);
    }

    try {
      const savedChat = localStorage.getItem(`codegym_ai_chat_${problem.id}`);
      setChatMessages(savedChat ? JSON.parse(savedChat) : [{
        role: 'assistant',
        content: `👋 Hi! I am your AI Coach powered by Gemini.\n\nI can explain **${problem.title}** in simple everyday words, review your draft code for bugs, or answer any questions you have.`,
      }]);
    } catch {
      setChatMessages([defaultChatMessage]);
    }
  }, [problem.id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isSendingChat]);

  // 1. Fetch AI Explanation
  const handleExplain = async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    try {
      const res = await api.aiExplainProblem(problem.id);
      setExplanation(res.explanation);
      localStorage.setItem(`codegym_ai_explain_${problem.id}`, res.explanation);
    } catch (err: any) {
      setExplanation(`⚠️ Failed to generate explanation: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  // 2. Fetch AI Code Review
  const handleCheckCode = async () => {
    if (isCheckingCode) return;
    setIsCheckingCode(true);
    try {
      const res = await api.aiCheckCode(problem.id, currentCode, problem.language);
      setCodeReview(res.review);
      localStorage.setItem(`codegym_ai_review_${problem.id}`, res.review);
    } catch (err: any) {
      setCodeReview(`⚠️ Failed to review code: ${err.message}`);
    } finally {
      setIsCheckingCode(false);
    }
  };

  // 3. Fetch Edge Test Cases
  const handleGenerateEdgeCases = async () => {
    if (isGeneratingCases) return;
    setIsGeneratingCases(true);
    try {
      const res = await api.aiGenerateEdgeCases(problem.id);
      const cases = res.testCases || [];
      setEdgeCases(cases);
      localStorage.setItem(`codegym_ai_edge_${problem.id}`, JSON.stringify(cases));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGeneratingCases(false);
    }
  };

  // 4. Send Interactive Chat Message
  const handleSendChat = async (customPrompt?: string) => {
    const messageToSend = customPrompt || inputQuestion.trim();
    if (!messageToSend || isSendingChat) return;

    const userMsg: ChatMessage = { role: 'user', content: messageToSend };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setInputQuestion('');
    setIsSendingChat(true);

    try {
      const apiMessages = updatedHistory.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await api.aiChat(problem.id, currentCode, problem.language, apiMessages);
      const assistantMsg: ChatMessage = { role: 'assistant', content: res.reply };
      const finalHistory = [...updatedHistory, assistantMsg];
      setChatMessages(finalHistory);
      localStorage.setItem(`codegym_ai_chat_${problem.id}`, JSON.stringify(finalHistory));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `⚠️ Error from AI: ${err.message || 'Please verify GEMINI_API_KEY in server/.env'}`,
      };
      setChatMessages([...updatedHistory, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear AI memory and chat history for this problem?')) {
      localStorage.removeItem(`codegym_ai_explain_${problem.id}`);
      localStorage.removeItem(`codegym_ai_review_${problem.id}`);
      localStorage.removeItem(`codegym_ai_chat_${problem.id}`);
      localStorage.removeItem(`codegym_ai_edge_${problem.id}`);
      setExplanation('');
      setCodeReview('');
      setEdgeCases([]);
      setChatMessages([defaultChatMessage]);
    }
  };

  return (
    <div className="bg-[#131418] border border-[#22242c] rounded-2xl flex flex-col h-full overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-[#101115] border-b border-[#22242c] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-zinc-200 text-xs">AI Tutor</h3>
            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Gemini
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#181920] p-0.5 rounded-xl border border-[#262832] gap-0.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('explain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
              activeTab === 'explain'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="w-3 h-3 text-amber-400/80" />
            <span>Intuition</span>
          </button>

          <button
            onClick={() => setActiveTab('checker')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
              activeTab === 'checker'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bug className="w-3 h-3 text-zinc-400" />
            <span>Review</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3 h-3 text-zinc-400" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('edgecases')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
              activeTab === 'edgecases'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400/80" />
            <span>Edge Cases</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 text-xs text-zinc-200">
        {/* 1. EXPLAIN TAB */}
        {activeTab === 'explain' && (
          <div className="space-y-3">
            {!explanation ? (
              <div className="text-center py-8 space-y-2.5 bg-[#181920] p-5 rounded-2xl border border-[#262832]">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-amber-400/80 flex items-center justify-center mx-auto">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-zinc-200 text-xs">Need help understanding what to do?</h4>
                <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                  Gemini will explain what the problem is asking in simple, relatable words with visual clues without spoiling code.
                </p>
                <button
                  onClick={handleExplain}
                  disabled={isExplaining}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs rounded-xl inline-flex items-center gap-2 border border-zinc-700 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isExplaining ? 'animate-spin' : ''}`} />
                  <span>{isExplaining ? 'Analyzing Problem...' : 'Explain Problem in Simple Terms'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#262832]">
                  <span className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400/80" /> Plain English Breakdown
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleExplain}
                      disabled={isExplaining}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700 transition-colors"
                      title="Re-generate fresh explanation"
                    >
                      <RotateCcw className={`w-3 h-3 ${isExplaining ? 'animate-spin' : ''}`} />
                      <span>Re-explain</span>
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 bg-zinc-800 p-1.5 rounded-lg border border-zinc-700 transition-colors"
                      title="Clear saved memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="bg-[#181920] p-4 rounded-2xl border border-[#262832]">
                  <FormattedText content={explanation} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CODE CHECKER TAB */}
        {activeTab === 'checker' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#262832]">
              <div>
                <h4 className="font-semibold text-zinc-200 text-xs">Code Reviewer</h4>
                <p className="text-[11px] text-zinc-400">
                  Checks your current draft for off-by-one errors and edge cases.
                </p>
              </div>
              <button
                onClick={handleCheckCode}
                disabled={isCheckingCode}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs rounded-xl inline-flex items-center gap-1.5 border border-zinc-700 transition-all disabled:opacity-50"
              >
                <Bug className={`w-3.5 h-3.5 ${isCheckingCode ? 'animate-spin' : ''}`} />
                <span>{isCheckingCode ? 'Reviewing...' : 'Review Draft'}</span>
              </button>
            </div>

            {codeReview ? (
              <div className="bg-[#181920] p-4 rounded-2xl border border-[#262832]">
                <FormattedText content={codeReview} />
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400 space-y-2 bg-[#181920] p-5 rounded-2xl border border-[#262832]">
                <Search className="w-6 h-6 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">
                  Write or modify code in the editor, then click "Review Draft" for helpful hints.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[340px]">
            {/* Chat Messages Log */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl leading-relaxed text-xs ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 text-zinc-100 ml-6 border border-zinc-700'
                      : 'bg-[#181920] border border-[#262832] text-zinc-200 mr-4'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium opacity-75">
                    {msg.role === 'user' ? (
                      <span>You</span>
                    ) : (
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" /> AI Coach
                      </span>
                    )}
                  </div>
                  <FormattedText content={msg.content} />
                </div>
              ))}

              {isSendingChat && (
                <div className="p-3 rounded-2xl bg-[#181920] border border-[#262832] text-zinc-400 flex items-center gap-2 text-xs">
                  <Sparkles className="w-3 h-3 animate-spin text-zinc-400" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="pt-2 border-t border-[#262832] flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask any question about this problem..."
                className="flex-1 bg-[#181920] border border-[#262832] rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={!inputQuestion.trim() || isSendingChat}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 4. EDGE TEST CASES TAB */}
        {activeTab === 'edgecases' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#262832]">
              <div>
                <h4 className="font-semibold text-zinc-200 text-xs">Edge Cases</h4>
                <p className="text-[11px] text-zinc-400">
                  Boundary scenarios to stress test your solution logic.
                </p>
              </div>
              <button
                onClick={handleGenerateEdgeCases}
                disabled={isGeneratingCases}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs rounded-xl inline-flex items-center gap-1.5 border border-zinc-700 transition-all disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isGeneratingCases ? 'animate-spin' : ''}`} />
                <span>{isGeneratingCases ? 'Generating...' : 'Find Cases'}</span>
              </button>
            </div>

            {edgeCases.length > 0 ? (
              <div className="space-y-2">
                {edgeCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#181920] border border-[#262832] rounded-xl space-y-1.5 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className="font-medium text-amber-400/90">Case #{idx + 1}</span>
                      <span className="text-zinc-400">{tc.description}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-[#101115] p-2 rounded-lg border border-[#22242c]">
                        <span className="text-zinc-500 font-sans">Input: </span>
                        <span className="text-zinc-300">{tc.input}</span>
                      </div>
                      <div className="bg-[#101115] p-2 rounded-lg border border-[#22242c]">
                        <span className="text-zinc-500 font-sans">Expected: </span>
                        <span className="text-emerald-400/90">{tc.expected_output}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400 space-y-2 bg-[#181920] p-5 rounded-2xl border border-[#262832]">
                <Zap className="w-6 h-6 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">Click "Find Cases" to generate boundary tests for this problem.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
