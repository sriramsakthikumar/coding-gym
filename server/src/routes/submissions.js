const express = require('express');
const router = express.Router();
const db = require('../db');

// Get submissions for a specific problem
router.get('/problem/:problemId', (req, res) => {
  try {
    const { problemId } = req.params;
    const submissions = db.prepare(`
      SELECT * FROM submissions
      WHERE problem_id = ?
      ORDER BY submitted_at DESC
      LIMIT 20
    `).all(problemId);

    const parsed = submissions.map(sub => {
      let output = [];
      try {
        output = JSON.parse(sub.output);
      } catch (e) {
        output = sub.output;
      }
      return { ...sub, output };
    });

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get recent global submissions
router.get('/recent', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT 
        s.*,
        p.title, p.difficulty, p.topic
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      ORDER BY s.submitted_at DESC
      LIMIT 15
    `).all();

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
