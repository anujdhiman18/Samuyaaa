import mongoose from 'mongoose';

const facultyLeaveSchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      default: 'f_jitender',
    },
    facultyName: {
      type: String,
      default: 'Prof. Jitender Sharma',
    },
    facultyEmail: {
      type: String,
      default: 'jitender.sharma@saumyaa.edu.in',
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
    reason: {
      type: String,
      default: 'Leave requested',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
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
