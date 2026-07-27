import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    rollNumber: String,
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Marks', 'Attendance', 'Fee', 'Announcement', 'Performance'],
      default: 'Announcement',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
