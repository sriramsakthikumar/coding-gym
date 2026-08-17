const express = require('express');
const router = express.Router();
const db = require('../db');

// Get structured learning path unlock tree for a language
router.get('/:language', (req, res) => {
  try {
    const { language } = req.params;
    const lang = language.toLowerCase();

    // Fetch all problems for this language with user progress
    const problems = db.prepare(`
      SELECT 
        p.id, p.language, p.level, p.topic, p.difficulty, p.title, p.order_index,
        up.status as user_status,
        up.attempts_count,
        up.success_count
      FROM problems p
      LEFT JOIN user_progress up ON p.id = up.problem_id
      WHERE p.language = ?
      ORDER BY p.order_index ASC
    `).all(lang);

    // Group by level and topic
    const levelsMap = {
      fundamentals: { name: 'Level 1: Fundamentals', level: 'fundamentals', topics: [] },
      intermediate: { name: 'Level 2: Intermediate', level: 'intermediate', topics: [] },
      advanced: { name: 'Level 3: Advanced', level: 'advanced', topics: [] }
    };

    // Extract ordered topics
    const topicOrder = [];
    problems.forEach(p => {
      if (!topicOrder.find(t => t.topic === p.topic && t.level === p.level)) {
        topicOrder.push({ topic: p.topic, level: p.level });
      }
    });

    let previousTopicSolvedRatio = 1.0; // First topic unlocked by default
    let previousLevelSolvedRatio = 1.0;

    const levels = ['fundamentals', 'intermediate', 'advanced'];

    const resultLevels = levels.map((lvlKey, lvlIdx) => {
      const lvlConfig = levelsMap[lvlKey];
      const levelProblems = problems.filter(p => p.level === lvlKey);
      const levelTopics = topicOrder.filter(t => t.level === lvlKey);

      let isLevelUnlocked = lvlIdx === 0 || previousLevelSolvedRatio >= 0.6;
      let totalLevelSolved = 0;

      const topicsWithUnlock = levelTopics.map((t, tIdx) => {
        const topicProblems = levelProblems.filter(p => p.topic === t.topic);
        const solvedInTopic = topicProblems.filter(p => p.user_status === 'solved').length;
        const topicTotal = topicProblems.length;
        const topicRatio = topicTotal > 0 ? (solvedInTopic / topicTotal) : 0;
        totalLevelSolved += solvedInTopic;

        const isUnlocked = isLevelUnlocked && (tIdx === 0 || previousTopicSolvedRatio >= 0.6);
        previousTopicSolvedRatio = topicRatio;

        return {
          topic: t.topic,
          isUnlocked,
          totalProblems: topicTotal,
          solvedProblems: solvedInTopic,
          completionPct: Math.round(topicRatio * 100),
          problems: topicProblems.map(p => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            status: p.user_status || 'unsolved'
          }))
        };
      });

      const levelTotal = levelProblems.length;
      const levelRatio = levelTotal > 0 ? (totalLevelSolved / levelTotal) : 0;
      previousLevelSolvedRatio = levelRatio;

      return {
        level: lvlKey,
        name: lvlConfig.name,
        isUnlocked: isLevelUnlocked,
        totalProblems: levelTotal,
        solvedProblems: totalLevelSolved,
        completionPct: Math.round(levelRatio * 100),
        topics: topicsWithUnlock
      };
    });

    res.json({
      success: true,
      data: {
        language: lang,
        levels: resultLevels
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
