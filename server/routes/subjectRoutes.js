import express from 'express';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All subject routes protected

router.route('/').get(getSubjects).post(createSubject);
router.route('/:id').put(updateSubject).delete(deleteSubject);

export default router;
