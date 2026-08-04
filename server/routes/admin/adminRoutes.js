import express from 'express';
import studentRoutes from '../studentRoutes.js';
import feeRoutes from '../feeRoutes.js';
import subjectRoutes from '../subjectRoutes.js';
import facultyRoutes from '../facultyRoutes.js';
import alumniRoutes from '../alumniRoutes.js';
import dashboardRoutes from '../dashboardRoutes.js';
import { getAllFacultyLeaves, updateFacultyLeaveStatus } from '../../controllers/facultyController.js';

const router = express.Router();

// Mount sub-routers for Admin Portal
router.use('/students', studentRoutes);
router.use('/fees', feeRoutes);
router.use('/subjects', subjectRoutes);
router.use('/faculty', facultyRoutes);
router.get('/faculty-leaves', getAllFacultyLeaves);
router.put('/faculty-leaves/:id/status', updateFacultyLeaveStatus);
router.use('/alumni', alumniRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
