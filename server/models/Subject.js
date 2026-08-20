import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    className: {
      type: String,
      required: [true, 'Class is required'],
      default: '10th',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teacherName: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    batchTime: {
      type: String,
      default: '5:00 PM - 6:30 PM',
    },
    totalEnrolled: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
export default Subject;
