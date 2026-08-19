import mongoose from 'mongoose';

const studentLeaveSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: 's_demo',
    },
    admissionNo: {
      type: String,
      default: 'ADM-2025-089',
    },
    studentName: {
      type: String,
      default: 'Varun Sharma',
    },
    parentPhone: {
      type: String,
      default: '9816099999',
    },
    className: {
      type: String,
      enum: ['S1', 'S2', 'S3', 'S4'],
      default: 'S2',
    },
    section: {
      type: String,
      default: 'Section A',
    },
    branch: {
      type: String,
      default: 'Main Center',
    },
    leaveType: {
      type: String,
      default: 'Sick Leave',
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    endDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    numberOfDays: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      default: 'Leave requested',
    },
    supportingDocument: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminRemarks: {
      type: String,
      default: '',
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const StudentLeave = mongoose.models.StudentLeave || mongoose.model('StudentLeave', studentLeaveSchema);
export default StudentLeave;
