# 🏋️ CodeGym: Personal Offline Coding Practice Platform
## Architecture Blueprint & Comprehensive Specification

---

## 1. Project Overview & Core Philosophy

**CodeGym** is a complete, single-user, 100% offline personal coding practice gym designed to build deep mastery of **pure logical thinking, algorithmic reasoning, and problem solving** across **Java**, **Python**, and **PHP** before tackling advanced OOP or academic DSA.

It combines:
- **LeetCode / HackerRank**: Real test cases, local process execution, automated validation, test runner.
- **Codecademy**: Structured, sequential practice paths unlocking topics step-by-step.
- **Duolingo**: Daily streak tracker, XP points, leveling system, daily customizable goals.
- **Anki (SuperMemo)**: Automated spaced-repetition revision queue (1-day, 3-day, 7-day, 14-day, 30-day intervals) with interactive Flashcard Mode.
- **LangChain & Google Gemini AI Tutor**: Instant, sub-second conceptual problem explainer (no code spoilers), code reviewer, doubt chat, and edge-case generator with persistent localStorage caching.

---

## 2. Key Architecture & Technologies

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Ultra-fast single-page application with URL Hash Routing |
| **Styling** | Tailwind CSS + Lucide Icons | Premium dark theme, custom `FormattedText` markdown parser, glassmorphism cards |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | Syntax highlighting, auto-complete, test runner, hints, diff solutions, persistent notes |
| **AI Layer** | LangChain + Google Gemini Multi-Model Pool | Sub-second latency (<1s) with auto-failover (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3-flash-preview`, `gemini-3.7-flash`, `gemini-pro-latest`) |
| **Analytics & Charts** | Recharts + Canvas Confetti | Topic strength radar, activity heatmaps, streak graphs, celebration effects |
| **Backend API** | Node.js + Express | RESTful API running locally at `http://localhost:3001` |
| **Code Execution** | Local Process Runner | Executes `java`, `python3`, and `php` with sandboxing, timeouts, and output capture |
| **Database** | SQLite 3 via `better-sqlite3` | Zero-setup, single file database (`coding_gym.db`), persistent local storage |

---

## 3. Directory Structure

```plaintext
coding-gym/
├── package.json                   # Root orchestrator (npm run dev runs client + server concurrently)
├── README.md                      # Quickstart and overview guide
├── PROJECT_BLUEPRINT.md           # This comprehensive specification
├── server/
│   ├── package.json
│   ├── data/
│   │   └── coding_gym.db          # Local SQLite Database (all progress, submissions, questions, plans)
│   ├── src/
│   │   ├── index.js               # Express application entry point (port 3001)
│   │   ├── db/
│   │   │   ├── schema.sql         # Database schema (7 tables + indexes)
│   │   │   ├── index.js           # SQLite connection & database helper
│   │   │   ├── generateAll300Questions.js # 300 100% unique pure-logic challenges generator
│   │   │   └── seedQuestions.js   # DB Seeder & drafts initializer
│   │   ├── routes/
│   │   │   ├── problems.js        # Problem catalog, search, pagination, preview
│   │   │   ├── execute.js         # Real Java/Python/PHP code execution engine
│   │   │   ├── submissions.js     # Submissions stream, XP calculation, history
│   │   │   ├── revision.js        # Spaced repetition engine (1d, 3d, 7d, 14d, 30d)
│   │   │   ├── progress.js        # Daily streak, XP, Level, Daily goal tracking
│   │   │   ├── paths.js           # Sequential topic unlock curriculum
│   │   │   ├── roadmaps.js        # Developer skill & career roadmaps
│   │   │   ├── planner.js         # Adaptive weekly learning plan with multi-language switching
│   │   │   └── ai.js              # AI Tutor endpoints (explain, check-code, chat, edge-cases)
│   │   └── services/
│   │       ├── codeRunner.js      # Child process runner with timeouts and memory guards
│   │       ├── revisionEngine.js  # Spaced repetition scheduling algorithms
│   │       └── aiService.js       # LangChain multi-model auto-failover & in-memory caching
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                # URL hash router & global state orchestrator
    │   ├── index.css              # Custom styling tokens and animations
    │   ├── api/                   # Typed API client for all backend endpoints
    │   ├── components/
    │   │   ├── Navbar.tsx         # Spacious segmented navbar, streak counter, XP capsule
    │   │   ├── MonacoPlayground.tsx # Monaco editor with runner, test cases, hints, diff solutions, notes
    │   │   ├── AIAssistant.tsx    # Persistent AI Tutor (Intuition, Code Review, Doubt Chat, Edge Cases)
    │   │   ├── FormattedText.tsx  # Custom markdown renderer (badges, code, bold, lists)
    │   │   ├── StreakTracker.tsx  # Daily streak and calendar view
    │   │   ├── XPModal.tsx        # Level up & XP celebration animations
    │   │   └── TopicRadar.tsx     # Strengths & weaknesses visual chart
    │   └── pages/
    │       ├── Dashboard.tsx      # Today's goal, daily progress, random challenge, quick resume
    │       ├── PracticePaths.tsx  # Sequential topic unlock tree for Java, Python, PHP
    │       ├── ProblemsList.tsx   # 300 questions library with search, preview modal, sorting, pagination
    │       ├── ProblemDetail.tsx  # Full-screen playground, runner, hints, solutions, AI Tutor
    │       ├── RevisionQueue.tsx  # Spaced repetition review manager with Flashcard Mode
    │       ├── RoadmapsView.tsx   # Visual interactive career roadmaps with AI concept quizzes
    │       ├── Analytics.tsx      # Deep dive statistics, topic mastery, report export
    │       └── WeeklyPlanner.tsx  # Adaptive weekly schedule with Combined / Single-language focus
```

---

## 4. Implemented Feature Modules

### A. Pure-Logic 300 Problem Curriculum
- **100 Java, 100 Python, 100 PHP** unique logical challenges.
- **Zero Duplicate Titles**: Completely eliminated synthetic placeholder templates.
- **Standardized Variable-Style Parameters**: Every problem clearly defines `nums = [...]`, `target = ...`, `s = "..."`, `x = ...` with concrete 4-number example walkthroughs and step-by-step logic traces.
- **Real Multi-Test Case Suites**: Includes standard cases, empty/single boundaries, negative numbers, zeros, duplicates, and hidden tests.

### B. High-Speed AI Problem & Logic Tutor
- **LangChain Multi-Model Auto-Failover**: Automatically prioritizes high-throughput models (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3-flash-preview`) with sub-second response times (<1s) and falls back gracefully to `gemini-3.7-flash` and `gemini-pro-latest` on rate limits.
- **Problem-First Intuition (No Code Spoilers)**: Explains what the problem is asking in simple, relatable words with physical analogies and mental model clues.
- **Persistent LocalStorage Memory**: Saves generated explanations, code reviews, and chat history per problem ID so reloads and tab changes never lose data or waste API tokens.

### C. URL Hash Routing & Navigation
- **Bookmarkable Hash URLs**: Synchronizes state with `#/dashboard`, `#/paths/java`, `#/problems`, `#/problem/java-001`, `#/revision`, `#/roadmaps/python`, `#/planner`, `#/analytics`.
- **Browser History Support**: Full Back and Forward button navigation.
- **Page Reload Resilience**: Reloading any problem or page retains the exact active state.

### D. Adaptive Weekly Planner with Language Switching
- **Multi-Mode Selector**: Toggle between **Combined (Tri-Language Gym)** and dedicated **Java Focus**, **Python Focus**, and **PHP Focus** schedules.
- **Adaptive Regeneration**: Recalculates 7-day plans based on the user's latest solve history and weakest topics.
- **Interactive Checklists**: Clickable checkmarks and direct solve launchers.

### E. Revision Queue & Flashcard Mode
- **SuperMemo (SM-2) Spaced Repetition**: Schedules reviews at 1d, 3d, 7d, 14d, and 30d (Mastered).
- **Interactive Flashcard Mode**: Front/back recall cards with confidence rating buttons (*Again, Hard, Good, Easy*).

---

## 5. Quick Run Commands

```bash
# Start backend (port 3001) & frontend (port 5173) concurrently
npm run dev

# Re-seed database with 300 unique pure-logic problems
npm run seed

# Build production bundle
npm run build
```
