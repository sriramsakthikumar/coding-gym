const express = require('express');
const router = express.Router();
const db = require('../db');
const { runCode, evaluateProblem } = require('../services/codeRunner');
const { recordProblemOutcome } = require('../services/revisionEngine');
const { v4: uuidv4 } = require('uuid');

// Quick Run (Custom Test / Scratchpad execution)
router.post('/run', async (req, res) => {
  try {
    const { language, code, input = '' } = req.body;
    if (!language || !code) {
      return res.status(400).json({ success: false, error: 'Language and code are required' });
    }

    const result = await runCode(language, code, input);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Full Evaluation & Submission against test cases
router.post('/submit', async (req, res) => {
  try {
    const { problemId, language, code, isStruggled = false } = req.body;

    if (!problemId || !language || !code) {
      return res.status(400).json({ success: false, error: 'problemId, language, and code are required' });
    }

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    let testCases = [];
    try {
      testCases = JSON.parse(problem.test_cases);
    } catch (e) {
      testCases = [];
    }

    // Run evaluation against all test cases
    const evalResult = await evaluateProblem(language, code, testCases);
    const isPassed = evalResult.allPassed;
    const submissionStatus = isPassed ? 'accepted' : (evalResult.results.some(r => r.error) ? 'runtime_error' : 'wrong_answer');

    // Fetch existing user progress
    const prevProgress = db.prepare('SELECT * FROM user_progress WHERE problem_id = ?').get(problemId);
    const wasAlreadySolved = prevProgress && prevProgress.status === 'solved';

    // Calculate XP
    let xpEarned = 0;
    if (isPassed) {
      if (!wasAlreadySolved) {
        if (problem.difficulty === 'Easy') xpEarned = 25;
        else if (problem.difficulty === 'Medium') xpEarned = 50;
        else xpEarned = 100;
      } else {
        xpEarned = 10; // Practice bonus for re-solving
      }
    }

    // Insert submission log
    const submissionId = `sub_${uuidv4()}`;
    const outputSummary = JSON.stringify(evalResult.results);
    const primaryError = evalResult.results.find(r => r.error)?.error || null;

    db.prepare(`
      INSERT INTO submissions (id, problem_id, language, code, status, output, error, execution_time_ms, xp_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submissionId, problemId, language, code, submissionStatus,
      outputSummary, primaryError, evalResult.totalTimeMs, xpEarned
    );

    // Update user_progress
    const newStatus = isPassed ? 'solved' : (wasAlreadySolved ? 'solved' : 'attempted');
    db.prepare(`
      INSERT INTO user_progress (
        problem_id, status, draft_code, attempts_count, success_count, fail_count,
        last_attempted_at, solved_at
      ) VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(problem_id) DO UPDATE SET
        status = excluded.status,
        draft_code = excluded.draft_code,
        attempts_count = user_progress.attempts_count + 1,
        success_count = user_progress.success_count + (CASE WHEN ? = 1 THEN 1 ELSE 0 END),
        fail_count = user_progress.fail_count + (CASE WHEN ? = 0 THEN 1 ELSE 0 END),
        last_attempted_at = CURRENT_TIMESTAMP,
        solved_at = COALESCE(user_progress.solved_at, excluded.solved_at)
    `).run(
      problemId, newStatus, code,
      isPassed ? 1 : 0, isPassed ? 0 : 1,
      isPassed ? new Date().toISOString() : null,
      isPassed ? 1 : 0, isPassed ? 1 : 0
    );

    // Update Daily Stats & User Profile Streak / XP
    const today = new Date().toISOString().split('T')[0];
    const userProfile = db.prepare("SELECT * FROM user_profile WHERE id = 'me'").get() || {
      xp: 0, level: 1, streak_days: 0, last_active_date: null
    };

    let streakDays = userProfile.streak_days;
    const lastActive = userProfile.last_active_date;

    if (!lastActive) {
      streakDays = 1;
    } else if (lastActive !== today) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streakDays += 1;
      } else if (diffDays > 1) {
        streakDays = 1;
      }
    }

    const totalXp = (userProfile.xp || 0) + xpEarned;
    const newLevel = Math.floor(totalXp / 100) + 1;

    db.prepare(`
      UPDATE user_profile
      SET xp = ?, level = ?, streak_days = ?, last_active_date = ?
      WHERE id = 'me'
    `).run(totalXp, newLevel, streakDays, today);

    // Update daily stats
    db.prepare(`
      INSERT INTO daily_stats (date, problems_solved, xp_earned)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        problems_solved = daily_stats.problems_solved + (CASE WHEN ? = 1 AND ? = 0 THEN 1 ELSE 0 END),
        xp_earned = daily_stats.xp_earned + ?
    `).run(
      today, isPassed && !wasAlreadySolved ? 1 : 0, xpEarned,
      isPassed ? 1 : 0, wasAlreadySolved ? 1 : 0, xpEarned
    );

    // Update Spaced Repetition queue
    recordProblemOutcome(problemId, isPassed, isStruggled);

    res.json({
      success: true,
      data: {
        submissionId,
        status: submissionStatus,
        isPassed,
        xpEarned,
        totalXp,
        level: newLevel,
        streakDays,
        evalResult
      }
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
