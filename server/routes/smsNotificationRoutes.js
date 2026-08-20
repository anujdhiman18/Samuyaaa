import express from 'express';
import SMSNotificationLog from '../models/SMSNotificationLog.js';
import Student from '../models/Student.js';
import { notificationService, processSMSDispatch } from '../services/notificationService.js';

const router = express.Router();

// POST /api/sms-notifications/dispatch - Dispatch SMS Notification
router.post('/dispatch', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      phoneNumber,
      notificationType,
      message,
      triggeredBy,
      relatedRecordId,
      eventKey,
    } = req.body;

    const result = await processSMSDispatch({
      studentId,
      studentObj: studentName ? { fullName: studentName, phone: phoneNumber } : null,
      notificationType: notificationType || 'GradePublished',
      message,
      triggeredBy: triggeredBy || 'Faculty',
      relatedRecordId,
      eventKeySuffix: eventKey || Date.now(),
    });

    return res.json(result);
  } catch (err) {
    console.error('Error in dispatching SMS:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sms-notifications - Get SMS Notification logs with filtering
router.get('/', async (req, res) => {
  try {
    const { search, type, status, limit = 100 } = req.query;
    const filter = {};

    if (type && type !== 'All') {
      filter.notificationType = type;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { studentName: regex },
        { phoneNumber: regex },
        { message: regex },
        { triggeredBy: regex },
      ];
    }

    const logs = await SMSNotificationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error('Error fetching SMS notification logs:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve SMS logs' });
  }
});

// POST /api/sms-notifications/retry/:id - Retry sending a failed SMS log
router.post('/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await notificationService.retrySMSNotification(id);
    return res.json(result);
  } catch (err) {
    console.error('Error retrying SMS notification:', err);
    return res.status(500).json({ success: false, message: 'Failed to retry SMS' });
  }
});

// PATCH /api/sms-notifications/preference/:studentId - Toggle SMS notifications ON/OFF for student
router.patch('/preference/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { enabled } = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { smsNotificationsEnabled: Boolean(enabled) },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    return res.json({
      success: true,
      message: `SMS notifications set to ${enabled ? 'ON' : 'OFF'} for ${student.fullName}`,
      smsNotificationsEnabled: student.smsNotificationsEnabled,
    });
  } catch (err) {
    console.error('Error updating student SMS preference:', err);
    return res.status(500).json({ success: false, message: 'Failed to update SMS preference' });
  }
});

export default router;
