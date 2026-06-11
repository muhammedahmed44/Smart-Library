const express = require('express');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { User, Book, UserHistory, Recommendation } = require('../models');

const router = express.Router();
router.use(authenticate);

/**
 * Lightweight genre-overlap recommendation engine.
 *
 * Algorithm:
 *  1. Collect genres the user has read (from UserHistory → Book.genre).
 *  2. Count frequency of each genre → weight map.
 *  3. Score every unread public book by: genreWeight / totalGenreReads.
 *     Boost by recency of genre reads (books in most-read genre score highest).
 *  4. Also surface user preference genres from User.preferences.genres.
 *  5. Write top-20 results to Recommendations table (upsert).
 *  6. Return them with the Book association.
 */
async function computeAndFetchRecommendations(userId) {
  // ── Fetch user prefs ───────────────────────────────────────────────────
  const user = await User.findByPk(userId, { attributes: ['preferences'] });
  const prefGenres = user?.preferences?.genres ?? [];

  // ── Fetch reading history ──────────────────────────────────────────────
  const history = await UserHistory.findAll({
    where: { user_id: userId },
    include: [{ model: Book, as: 'book', attributes: ['id', 'genre'] }],
  });

  const readBookIds = new Set(history.map((h) => h.book_id));

  // Build genre frequency map from history
  const genreFreq = {};
  for (const h of history) {
    const g = h.book?.genre;
    if (g) genreFreq[g] = (genreFreq[g] || 0) + 1;
  }

  // Blend in preference genres (half-weight)
  for (const g of prefGenres) {
    genreFreq[g] = (genreFreq[g] || 0) + 0.5;
  }

  const totalWeight = Object.values(genreFreq).reduce((a, b) => a + b, 0) || 1;

  // ── Fetch candidate books ──────────────────────────────────────────────
  const candidates = await Book.findAll({
    where: {
      visibility: 'public',
      is_published: true,
      ...(readBookIds.size > 0 ? { id: { [Op.notIn]: [...readBookIds] } } : {}),
    },
    attributes: ['id', 'title', 'genre', 'cover_path', 'author_id'],
    limit: 200,
  });

  // ── Score candidates ───────────────────────────────────────────────────
  const scored = candidates.map((book) => {
    const g = book.genre;
    const freq = g ? (genreFreq[g] || 0) : 0;
    const score = parseFloat((freq / totalWeight).toFixed(4));
    const reason = g && freq > 0
      ? `Based on your interest in ${g}`
      : 'Popular in the library';
    return { bookId: book.id, score, reason };
  });

  // Sort by score descending, take top 20
  scored.sort((a, b) => b.score - a.score);
  const top20 = scored.slice(0, 20);

  // ── Upsert into Recommendations ───────────────────────────────────────
  // First, remove any stale rows not in the fresh top-20
  const freshBookIds = top20.map(({ bookId }) => bookId);
  await Recommendation.destroy({
    where: {
      user_id: userId,
      ...(freshBookIds.length > 0 ? { book_id: { [Op.notIn]: freshBookIds } } : {}),
    },
  });

  for (const { bookId, score, reason } of top20) {
    await Recommendation.upsert({ user_id: userId, book_id: bookId, score, reason });
  }

  // ── Fetch with Book data to return ────────────────────────────────────
  return Recommendation.findAll({
    where: { user_id: userId },
    include: [{
      model: Book,
      as: 'book',
      attributes: ['id', 'title', 'genre', 'cover_path'],
    }],
    order: [['score', 'DESC']],
    limit: 20,
  });
}

// GET /api/recommendations
router.get('/', async (req, res, next) => {
  try {
    const recs = await computeAndFetchRecommendations(req.user.id);
    return sendSuccess(res, recs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;