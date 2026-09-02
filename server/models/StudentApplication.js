import mongoose from 'mongoose';

const studentApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    dob: {
      type: String,
      default: '',
    },
    academicStage: {
      type: String,
      default: 'S2',
      trim: true,
    },
    currentClass: {
      type: String,
      default: '',
      trim: true,
    },
    targetClass: {
      type: String,
      default: 'S2',
      trim: true,
    },
    branch: {
      type: String,
      enum: ['Main Center (Bagru)', 'Branch (Daroh)', 'Main Center', 'Branch', 'Bagru', 'Daroh'],
      default: 'Main Center (Bagru)',
      required: [true, 'Preferred center is required'],
      trim: true,
    },
    subjects: {
      type: [String],
      default: [],
    },
    previousSchool: {
      type: String,
      default: '',
      trim: true,
    },
    parentName: {
      type: String,
      required: [true, 'Parent/Guardian name is required'],
      trim: true,
    },
    parentContact: {
      type: String,
      required: [true, 'Parent/Guardian contact number is required'],
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    nextEligibleDate: {
      type: Date,
      default: null,
    },
    lastApprovedRequestId: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    notificationHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        notes: String,
        sentTo: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const StudentApplication = mongoose.model('StudentApplication', studentApplicationSchema);

export default StudentApplication;
