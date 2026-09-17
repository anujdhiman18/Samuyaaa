import express from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleFeeStatus,
  bulkActionStudents,
  remindWhatsApp,
  remindSMS,
  remindEmail,
  bulkRemindDueFeesSMS,
  bulkRemindDueFeesEmail,
  getReminderLogs,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All student routes require JWT auth

router.get('/reminder-logs', getReminderLogs);
router.post('/bulk-action', bulkActionStudents);
router.post('/bulk-remind-sms', bulkRemindDueFeesSMS);
router.post('/bulk-remind-email', bulkRemindDueFeesEmail);
router.post('/:id/remind-whatsapp', remindWhatsApp);
router.post('/:id/remind-sms', remindSMS);
router.post('/:id/remind-email', remindEmail);

router.route('/').get(getStudents).post(createStudent);
router.route('/:id').get(getStudentById).put(updateStudent).delete(deleteStudent);
router.route('/:id/toggle-fee').put(toggleFeeStatus);

export default router;

