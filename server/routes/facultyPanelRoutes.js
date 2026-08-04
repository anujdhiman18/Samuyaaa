import express from 'express';
import {
  facultyLogin,
  getFacultyDashboard,
  getAssignedStudents,
  getAssignments,
  createAssignment,
  gradeSubmission,
  getStudyMaterials,
  uploadStudyMaterial,
  getFacultyLeaves,
  applyFacultyLeave,
} from '../controllers/facultyPanelController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Unprotected Faculty Login
router.post('/login', facultyLogin);

// Protected Faculty Endpoints (Requires JWT Auth & Faculty RBAC)
router.use(protect);

router.get('/dashboard', getFacultyDashboard);
router.get('/students', getAssignedStudents);

router.route('/assignments').get(getAssignments).post(createAssignment);
router.post('/assignments/:id/grade', gradeSubmission);

router.route('/materials').get(getStudyMaterials).post(uploadStudyMaterial);
router.route('/leaves').get(getFacultyLeaves).post(applyFacultyLeave);

export default router;
