import express from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignFacultyRoles,
  getActivityLogs,
  logActivity,
  getLoginHistory,
} from '../../controllers/rbacController.js';

const router = express.Router();

// Roles Endpoints
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// Faculty Role Assignment
router.put('/faculty-roles/:facultyId', assignFacultyRoles);

// Activity Logs & Audit History
router.get('/activity-logs', getActivityLogs);
router.post('/activity-logs', logActivity);
router.get('/login-history', getLoginHistory);

export default router;

