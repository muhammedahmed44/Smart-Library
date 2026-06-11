const { UserHistory, Highlight, Book } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { getBookById, canReadBook } = require('../utils/bookAccess');

// ─── POST /api/history/:bookId ─────────────────────────────────────────────
// Upsert reading progress (debounced from frontend on page change).
async function upsertHistory(req, res, next) {
  try {
    const { bookId } = req.params;
    const { lastPage } = req.body;

    if (!lastPage || isNaN(parseInt(lastPage))) {
      return sendError(res, 'lastPage is required and must be a number', 400);
    }

    const book = await getBookById(bookId);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canReadBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    const page = Math.max(1, parseInt(lastPage));
    const completionPct =
      book.total_pages > 0
        ? parseFloat(((page / book.total_pages) * 100).toFixed(2))
        : 0;

    const [history, created] = await UserHistory.findOrCreate({
      where: { user_id: req.user.id, book_id: bookId },
      defaults: {
        user_id: req.user.id,
        book_id: bookId,
        last_page: page,
        completion_pct: completionPct,
        last_read_at: new Date(),
      },
    });

    if (!created) {
      await history.update({
        last_page: page,
        completion_pct: completionPct,
        last_read_at: new Date(),
      });
    }

    return sendSuccess(res, history, created ? 'History created' : 'Progress saved');
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/history ──────────────────────────────────────────────────────
async function getHistory(req, res, next) {
  try {
    const { limit = 20 } = req.query;

    const history = await UserHistory.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'genre', 'cover_path', 'total_pages', 'visibility', 'is_published'],
        },
      ],
      order: [['last_read_at', 'DESC']],
      limit: Math.min(100, parseInt(limit)),
    });

    return sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/highlights/:bookId ───────────────────────────────────────────
async function getHighlights(req, res, next) {
  try {
    const book = await getBookById(req.params.bookId);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canReadBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    const highlights = await Highlight.findAll({
      where: { user_id: req.user.id, book_id: req.params.bookId },
      order: [['created_at', 'ASC']],
    });

    return sendSuccess(res, highlights);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/highlights ──────────────────────────────────────────────────
// Called server-side from the AI controller after a successful LLM response.
// Can also be called directly from the reader if needed in future.
async function createHighlight(req, res, next) {
  try {
    const { bookId, selectedText, pageNumber, positionData, aiAction, aiResult } = req.body;

    if (!bookId || !selectedText || !pageNumber || !positionData || !aiAction) {
      return sendError(res, 'bookId, selectedText, pageNumber, positionData and aiAction are required', 400);
    }

    const book = await getBookById(bookId);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canReadBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    // Sanitize text — max 5000 chars stored
    const text = String(selectedText).slice(0, 5000);

    const highlight = await Highlight.create({
      user_id: req.user.id,
      book_id: bookId,
      selected_text: text,
      page_number: parseInt(pageNumber),
      position_data: positionData,
      ai_action: aiAction,
      ai_result: aiResult || null,
    });

    return sendSuccess(res, highlight, 'Highlight saved', 201);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/highlights/:id ────────────────────────────────────────────
async function deleteHighlight(req, res, next) {
  try {
    const highlight = await Highlight.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!highlight) return sendError(res, 'Highlight not found', 404);

    await highlight.destroy();
    return sendSuccess(res, null, 'Highlight deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { upsertHistory, getHistory, getHighlights, createHighlight, deleteHighlight };