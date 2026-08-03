import express from 'express';
import {
  getAttendance,
  saveBatchAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Require JWT protection

router.get('/', getAttendance);
router.post('/batch', saveBatchAttendance);
router.delete('/:id', deleteAttendance);

export default router;
