import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: 'Unknown User',
    },
    userRole: {
      type: String,
      default: 'Faculty',
    },
    action: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'GENERAL',
    },
    details: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'DENIED', 'WARNING', 'FAILED'],
      default: 'SUCCESS',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

