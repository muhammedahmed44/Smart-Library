const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadBook, validatePdf, uploadCover } = require('../config/multer');
const {
  listPublicBooks,
  getPublicBook,
  serveBookPdf,
  listGenres,
} = require('../controllers/libraryController');
const {
  listPersonalBooks,
  getPersonalBook,
  uploadPersonalBook,
  updatePersonalBook,
  deletePersonalBook,
  servePersonalPdf,
} = require('../controllers/personalController');
const {
  listAuthorBooks,
  publishBook,
  togglePublish,
  uploadBookCover,
} = require('../controllers/authorController');
const {
  upsertHistory,
  getHistory,
  getHighlights,
  createHighlight,
  deleteHighlight,
} = require('../controllers/historyController');

// ─── Public Library ────────────────────────────────────────────────────────
const libraryRouter = express.Router();

libraryRouter.get('/books',             optionalAuth, listPublicBooks);
libraryRouter.get('/books/:id',         optionalAuth, getPublicBook);
libraryRouter.get('/books/:id/serve',   authenticate, serveBookPdf);
libraryRouter.get('/genres',            listGenres);

// ─── Personal Section ──────────────────────────────────────────────────────
const personalRouter = express.Router();

personalRouter.use(authenticate);

personalRouter.get('/',                  listPersonalBooks);
personalRouter.get('/:id',               getPersonalBook);
personalRouter.post(
  '/',
  uploadBook.single('file'),
  validatePdf,
  uploadPersonalBook
);
personalRouter.put('/:id',               updatePersonalBook);
personalRouter.delete('/:id',            deletePersonalBook);
personalRouter.get('/:id/serve',         servePersonalPdf);

// ─── Author Panel ──────────────────────────────────────────────────────────
const authorRouter = express.Router();

authorRouter.use(authenticate, authorize('author', 'admin'));

authorRouter.get('/books',               listAuthorBooks);
authorRouter.post(
  '/books',
  uploadBook.single('file'),
  validatePdf,
  publishBook
);
authorRouter.put('/books/:id/publish',   togglePublish);
authorRouter.post(
  '/books/:id/cover',
  uploadCover.single('cover'),
  uploadBookCover
);

// ─── History + Highlights ──────────────────────────────────────────────────
const historyRouter = express.Router();

historyRouter.use(authenticate);

historyRouter.post('/:bookId',           upsertHistory);
historyRouter.get('/',                   getHistory);

const highlightsRouter = express.Router();

highlightsRouter.use(authenticate);

highlightsRouter.get('/:bookId',         getHighlights);
highlightsRouter.post('/',               createHighlight);
highlightsRouter.delete('/:id',          deleteHighlight);

module.exports = { libraryRouter, personalRouter, authorRouter, historyRouter, highlightsRouter };