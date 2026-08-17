const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function generateDynamicPlan(mode = 'combined') {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Combined mode language schedule: Mon=Java, Tue=Python, Wed=PHP, Thu=Java, Fri=Python, Sat=PHP, Sun=All
  const combinedLangSchedule = ['java', 'python', 'php', 'java', 'python', 'php', 'java'];

  const planDays = daysOfWeek.map((dayName, idx) => {
    let targetLang = mode;
    if (mode === 'combined') {
      targetLang = combinedLangSchedule[idx];
    }

    // Query topics for target language sorted by lowest mastery / uncompleted
    const topicStats = db.prepare(`
      SELECT 
        p.language,
        p.topic,
        COUNT(p.id) as total,
        SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) as solved,
        SUM(CASE WHEN up.status = 'attempted' THEN 1 ELSE 0 END) as attempted
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      WHERE p.language = ?
      GROUP BY p.language, p.topic
      ORDER BY (CAST(SUM(CASE WHEN up.status = 'solved' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(p.id)) ASC, total DESC
    `).all(targetLang);

    const topicItem = topicStats[idx % (topicStats.length || 1)] || {
      language: targetLang,
      topic: 'Arrays & Two Pointers'
    };

    // Find 2 recommended problems for this topic
    let problems = db.prepare(`
      SELECT p.id, p.title, p.language, p.difficulty, p.topic, up.status as user_status
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      WHERE p.language = ? AND p.topic = ? AND (up.status != 'solved' OR up.status IS NULL)
      ORDER BY p.order_index ASC
      LIMIT 2
    `).all(targetLang, topicItem.topic);

    if (problems.length < 2) {
      problems = db.prepare(`
        SELECT p.id, p.title, p.language, p.difficulty, p.topic, up.status as user_status
        FROM problems p
        LEFT JOIN user_progress up ON p.id = up.problem_id
        WHERE p.language = ? AND p.topic = ?
        ORDER BY p.order_index ASC
        LIMIT 2
      `).all(targetLang, topicItem.topic);
    }

    // If still empty, grab any 2 from target language
    if (problems.length === 0) {
      problems = db.prepare(`
        SELECT p.id, p.title, p.language, p.difficulty, p.topic, up.status as user_status
        FROM problems p
        LEFT JOIN user_progress up ON p.id = up.problem_id
        WHERE p.language = ?
        ORDER BY p.order_index ASC
        LIMIT 2
      `).all(targetLang);
    }

    const focusDescriptions = [
      `Master core logic and problem solving in ${targetLang.toUpperCase()} ${topicItem.topic}`,
      `Strengthen code fluency and avoid edge-case bugs in ${targetLang.toUpperCase()}`,
      `Deep dive and practice patterns in ${topicItem.topic}`,
      `Algorithmic efficiency and clean solutions in ${targetLang.toUpperCase()}`,
      `Sprint through revision and challenges in ${topicItem.topic}`,
      `Comprehensive review and timed coding in ${targetLang.toUpperCase()}`,
      `Weekly capstone and confidence check on ${topicItem.topic}`
    ];

    return {
      day: dayName,
      focusTopic: `${targetLang.toUpperCase()}: ${topicItem.topic}`,
      language: targetLang,
      topic: topicItem.topic,
      description: focusDescriptions[idx],
      targetMinutes: 30,
      targetProblems: 2,
      problems
    };
  });

  return planDays;
}

// 1. Get weekly plan by mode (combined | java | python | php)
router.get('/weekly', (req, res) => {
  try {
    const mode = (req.query.mode || 'combined').toLowerCase();
    const currentMonday = getMonday(new Date());
    const planKey = `${currentMonday}_${mode}`;

    let row = db.prepare('SELECT * FROM weekly_plans WHERE week_start_date = ?').get(planKey);

    if (!row) {
      const planData = generateDynamicPlan(mode);
      const id = `plan_${uuidv4()}`;
      db.prepare(`
        INSERT INTO weekly_plans (id, week_start_date, plan_data)
        VALUES (?, ?, ?)
      `).run(id, planKey, JSON.stringify(planData));

      return res.json({
        success: true,
        data: {
          id,
          mode,
          weekStartDate: currentMonday,
          days: planData
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: row.id,
        mode,
        weekStartDate: currentMonday,
        days: JSON.parse(row.plan_data)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Regenerate plan on demand for selected mode
router.post('/generate', (req, res) => {
  try {
    const { mode = 'combined' } = req.body;
    const currentMonday = getMonday(new Date());
    const planKey = `${currentMonday}_${mode.toLowerCase()}`;
    const planData = generateDynamicPlan(mode.toLowerCase());
    const id = `plan_${uuidv4()}`;

    db.prepare(`
      INSERT INTO weekly_plans (id, week_start_date, plan_data)
      VALUES (?, ?, ?)
      ON CONFLICT(week_start_date) DO UPDATE SET
        plan_data = excluded.plan_data
    `).run(id, planKey, JSON.stringify(planData));

    res.json({
      success: true,
      message: `Weekly plan generated for ${mode.toUpperCase()} mode!`,
      data: {
        id,
        mode,
        weekStartDate: currentMonday,
        days: planData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
