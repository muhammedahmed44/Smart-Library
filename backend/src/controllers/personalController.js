const { Book } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { getBookById, canManageBook, canReadBook } = require('../utils/bookAccess');
const { deleteUploadedFile, resolveUploadPath } = require('../config/multer');
const { serveBookPdf } = require('./libraryController');
const path = require('path');
const fs = require('fs');

// ─── GET /api/personal/books/:id ──────────────────────────────────────────
async function getPersonalBook(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canManageBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    return sendSuccess(res, book);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/personal/books ───────────────────────────────────────────────
async function listPersonalBooks(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(100, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;

    const { rows: books, count: total } = await Book.findAndCountAll({
      where: { author_id: req.user.id },
      order: [['created_at', 'DESC']],
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

// ─── POST /api/personal/books ──────────────────────────────────────────────
// Multer + validatePdf run before this controller (see routes).
async function uploadPersonalBook(req, res, next) {
  try {
    const { title, description, genre } = req.body;

    if (!title?.trim()) {
      // Clean up the already-saved file if validation fails here
      if (req.pdfMeta) deleteUploadedFile(req.pdfMeta.filePath);
      return sendError(res, 'Book title is required', 400);
    }
    if (genre && genre.trim().length > 80) {
      if (req.pdfMeta) deleteUploadedFile(req.pdfMeta.filePath);
      return sendError(res, 'Genre must be 80 characters or fewer', 400);
    }

    const book = await Book.create({
      author_id: req.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      genre: genre?.trim() || null,
      file_path: req.pdfMeta.filePath,
      file_size_bytes: req.pdfMeta.fileSizeBytes,
      total_pages: req.pdfMeta.totalPages,
      visibility: 'private',
      is_published: false,
    });

    return sendSuccess(res, book, 'Book uploaded successfully', 201);
  } catch (err) {
    if (req.pdfMeta) deleteUploadedFile(req.pdfMeta.filePath);
    next(err);
  }
}

// ─── PUT /api/personal/books/:id ──────────────────────────────────────────
async function updatePersonalBook(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canManageBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    const { title, description, genre, visibility } = req.body;

    const updates = {};
    if (title?.trim())       updates.title       = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (genre !== undefined)  updates.genre       = genre?.trim() || null;
    if (visibility && ['private', 'public'].includes(visibility)) {
      updates.visibility = visibility;
    }

    await book.update(updates);
    return sendSuccess(res, book, 'Book updated');
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/personal/books/:id ───────────────────────────────────────
async function deletePersonalBook(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canManageBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    // Delete files from disk first
    deleteUploadedFile(book.file_path);
    if (book.cover_path) deleteUploadedFile(book.cover_path);

    await book.destroy();
    return sendSuccess(res, null, 'Book deleted successfully');
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/personal/books/:id/serve ────────────────────────────────────
// Delegates to the shared serveBookPdf helper from libraryController.
// canReadBook allows owner, admin, or explicit-permission users —
// including private books — so personal books stream correctly.
async function servePersonalPdf(req, res, next) {
  return serveBookPdf(req, res, next);
}

module.exports = {
  listPersonalBooks,
  getPersonalBook,
  uploadPersonalBook,
  updatePersonalBook,
  deletePersonalBook,
  servePersonalPdf,
};