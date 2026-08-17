const express = require('express');
const router = express.Router();
const db = require('../db');
const { getRevisionQueue, processReview, recordProblemOutcome } = require('../services/revisionEngine');

// Get all items in spaced repetition queue
router.get('/queue', (req, res) => {
  try {
    const queue = getRevisionQueue();
    
    const overdue = queue.filter(q => q.queue_status === 'overdue');
    const dueToday = queue.filter(q => q.queue_status === 'due_today');
    const upcoming = queue.filter(q => q.queue_status === 'upcoming');
    const mastered = queue.filter(q => q.queue_status === 'mastered');

    res.json({
      success: true,
      data: {
        summary: {
          total: queue.length,
          overdueCount: overdue.length,
          dueTodayCount: dueToday.length,
          upcomingCount: upcoming.length,
          masteredCount: mastered.length
        },
        overdue,
        dueToday,
        upcoming,
        mastered,
        all: queue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Flashcard / Spaced Repetition confidence rating
router.post('/review/:problemId', (req, res) => {
  try {
    const { problemId } = req.params;
    const { rating } = req.body; // 'again', 'hard', 'good', 'easy'

    if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
      return res.status(400).json({ success: false, error: 'Invalid rating. Expected again, hard, good, or easy' });
    }

    const result = processReview(problemId, rating);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manually add or toggle problem into revision queue
router.post('/toggle-flag/:problemId', (req, res) => {
  try {
    const { problemId } = req.params;
    const { isStruggled } = req.body;

    recordProblemOutcome(problemId, false, isStruggled ?? true);
    res.json({ success: true, message: 'Revision status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
