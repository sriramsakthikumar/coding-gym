const db = require('../db');

const INTERVAL_DAYS = [1, 3, 7, 14, 30]; // Stage 0 to 4

function getNextDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Update or create spaced repetition item for a problem
 */
function recordProblemOutcome(problemId, wasSuccessful, isStruggled = false) {
  const existing = db.prepare('SELECT * FROM revision_items WHERE problem_id = ?').get(problemId);

  if (!existing) {
    // If not successful or struggled, schedule immediately in revision queue
    if (!wasSuccessful || isStruggled) {
      const nextReview = getNextDate(1);
      db.prepare(`
        INSERT INTO revision_items (id, problem_id, interval_stage, next_review_at, reviews_count, lapses_count, is_struggled)
        VALUES (?, ?, 0, ?, 1, 1, ?)
      `).run(`rev_${Date.now()}_${problemId}`, problemId, nextReview, isStruggled ? 1 : 0);
    }
    return;
  }

  let nextStage = existing.interval_stage;
  let lapses = existing.lapses_count;
  let reviews = existing.reviews_count + 1;

  if (wasSuccessful && !isStruggled) {
    nextStage = Math.min(existing.interval_stage + 1, 4);
  } else {
    // Reset to stage 0 on struggle or fail
    nextStage = 0;
    lapses += 1;
  }

  const days = INTERVAL_DAYS[nextStage] || 1;
  const nextReviewAt = getNextDate(days);

  db.prepare(`
    UPDATE revision_items
    SET interval_stage = ?,
        next_review_at = ?,
        last_reviewed_at = CURRENT_TIMESTAMP,
        reviews_count = ?,
        lapses_count = ?,
        is_struggled = ?
    WHERE problem_id = ?
  `).run(nextStage, nextReviewAt, reviews, lapses, isStruggled ? 1 : 0, problemId);
}

/**
 * Manually review / rate confidence for an item
 */
function processReview(problemId, confidenceRating) {
  // confidenceRating: 'again' (fail), 'hard' (struggled), 'good' (pass), 'easy' (boost)
  const existing = db.prepare('SELECT * FROM revision_items WHERE problem_id = ?').get(problemId);
  let stage = existing ? existing.interval_stage : 0;
  let lapses = existing ? existing.lapses_count : 0;
  let reviews = (existing ? existing.reviews_count : 0) + 1;
  let struggled = 0;

  if (confidenceRating === 'again') {
    stage = 0;
    lapses += 1;
    struggled = 1;
  } else if (confidenceRating === 'hard') {
    stage = Math.max(0, stage - 1);
    struggled = 1;
  } else if (confidenceRating === 'good') {
    stage = Math.min(stage + 1, 4);
  } else if (confidenceRating === 'easy') {
    stage = Math.min(stage + 2, 4);
  }

  const days = INTERVAL_DAYS[stage];
  const nextReviewAt = getNextDate(days);

  if (existing) {
    db.prepare(`
      UPDATE revision_items
      SET interval_stage = ?,
          next_review_at = ?,
          last_reviewed_at = CURRENT_TIMESTAMP,
          reviews_count = ?,
          lapses_count = ?,
          is_struggled = ?
      WHERE problem_id = ?
    `).run(stage, nextReviewAt, reviews, lapses, struggled, problemId);
  } else {
    db.prepare(`
      INSERT INTO revision_items (id, problem_id, interval_stage, next_review_at, last_reviewed_at, reviews_count, lapses_count, is_struggled)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1, ?, ?)
    `).run(`rev_${Date.now()}_${problemId}`, problemId, stage, nextReviewAt, lapses, struggled);
  }

  return { stage, nextReviewAt, days };
}

/**
 * Get formatted queue with status badges
 */
function getRevisionQueue() {
  const rows = db.prepare(`
    SELECT 
      r.*,
      p.title, p.language, p.difficulty, p.topic, p.level,
      up.status as user_status
    FROM revision_items r
    JOIN problems p ON r.problem_id = p.id
    LEFT JOIN user_progress up ON r.problem_id = up.problem_id
    ORDER BY r.next_review_at ASC
  `).all();

  const now = new Date();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return rows.map(item => {
    const reviewDate = new Date(item.next_review_at);
    let queueStatus = 'upcoming';

    if (reviewDate < now) {
      queueStatus = 'overdue';
    } else if (reviewDate <= todayEnd) {
      queueStatus = 'due_today';
    } else if (item.interval_stage >= 4) {
      queueStatus = 'mastered';
    }

    return {
      ...item,
      queue_status: queueStatus,
      interval_days: INTERVAL_DAYS[item.interval_stage] || 1
    };
  });
}

module.exports = {
  recordProblemOutcome,
  processReview,
  getRevisionQueue,
  INTERVAL_DAYS
};
