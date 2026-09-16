import Notification from '../models/Notification.js';

// @desc    Get notifications for user / student / role
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const { studentId, recipientId, role } = req.query;
    const query = {};

    if (studentId) {
      query.$or = [{ student: studentId }, { recipientId: studentId }, { recipientRole: 'All' }, { recipientRole: 'Student' }];
    } else if (recipientId) {
      query.$or = [{ recipientId }, { recipientRole: 'All' }, { recipientRole: role || 'Student' }];
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create notification
// @route   POST /api/notifications
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, student, recipientId, recipientRole, link } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'Announcement',
      student,
      recipientId: recipientId || '',
      recipientRole: recipientRole || 'Student',
      link: link || '',
      isRead: false,
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
