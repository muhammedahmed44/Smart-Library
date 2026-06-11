const { User } = require('../models');
const { issueToken, clearToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

// ─── Register ──────────────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email and password are required', 400);
    }
    if (password.length < 8) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: password,   // hashed by beforeCreate hook
      role: 'user',
    });

    issueToken(res, { id: user.id, role: user.role });

    return sendSuccess(res, user.toSafeObject(), 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ─── Login ─────────────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    issueToken(res, { id: user.id, role: user.role });

    return sendSuccess(res, user.toSafeObject(), 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────
function logout(req, res) {
  clearToken(res);
  return sendSuccess(res, null, 'Logged out successfully');
}

// ─── Me ────────────────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    // req.user is attached by authenticate middleware (already excludes password_hash)
    return sendSuccess(res, req.user.toJSON());
  } catch (err) {
    next(err);
  }
}

// ─── Update Preferences ────────────────────────────────────────────────────
async function updatePreferences(req, res, next) {
  try {
    const { genres, readingSpeed, theme } = req.body;

    const allowed = {
      ...(Array.isArray(genres) && { genres }),
      ...(readingSpeed && ['slow', 'medium', 'fast'].includes(readingSpeed) && { readingSpeed }),
      ...(theme && ['light', 'dark'].includes(theme) && { theme }),
    };

    if (Object.keys(allowed).length === 0) {
      return sendError(res, 'No valid preference fields provided', 400);
    }

    const merged = { ...req.user.preferences, ...allowed };
    await req.user.update({ preferences: merged });

    return sendSuccess(res, { preferences: merged }, 'Preferences updated');
  } catch (err) {
    next(err);
  }
}

// ─── Request Author Role ───────────────────────────────────────────────────
async function requestAuthorRole(req, res, next) {
  try {
    const { RoleRequest } = require('../models');
    const { message } = req.body;

    if (req.user.role !== 'user') {
      return sendError(res, 'Only regular users can request the author role', 400);
    }

    // One active request at a time
    const existing = await RoleRequest.findOne({
      where: { user_id: req.user.id, status: 'pending' },
    });
    if (existing) {
      return sendError(res, 'You already have a pending author request', 409);
    }

    const request = await RoleRequest.create({
      user_id: req.user.id,
      requested_role: 'author',
      message: message?.trim() || null,
    });

    return sendSuccess(res, request, 'Author role request submitted', 201);
  } catch (err) {
    next(err);
  }
}

// ─── Get My Role Request Status ────────────────────────────────────────────
async function myRoleRequest(req, res, next) {
  try {
    const { RoleRequest } = require('../models');

    const request = await RoleRequest.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    return sendSuccess(res, request);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, updatePreferences, requestAuthorRole, myRoleRequest };