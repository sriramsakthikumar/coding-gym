import type { Problem } from '../types';

const GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string) ||
  'AQ.Ab8RN6KpUn0vtVqtTujjFVey_yXExSno3XX7Wt4284mimjYoBQ';

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

async function queryGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }

  const payload: any = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API error ${response.status}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty response received from Gemini.');
  }

  return text;
}

export const geminiAI = {
  // 1. Plain-English Problem Intuition & Visual Breakdown
  explainProblem: async (problem: Problem): Promise<string> => {
    const prompt = `
You are a friendly, world-class coding coach.
Explain what this problem is asking in clear, plain-English without spoiling the complete solution code.

Problem Title: ${problem.title}
Language: ${problem.language}
Difficulty: ${problem.difficulty}
Topic: ${problem.topic}

Description:
${problem.description}

Formatting Guidelines:
1. **What is this asking in simple words?** (A crystal-clear, relatable 2-3 sentence overview).
2. **Visual Walkthrough / Step-by-Step Logic**: Use one concrete example to illustrate how to think about the steps.
3. **Core Concept & Intuition**: Explain the key idea (e.g. why ${problem.topic} is used) without writing the full code solution.
4. **Edge Cases to Watch Out For**: (e.g. empty arrays, negative numbers, single elements).
`;

    return queryGemini(
      prompt,
      'You are an expert algorithm coach. Give clear, motivating, and beautifully formatted markdown explanations.'
    );
  },

  // 2. Code Review, Bug Hunter, and Suggestions
  checkCode: async (problem: Problem, code: string, language: string): Promise<string> => {
    const prompt = `
You are a senior code reviewer and mentor.
Review the following user code for the problem "${problem.title}" (${problem.difficulty}).

Problem Description:
${problem.description}

User Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Provide a constructive, encouraging review formatted in markdown:
1. **Status & Logic Check**: Does the approach look sound?
2. **Potential Bugs / Edge Cases**: Are there any off-by-one errors, unhandled boundary cases, or null pointer issues?
3. **Time & Space Complexity**: Is this optimal? What is the Big-O runtime?
4. **Helpful Suggestion**: Give a gentle nudge/hint without dumping the entire solution.
`;

    return queryGemini(
      prompt,
      'You are a precise and encouraging code reviewer. Focus on actionable feedback and logic verification.'
    );
  },

  // 3. Interactive Multi-turn Chat Coach
  chat: async (
    problem: Problem,
    code: string,
    language: string,
    messages: { role: string; content: string }[]
  ): Promise<string> => {
    const systemPrompt = `
You are CodeGym AI Coach, a supportive coding mentor.
Current Problem: "${problem.title}" (${problem.difficulty} - ${problem.topic}).
Description: ${problem.description}
Current User Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Answer the user's questions clearly and concisely. If they are stuck, give them a progressive hint or guide their thinking with leading questions instead of writing the whole solution for them. Keep replies concise and formatted in clean markdown.
`;

    const chatHistoryText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${chatHistoryText}\n\nCoach:`;

    return queryGemini(prompt, systemPrompt);
  },

  // 4. Edge Cases Generator
  generateEdgeCases: async (
    problem: Problem
  ): Promise<{ input: string; expected_output: string; description: string }[]> => {
    const prompt = `
Generate 3 to 4 challenging boundary or edge cases for the following problem.

Problem: ${problem.title}
Description: ${problem.description}

Return ONLY valid JSON array with this exact format, with NO markdown backticks or extra text:
[
  {
    "input": "...",
    "expected_output": "...",
    "description": "Short explanation why this is a key edge case"
  }
]
`;

    try {
      const raw = await queryGemini(prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse Gemini edge cases JSON, using problem test cases fallback:', e);
    }

    return (problem.test_cases || []).map((tc, idx) => ({
      input: tc.input,
      expected_output: tc.expected_output,
      description: `Test Case #${idx + 1} (${tc.is_hidden ? 'Hidden boundary scenario' : 'Standard sample'})`,
    }));
  },
};
