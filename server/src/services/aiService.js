require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// High-speed fallback model chain (Ordered from fastest lite models to deep reasoning models)
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview',
  'gemini-pro-latest'
];

// In-memory cache for instant 0ms responses on repeated views
const explanationCache = new Map();
const edgeCaseCache = new Map();

/**
 * Resilient multi-model invocation engine
 * Automatically tries next model in the fallback chain if current is rate-limited or fails
 */
async function invokeWithAutoFailover(messages, temperature = 0.2) {
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: GEMINI_API_KEY,
        temperature: temperature,
        maxRetries: 1,
      });

      const response = await model.invoke(messages);
      if (response && response.content) {
        return {
          content: response.content,
          modelUsed: modelName,
        };
      }
    } catch (err) {
      console.warn(`[AI Failover] Model ${modelName} failed (${err.message.slice(0, 80)}). Switching to next candidate...`);
      lastError = err;
    }
  }

  throw new Error(`All available AI models failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

/**
 * High-speed Problem Explainer: Explains WHAT the problem is asking clearly with visual analogies.
 * DOES NOT spoil the full code solution. Focuses on conceptual clarity and problem understanding.
 */
async function explainProblemLogic(problem) {
  const cacheKey = `explain_${problem.id}`;
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey);
  }

  const systemPrompt = `You are a friendly coding mentor helping someone who is building their logical problem-solving skills.
Your job is to EXPLAIN THE PROBLEM ITSELF in crystal-clear, simple, non-academic words.
DO NOT provide the full solution code. DO NOT jump straight to complex DSA jargon.
Format cleanly in markdown with section headers. Use plain O(N) notation without LaTeX math symbols.`;

  const userPrompt = `Problem Title: ${problem.title}
Difficulty: ${problem.difficulty}
Topic: ${problem.topic}
Language: ${problem.language}
Problem Statement:
${problem.description}

Please explain the problem clearly following this exact structure:

### 🎯 1. What is this Problem Asking? (In Simple Words)
• Explain the goal of the problem in simple, everyday language as if explaining to a beginner.
• Use a relatable real-world analogy.
• Clarify what the input parameters mean.

### 🔍 2. Step-by-Step Visual Example
• Pick a concrete sample array (e.g. 4 numbers like [2, 7, 11, 15] or [1, 5, 8, 14]).
• Walk through the numbers step by step showing how the positions (indices 0, 1, 2...) relate to the values.
• Show clearly why the expected output was chosen.

### 🧠 3. How to Think About the Logic (Mental Clues - No Code Spoilers)
• Provide 2-3 logical thinking questions or mental steps the student should consider to construct their algorithm.

### ⚠️ 4. Common Traps & Edge Cases to Watch Out For
• What mistakes do beginners usually make (e.g. 0-based vs 1-based indexing, using same item twice, negatives, empty inputs)?`;

  const res = await invokeWithAutoFailover([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ], 0.2);

  explanationCache.set(cacheKey, res.content);
  return res.content;
}

/**
 * Fast Code Logic & Bug Checker
 */
async function checkCodeLogic(problem, code, language) {
  const systemPrompt = `You are an expert pair programmer. Review the user's code draft for logical errors, boundary edge cases, and off-by-one mistakes. Be constructive, encouraging, and provide hints rather than just rewriting everything.`;

  const userPrompt = `Problem: ${problem.title} (${problem.difficulty})
Language: ${language}
Problem Statement: ${problem.description}

User's Code:
\`\`\`${language}
${code}
\`\`\`

Review format:
### 🧐 Logic Assessment
(Does this logic correctly solve the problem?)

### 🐛 Potential Bugs or Edge Case Flaws
(Are there issues with bounds, empty inputs, negatives, or index matching?)

### 💡 Recommendation & Next Step
(Actionable guidance to fix the code)`;

  const res = await invokeWithAutoFailover([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ], 0.2);

  return res.content;
}

/**
 * AI Doubt Chat Helper
 */
async function chatAboutProblem(problem, code, language, chatHistory) {
  const systemPrompt = `You are a patient and clear programming coach. The user has doubts about the problem "${problem.title}".
Explain intuitively in plain English. Guide their thinking step-by-step. Avoid unformatted LaTeX or overly academic jargon.`;

  const messages = [
    new SystemMessage(systemPrompt),
    ...chatHistory.map((m) =>
      m.role === 'user' ? new HumanMessage(m.content) : new HumanMessage(m.content)
    ),
  ];

  const res = await invokeWithAutoFailover(messages, 0.3);
  return res.content;
}

/**
 * AI Edge Case Generator
 */
async function generateEdgeCases(problem) {
  const cacheKey = `edge_${problem.id}`;
  if (edgeCaseCache.has(cacheKey)) {
    return edgeCaseCache.get(cacheKey);
  }

  const systemPrompt = `You are a QA Engineer. Return a strict JSON array of 3 tricky edge cases for "${problem.title}".
Format: [{"input": "...", "expected_output": "...", "description": "..."}]
Return ONLY the raw JSON array without markdown formatting.`;

  const userPrompt = `Problem: ${problem.title}\nDescription: ${problem.description}`;

  const res = await invokeWithAutoFailover([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ], 0.1);

  try {
    let clean = res.content.trim();
    if (clean.startsWith('```json')) clean = clean.replace(/```json/g, '').replace(/```/g, '').trim();
    else if (clean.startsWith('```')) clean = clean.replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    edgeCaseCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    return [
      { input: "1\n0\n0", expected_output: "[]", description: "Single element array boundary" },
      { input: "2\n-5 5\n0", expected_output: "[0, 1]", description: "Negative and positive numbers summing to zero" },
      { input: "4\n10 20 30 40\n100", expected_output: "[]", description: "Target sum that cannot be formed" }
    ];
  }
}

module.exports = {
  explainProblemLogic,
  checkCodeLogic,
  chatAboutProblem,
  generateEdgeCases,
};
