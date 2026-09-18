import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import FeePayment from '../models/FeePayment.js';

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    // ✅ All queries run in PARALLEL — 4x faster than sequential
    const [
      totalStudents,
      activeStudentsList,
      totalSubjects,
      payments,
      recentRegistrations,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.find({ status: 'Active' })
        .select('_id feesPaid paidTillMonth monthlyFee feeDueDate')  // Only needed fields
        .lean(),                                                       // Plain JS objects — faster
      Subject.countDocuments(),
      FeePayment.find({ monthYear: currentMonthStr })
        .select('student amountPaid monthYear')
        .lean(),
      Student.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Total fees collected (all time) — separate aggregation query
    const totalFeesAgg = await FeePayment.aggregate([
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const totalFeesCollected = totalFeesAgg[0]?.total || 0;
    const thisMonthCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    const paidStudentIds = new Set(payments.map((p) => String(p.student)));

    const unpaidStudents = activeStudentsList.filter(
      (s) => !s.feesPaid && s.paidTillMonth !== currentMonthStr && !paidStudentIds.has(String(s._id))
    );
    const paidStudents = activeStudentsList.filter(
      (s) => s.feesPaid || s.paidTillMonth === currentMonthStr || paidStudentIds.has(String(s._id))
    );

    const activeStudents = activeStudentsList.length;
    const paidStudentsCount = paidStudents.length;
    const pendingStudentsCount = unpaidStudents.length;
    const pendingFeeAmount = unpaidStudents.reduce((acc, s) => acc + (s.monthlyFee || 2500), 0);
    const monthlyTarget = activeStudentsList.reduce((acc, s) => acc + (s.monthlyFee || 2500), 0);

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
        paidStudentsCount,
        pendingStudentsCount,
        paidPercentage: activeStudents ? Math.round((paidStudentsCount / activeStudents) * 100) : 0,
        pendingPercentage: activeStudents ? Math.round((pendingStudentsCount / activeStudents) * 100) : 0,
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
