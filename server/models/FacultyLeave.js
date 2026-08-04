import mongoose from 'mongoose';

const facultyLeaveSchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      default: 'f_jitender',
    },
    employeeId: {
      type: String,
      default: 'EMP-2025-014',
    },
    facultyName: {
      type: String,
      default: 'Prof. Jitender Sharma',
    },
    facultyEmail: {
      type: String,
      default: 'jitender.sharma@saumyaa.edu.in',
    },
    department: {
      type: String,
      default: 'Science & Mathematics',
    },
    branch: {
      type: String,
      default: 'Bagru',
    },
    leaveType: {
      type: String,
      default: 'Casual Leave',
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

const FacultyLeave = mongoose.models.FacultyLeave || mongoose.model('FacultyLeave', facultyLeaveSchema);
export default FacultyLeave;
