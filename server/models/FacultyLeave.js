import mongoose from 'mongoose';

const facultyLeaveSchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['Casual Leave', 'Sick Leave', 'Duty Leave', 'Earned Leave'],
      default: 'Casual Leave',
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const FacultyLeave = mongoose.models.FacultyLeave || mongoose.model('FacultyLeave', facultyLeaveSchema);
export default FacultyLeave;
