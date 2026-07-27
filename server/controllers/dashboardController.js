import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import FeePayment from '../models/FeePayment.js';

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    const totalSubjects = await Subject.countDocuments();

    const payments = await FeePayment.find();
    const totalFeesCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    const students = await Student.find({ status: 'Active' });
    const monthlyTarget = students.reduce((acc, s) => acc + (s.monthlyFee || 0), 0);

    const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const thisMonthPayments = payments.filter((p) => p.monthYear === currentMonthStr);
    const thisMonthCollected = thisMonthPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    const pendingFeeAmount = Math.max(0, monthlyTarget - thisMonthCollected);

    const recentRegistrations = await Student.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalSubjects,
        totalFeesCollected,
        pendingFeePayments: pendingFeeAmount,
        thisMonthCollected,
        monthlyTarget,
      },
      recentRegistrations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Fee Reminders (Overdue, Due Today, Due Next 3 Days)
// @route   GET /api/dashboard/reminders
export const getFeeReminders = async (req, res) => {
  try {
    const todayDate = new Date().getDate();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const activeStudents = await Student.find({ status: 'Active' });

    const todayDue = [];
    const nextThreeDaysDue = [];
    const overdue = [];

    activeStudents.forEach((student) => {
      const isPaid = student.paidTillMonth === currentMonth;

      if (!isPaid) {
        const dueDate = student.feeDueDate || 5;

        if (todayDate > dueDate) {
          overdue.push(student);
        } else if (todayDate === dueDate) {
          todayDue.push(student);
        } else if (dueDate - todayDate <= 3 && dueDate - todayDate > 0) {
          nextThreeDaysDue.push(student);
        }
      }
    });

    res.json({
      success: true,
      reminders: {
        todayDue,
        nextThreeDaysDue,
        overdue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Global Search (Students, Subjects, Roll Number, Phone)
// @route   GET /api/dashboard/search
export const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ success: true, students: [], subjects: [] });
    }

    const students = await Student.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { rollNumber: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { parentPhone: { $regex: query, $options: 'i' } },
      ],
    }).limit(5);

    const subjects = await Subject.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { teacherName: { $regex: query, $options: 'i' } },
      ],
    }).limit(5);

    res.json({
      success: true,
      students,
      subjects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
