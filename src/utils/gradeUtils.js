/**
 * Grade Management System Utilities
 * Assessment Components:
 * - Internal Assessment 1: 25 marks
 * - Mid-Term Practical: 50 marks
 * - Assignment Score: 20 marks
 * - Final Term Board Prep: 100 marks
 * - Entrance Exam – New Students: 25 marks (Standalone)
 * Total Raw Max: 195 marks
 */

export const MAX_MARKS_CONFIG = {
  midTerm: 50,
  assignment: 20,
  finalExam: 100,
  internal: 25,
  entranceExam: 25,
  totalRawMax: 195,
};

export const ASSESSMENT_TYPES_CONFIG = {
  'Internal Assessment 1': {
    key: 'internal',
    field: 'internalMarks',
    label: 'Internal Assessment 1',
    max: 25,
    description: 'Continuous classroom evaluation & internal assessment',
  },
  'Mid-Term Practical': {
    key: 'midTerm',
    field: 'midTermMarks',
    label: 'Mid-Term Practical',
    max: 50,
    description: 'Mid-term practical & lab experimentation score',
  },
  'Assignment Score': {
    key: 'assignment',
    field: 'assignmentMarks',
    label: 'Assignment Score',
    max: 20,
    description: 'Homework, projects & subject assignment score',
  },
  'Final Term Board Prep': {
    key: 'finalExam',
    field: 'finalExamMarks',
    label: 'Final Term Board Prep',
    max: 100,
    description: 'Final term examination & board prep mock test',
  },
  'Entrance Exam – New Students': {
    key: 'entranceExam',
    field: 'entranceExamMarks',
    label: 'Entrance Exam – New Students',
    max: 25,
    cutoffPct: 40, // 40% cutoff (10/25)
    description: 'Evaluation test for new/incoming students prior to enrollment',
    isStandalone: true,
  },
};

export const GRADE_SCALE = [
  { minPct: 90, grade: 'A+', label: 'Outstanding (A+)', bgClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { minPct: 80, grade: 'A', label: 'Excellent (A)', bgClass: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { minPct: 70, grade: 'B+', label: 'Very Good (B+)', bgClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { minPct: 60, grade: 'B', label: 'Good (B)', bgClass: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { minPct: 50, grade: 'C', label: 'Satisfactory (C)', bgClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { minPct: 35, grade: 'D', label: 'Pass (D)', bgClass: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { minPct: 0, grade: 'F', label: 'Fail (F)', bgClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
];

/**
 * Calculate letter grade based on percentage (0 - 100)
 */
export const calculateGrade = (pct) => {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  for (const scale of GRADE_SCALE) {
    if (p >= scale.minPct) {
      return scale.grade;
    }
  }
  return 'F';
};

/**
 * Get grade metadata object (badge classes, labels)
 */
export const getGradeMeta = (gradeLetter) => {
  const target = GRADE_SCALE.find((g) => g.grade === gradeLetter);
  return target || { grade: gradeLetter || 'F', label: 'Fail (F)', bgClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
};

/**
 * Entrance Exam result calculation (cutoff 40% = 10/25)
 */
export const calculateEntranceExamResult = (obtainedMarks, maxMarks = 25, cutoffPct = 40) => {
  const obtained = Math.max(0, Math.min(maxMarks, Number(obtainedMarks) || 0));
  const pct = Number(((obtained / maxMarks) * 100).toFixed(1));
  const isQualified = pct >= cutoffPct;

  return {
    obtained,
    max: maxMarks,
    pct,
    result: isQualified ? 'Qualified' : 'Not Qualified',
    bgClass: isQualified
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  };
};

/**
 * Full breakdown calculation for the 4 standard component marks (Excludes Entrance Exam):
 * Returns: { internal, midTerm, assignment, finalExam, rawTotal, totalMax, converted100, grade }
 */
export const calculateGradeBreakdown = (marksObj = {}) => {
  const marksByType = marksObj.marksByType || {};

  const internal = Math.max(
    0,
    Math.min(
      25,
      Number(
        marksByType['Internal Assessment 1']?.obtained ??
          marksObj.internalMarks ??
          marksObj.internal ??
          marksObj.practicalMarks
      ) || 0
    )
  );

  const midTerm = Math.max(
    0,
    Math.min(
      50,
      Number(
        marksByType['Mid-Term Practical']?.obtained ??
          marksObj.midTermMarks ??
          marksObj.midTerm
      ) || 0
    )
  );

  const assignment = Math.max(
    0,
    Math.min(
      20,
      Number(
        marksByType['Assignment Score']?.obtained ??
          marksObj.assignmentMarks ??
          marksObj.assignment
      ) || 0
    )
  );

  const finalExam = Math.max(
    0,
    Math.min(
      100,
      Number(
        marksByType['Final Term Board Prep']?.obtained ??
          marksObj.finalExamMarks ??
          marksObj.finalExam ??
          marksObj.theoryMarks
      ) || 0
    )
  );

  const rawTotal = internal + midTerm + assignment + finalExam;
  const totalMax = MAX_MARKS_CONFIG.totalRawMax; // 195
  
  // Automatic conversion to 100 marks scale
  const converted100 = Number(((rawTotal / totalMax) * 100).toFixed(1));
  const grade = calculateGrade(converted100);

  return {
    internal,
    midTerm,
    assignment,
    finalExam,
    rawTotal,
    totalMax,
    converted100,
    grade,
  };
};
