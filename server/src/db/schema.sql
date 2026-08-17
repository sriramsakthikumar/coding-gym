-- Coding Gym SQLite Database Schema

CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    language TEXT NOT NULL,          -- 'java', 'python', 'php'
    level TEXT NOT NULL,             -- 'fundamentals', 'intermediate', 'advanced'
    topic TEXT NOT NULL,             -- e.g. 'Variables', 'OOP', 'Collections', 'Algorithms'
    difficulty TEXT NOT NULL,        -- 'Easy', 'Medium', 'Hard'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    solution_code TEXT NOT NULL,
    examples TEXT NOT NULL,          -- JSON string of [{input, output, explanation}]
    test_cases TEXT NOT NULL,        -- JSON string of [{input, expected_output, is_hidden}]
    hints TEXT NOT NULL,             -- JSON string of string[]
    explanation TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
    problem_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'unsolved',  -- 'unsolved', 'attempted', 'solved'
    draft_code TEXT,
    notes TEXT,
    attempts_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    last_attempted_at DATETIME,
    solved_at DATETIME,
    time_spent_seconds INTEGER DEFAULT 0,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,            -- 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded'
    output TEXT,
    error TEXT,
    execution_time_ms INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS revision_items (
    id TEXT PRIMARY KEY,
    problem_id TEXT UNIQUE NOT NULL,
    interval_stage INTEGER DEFAULT 0, -- 0 (1d), 1 (3d), 2 (7d), 3 (14d), 4 (mastered)
    next_review_at DATETIME NOT NULL,
    last_reviewed_at DATETIME,
    reviews_count INTEGER DEFAULT 0,
    lapses_count INTEGER DEFAULT 0,
    is_struggled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,           -- YYYY-MM-DD
    problems_solved INTEGER DEFAULT 0,
    practice_seconds INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    topics_touched TEXT DEFAULT '[]' -- JSON array
);

CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY DEFAULT 'me',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_active_date TEXT,
    daily_goal_problems INTEGER DEFAULT 3,
    daily_goal_minutes INTEGER DEFAULT 30
);

CREATE TABLE IF NOT EXISTS weekly_plans (
    id TEXT PRIMARY KEY,
    week_start_date TEXT UNIQUE NOT NULL,
    plan_data TEXT NOT NULL,         -- JSON of schedule
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problems_lang_topic ON problems(language, topic);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_revision_next_review ON revision_items(next_review_at);
