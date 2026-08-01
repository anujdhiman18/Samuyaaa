import express from 'express';
import { getFaculty, createFaculty, updateFaculty, deleteFaculty, notifyFacultyApplication } from '../controllers/facultyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to fetch active faculty for website
router.get('/', getFaculty);

// Public route to notify admin on faculty application submission
router.post('/notify', notifyFacultyApplication);

// Admin protected routes for CUD operations
router.post('/', protect, createFaculty);
router.put('/:id', protect, updateFaculty);
router.delete('/:id', protect, deleteFaculty);

export default router;
