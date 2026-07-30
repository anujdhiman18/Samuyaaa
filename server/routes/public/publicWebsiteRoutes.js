import express from 'express';
import Feedback from '../../models/Feedback.js';
import Faculty from '../../models/Faculty.js';
import Subject from '../../models/Subject.js';
import Alumni from '../../models/Alumni.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = express.Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Saumyaa Public API service is fully operational',
    timestamp: new Date().toISOString(),
  });
});

// Public Inquiry Submission
router.post(
  '/inquiry',
  asyncHandler(async (req, res) => {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone, and message are required' });
    }

    const newFeedback = await Feedback.create({
      name,
      phone,
      email: email || '',
      subject: subject || 'General Inquiry',
      message,
      rating: 5,
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      inquiry: newFeedback,
    });
  })
);

// Public Active Faculty Directory
router.get(
  '/faculty',
  asyncHandler(async (req, res) => {
    const faculty = await Faculty.find({ is_active: { $ne: false } }).sort({ display_order: 1 });
    res.json({ success: true, faculty });
  })
);

// Public Active Subjects Directory
router.get(
  '/subjects',
  asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ status: 'Active' }).sort({ name: 1 });
    res.json({ success: true, subjects });
  })
);

// Public Featured Alumni
router.get(
  '/alumni',
  asyncHandler(async (req, res) => {
    const alumni = await Alumni.find({ is_active: { $ne: false } }).sort({ is_featured: -1, display_order: 1 });
    res.json({ success: true, alumni });
  })
);

export default router;
