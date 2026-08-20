import mongoose from 'mongoose';

const smsNotificationLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    studentId: String,
    studentName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    notificationType: {
      type: String,
      enum: ['Attendance', 'GradePublished', 'GradeUpdated', 'AccountUpdate'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    triggeredBy: {
      type: String,
      default: 'System',
    },
    relatedRecordId: String,
    eventKey: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    providerMessageId: String,
    errorMessage: String,
    sentAt: Date,
  },
  { timestamps: true }
);

const SMSNotificationLog =
  mongoose.models.SMSNotificationLog || mongoose.model('SMSNotificationLog', smsNotificationLogSchema);

export default SMSNotificationLog;
