import express from 'express';
import { notifyDemoClassSchedule } from '../services/notificationService.js';

const router = express.Router();

/**
 * @desc    Send automated SMS & Email confirmation when a demo class is scheduled or updated
 * @route   POST /api/demo-bookings/notify-schedule
 * @access  Public / Admin
 */
router.post('/notify-schedule', async (req, res) => {
  try {
    const {
      studentName,
      phone,
      parentPhone,
      email,
      parentEmail,
      subject,
      className,
      class: rawClass,
      scheduledDate,
      scheduledTime,
      facultyMentor,
      meetingMode,
      branch,
      bookingId,
      notes,
    } = req.body;

    const contactPhone = phone || parentPhone;
    const contactEmail = email || parentEmail;
    const targetClass = className || rawClass || 'General';

    if (!contactPhone && !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'At least one contact method (Phone or Email) is required to notify student/parent.',
      });
    }

    const result = await notifyDemoClassSchedule({
      studentName: studentName || 'Student',
      phone: contactPhone,
      email: contactEmail,
      subject: subject || 'Demo Session',
      className: targetClass,
      scheduledDate,
      scheduledTime: scheduledTime || '04:30 PM',
      facultyMentor: facultyMentor || 'Jitender Sharma',
      meetingMode: meetingMode || 'Offline Classroom',
      branch: branch || 'Main Center (Bagru)',
      bookingId: bookingId || 'DM-DEMO',
      notes,
      triggeredBy: req.user?.name || 'Admin',
    });

    res.json({
      success: true,
      message: `Demo schedule notification dispatched for ${studentName}!`,
      details: result,
    });
  } catch (error) {
    console.error('[demoBookingRoutes] Error sending demo schedule notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
