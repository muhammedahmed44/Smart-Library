/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [status]
 */
function sendSuccess(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [status]
 * @param {*} [errors]
 */
function sendError(res, message = 'An error occurred', status = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { sendSuccess, sendError };