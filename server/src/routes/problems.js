const express = require('express');
const router = express.Router();
const db = require('../db');

// List problems with rich filtering & progress stats
router.get('/', (req, res) => {
  try {
    const { language, level, topic, difficulty, status, search, limit = 300, offset = 0 } = req.query;

    let query = `
      SELECT 
        p.id, p.language, p.level, p.topic, p.difficulty, p.title, p.order_index,
        up.status as user_status,
        up.attempts_count,
        up.success_count,
        up.time_spent_seconds,
        up.last_attempted_at,
        up.solved_at,
        r.interval_stage as revision_stage,
        r.next_review_at as revision_next_review
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      LEFT JOIN revision_items r ON p.id = r.problem_id
      WHERE 1=1
    `;

    const params = [];

    if (language) {
      query += ` AND p.language = ?`;
      params.push(language);
    }
    if (level) {
      query += ` AND p.level = ?`;
      params.push(level);
    }
    if (topic) {
      query += ` AND p.topic = ?`;
      params.push(topic);
    }
    if (difficulty) {
      query += ` AND p.difficulty = ?`;
      params.push(difficulty);
    }
    if (status) {
      if (status === 'unsolved') {
        query += ` AND (up.status = 'unsolved' OR up.status IS NULL)`;
      } else {
        query += ` AND up.status = ?`;
        params.push(status);
      }
    }
    if (search) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.topic LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.language ASC, p.order_index ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const problems = db.prepare(query).all(...params);
    res.json({ success: true, count: problems.length, data: problems });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get topics breakdown
router.get('/topics', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.language,
        p.topic,
        p.level,
        COUNT(p.id) as total_problems,
        SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) as solved_count
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      GROUP BY p.language, p.topic, p.level
      ORDER BY p.language, p.level, p.topic
    `).all();

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single problem by ID with user draft & revision state
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const problem = db.prepare(`
      SELECT 
        p.*,
        up.status as user_status,
        up.draft_code,
        up.notes,
        up.attempts_count,
        up.success_count,
        up.fail_count,
        up.time_spent_seconds,
        up.last_attempted_at,
        up.solved_at,
        r.interval_stage as revision_stage,
        r.next_review_at as revision_next_review,
        r.is_struggled as revision_struggled
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      LEFT JOIN revision_items r ON p.id = r.problem_id
      WHERE p.id = ?
    `).get(id);

    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    // Parse JSON fields
    try {
      problem.examples = JSON.parse(problem.examples);
    } catch (e) {
      problem.examples = [];
    }

    try {
      problem.test_cases = JSON.parse(problem.test_cases);
    } catch (e) {
      problem.test_cases = [];
    }

    try {
      problem.hints = JSON.parse(problem.hints);
    } catch (e) {
      problem.hints = [];
    }

    // Default draft code to starter code if not set
    if (!problem.draft_code) {
      problem.draft_code = problem.starter_code;
    }

    res.json({ success: true, data: problem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
