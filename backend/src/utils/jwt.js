const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'elib_token';

/**
 * Sign a JWT and attach it as an HTTP-only cookie on the response.
 * @param {import('express').Response} res
 * @param {{ id: number, role: string }} payload
 */
function issueToken(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
}

/**
 * Verify a JWT string and return its decoded payload.
 * @param {string} token
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Clear the auth cookie (logout).
 * @param {import('express').Response} res
 */
function clearToken(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

module.exports = { issueToken, verifyToken, clearToken, COOKIE_NAME };