# 🏋️ CodeGym: 100% Offline Personal Coding & Logic Practice Gym

A full-stack, single-user, offline coding gym built for deep mastery of **pure logical thinking, algorithmic reasoning, and problem solving** across **Java**, **Python**, and **PHP**.

---

## 🌟 Key Highlights

- **🧠 300 Pure-Logic Problem Challenges**: 100 Java, 100 Python, 100 PHP across Fundamentals, Intermediate, and Advanced tiers. All 100% unique without template duplicates.
- **📌 Crystal-Clear Parameter & Goal Specifications**: Variables clearly formatted (`nums = [...]`, `target = ...`, `s = "..."`) with detailed 4-number example walkthroughs and step-by-step logic traces.
- **⚡ High-Speed AI Problem Tutor (Google Gemini via LangChain)**:
  - **Sub-second latency (<1s)** via optimized candidate model auto-failover (`gemini-3.5-flash-lite` ➔ `gemini-3.1-flash-lite` ➔ `gemini-3-flash-preview` ➔ `gemini-3.7-flash` ➔ `gemini-pro-latest`).
  - **Problem-First Intuition**: Explains what the problem is asking in plain English with everyday analogies without giving away code spoilers.
  - **Code Reviewer, Doubt Chat & Edge Cases Generator**.
  - **Persistent Memory**: Saves all AI generations to `localStorage` per problem so reloads and tab changes never lose data or waste tokens.
- **🔗 URL Hash Routing & Reload Persistence**: Direct bookmarkable URLs (`#/problem/java-001`, `#/planner`, `#/revision`, `#/roadmaps/python`) with seamless browser Back/Forward history support.
- **📅 Adaptive Weekly Planner**: Dynamically switch between **Combined (Tri-Language Gym)** and dedicated **Java Focus**, **Python Focus**, and **PHP Focus** schedules with adaptive regeneration.
- **🧠 Spaced Repetition Engine (SuperMemo / Anki)**: Automated revision scheduling (`1d` ➔ `3d` ➔ `7d` ➔ `14d` ➔ `30d Mastered`) with interactive Flashcard Mode and confidence rating.
- **🌲 Sequential Unlock Curriculum (Practice Paths)**: Structured progression unlocking subsequent topics only after prerequisites are achieved.
- **🗺️ Interactive Career Roadmaps**: Milestone roadmaps for Java Backend, Python Systems, and Modern PHP Developers with interactive AI concept quizzes.
- **💻 Monaco Code Editor**: High-performance editor with local execution (`javac`/`java`, `python3`, `php`), real test-case runners, hints, optimal solutions diff viewer, and persistent notes.
- **📊 Analytics & Gamification**: Streak flames, XP points, Level up progression, Topic Radar mastery charts, and 30-day consistency heatmaps.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js 18+
- Java SDK (`javac` & `java`)
- Python 3 (`python3`)
- PHP CLI (`php`)

### 2. Start the Development Server
From the root project directory, run:

```bash
npm run dev
```

This starts both:
- **Backend API**: `http://localhost:3001`
- **Frontend SPA**: `http://localhost:5173`

Open `http://localhost:5173` in your browser to begin practicing!

---

## 📁 Project Architecture

```plaintext
coding-gym/
├── package.json                   # Root workspace orchestrator
├── PROJECT_BLUEPRINT.md           # Comprehensive architectural blueprint
├── README.md                      # Quickstart and overview guide
├── server/
│   ├── data/
│   │   └── coding_gym.db          # Local SQLite Database (all progress, submissions, questions)
│   ├── src/
│   │   ├── index.js               # Express API entry point (port 3001)
│   │   ├── db/                    # SQLite initialization & 300 unique questions generator
│   │   ├── routes/                # problems, execute, submissions, revision, progress, paths, roadmaps, planner, ai
│   │   └── services/              # codeRunner.js, revisionEngine.js, aiService.js (LangChain Gemini Auto-Failover)
└── client/
    ├── src/
    │   ├── App.tsx                # URL hash router & global state orchestrator
    │   ├── api/                   # Typed API client for all backend endpoints
    │   ├── components/            # MonacoPlayground, AIAssistant, FormattedText, Navbar, StreakTracker, TopicRadar, XPModal
    │   └── pages/                 # Dashboard, PracticePaths, ProblemsList, ProblemDetail, RevisionQueue, RoadmapsView, WeeklyPlanner, Analytics
```

---

## 🛠️ Offline Database Management

- To re-seed the SQLite database with fresh questions:
```bash
npm run seed
```
- Database data persists in `server/data/coding_gym.db`.
