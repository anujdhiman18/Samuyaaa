import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// GET all approved feedback / reviews
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST submit new feedback from anyone
router.post('/', async (req, res) => {
  try {
    const { name, role, quote, stars } = req.body;
    if (!name || !role || !quote) {
      return res.status(400).json({ success: false, message: 'Name, Role, and Message are required' });
    }

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const feedback = await Feedback.create({
      name,
      role,
      quote,
      stars: Number(stars) || 5,
      initials,
      isApproved: true,
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
