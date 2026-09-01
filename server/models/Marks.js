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
    className: String,
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    subjectId: {
      type: String,
      trim: true,
    },
    // Entrance Exam Data Model for new/prospective incoming students
    entranceExam: {
      applicantId: String,
      name: String,
      obtained: { type: Number, default: 0, min: 0, max: 25 },
      percentage: { type: Number, default: 0 },
      result: { type: String, enum: ['Qualified', 'Not Qualified'], default: 'Not Qualified' },
      admitted: { type: Boolean, default: false },
    },
    entranceExamMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 25,
    },
    // Map storing independent assessment types:
    // "Internal Assessment 1": { obtained, max: 25 }
    // "Mid-Term Practical": { obtained, max: 50 }
    // "Assignment Score": { obtained, max: 20 }
    // "Final Term Board Prep": { obtained, max: 100 }
    // "Entrance Exam – New Students": { obtained, max: 25 }
    marksByType: {
      type: Map,
      of: {
        obtained: Number,
        max: Number,
      },
      default: {},
    },
    // Individual Evaluation Components
    midTermPracticalMarks: {
      type: Number,
      default: 0,
      min: [0, 'Mid-Term Practical marks cannot be negative'],
      max: [50, 'Mid-Term Practical marks cannot exceed 50'],
    },
    assignmentMarks: {
      type: Number,
      default: 0,
      min: [0, 'Assignment marks cannot be negative'],
      max: [20, 'Assignment marks cannot exceed 20'],
    },
    finalExamMarks: {
      type: Number,
      default: 0,
      min: [0, 'Final Exam marks cannot be negative'],
      max: [100, 'Final Exam marks cannot exceed 100'],
    },
    internalAssessmentMarks: {
      type: Number,
      default: 0,
      min: [0, 'Internal Assessment marks cannot be negative'],
      max: [25, 'Internal Assessment marks cannot exceed 25'],
    },
    rawTotal: {
      type: Number,
      default: 0,
    },
    totalMaxPossible: {
      type: Number,
      default: 195,
    },
    convertedScore: {
      type: Number,
      default: 0,
    },
    maxMarks: {
      type: Number,
      default: 195,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: 'F',
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedBy: {
      type: String,
      default: 'Faculty Member',
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

marksSchema.pre('save', function (next) {
  // Entrance exam standalone calculation
  if (this.entranceExamMarks !== undefined || (this.entranceExam && this.entranceExam.obtained !== undefined)) {
    const entranceObtained = Math.max(0, Math.min(25, Number(this.entranceExamMarks ?? this.entranceExam?.obtained) || 0));
    const entrancePct = Number(((entranceObtained / 25) * 100).toFixed(1));
    const isQualified = entrancePct >= 40;

    this.entranceExamMarks = entranceObtained;
    this.entranceExam = {
      applicantId: this.entranceExam?.applicantId || this.rollNumber || 'APP-2026-001',
      name: this.entranceExam?.name || this.studentName || 'New Applicant',
      obtained: entranceObtained,
      percentage: entrancePct,
      result: isQualified ? 'Qualified' : 'Not Qualified',
      admitted: Boolean(this.entranceExam?.admitted),
    };
  }

  // Sync individual component fields with marksByType map if populated
  if (this.marksByType) {
    const map = this.marksByType;
    if (map.get && map.get('Internal Assessment 1')) {
      this.internalAssessmentMarks = Math.max(0, Math.min(25, Number(map.get('Internal Assessment 1').obtained) || 0));
    }
    if (map.get && map.get('Mid-Term Practical')) {
      this.midTermPracticalMarks = Math.max(0, Math.min(50, Number(map.get('Mid-Term Practical').obtained) || 0));
    }
    if (map.get && map.get('Assignment Score')) {
      this.assignmentMarks = Math.max(0, Math.min(20, Number(map.get('Assignment Score').obtained) || 0));
    }
    if (map.get && map.get('Final Term Board Prep')) {
      this.finalExamMarks = Math.max(0, Math.min(100, Number(map.get('Final Term Board Prep').obtained) || 0));
    }
    if (map.get && map.get('Entrance Exam – New Students')) {
      this.entranceExamMarks = Math.max(0, Math.min(25, Number(map.get('Entrance Exam – New Students').obtained) || 0));
    }
  }

  // Clamp & calculate raw total for 4 regular components (Entrance Exam is excluded from raw total / 195)
  const midTerm = Math.max(0, Math.min(50, Number(this.midTermPracticalMarks) || 0));
  const assignment = Math.max(0, Math.min(20, Number(this.assignmentMarks) || 0));
  const finalExam = Math.max(0, Math.min(100, Number(this.finalExamMarks) || 0));
  const internal = Math.max(0, Math.min(25, Number(this.internalAssessmentMarks) || 0));

  this.rawTotal = midTerm + assignment + finalExam + internal;
  this.obtainedMarks = this.rawTotal;
  this.totalMaxPossible = 195;
  this.maxMarks = 195;

  // Formula: convertedScore = (rawTotal / totalMaxPossible) * 100
  this.convertedScore = Number(((this.rawTotal / 195) * 100).toFixed(1));
  this.percentage = this.convertedScore;

  // Sync back into marksByType map
  this.marksByType = {
    'Internal Assessment 1': { obtained: internal, max: 25 },
    'Mid-Term Practical': { obtained: midTerm, max: 50 },
    'Assignment Score': { obtained: assignment, max: 20 },
    'Final Term Board Prep': { obtained: finalExam, max: 100 },
    'Entrance Exam – New Students': { obtained: this.entranceExamMarks, max: 25 },
  };

  // Grade calculation (A+: 90-100, A: 80-89, B+: 70-79, B: 60-69, C: 50-59, D: 35-49, F: <35)
  if (this.convertedScore >= 90) this.grade = 'A+';
  else if (this.convertedScore >= 80) this.grade = 'A';
  else if (this.convertedScore >= 70) this.grade = 'B+';
  else if (this.convertedScore >= 60) this.grade = 'B';
  else if (this.convertedScore >= 50) this.grade = 'C';
  else if (this.convertedScore >= 35) this.grade = 'D';
  else this.grade = 'F';

  next();
});

const Marks = mongoose.models.Marks || mongoose.model('Marks', marksSchema);
export default Marks;
