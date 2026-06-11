require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const {
  libraryRouter,
  personalRouter,
  authorRouter,
  historyRouter,
  highlightsRouter,
} = require('./routes/books');
const aiRoutes = require('./routes/ai');
const recommendationsRoutes = require('./routes/recommendations');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow PDF streaming cross-origin
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'"],             // pdfjs worker is now bundled locally
        styleSrc:       ["'self'", "'unsafe-inline'"], // Tailwind injects inline styles
        imgSrc:         ["'self'", 'data:', 'blob:'],
        connectSrc:     ["'self'"],
        workerSrc:      ["'self'", 'blob:'],    // pdfjs spawns a worker blob
        objectSrc:      ["'none'"],
        frameAncestors: ["'none'"],
      },
    } : false, // disabled in development for convenience
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true, // required for HTTP-only cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Global rate limit ─────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
  })
);

// ─── Static uploads (cover images only — PDFs are served via streaming route)
const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads/covers', express.static(path.join(UPLOAD_BASE, 'covers')));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/library',         libraryRouter);
app.use('/api/personal/books',  personalRouter);
app.use('/api/author',          authorRouter);
app.use('/api/history',         historyRouter);
app.use('/api/highlights',      highlightsRouter);
app.use('/api/ai',             aiRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 + Error handler ───────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Serve frontend build in production ────────────────────────────────────
// The frontend build (frontend/dist) is placed one level up from backend/src.
// Express serves it as static files and falls back to index.html for all
// non-API routes so React Router handles client-side navigation on refresh.
if (process.env.NODE_ENV === 'production') {
  const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(FRONTEND_DIST));
  // SPA fallback — must come AFTER all API routes and the 404 handler
  app.get('*', (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅  Database connected');

    // Sync models in development (use migrate script in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅  Models synced');
    }

    app.listen(PORT, () => {
      console.log(`🚀  E-Library API running on http://localhost:${PORT}`);
      console.log(`    Environment : ${process.env.NODE_ENV}`);
      console.log(`    Client      : ${process.env.CLIENT_ORIGIN}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
}

start();