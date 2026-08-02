import express from 'express';
import {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/profile', protect, getAdminProfile);
router.put('/profile', protect, updateAdminProfile);
router.put('/change-password', protect, changeAdminPassword);

export default router;
