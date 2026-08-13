import express from 'express';
import {
  submitStudentApplication,
  getStudentApplications,
  updateStudentApplicationStatus,
  deleteStudentApplication,
} from '../controllers/studentApplicationController.js';

const router = express.Router();

// Public application submission
router.post('/', submitStudentApplication);

// Application management (Admin / Internal)
router.get('/', getStudentApplications);
router.put('/:id/status', updateStudentApplicationStatus);
router.delete('/:id', deleteStudentApplication);

export default router;
