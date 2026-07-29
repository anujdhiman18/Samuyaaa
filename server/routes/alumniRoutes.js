import express from 'express';
import {
  getAlumni,
  getAlumniStats,
  createAlumni,
  updateAlumni,
  deleteAlumni,
} from '../controllers/alumniController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAlumni);
router.get('/stats', getAlumniStats);
router.post('/', protect, adminOnly, createAlumni);
router.put('/:id', protect, adminOnly, updateAlumni);
router.delete('/:id', protect, adminOnly, deleteAlumni);

export default router;
