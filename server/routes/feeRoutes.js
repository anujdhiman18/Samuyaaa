import express from 'express';
import { getFeePayments, recordFeePayment, getFeeStats } from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getFeePayments).post(recordFeePayment);
router.get('/stats', getFeeStats);

export default router;
