import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: 'Unknown User',
    },
    userEmail: {
      type: String,
      default: '',
    },
    userRole: {
      type: String,
      default: 'Faculty',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Browser',
    },
    status: {
      type: String,
      enum: ['Success', 'Failed', 'Blocked'],
      default: 'Success',
    },
  },
  { timestamps: true }
);

const LoginHistory = mongoose.models.LoginHistory || mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;

