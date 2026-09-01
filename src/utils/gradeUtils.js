/**
 * Grade Management System Utilities
 * Assessment Components:
 * - Mid-Term: 50 marks
 * - Assignment: 20 marks
 * - Final Exam: 100 marks
 * - Internal: 25 marks
 * Total Raw Max: 195 marks
 */

export const MAX_MARKS_CONFIG = {
  midTerm: 50,
  assignment: 20,
  finalExam: 100,
  internal: 25,
  totalRawMax: 195,
};

export const GRADE_SCALE = [
  { minPct: 90, grade: 'A+', label: 'Outstanding (A+)', bgClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { minPct: 80, grade: 'A', label: 'Excellent (A)', bgClass: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { minPct: 70, grade: 'B+', label: 'Very Good (B+)', bgClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { minPct: 60, grade: 'B', label: 'Good (B)', bgClass: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { minPct: 50, grade: 'C', label: 'Satisfactory (C)', bgClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { minPct: 40, grade: 'D', label: 'Pass (D)', bgClass: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
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
 * Full breakdown calculation for the 4 component marks:
 * - Mid-Term (max 50)
 * - Assignment (max 20)
 * - Final Exam (max 100)
 * - Internal (max 25)
 * Returns: { midTerm, assignment, finalExam, internal, rawTotal, totalMax, converted100, grade }
 */
export const calculateGradeBreakdown = (marksObj = {}) => {
  const midTerm = Math.max(0, Math.min(MAX_MARKS_CONFIG.midTerm, Number(marksObj.midTermMarks ?? marksObj.midTerm) || 0));
  const assignment = Math.max(0, Math.min(MAX_MARKS_CONFIG.assignment, Number(marksObj.assignmentMarks ?? marksObj.assignment) || 0));
  const finalExam = Math.max(0, Math.min(MAX_MARKS_CONFIG.finalExam, Number(marksObj.finalExamMarks ?? marksObj.finalExam ?? marksObj.theoryMarks) || 0));
  const internal = Math.max(0, Math.min(MAX_MARKS_CONFIG.internal, Number(marksObj.internalMarks ?? marksObj.internal ?? marksObj.practicalMarks) || 0));

  const rawTotal = midTerm + assignment + finalExam + internal;
  const totalMax = MAX_MARKS_CONFIG.totalRawMax; // 195
  
  // Automatic conversion to 100 marks scale
  const converted100 = Number(((rawTotal / totalMax) * 100).toFixed(1));
  const grade = calculateGrade(converted100);

  return {
    midTerm,
    assignment,
    finalExam,
    internal,
    rawTotal,
    totalMax,
    converted100,
    grade,
  };
};
