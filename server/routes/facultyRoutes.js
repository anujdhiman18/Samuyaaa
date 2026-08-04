import express from 'express';
import {
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  notifyFacultyApplication,
  sendFacultyApplicationEmailController,
  sendCandidateStatusEmailController,
  assignResponsibilities,
  removeResponsibility,
  getAuditLogs,
  getAllFacultyLeaves,
  updateFacultyLeaveStatus,
} from '../controllers/facultyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to fetch active faculty for website
router.get('/', getFaculty);

// Admin Faculty Leaves Endpoints
router.get('/leaves', getAllFacultyLeaves);
router.put('/leaves/:id/status', updateFacultyLeaveStatus);

// Public route to send faculty application email via Nodemailer
router.post('/send-email', sendFacultyApplicationEmailController);

// Public route to send candidate status change notification via Nodemailer / fallback
router.post('/notify-status', sendCandidateStatusEmailController);

// Backward compatible notification route
router.post('/notify', notifyFacultyApplication);

// Admin protected routes for CUD operations & Responsibility management
router.post('/', protect, createFaculty);
router.put('/:id', protect, updateFaculty);
router.delete('/:id', protect, deleteFaculty);

router.post('/:id/responsibilities', protect, assignResponsibilities);
router.delete('/:id/responsibilities/:respId', protect, removeResponsibility);
router.get('/:id/audit-log', protect, getAuditLogs);

export default router;
