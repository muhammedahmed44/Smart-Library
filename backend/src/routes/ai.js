const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticate } = require('../middleware/auth');
const { sendError } = require('../utils/response');
const { getBookById, canReadBook } = require('../utils/bookAccess');
const { Highlight } = require('../models');

const router = express.Router();
router.use(authenticate);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ── Prompt templates ────────────────────────────────────────────────────────
const SUMMARIZE_SYSTEM = `You are a reading assistant embedded in an e-library. 
The user has highlighted a passage from a book. Provide a clear, insightful summary 
of the selected text in 2-4 sentences. Focus on the core ideas. 
Be concise but comprehensive. Do not start with "This passage" or "The text".`;

const SYNONYMS_SYSTEM = `You are a vocabulary assistant embedded in an e-library.
The user has highlighted a word or short phrase. Return a JSON array (and nothing else) 
in this exact shape:
[
  { "word": "synonym1", "definition": "brief definition", "partOfSpeech": "noun|verb|adj|adv" },
  { "word": "synonym2", "definition": "brief definition", "partOfSpeech": "noun|verb|adj|adv" }
]
Provide 4-6 synonyms. Return only the JSON array, no markdown fences.`;

// ── Shared stream helper ─────────────────────────────────────────────────────
async function streamToClient(res, model, prompt, systemInstruction) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  const gemini = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction,
  });

  const result = await gemini.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      // SSE format: data: <payload>\n\n
      res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ── POST /api/ai/summarize ───────────────────────────────────────────────────
router.post('/summarize', async (req, res, next) => {
  try {
    const { text, bookId, pageNumber, positionData } = req.body;

    if (!text?.trim()) return sendError(res, 'text is required', 400);

    // Sanitize: max 2000 chars
    const sanitized = String(text).trim().slice(0, 2000);

    // Verify book access
    if (bookId) {
      const book = await getBookById(bookId);
      if (book) {
        const allowed = await canReadBook(req.user, book);
        if (!allowed) return sendError(res, 'Access denied', 403);
      }
    }

    // Save highlight BEFORE streaming (so it's persisted even if stream is interrupted)
    if (bookId && pageNumber && positionData) {
      await Highlight.create({
        user_id: req.user.id,
        book_id: bookId,
        selected_text: sanitized,
        page_number: parseInt(pageNumber),
        position_data: positionData,
        ai_action: 'summarize',
        ai_result: null, // will not store full result for summarize — too large
      }).catch(() => {}); // non-fatal
    }

    await streamToClient(
      res,
      process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      `Summarize the following passage:\n\n"${sanitized}"`,
      SUMMARIZE_SYSTEM
    );
  } catch (err) {
    if (!res.headersSent) next(err);
    else { res.write('data: [ERROR]\n\n'); res.end(); }
  }
});

// ── POST /api/ai/synonyms ────────────────────────────────────────────────────
router.post('/synonyms', async (req, res, next) => {
  try {
    const { text, bookId, pageNumber, positionData } = req.body;

    if (!text?.trim()) return sendError(res, 'text is required', 400);
    const sanitized = String(text).trim().slice(0, 200); // synonyms: word/phrase only

    if (bookId) {
      const book = await getBookById(bookId);
      if (book) {
        const allowed = await canReadBook(req.user, book);
        if (!allowed) return sendError(res, 'Access denied', 403);
      }
    }

    if (bookId && pageNumber && positionData) {
      await Highlight.create({
        user_id: req.user.id,
        book_id: bookId,
        selected_text: sanitized,
        page_number: parseInt(pageNumber),
        position_data: positionData,
        ai_action: 'synonyms',
        ai_result: null,
      }).catch(() => {});
    }

    await streamToClient(
      res,
      process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      `Provide synonyms for: "${sanitized}"`,
      SYNONYMS_SYSTEM
    );
  } catch (err) {
    if (!res.headersSent) next(err);
    else { res.write('data: [ERROR]\n\n'); res.end(); }
  }
});

module.exports = router;