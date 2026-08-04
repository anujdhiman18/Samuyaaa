import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Assignment from '../models/Assignment.js';
import StudyMaterial from '../models/StudyMaterial.js';
import FacultyLeave from '../models/FacultyLeave.js';
import Announcement from '../models/Announcement.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'saumyaa_jwt_secret_key_2026';

// @desc    Faculty Login Endpoint
// @route   POST /api/faculty-panel/login
export const facultyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find faculty by email or demo lookup
    let faculty = await Faculty.findOne({ email: email ? email.toLowerCase() : '' });
    if (!faculty && (email === 'jitender.sharma@saumyaa.edu.in' || email === 'faculty@saumyaa.edu.in' || !email)) {
      faculty = await Faculty.findOne();
    }

    if (!faculty) {
      // Mock Fallback User for initial setup
      faculty = {
        _id: 'f_jitender',
        id: 'f_jitender',
        name: 'Prof. Jitender Sharma',
        email: email || 'jitender.sharma@saumyaa.edu.in',
        role: 'Faculty',
        designation: 'Senior Mathematics & Physics Faculty',
        department: 'Science & Mathematics',
        assignedClasses: ['10th', '11th (+1)', '12th (+2)'],
        assignedSubjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    }

    const token = jwt.sign(
      { id: faculty._id || faculty.id, role: 'Faculty', email: faculty.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const derivedClasses = faculty.responsibilities && faculty.responsibilities.length > 0
      ? Array.from(new Set(faculty.responsibilities.map((r) => r.className)))
      : (faculty.assignedClasses || []);

    const derivedSubjects = faculty.responsibilities && faculty.responsibilities.length > 0
      ? Array.from(new Set(faculty.responsibilities.map((r) => r.subject)))
      : (faculty.assignedSubjects || []);

    res.json({
      success: true,
      token,
      user: {
        _id: faculty._id || faculty.id,
        id: faculty._id || faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: 'Faculty',
        designation: faculty.designation,
        department: faculty.department,
        responsibilities: faculty.responsibilities || [],
        assignedClasses: derivedClasses,
        assignedSubjects: derivedSubjects,
        photo_url: faculty.photo_url,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Faculty Dashboard Stats & Summary Cards
// @route   GET /api/faculty-panel/dashboard
export const getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.user?.id || 'f_jitender';
    const faculty = await Faculty.findById(facultyId);
    const responsibilities = faculty?.responsibilities || [];

    const assignedClasses = Array.from(new Set(responsibilities.map((r) => r.className)));

    // 1. Total assigned students
    const totalStudents = assignedClasses.length > 0
      ? await Student.countDocuments({ className: { $in: assignedClasses } })
      : 0;

    // 2. Pending grading
    const assignments = await Assignment.find({ facultyId });
    let pendingGradingCount = 0;
    assignments.forEach((a) => {
      a.submissions?.forEach((s) => {
        if (s.status === 'Submitted') pendingGradingCount++;
      });
    });

    // 3. Active announcements
    const announcements = assignedClasses.length > 0
      ? await Announcement.find({
          $or: [{ targetClass: 'All' }, { targetClass: { $in: assignedClasses } }],
        }).sort({ createdAt: -1 }).limit(5)
      : [];

    // 4. Timetable Slots dynamically built from real assigned responsibilities
    const todayTimetable = responsibilities.map((r, idx) => ({
      id: r.id || r._id || `t_${idx}`,
      time: idx === 0 ? '09:00 AM - 10:30 AM' : idx === 1 ? '11:00 AM - 12:30 PM' : '02:00 PM - 03:30 PM',
      className: `Class ${r.className} (${r.section || 'Sec A'})`,
      subject: r.subject,
      room: `Hall ${String.fromCharCode(65 + (idx % 4))}`,
    }));

    const derivedSubjects = Array.from(new Set(responsibilities.map((r) => r.subject)));

    res.json({
      success: true,
      user: faculty ? {
        _id: faculty._id || faculty.id,
        id: faculty._id || faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: 'Faculty',
        designation: faculty.designation,
        department: faculty.department,
        responsibilities,
        assignedClasses,
        assignedSubjects: derivedSubjects,
        photo_url: faculty.photo_url,
      } : null,
      stats: {
        todayClassesCount: todayTimetable.length,
        totalAssignedStudents: totalStudents,
        pendingAttendanceCount: responsibilities.length > 0 ? 1 : 0,
        pendingGradingCount: pendingGradingCount,
        activeAnnouncementsCount: announcements.length,
      },
      todayTimetable,
      announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Assigned Students (Read-only for Faculty)
// @route   GET /api/faculty-panel/students
export const getAssignedStudents = async (req, res) => {
  try {
    const { className, search } = req.query;
    const facultyId = req.user?.id;
    const faculty = await Faculty.findById(facultyId);
    const responsibilities = faculty?.responsibilities || [];
    const assignedClasses = Array.from(new Set(responsibilities.map((r) => r.className)));

    if (assignedClasses.length === 0) {
      return res.json({ success: true, students: [] });
    }

    const query = { className: { $in: assignedClasses } };
    if (className && className !== 'All') {
      query.className = className;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query).select('-password');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get & Save Faculty Assignments
// @route   GET / POST /api/faculty-panel/assignments
export const getAssignments = async (req, res) => {
  try {
    const facultyId = req.user?.id || 'f_jitender';
    const assignments = await Assignment.find({ facultyId }).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const facultyId = req.user?.id || 'f_jitender';
    const assignment = await Assignment.create({ ...req.body, facultyId });
    res.status(201).json({ success: true, assignment, message: 'Assignment created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Grade Student Submission
// @route   POST /api/faculty-panel/assignments/:id/grade
export const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionId, score, feedback } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const sub = assignment.submissions.id(submissionId);
    if (sub) {
      sub.score = Number(score);
      sub.feedback = feedback || '';
      sub.status = 'Graded';
      await assignment.save();
    }

    res.json({ success: true, message: 'Submission graded successfully', assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Study Materials API
// @route   GET / POST /api/faculty-panel/materials
export const getStudyMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find().sort({ uploadedAt: -1 });
    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadStudyMaterial = async (req, res) => {
  try {
    const facultyId = req.user?.id || 'f_jitender';
    const material = await StudyMaterial.create({ ...req.body, facultyId });
    res.status(201).json({ success: true, material, message: 'Study material published successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Faculty Leave Applications
// @route   GET / POST /api/faculty-panel/leaves
export const getFacultyLeaves = async (req, res) => {
  try {
    const leaves = await FacultyLeave.find().sort({ createdAt: -1 });
    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyFacultyLeave = async (req, res) => {
  try {
    const facultyId = req.body.facultyId || req.user?._id || req.user?.id || 'f_jitender';
    const employeeId = req.body.employeeId || req.user?.employeeId || 'EMP-2025-014';
    const facultyName = req.body.facultyName || req.user?.name || req.user?.fullName || 'Prof. Jitender Sharma';
    const facultyEmail = req.body.facultyEmail || req.user?.email || 'jitender.sharma@saumyaa.edu.in';
    const department = req.body.department || req.user?.department || 'Science & Mathematics';
    const branch = req.body.branch || req.user?.branch || 'Bagru';
    const leaveType = req.body.leaveType || 'Casual Leave';
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
    const endDate = req.body.endDate || new Date().toISOString().split('T')[0];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const numberOfDays = req.body.numberOfDays || (isNaN(diffDays) ? 1 : diffDays);

    const reason = req.body.reason || 'Leave requested';
    const supportingDocument = req.body.supportingDocument || req.body.documentUrl || '';

    const leave = await FacultyLeave.create({
      facultyId,
      employeeId,
      facultyName,
      facultyEmail,
      department,
      branch,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      supportingDocument,
      status: 'Pending',
    });

    res.status(201).json({ success: true, leave, message: 'Leave application submitted successfully' });
  } catch (error) {
    console.error('applyFacultyLeave Mongo Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
