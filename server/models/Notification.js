import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      trim: true,
      default: '',
    },
    recipientRole: {
      type: String,
      enum: ['Student', 'Faculty', 'Admin', 'SuperAdmin', 'All'],
      default: 'Student',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    rollNumber: String,
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Marks', 'Attendance', 'Fee', 'Announcement', 'Performance', 'Leave', 'Profile', 'System'],
      default: 'Announcement',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ student: 1, createdAt: -1 });
notificationSchema.index({ faculty: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
