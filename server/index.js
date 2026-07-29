import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import feedbackRoutes from './routes/feedback.js';
import facultyRoutes from './routes/facultyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSchedulers } from './jobs/feeScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saumyaa_db';

// Security Headers & Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/faculty', facultyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Saumyaa Studies API backend is operational' });
});

// Error handling middleware
app.use(errorHandler);

// Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB database: ${MONGO_URI}`);
    initSchedulers();
    app.listen(PORT, () => {
      console.log(`Saumyaa Admin Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.warn(`MongoDB Connection Warning: ${err.message}. Backend running in standalone mode on port ${PORT}.`);
    initSchedulers();
    app.listen(PORT, () => {
      console.log(`Saumyaa Admin Backend running on http://localhost:${PORT}`);
    });
  });
