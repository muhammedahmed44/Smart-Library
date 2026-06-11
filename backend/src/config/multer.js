const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const { sendError } = require('../utils/response');

const MAX_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 20) * 1024 * 1024;

// ─── Ensure upload dirs exist ──────────────────────────────────────────────
const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR || './uploads');
const BOOKS_DIR   = path.join(UPLOAD_BASE, 'books');
const COVERS_DIR  = path.join(UPLOAD_BASE, 'covers');

[UPLOAD_BASE, BOOKS_DIR, COVERS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Storage: deterministic uuid filename, no extension guessing ───────────
const bookStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BOOKS_DIR),
  filename: (_req, _file, cb) => cb(null, `${uuidv4()}.pdf`),
});

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, COVERS_DIR),
  filename: (_req, _file, cb) => {
    const ext = path.extname(_file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ─── MIME filter ───────────────────────────────────────────────────────────
function pdfFilter(_req, file, cb) {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(Object.assign(new Error('Only PDF files are accepted'), { status: 415 }), false);
}

function imageFilter(_req, file, cb) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only JPEG, PNG, WebP or GIF images are accepted'), { status: 415 }), false);
}

// ─── Multer instances ──────────────────────────────────────────────────────
const uploadBook = multer({
  storage: bookStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_BYTES, files: 1 },
});

const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB for covers
});

// ─── pdf-parse validation middleware ──────────────────────────────────────
// Run AFTER uploadBook.single('file') has placed the file on disk.
// Reads the saved file, runs pdf-parse, extracts page count.
// Deletes the file and rejects the request if it is not a valid PDF.
async function validatePdf(req, res, next) {
  if (!req.file) return sendError(res, 'No file uploaded', 400);

  const filePath = req.file.path;

  try {
    const buffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(buffer);

    if (!data || !data.numpages || data.numpages < 1) {
      throw new Error('PDF has no readable pages');
    }

    // Attach parsed metadata so controllers can persist it
    req.pdfMeta = {
      totalPages: data.numpages,
      filePath: path.relative(UPLOAD_BASE, filePath), // e.g. "books/uuid.pdf"
      fileSizeBytes: req.file.size,
    };

    next();
  } catch (err) {
    // Purge the invalid file from disk
    fs.unlink(filePath, () => {});
    return sendError(res, `Invalid or corrupted PDF: ${err.message}`, 422);
  }
}

// ─── Helper: delete a file by its relative path ───────────────────────────
function deleteUploadedFile(relativePath) {
  if (!relativePath) return;
  const abs = path.join(UPLOAD_BASE, relativePath);
  fs.unlink(abs, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`[Storage] Failed to delete ${abs}:`, err.message);
    }
  });
}

// ─── Helper: absolute path from relative storage path ─────────────────────
function resolveUploadPath(relativePath) {
  return path.join(UPLOAD_BASE, relativePath);
}

module.exports = {
  uploadBook,
  uploadCover,
  validatePdf,
  deleteUploadedFile,
  resolveUploadPath,
  UPLOAD_BASE,
};