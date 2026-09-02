import express from 'express';
import {
  createProfileChangeRequest,
  getMyProfileChangeRequests,
  getAllProfileChangeRequests,
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
} from '../controllers/facultyProfileRequestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected Endpoints
router.use(protect);

// Faculty Routes
router.post('/faculty-panel/profile-change-request', createProfileChangeRequest);
router.get('/faculty-panel/profile-change-requests', getMyProfileChangeRequests);

// Admin Routes
router.get('/admin/profile-change-requests', getAllProfileChangeRequests);
router.put('/admin/profile-change-requests/:id/approve', approveProfileChangeRequest);
router.put('/admin/profile-change-requests/:id/reject', rejectProfileChangeRequest);

export default router;
