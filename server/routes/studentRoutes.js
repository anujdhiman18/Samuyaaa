import express from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleFeeStatus,
  remindWhatsApp,
  remindSMS,
  getReminderLogs,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All student routes require JWT auth

router.get('/reminder-logs', getReminderLogs);
router.post('/:id/remind-whatsapp', remindWhatsApp);
router.post('/:id/remind-sms', remindSMS);

router.route('/').get(getStudents).post(createStudent);
router.route('/:id').get(getStudentById).put(updateStudent).delete(deleteStudent);
router.route('/:id/toggle-fee').put(toggleFeeStatus);

export default router;
