const { verifyToken, COOKIE_NAME } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { User } = require('../models');

/**
 * Authenticate middleware — reads JWT from HTTP-only cookie,
 * verifies it, fetches the user from DB, attaches to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return sendError(res, 'Authentication required', 401);
    }

    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    next(err);
  }
}

/**
 * RBAC guard factory — call with one or more allowed roles.
 * Must be used AFTER authenticate middleware.
 *
 * @param {...string} roles - e.g. authorize('admin'), authorize('author', 'admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}

/**
 * Optional auth — attaches req.user if token is present and valid,
 * but does NOT reject if missing. Used for public endpoints that
 * return extra data when authenticated.
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (user) req.user = user;
    next();
  } catch {
    // Invalid/expired token — continue as guest
    next();
  }
}

module.exports = { authenticate, authorize, optionalAuth };