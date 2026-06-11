const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  me,
  updatePreferences,
  requestAuthorRole,
  myRoleRequest,
} = require('../controllers/authController');

const router = express.Router();

// Stricter rate limit on auth endpoints — 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/logout',   authenticate, logout);
router.get('/me',        authenticate, me);
router.put('/preferences', authenticate, updatePreferences);
router.post('/role-request',    authenticate, requestAuthorRole);
router.get('/role-request/me',  authenticate, myRoleRequest);

module.exports = router;