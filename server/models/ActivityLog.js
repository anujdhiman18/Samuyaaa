const mongoose = require('mongoose');

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

module.exports = mongoose.model('ActivityLog', activityLogSchema);
