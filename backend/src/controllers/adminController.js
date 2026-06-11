const { RoleRequest, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// ─── GET /api/admin/role-requests ─────────────────────────────────────────
async function listRoleRequests(req, res, next) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(100, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;

    const where = {};
    if (['pending', 'approved', 'rejected'].includes(status)) where.status = status;

    const { rows: requests, count: total } = await RoleRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role', 'created_at'] },
        { model: User, as: 'actionedBy', attributes: ['id', 'name'], required: false },
      ],
      order: [['created_at', 'DESC']],
      limit: safeLimit,
      offset,
    });

    return sendSuccess(res, {
      requests,
      pagination: { total, page: parseInt(page), limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/admin/role-requests/:id ─────────────────────────────────────
// Approve or reject a role request. On approval, updates the user's role.
async function actionRoleRequest(req, res, next) {
  try {
    const { action, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return sendError(res, 'action must be "approved" or "rejected"', 400);
    }

    const request = await RoleRequest.findByPk(req.params.id, {
      include: [{ model: User, as: 'requester' }],
    });

    if (!request) return sendError(res, 'Request not found', 404);
    if (request.status !== 'pending') {
      return sendError(res, `Request has already been ${request.status}`, 409);
    }

    // Update the request
    await request.update({
      status: action,
      actioned_by: req.user.id,
      actioned_at: new Date(),
      admin_note: adminNote?.trim() || null,
    });

    // If approved — elevate the user's role silently
    if (action === 'approved') {
      await request.requester.update({ role: request.requested_role });
    }

    return sendSuccess(res, request, `Request ${action} successfully`);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/users ──────────────────────────────────────────────────
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const safeLimit = Math.min(100, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;

    const where = {};
    if (role && ['user', 'author', 'admin'].includes(role)) where.role = role;

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: safeLimit,
      offset,
    });

    return sendSuccess(res, {
      users,
      pagination: { total, page: parseInt(page), limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────
async function setUserRole(req, res, next) {
  try {
    const { role } = req.body;

    if (!['user', 'author', 'admin'].includes(role)) {
      return sendError(res, 'role must be one of: user, author, admin', 400);
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (user.id === req.user.id) {
      return sendError(res, 'You cannot change your own role', 400);
    }

    await user.update({ role });
    return sendSuccess(res, user.toSafeObject(), 'User role updated');
  } catch (err) {
    next(err);
  }
}

module.exports = { listRoleRequests, actionRoleRequest, listUsers, setUserRole };