const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listRoleRequests, actionRoleRequest, listUsers, setUserRole } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/role-requests',         listRoleRequests);
router.put('/role-requests/:id',     actionRoleRequest);
router.get('/users',                 listUsers);
router.put('/users/:id/role',        setUserRole);

module.exports = router;