import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      default: '',
    },
    className: {
      type: String,
      required: [true, 'Class is required'],
      default: 'Class S2',
      trim: true,
    },
    category: {
      type: String,
      default: 'Foundation',
      trim: true,
    },
    categoryCode: {
      type: String,
      enum: ['S1', 'S2', 'S3', 'S4'],
      default: 'S2',
      trim: true,
    },
    stream: {
      type: String,
      default: 'CBSE Board',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    teacherName: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
      default: 'Jitender Sharma',
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    batchTime: {
      type: String,
      default: '5:00 PM – 6:30 PM',
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 20,
      min: 1,
    },
    totalEnrolled: {
      type: Number,
      default: 0,
    },
    branch: {
      type: String,
      default: 'Main Center (Bagru)',
      trim: true,
    },
    academicSession: {
      type: String,
      default: '2025-2026',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, categoryCode: 1, isActive: 1 });
subjectSchema.index({ teacherName: 1, isActive: 1 });
subjectSchema.index({ branch: 1, isActive: 1 });

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
export default Subject;
