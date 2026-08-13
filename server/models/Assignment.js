import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: String,
    rollNumber: String,
    fileUrl: String,
    fileName: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Graded', 'Pending'],
      default: 'Submitted',
    },
  },
  { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    subject: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
      enum: ['S1', 'S2', 'S3', 'S4'],
      default: 'S2',
    },
    facultyId: {
      type: String,
      required: true,
    },
    facultyName: String,
    dueDate: {
      type: String,
      required: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
export default Assignment;
