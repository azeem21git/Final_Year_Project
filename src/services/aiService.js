// Gemini AI Service for code suggestions

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAbab2538kL2iyLo_8vgyZhRBYwjOc1KaM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function parseResponseText(data) {
  // Support multiple possible response shapes returned by Gemini APIs
  try {
    // v1beta `candidates[0].content.parts[0].text`
    const v1 = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (v1) return v1;

    // Alternative shape: `output[0].content[0].text`
    const alt = data?.output?.[0]?.content?.[0]?.text;
    if (alt) return alt;

    // Older shape: `candidates[0].output_text`
    const old = data?.candidates?.[0]?.output_text;
    if (old) return old;

    // Fallback: serialize message field
    if (typeof data === 'string') return data;
    return null;
  } catch (e) {
    console.error('[AI] Failed to parse response:', e);
    return null;
  }
}

async function safeFetch(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  return { ok: res.ok, status: res.status, data: json };
}

export const aiService = {
  /**
   * Get code suggestions from Gemini AI
   * @param {string} code - Current code content
   * @param {string} language - Programming language
   * @param {number} lineNumber - Current line number
   * @param {string} context - Additional context for better suggestions
   * @returns {Promise<string>} - AI-generated code suggestion
   */
  async getCodeSuggestion(code, language, lineNumber, context = '') {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return null;
    }

    try {
      const prompt = `You are an expert ${language} programmer.\n\nCurrent code (line ${lineNumber}):\n\`\`\`${language}\n${code}\n\`\`\`\n\n${context ? `Context: ${context}` : ''}\n\nProvide a brief, single-line code suggestion to complete or improve the code at line ${lineNumber}. Only return the suggestion code without explanations or markdown formatting.`;

      const body = {
        contents: [
          { parts: [ { text: prompt } ] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        }
      };

      const { ok, status, data } = await safeFetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!ok) {
        console.error('[AI] Gemini API error', status, data);
        return null;
      }

      const suggestion = parseResponseText(data);
      if (suggestion) return suggestion.trim();
      console.debug('[AI] No suggestion text in response', data);
      return null;
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      return null;
    }
  },

  /**
   * Get code explanation from Gemini AI
   * @param {string} code - Code to explain
   * @param {string} language - Programming language
   * @returns {Promise<string>} - Code explanation
   */
  async explainCode(code, language) {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return null;
    }

    try {
      const prompt = `Explain this ${language} code briefly in 2-3 sentences:
\`\`\`${language}
${code}
\`\`\`

Be concise and focus on what the code does.`;

      const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 300 } };
      const { ok, status, data } = await safeFetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!ok) { console.error('[AI] Gemini API error', status, data); return null; }
      const explanation = parseResponseText(data);
      return explanation ? explanation.trim() : null;
    } catch (error) {
      console.error('Error explaining code:', error);
      return null;
    }
  },

  /**
   * Get code optimization suggestions
   * @param {string} code - Code to optimize
   * @param {string} language - Programming language
   * @returns {Promise<string>} - Optimization suggestions
   */
  async optimizeCode(code, language) {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return null;
    }

    try {
      const prompt = `Suggest optimizations for this ${language} code. Focus on performance and readability:
\`\`\`${language}
${code}
\`\`\`

Provide 2-3 specific suggestions with brief explanations.`;

      const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 400 } };
      const { ok, status, data } = await safeFetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!ok) { console.error('[AI] Gemini API error', status, data); return null; }
      const suggestions = parseResponseText(data);
      return suggestions ? suggestions.trim() : null;
    } catch (error) {
      console.error('Error optimizing code:', error);
      return null;
    }
  },

  /**
   * Debug code issues
   * @param {string} code - Code to debug
   * @param {string} language - Programming language
   * @param {string} errorMessage - Error message if available
   * @returns {Promise<string>} - Debug suggestions
   */
  async debugCode(code, language, errorMessage = '') {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return null;
    }

    try {
      const errorContext = errorMessage ? `Error: ${errorMessage}\n` : '';
      const prompt = `Help debug this ${language} code:
${errorContext}
\`\`\`${language}
${code}
\`\`\`

Identify potential issues and suggest fixes.`;

      const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 500 } };
      const { ok, status, data } = await safeFetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!ok) { console.error('[AI] Gemini API error', status, data); return null; }
      const debugSuggestions = parseResponseText(data);
      return debugSuggestions ? debugSuggestions.trim() : null;
    } catch (error) {
      console.error('Error debugging code:', error);
      return null;
    }
  },
};
