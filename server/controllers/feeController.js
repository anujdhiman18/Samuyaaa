import FeePayment from '../models/FeePayment.js';
import Student from '../models/Student.js';

// @desc    Get fee payments and statistics
// @route   GET /api/fees
export const getFeePayments = async (req, res) => {
  try {
    const { studentId, search, monthYear } = req.query;
    const query = {};

    if (studentId) {
      query.student = studentId;
    }

    if (monthYear) {
      query.monthYear = monthYear;
    }

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const payments = await FeePayment.find(query).populate('student').sort({ paymentDate: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record fee payment
// @route   POST /api/fees
export const recordFeePayment = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMode, transactionId, monthYear, remarks } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const monthlyFee = student.monthlyFee;
    const pendingAmount = Math.max(0, monthlyFee - Number(amountPaid));

    // Generate unique receipt number
    const count = await FeePayment.countDocuments();
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await FeePayment.create({
      student: student._id,
      studentName: student.fullName,
      rollNumber: student.rollNumber,
      className: student.className,
      amountPaid: Number(amountPaid),
      monthlyFee,
      pendingAmount,
      monthYear: monthYear || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      paymentMode: paymentMode || 'UPI',
      transactionId: transactionId || '',
      receiptNumber,
      remarks: remarks || 'Tuition fee',
    });

    // Update student paid month
    student.paidTillMonth = payment.monthYear;
    await student.save();

    res.status(201).json({ success: true, payment, message: 'Fee payment recorded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get Fee Statistics
// @route   GET /api/fees/stats
export const getFeeStats = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Active' });
    const totalStudents = students.length;

    const totalMonthlyTarget = students.reduce((acc, s) => acc + (s.monthlyFee || 0), 0);

    const payments = await FeePayment.find();
    const totalFeesCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    // Calculate current month statistics
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const currentMonthPayments = payments.filter((p) => p.monthYear === currentMonth);

    const currentMonthCollected = currentMonthPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    const pendingFeePayments = Math.max(0, totalMonthlyTarget - currentMonthCollected);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalMonthlyTarget,
        totalFeesCollected,
        currentMonthCollected,
        pendingFeePayments,
        paidStudentsCount: currentMonthPayments.length,
        pendingStudentsCount: Math.max(0, totalStudents - currentMonthPayments.length),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
