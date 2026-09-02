import mongoose from 'mongoose';

const facultyProfileRequestSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.Mixed, // Supports ObjectId and string IDs (e.g. 'f_jitender')
      required: [true, 'Faculty ID is required'],
      ref: 'Faculty',
    },
    facultyName: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
    },
    facultyEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    currentValues: {
      type: Object,
      required: [true, 'Current values snapshot is required'],
    },
    requestedValues: {
      type: Object,
      required: [true, 'Requested change values are required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for profile change is required'],
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminComments: {
      type: String,
      default: '',
      trim: true,
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
    reviewedDate: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reviewedByName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for fast lookup by faculty and request date
facultyProfileRequestSchema.index({ facultyId: 1, requestDate: -1 });

const FacultyProfileRequest =
  mongoose.models.FacultyProfileRequest ||
  mongoose.model('FacultyProfileRequest', facultyProfileRequestSchema);

export default FacultyProfileRequest;
