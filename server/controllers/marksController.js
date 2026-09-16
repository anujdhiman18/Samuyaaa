import Marks from '../models/Marks.js';
import Student from '../models/Student.js';

// @desc    Get marks records (by studentId, subject, examName, className)
// @route   GET /api/marks
export const getMarks = async (req, res) => {
  try {
    const { studentId, subject, examName, className } = req.query;
    const query = {};

    if (studentId) {
      query.student = studentId;
    }

    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    if (examName && examName !== 'All') {
      query.examName = examName;
    }

    if (className && className !== 'All') {
      query.className = className;
    }

    const marks = await Marks.find(query)
      .populate('student', 'fullName rollNumber className admissionNumber course batch')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: marks.length, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student marks report by Student ID / Roll Number
// @route   GET /api/marks/student/:id
export const getStudentMarks = async (req, res) => {
  try {
    const { id } = req.params;
    let query = { student: id };

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const st = await Student.findOne({ $or: [{ rollNumber: id }, { admissionNumber: id }] });
      if (st) {
        query = { student: st._id };
      }
    }

    const marks = await Marks.find(query).sort({ createdAt: -1 });

    // Calculate aggregated GPA / Performance stats
    let totalObtained = 0;
    let totalMax = 0;

    marks.forEach((m) => {
      totalObtained += Number(m.obtainedMarks) || 0;
      totalMax += Number(m.maxMarks) || 100;
    });

    const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      marks,
      stats: {
        totalExams: marks.length,
        totalObtained,
        totalMax,
        overallPercentage: Number(overallPercentage),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record / Upload single or bulk marks
// @route   POST /api/marks
export const recordMarks = async (req, res) => {
  try {
    const { studentId, rollNumber, studentName, className, examName, subject, marksByType, obtainedMarks, maxMarks, grade, percentage } = req.body;

    if (!studentId || !examName || !subject) {
      return res.status(400).json({ success: false, message: 'Student, Exam Name, and Subject are required' });
    }

    let student = await Student.findById(studentId);
    if (!student && rollNumber) {
      student = await Student.findOne({ rollNumber });
    }

    const calculatedMax = Number(maxMarks) || 100;
    const calculatedObtained = Number(obtainedMarks) || 0;
    const calculatedPct = percentage || (calculatedMax > 0 ? (calculatedObtained / calculatedMax) * 100 : 0);

    const markEntry = await Marks.create({
      student: student ? student._id : studentId,
      rollNumber: rollNumber || student?.rollNumber || 'N/A',
      studentName: studentName || student?.fullName || 'N/A',
      className: className || student?.className || '10th',
      examName,
      subject,
      marksByType: marksByType || {},
      obtainedMarks: calculatedObtained,
      maxMarks: calculatedMax,
      percentage: Number(calculatedPct.toFixed(1)),
      grade: grade || (calculatedPct >= 90 ? 'A+' : calculatedPct >= 80 ? 'A' : calculatedPct >= 70 ? 'B+' : calculatedPct >= 60 ? 'B' : 'C'),
    });

    res.status(201).json({ success: true, mark: markEntry, message: 'Marks recorded successfully in database' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
