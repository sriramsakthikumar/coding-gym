import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { WorkoutWorkspace } from './pages/WorkoutWorkspace';
import { ProblemsCatalog } from './pages/ProblemsCatalog';
import type { ProgressSummary, Language } from './types';
import { api } from './api';

const defaultStats: ProgressSummary = {
  profile: {
    id: 'me',
    xp: 0,
    level: 1,
    streak_days: 0,
    last_active_date: null,
    daily_goal_problems: 3,
    daily_goal_minutes: 30,
  },
  overall: {
    totalProblems: 300,
    solvedProblems: 0,
    completionPct: 0,
    totalPracticeSeconds: 0,
  },
  today: {
    date: new Date().toISOString().split('T')[0],
    problems_solved: 0,
    practice_seconds: 0,
    xp_earned: 0,
  },
  byLanguage: [
    { language: 'java', total: 100, solved: 0, attempted: 0 },
    { language: 'python', total: 100, solved: 0, attempted: 0 },
    { language: 'php', total: 100, solved: 0, attempted: 0 },
  ],
  byDifficulty: [
    { difficulty: 'Easy', total: 100, solved: 0 },
    { difficulty: 'Medium', total: 120, solved: 0 },
    { difficulty: 'Hard', total: 80, solved: 0 },
  ],
  byLevel: [
    { level: 'fundamentals', total: 105, solved: 0 },
    { level: 'intermediate', total: 105, solved: 0 },
    { level: 'advanced', total: 90, solved: 0 },
  ],
  activityHistory: [],
  topicMastery: [],
  lastWorkedProblem: null,
};

// Route parser helper
function getInitialRoute(): { tab: 'workout' | 'catalog'; problemId: string; lang: Language } {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const savedRoute = localStorage.getItem('codegym_route');

  const routeStr = hash || savedRoute || 'workout/java-001';
  const parts = routeStr.split('/');
  const main = parts[0] || 'workout';
  const sub = parts[1] || null;

  if (main === 'catalog') {
    const lang = (sub && ['java', 'python', 'php'].includes(sub.toLowerCase()))
      ? (sub.toLowerCase() as Language)
      : 'java';
    return { tab: 'catalog', problemId: `${lang}-001`, lang };
  }

  // workout mode
  let problemId = sub || 'java-001';
  let lang: Language = 'java';

  if (problemId.startsWith('python-')) lang = 'python';
  else if (problemId.startsWith('php-')) lang = 'php';
  else if (problemId.startsWith('java-')) lang = 'java';
  else problemId = 'java-001';

  return { tab: 'workout', problemId, lang };
}

export function App() {
  const initial = getInitialRoute();

  const [activeTab, setActiveTab] = useState<'workout' | 'catalog'>(initial.tab);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(initial.lang);
  const [activeProblemId, setActiveProblemId] = useState<string>(initial.problemId);
  const [stats, setStats] = useState<ProgressSummary>(defaultStats);

  // Sync route changes to URL hash & localStorage
  const syncRoute = useCallback((tab: 'workout' | 'catalog', problemId: string, lang: Language) => {
    let routePath = tab === 'workout' ? `workout/${problemId}` : `catalog/${lang}`;
    window.location.hash = `#/${routePath}`;
    localStorage.setItem('codegym_route', routePath);
  }, []);

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = getInitialRoute();
      setActiveTab(parsed.tab);
      setActiveProblemId(parsed.problemId);
      setSelectedLanguage(parsed.lang);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load global user stats
  const loadGlobalStats = async () => {
    try {
      const data = await api.getProgressStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const handleOpenProblem = (problemId: string) => {
    setActiveProblemId(problemId);
    let lang: Language = selectedLanguage;
    if (problemId.startsWith('python-')) lang = 'python';
    else if (problemId.startsWith('php-')) lang = 'php';
    else if (problemId.startsWith('java-')) lang = 'java';

    setSelectedLanguage(lang);
    setActiveTab('workout');
    syncRoute('workout', problemId, lang);
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    // If current problem is not for the selected language, switch to problem 001 of that language
    let newProbId = activeProblemId;
    if (!activeProblemId.startsWith(lang)) {
      newProbId = `${lang}-001`;
      setActiveProblemId(newProbId);
    }
    syncRoute(activeTab, newProbId, lang);
  };

  const handleTabChange = (tab: 'workout' | 'catalog') => {
    setActiveTab(tab);
    syncRoute(tab, activeProblemId, selectedLanguage);
  };

  const handlePickRandom = async () => {
    try {
      const problems = await api.getProblems({ language: selectedLanguage });
      if (problems && problems.length > 0) {
        const randomProb = problems[Math.floor(Math.random() * problems.length)];
        handleOpenProblem(randomProb.id);
      }
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1013] text-zinc-300 flex flex-col font-sans selection:bg-zinc-700/50 selection:text-zinc-100">
      {/* Streamlined Clean Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        stats={stats}
        onPickRandom={handlePickRandom}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3">
        {activeTab === 'workout' && (
          <WorkoutWorkspace
            problemId={activeProblemId}
            onSelectProblem={handleOpenProblem}
            onBackToCatalog={() => handleTabChange('catalog')}
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            onRefreshStats={loadGlobalStats}
          />
        )}

        {activeTab === 'catalog' && (
          <ProblemsCatalog
            onOpenProblem={handleOpenProblem}
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            stats={stats}
            onRefreshStats={loadGlobalStats}
          />
        )}
      </main>
    </div>
  );
}

export default App;
