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
    targetClass: {
      type: String,
      required: [true, 'Class/Grade applying for is required'],
      enum: ['S1', 'S2', 'S3', 'S4'],
      default: 'S2',
      trim: true,
    },
    branch: {
      type: String,
      enum: ['Bagru', 'Daroh'],
      default: 'Bagru',
      required: [true, 'Preferred branch is required'],
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
