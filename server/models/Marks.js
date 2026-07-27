import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    rollNumber: String,
    studentName: String,
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    obtainedMarks: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      default: 'A',
    },
    percentage: {
      type: Number,
      default: 0,
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

marksSchema.pre('save', function (next) {
  if (this.maxMarks > 0) {
    this.percentage = Number(((this.obtainedMarks / this.maxMarks) * 100).toFixed(1));
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else this.grade = 'D';
  }
  next();
});

const Marks = mongoose.models.Marks || mongoose.model('Marks', marksSchema);
export default Marks;
