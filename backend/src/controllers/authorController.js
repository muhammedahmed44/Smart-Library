const { Book, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { getBookById, canManageBook } = require('../utils/bookAccess');
const { uploadCover, deleteUploadedFile, resolveUploadPath } = require('../config/multer');
const path = require('path');
const fs = require('fs');

// ─── GET /api/author/books ─────────────────────────────────────────────────
async function listAuthorBooks(req, res, next) {
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
      pagination: { total, page: parseInt(page), limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/author/books ────────────────────────────────────────────────
// Authors publish directly to the public library.
// Multer + validatePdf run before this controller.
async function publishBook(req, res, next) {
  try {
    const { title, description, genre } = req.body;

    if (!title?.trim()) {
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
      visibility: 'public',
      is_published: true,
      published_at: new Date(),
    });

    return sendSuccess(res, book, 'Book published to public library', 201);
  } catch (err) {
    if (req.pdfMeta) deleteUploadedFile(req.pdfMeta.filePath);
    next(err);
  }
}

// ─── PUT /api/author/books/:id/publish ────────────────────────────────────
// Toggle published status. Also switches visibility to 'public' on publish.
async function togglePublish(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canManageBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    const willPublish = !book.is_published;

    await book.update({
      is_published: willPublish,
      visibility: willPublish ? 'public' : 'private',
      published_at: willPublish ? new Date() : book.published_at,
    });

    const action = willPublish ? 'published' : 'unpublished';
    return sendSuccess(res, book, `Book ${action} successfully`);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/author/books/:id/cover ─────────────────────────────────────
// Upload or replace the cover image for a book.
async function uploadBookCover(req, res, next) {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);

    const allowed = await canManageBook(req.user, book);
    if (!allowed) return sendError(res, 'Access denied', 403);

    if (!req.file) return sendError(res, 'No cover image uploaded', 400);

    const { UPLOAD_BASE } = require('../config/multer');
    const newCoverRelative = path.relative(UPLOAD_BASE, req.file.path);

    // Delete old cover if exists
    if (book.cover_path) deleteUploadedFile(book.cover_path);

    await book.update({ cover_path: newCoverRelative });

    return sendSuccess(res, { cover_path: newCoverRelative }, 'Cover updated');
  } catch (err) {
    if (req.file) {
      const { UPLOAD_BASE } = require('../config/multer');
      deleteUploadedFile(path.relative(UPLOAD_BASE, req.file.path));
    }
    next(err);
  }
}

module.exports = { listAuthorBooks, publishBook, togglePublish, uploadBookCover };