import Student from '../models/Student.js';

// @desc    Get all students with filter, search, pagination
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, className, status } = req.query;

    const query = {};

    if (className && className !== 'All') {
      query.className = className;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({
      success: true,
      students,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create student
// @route   POST /api/students
export const createStudent = async (req, res) => {
  try {
    let { rollNumber, className } = req.body;

    // Auto-generate sequential Roll Number if missing or blank
    if (!rollNumber || rollNumber.trim() === '') {
      const classCode = className ? className.replace(/\D/g, '') || '10' : '10';
      const prefix = `SAU-${classCode.padStart(2, '0')}-`;
      const allClassStudents = await Student.find({ rollNumber: new RegExp(`^${prefix}`) });
      
      let maxSeq = 0;
      allClassStudents.forEach((s) => {
        const match = s.rollNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      });

      rollNumber = `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
      req.body.rollNumber = rollNumber;
    } else {
      // Check duplicate roll number
      const existing = await Student.findOne({ rollNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: `Roll number ${rollNumber} already exists` });
      }
    }

    const student = await Student.create(req.body);
    res.status(201).json({ success: true, student, message: 'Student registered successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check duplicate roll number if updated
    if (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) {
      const existing = await Student.findOne({ rollNumber: req.body.rollNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: `Roll number ${req.body.rollNumber} already exists` });
      }
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, student: updated, message: 'Student updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Student Fee Paid Status (Paid / Unpaid)
// @route   PUT /api/students/:id/toggle-fee
export const toggleFeeStatus = async (req, res) => {
  try {
    const { feesPaid } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    student.feesPaid = Boolean(feesPaid);
    student.paymentDate = feesPaid ? new Date() : null;
    student.paidTillMonth = feesPaid ? currentMonth : '';

    await student.save();

    // If marked Paid, auto-record fee ledger history entry if not present
    if (feesPaid) {
      const FeePayment = (await import('../models/FeePayment.js')).default;
      const existing = await FeePayment.findOne({ student: student._id, monthYear: currentMonth });
      if (!existing) {
        const count = await FeePayment.countDocuments();
        const receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        await FeePayment.create({
          student: student._id,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          className: student.className,
          amountPaid: student.monthlyFee || 2500,
          monthlyFee: student.monthlyFee || 2500,
          pendingAmount: 0,
          paymentDate: new Date(),
          monthYear: currentMonth,
          paymentMode: 'UPI',
          receiptNumber,
          remarks: 'Monthly tuition fee (Toggle Paid)',
        });
      }
    }

    res.json({
      success: true,
      student,
      message: `Fee status updated to ${feesPaid ? 'PAID' : 'UNPAID'}`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
