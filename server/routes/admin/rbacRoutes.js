const express = require('express');
const router = express.Router();
const rbacController = require('../../controllers/rbacController');

// Roles Endpoints
router.get('/roles', rbacController.getRoles);
router.post('/roles', rbacController.createRole);
router.put('/roles/:id', rbacController.updateRole);
router.delete('/roles/:id', rbacController.deleteRole);

// Faculty Role Assignment
router.put('/faculty-roles/:facultyId', rbacController.assignFacultyRoles);

// Activity Logs & Audit History
router.get('/activity-logs', rbacController.getActivityLogs);
router.post('/activity-logs', rbacController.logActivity);
router.get('/login-history', rbacController.getLoginHistory);

module.exports = router;
