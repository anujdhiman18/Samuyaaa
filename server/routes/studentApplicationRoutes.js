import express from 'express';
import {
  submitStudentApplication,
  updatePendingStudentApplication,
  getStudentApplications,
  updateStudentApplicationStatus,
  deleteStudentApplication,
} from '../controllers/studentApplicationController.js';

const router = express.Router();

// Public application submission & update
router.post('/', submitStudentApplication);
router.put('/:id', updatePendingStudentApplication);

// Application management (Admin / Internal)
router.get('/', getStudentApplications);
router.put('/:id/status', updateStudentApplicationStatus);
router.delete('/:id', deleteStudentApplication);

export default router;
