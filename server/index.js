import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { validateEnv } from './config/validateEnv.js';
import publicRoutes from './routes/public/publicWebsiteRoutes.js';
import authRoutes from './routes/public/authRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';

import studentRoutes from './routes/studentRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import feedbackRoutes from './routes/feedback.js';
import facultyRoutes from './routes/facultyRoutes.js';
import alumniRoutes from './routes/alumniRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import facultyPanelRoutes from './routes/facultyPanelRoutes.js';
import rbacRoutes from './routes/admin/rbacRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { initSchedulers } from './jobs/feeScheduler.js';

dotenv.config();

// Step 1: Startup Environment Validation
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saumyaa_db';

// Security Headers & Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', limiter);

// Step 2: Physically Separated & Isolated Route Mounts
import { applyStudentLeave, getStudentLeaves } from './controllers/studentController.js';

// Public Website & Auth API Namespace
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);

// Admin & Faculty Portal API Namespaces
app.use('/api/admin', adminRoutes);
app.use('/api/faculty-panel', facultyPanelRoutes);
app.use('/api/rbac', rbacRoutes);
app.post('/api/student-panel/leaves', applyStudentLeave);
app.get('/api/student-panel/leaves', getStudentLeaves);

// Backward Compatibility Direct Mappings
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/alumni', alumniRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Saumyaa Studies API backend is operational',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Global Uncaught Exception Protection to Prevent Server Crashes
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception caught gracefully:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection caught gracefully:', reason);
});

// Database Connection & Server Listener with Port Conflict Protection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅ Connected to MongoDB database: ${MONGO_URI}`);
    startServer();
  })
  .catch((err) => {
    console.warn(`⚠️ MongoDB Connection Warning: ${err.message}. Backend running in standalone mode on port ${PORT}.`);
    startServer();
  });

function startServer() {
  initSchedulers();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Saumyaa Admin & Public Backend running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ ERROR: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Please terminate the process using port ${PORT} or change PORT in server/.env`);
    } else {
      console.error('❌ Server startup error:', err.message);
    }
  });
}
