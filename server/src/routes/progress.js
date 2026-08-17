const express = require('express');
const router = express.Router();
const db = require('../db');

// Full Progress & Statistics Dashboard Data
router.get('/stats', (req, res) => {
  try {
    const profile = db.prepare("SELECT * FROM user_profile WHERE id = 'me'").get() || {
      xp: 0, level: 1, streak_days: 0, last_active_date: null,
      daily_goal_problems: 3, daily_goal_minutes: 30
    };

    // Solved by language
    const langStats = db.prepare(`
      SELECT 
        p.language,
        COUNT(p.id) as total,
        SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) as solved,
        SUM(CASE WHEN up.status = 'attempted' THEN 1 ELSE 0 END) as attempted
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      GROUP BY p.language
    `).all();

    // Solved by difficulty
    const diffStats = db.prepare(`
      SELECT 
        p.difficulty,
        COUNT(p.id) as total,
        SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) as solved
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      GROUP BY p.difficulty
    `).all();

    // Solved by level
    const levelStats = db.prepare(`
      SELECT 
        p.level,
        COUNT(p.id) as total,
        SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) as solved
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      GROUP BY p.level
    `).all();

    // Today's Stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = db.prepare("SELECT * FROM daily_stats WHERE date = ?").get(today) || {
      date: today, problems_solved: 0, practice_seconds: 0, xp_earned: 0
    };

    // Last 30 days activity
    const activityHistory = db.prepare(`
      SELECT date, problems_solved, practice_seconds, xp_earned
      FROM daily_stats
      ORDER BY date DESC
      LIMIT 30
    `).all();

    // Topic mastery scores (for Radar chart / analytics)
    const topicMastery = db.prepare(`
      SELECT 
        p.topic,
        COUNT(p.id) as total,
        SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) as solved,
        ROUND((CAST(SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(p.id)) * 100, 1) as mastery_pct
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      GROUP BY p.topic
      HAVING total >= 5
      ORDER BY mastery_pct ASC
    `).all();

    // Last worked problem (quick resume)
    const lastProblem = db.prepare(`
      SELECT 
        p.id, p.title, p.language, p.difficulty, p.topic, up.status, up.last_attempted_at
      FROM user_progress up
      JOIN problems p ON up.problem_id = p.id
      ORDER BY up.last_attempted_at DESC
      LIMIT 1
    `).get();

    // Overall summary counts
    const totalCount = db.prepare("SELECT COUNT(*) as c FROM problems").get().c;
    const solvedCount = db.prepare("SELECT COUNT(*) as c FROM user_progress WHERE status = 'solved'").get().c;
    const totalPracticeSecs = db.prepare("SELECT COALESCE(SUM(time_spent_seconds), 0) as s FROM user_progress").get().s;

    res.json({
      success: true,
      data: {
        profile,
        overall: {
          totalProblems: totalCount,
          solvedProblems: solvedCount,
          completionPct: Math.round((solvedCount / (totalCount || 1)) * 100),
          totalPracticeSeconds: totalPracticeSecs
        },
        today: todayStats,
        byLanguage: langStats,
        byDifficulty: diffStats,
        byLevel: levelStats,
        activityHistory,
        topicMastery,
        lastWorkedProblem: lastProblem || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update daily goals
router.put('/goal', (req, res) => {
  try {
    const { daily_goal_problems, daily_goal_minutes } = req.body;
    db.prepare(`
      UPDATE user_profile
      SET daily_goal_problems = COALESCE(?, daily_goal_problems),
          daily_goal_minutes = COALESCE(?, daily_goal_minutes)
      WHERE id = 'me'
    `).run(daily_goal_problems, daily_goal_minutes);

    res.json({ success: true, message: 'Goal updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-save draft code and user notes
router.post('/save-draft', (req, res) => {
  try {
    const { problemId, code, notes } = req.body;
    if (!problemId) {
      return res.status(400).json({ success: false, error: 'problemId is required' });
    }

    db.prepare(`
      INSERT INTO user_progress (problem_id, draft_code, notes, last_attempted_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(problem_id) DO UPDATE SET
        draft_code = COALESCE(?, user_progress.draft_code),
        notes = COALESCE(?, user_progress.notes),
        last_attempted_at = CURRENT_TIMESTAMP
    `).run(problemId, code, notes, code, notes);

    res.json({ success: true, message: 'Draft saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Practice Heartbeat (tracks practice timer seconds)
router.post('/heartbeat', (req, res) => {
  try {
    const { problemId, seconds = 10 } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (problemId) {
      db.prepare(`
        UPDATE user_progress
        SET time_spent_seconds = time_spent_seconds + ?
        WHERE problem_id = ?
      `).run(Number(seconds), problemId);
    }

    db.prepare(`
      INSERT INTO daily_stats (date, practice_seconds)
      VALUES (?, ?)
      ON CONFLICT(date) DO UPDATE SET
        practice_seconds = daily_stats.practice_seconds + ?
    `).run(today, Number(seconds), Number(seconds));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle or set solved status directly
router.post('/status', (req, res) => {
  try {
    const { problemId, status } = req.body;
    if (!problemId || !['solved', 'unsolved', 'attempted'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid problemId and status are required' });
    }
    const isSolved = status === 'solved';
    db.prepare(`
      INSERT INTO user_progress (problem_id, status, last_attempted_at, solved_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(problem_id) DO UPDATE SET
        status = excluded.status,
        last_attempted_at = CURRENT_TIMESTAMP,
        solved_at = CASE WHEN ? = 1 THEN COALESCE(user_progress.solved_at, CURRENT_TIMESTAMP) ELSE NULL END
    `).run(problemId, status, isSolved ? new Date().toISOString() : null, isSolved ? 1 : 0);

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
