/* ================================================================
   Ovai — Netlify Serverless Function
   File: netlify/functions/convert.js

   This function proxies requests from the browser to the
   Anthropic Claude API. The API key is stored as a Netlify
   environment variable (ANTHROPIC_API_KEY) and is never
   exposed to the client.
================================================================ */

exports.handler = async function (event, context) {

  /* ── Only allow POST ── */
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  /* ── CORS headers (allow your Netlify domain) ── */
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  /* ── Handle CORS preflight ── */
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  /* ── Parse request body ── */
  let text, mode;
  try {
    const body = JSON.parse(event.body);
    text = body.text;
    mode = body.mode;
    if (!text || !mode) throw new Error('Missing text or mode');
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request body: ' + err.message })
    };
  }

  /* ── Check API key is set ── */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error: API key not set.' })
    };
  }

  /* ── System prompts ── */
  const systemPrompts = {

    quiz: `You are a precise equation-to-LaTeX converter and Moodle GIFT formatter.
The user will provide text containing multiple-choice quiz questions with equations written in plain text or Word equation format.

Your task:
1. Convert EVERY equation (in stems and all options) to LaTeX code.
2. Wrap each equation with \\( at the start and \\) at the end (with a space inside each delimiter).
3. Format the entire output as valid Moodle GIFT format.
4. Preserve all question text, option letters, and correct answer markers exactly.
5. Mark correct answers with = and wrong answers with ~ in GIFT format.
6. Add a brief feedback comment for each correct answer using #.

Output ONLY the raw GIFT text. No explanation, no markdown fences, no code blocks.`,

    content: `You are a precise equation-to-LaTeX converter.
The user will provide text extracted from a document containing educational content with equations written in plain text or Word equation format.

Your task:
1. Identify EVERY equation, formula, or mathematical expression.
2. Convert each one to correct LaTeX code.
3. Wrap each with \\( at the start and \\) at the end (with a space inside each delimiter).
   Example: \\( \\bar{x} = \\frac{\\sum fx}{\\sum f} \\)
4. Preserve ALL other text — headings, bullet points, explanations, examples, exercise labels — EXACTLY as written. Do not add, remove, or rephrase any non-equation text.
5. Preserve the document structure: paragraphs, lists, sections.

Output ONLY the converted text. No explanation, no markdown fences, no code blocks.`
  };

  const systemPrompt = systemPrompts[mode];
  if (!systemPrompt) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid mode. Use "content" or "quiz".' })
    };
  }

  /* ── Call Anthropic API ── */
  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 8000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: text }]
      })
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.json().catch(() => ({}));
      throw new Error(errBody.error?.message || 'Anthropic API error ' + anthropicResponse.status);
    }

    const data = await anthropicResponse.json();
    const result = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result })
    };

  } catch (err) {
    console.error('Conversion error:', err.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: 'Conversion failed: ' + err.message })
    };
  }
};
