import mongoose from 'mongoose';

const feeReminderLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: String,
    parentPhone: String,
    email: String,
    amountDue: Number,
    monthYear: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    channel: {
      type: String,
      enum: ['WhatsApp', 'Email', 'SMS'],
      default: 'Email',
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
    message: String,
  },
  { timestamps: true }
);

const FeeReminderLog = mongoose.models.FeeReminderLog || mongoose.model('FeeReminderLog', feeReminderLogSchema);
export default FeeReminderLog;
