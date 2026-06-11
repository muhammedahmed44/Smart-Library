const { sendError } = require('../utils/response');

/**
 * Global Express error handler.
 * Catches anything passed to next(err).
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors?.map((e) => e.message) ?? [err.message];
    return sendError(res, 'Validation failed', 422, errors);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 20}MB`, 413);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 'Unexpected file field', 400);
  }

  // JWT errors (should normally be caught in middleware, but just in case)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired session', 401);
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  return sendError(res, message, status);
}

/**
 * 404 handler — attach after all routes.
 */
function notFound(req, res) {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}

module.exports = { errorHandler, notFound };