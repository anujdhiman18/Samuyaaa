import express from 'express';
import { getDashboardStats, getFeeReminders, globalSearch } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/reminders', getFeeReminders);
router.get('/search', globalSearch);

export default router;
