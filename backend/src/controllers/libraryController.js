const { Op } = require('sequelize');
const { Book, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { getBookById, canReadBook } = require('../utils/bookAccess');
const { resolveUploadPath } = require('../config/multer');
const fs = require('fs');

// ─── GET /api/library/books ────────────────────────────────────────────────
async function listPublicBooks(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      search,
      sort = 'published_at',
      order = 'DESC',
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const safeLimit = Math.min(100, parseInt(limit));

    const where = { visibility: 'public', is_published: true };
    if (genre) where.genre = genre;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const allowedSorts = ['published_at', 'title', 'created_at'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'published_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows: books, count: total } = await Book.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [[safeSort, safeOrder]],
      limit: safeLimit,
      offset,
    });

    return sendSuccess(res, {
      books,
      pagination: {
        total,
        page: parseInt(page),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/library/books/:id ────────────────────────────────────────────
async function getPublicBook(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);
    if (book.visibility !== 'public' || !book.is_published) {
      return sendError(res, 'Book not found', 404);
    }
    return sendSuccess(res, book);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/library/books/:id/serve ─────────────────────────────────────
// Byte-range streaming — serves the PDF in chunks using Range headers.
// Requires authentication + read permission.
async function serveBookPdf(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canReadBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    const filePath = resolveUploadPath(book.file_path);
    if (!fs.existsSync(filePath)) {
      return sendError(res, 'File not found on server', 404);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      // ── Partial content (byte-range) ──
      const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).send('Range Not Satisfiable');
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=3600',
      });

      fileStream.pipe(res);
    } else {
      // ── Full file (first request from viewer) ──
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/pdf',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/library/genres ───────────────────────────────────────────────
async function listGenres(req, res, next) {
  try {
    const { sequelize } = require('../models');
    const { fn, col, literal } = require('sequelize');

    const results = await Book.findAll({
      where: { visibility: 'public', is_published: true, genre: { [Op.ne]: null } },
      attributes: [
        'genre',
        [fn('COUNT', col('genre')), 'count'],
      ],
      group: ['genre'],
      order: [[literal('count'), 'DESC']],
      raw: true,
    });
    return sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}

module.exports = { listPublicBooks, getPublicBook, serveBookPdf, listGenres };