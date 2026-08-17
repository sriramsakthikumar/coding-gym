const express = require('express');
const router = express.Router();
const db = require('../db');
const {
  explainProblemLogic,
  checkCodeLogic,
  chatAboutProblem,
  generateEdgeTestCases
} = require('../services/aiService');

// Helper to get problem with parsed fields
function getProblem(problemId) {
  const p = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
  if (!p) return null;
  try { p.examples = JSON.parse(p.examples); } catch (e) { p.examples = []; }
  try { p.test_cases = JSON.parse(p.test_cases); } catch (e) { p.test_cases = []; }
  return p;
}

// 1. AI Explain Problem Logic
router.post('/explain', async (req, res) => {
  try {
    const { problemId } = req.body;
    if (!problemId) {
      return res.status(400).json({ success: false, error: 'problemId is required' });
    }

    const problem = getProblem(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    const explanation = await explainProblemLogic(problem);
    res.json({ success: true, data: { explanation } });
  } catch (err) {
    console.error('AI Explain error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI Explain failed' });
  }
});

// 2. AI Check Code Logic & Find Bugs
router.post('/check-code', async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code) {
      return res.status(400).json({ success: false, error: 'problemId and code are required' });
    }

    const problem = getProblem(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    const review = await checkCodeLogic(problem, code, language || problem.language);
    res.json({ success: true, data: { review } });
  } catch (err) {
    console.error('AI Check error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI Code check failed' });
  }
});

// 3. AI Interactive Doubt Resolver / Chat
router.post('/chat', async (req, res) => {
  try {
    const { problemId, code, language, messages = [] } = req.body;
    if (!problemId || !messages || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'problemId and messages are required' });
    }

    const problem = getProblem(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    const reply = await chatAboutProblem(problem, code, language || problem.language, messages);
    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('AI Chat error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI Chat failed' });
  }
});

// 4. AI Generate Edge Test Cases
router.post('/edge-cases', async (req, res) => {
  try {
    const { problemId } = req.body;
    const problem = getProblem(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    const testCases = await generateEdgeTestCases(problem);
    res.json({ success: true, data: { testCases } });
  } catch (err) {
    console.error('AI Edge Cases error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate test cases' });
  }
});

module.exports = router;
