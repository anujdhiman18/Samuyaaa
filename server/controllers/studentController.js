import Student from '../models/Student.js';

// @desc    Get all students with filter, search, pagination, sorting
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, className, course, batch, semester, status, feeStatus, sortBy, sortOrder } = req.query;

    const query = {};

    if (className && className !== 'All') {
      query.className = className;
    }

    if (course && course !== 'All') {
      query.course = course;
    }

    if (batch && batch !== 'All') {
      query.batch = batch;
    }

    if (semester && semester !== 'All') {
      query.semester = semester;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (feeStatus && feeStatus !== 'All') {
      query.feesPaid = feeStatus === 'paid';
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort(sortOptions).skip(skip).limit(limit);

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
    let { rollNumber, className, admissionNumber } = req.body;

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
      const existing = await Student.findOne({ rollNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: `Roll number ${rollNumber} already exists` });
      }
    }

    // Auto-generate Admission Number if missing
    if (!admissionNumber || admissionNumber.trim() === '') {
      const count = await Student.countDocuments();
      const year = new Date().getFullYear();
      req.body.admissionNumber = `ADM-${year}-${String(count + 1).padStart(3, '0')}`;
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

    if (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) {
      const existing = await Student.findOne({ rollNumber: req.body.rollNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: `Roll number ${req.body.rollNumber} already exists` });
      }
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    // Dispatch automated SMS alert
    try {
      const phoneToNotify = updated.parentPhone || updated.phone;
      const smsText = `Saumyaa Update: Profile details updated for ${updated.fullName} (${updated.rollNumber || 'N/A'}, Class ${updated.className || '10th'}). - Saumyaa Studies`;
      const { sendGenericSMS } = await import('../services/twilioService.js');
      await sendGenericSMS({ phone: phoneToNotify, text: smsText });

      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        student: updated._id,
        rollNumber: updated.rollNumber,
        title: 'Profile Updated',
        message: smsText,
        type: 'Performance',
      });
    } catch (e) {}

    res.json({ success: true, student: updated, message: 'Student updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in database' });
    }

    await Student.findByIdAndDelete(req.params.id);

    try {
      const StudentLeave = (await import('../models/StudentLeave.js')).default;
      await StudentLeave.deleteMany({
        $or: [
          { studentId: req.params.id },
          { admissionNo: student.admissionNumber },
          { studentName: student.fullName },
        ],
      });
    } catch (e) {}

    res.json({ success: true, message: 'Student record deleted successfully from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk actions on students (delete, change status)
// @route   POST /api/students/bulk-action
export const bulkActionStudents = async (req, res) => {
  try {
    const { action, studentIds, newStatus } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No student IDs provided' });
    }

    if (action === 'delete') {
      const students = await Student.find({ _id: { $in: studentIds } });
      const admissionNos = students.map((s) => s.admissionNumber).filter(Boolean);
      await Student.deleteMany({ _id: { $in: studentIds } });

      try {
        const StudentLeave = (await import('../models/StudentLeave.js')).default;
        await StudentLeave.deleteMany({
          $or: [
            { studentId: { $in: studentIds } },
            { admissionNo: { $in: admissionNos } },
          ],
        });
      } catch (e) {}

      return res.json({ success: true, message: `${studentIds.length} student records deleted successfully from database` });
    }

    if (action === 'status') {
      await Student.updateMany({ _id: { $in: studentIds } }, { $set: { status: newStatus || 'Active' } });
      return res.json({ success: true, message: `Status updated to ${newStatus} for ${studentIds.length} students` });
    }

    return res.status(400).json({ success: false, message: 'Invalid bulk action specified' });
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
    const FeePayment = (await import('../models/FeePayment.js')).default;
    if (feesPaid) {
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
    } else {
      await FeePayment.deleteMany({ student: student._id, monthYear: currentMonth });
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

// @desc    Send automated WhatsApp reminder via Twilio
// @route   POST /api/students/:id/remind-whatsapp
export const remindWhatsApp = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const studentName = student ? student.fullName : req.body.studentName || 'Student';
    const studentPhone = student ? (student.parentPhone || student.phone) : req.body.phone;
    const dueAmount = student ? (student.totalFeeAmount ? (student.totalFeeAmount - (student.amountPaid || 0)) : (student.monthlyFee || 2500)) : (req.body.dueAmount || 2500);
    const rollNumber = student ? student.rollNumber : req.body.rollNumber || 'N/A';
    const className = student ? student.className : req.body.className || '10th';

    if (!studentPhone) {
      return res.status(400).json({ success: false, message: 'Student registered phone number is missing or empty' });
    }

    try {
      const { sendWhatsAppReminder } = await import('../services/twilioService.js');
      const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;
      const twilioRes = await sendWhatsAppReminder({ studentPhone, studentName, dueAmount, rollNumber, className });

      const log = await FeeReminderLog.create({
        student: student ? student._id : null,
        studentName,
        parentPhone: studentPhone,
        amountDue: Number(dueAmount),
        monthYear: req.body.monthYear || 'July 2026',
        channel: 'WhatsApp',
        status: 'sent',
        message: twilioRes.message,
      });

      return res.json({
        success: true,
        message: `WhatsApp reminder dispatched to ${studentName} (${studentPhone})`,
        twilio: twilioRes,
        log,
      });
    } catch (twilioErr) {
      const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;
      await FeeReminderLog.create({
        student: student ? student._id : null,
        studentName,
        parentPhone: studentPhone,
        amountDue: Number(dueAmount),
        monthYear: req.body.monthYear || 'July 2026',
        channel: 'WhatsApp',
        status: 'failed',
        message: twilioErr.message,
      });
      return res.status(500).json({ success: false, message: twilioErr.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send automated SMS reminder via Twilio
// @route   POST /api/students/:id/remind-sms
export const remindSMS = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const studentName = student ? student.fullName : req.body.studentName || 'Student';
    const studentPhone = student ? (student.parentPhone || student.phone) : req.body.phone;
    const dueAmount = student ? (student.totalFeeAmount ? (student.totalFeeAmount - (student.amountPaid || 0)) : (student.monthlyFee || 2500)) : (req.body.dueAmount || 2500);
    const rollNumber = student ? student.rollNumber : req.body.rollNumber || 'N/A';
    const className = student ? student.className : req.body.className || '10th';

    if (!studentPhone) {
      return res.status(400).json({ success: false, message: 'Student registered phone number is missing or empty' });
    }

    try {
      const { sendSMSReminder } = await import('../services/twilioService.js');
      const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;
      const twilioRes = await sendSMSReminder({ studentPhone, studentName, dueAmount, rollNumber, className });

      const log = await FeeReminderLog.create({
        student: student ? student._id : null,
        studentName,
        parentPhone: studentPhone,
        amountDue: Number(dueAmount),
        monthYear: req.body.monthYear || 'July 2026',
        channel: 'SMS',
        status: 'sent',
        message: twilioRes.message,
      });

      return res.json({
        success: true,
        message: `SMS reminder dispatched to ${studentName} (${studentPhone})`,
        twilio: twilioRes,
        log,
      });
    } catch (twilioErr) {
      const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;
      await FeeReminderLog.create({
        student: student ? student._id : null,
        studentName,
        parentPhone: studentPhone,
        amountDue: Number(dueAmount),
        monthYear: req.body.monthYear || 'July 2026',
        channel: 'SMS',
        status: 'failed',
        message: twilioErr.message,
      });
      return res.status(500).json({ success: false, message: twilioErr.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reminder logs history
// @route   GET /api/students/reminder-logs
export const getReminderLogs = async (req, res) => {
  try {
    const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;
    const logs = await FeeReminderLog.find().sort({ sentAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply for Student Leave
// @route   POST /api/student-panel/leaves
export const applyStudentLeave = async (req, res) => {
  try {
    const StudentLeave = (await import('../models/StudentLeave.js')).default;
    const studentId = req.body.studentId || req.user?._id || req.user?.id || 's_demo';
    const admissionNo = req.body.admissionNo || req.user?.admissionNo || 'ADM-2025-089';
    const studentName = req.body.studentName || req.user?.name || req.user?.fullName || 'Varun Sharma';
    const parentPhone = req.body.parentPhone || req.user?.phone || req.user?.parentPhone || '9816099999';
    const className = req.body.className || req.user?.className || '10th';
    const section = req.body.section || req.user?.section || 'Section A';
    const branch = req.body.branch || req.user?.branch || 'Main Center';
    const leaveType = req.body.leaveType || 'Sick Leave';
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
    const endDate = req.body.endDate || new Date().toISOString().split('T')[0];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const numberOfDays = req.body.numberOfDays || (isNaN(diffDays) ? 1 : diffDays);

    const reason = req.body.reason || 'Leave requested';
    const supportingDocument = req.body.supportingDocument || req.body.documentUrl || '';

    const leave = await StudentLeave.create({
      studentId,
      admissionNo,
      studentName,
      parentPhone,
      className,
      section,
      branch,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      supportingDocument,
      status: 'Pending',
    });

    res.status(201).json({ success: true, leave, message: 'Student leave application submitted successfully' });
  } catch (error) {
    console.error('applyStudentLeave error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Leaves for student panel
// @route   GET /api/student-panel/leaves
export const getStudentLeaves = async (req, res) => {
  try {
    const StudentLeave = (await import('../models/StudentLeave.js')).default;
    const leaves = await StudentLeave.find().sort({ createdAt: -1 });
    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all student leaves for Admin
// @route   GET /api/admin/student-leaves
export const getAllStudentLeaves = async (req, res) => {
  try {
    const StudentLeave = (await import('../models/StudentLeave.js')).default;
    let leaves = await StudentLeave.find().sort({ createdAt: -1 });

    if (!leaves || leaves.length === 0) {
      const demoLeaves = [
        {
          studentId: 's_demo_1',
          admissionNo: 'ADM-2025-089',
          studentName: 'Varun Sharma',
          parentPhone: '9816099999',
          className: '10th',
          section: 'Section A',
          branch: 'Main Center',
          leaveType: 'Sick Leave',
          startDate: '2026-08-10',
          endDate: '2026-08-12',
          numberOfDays: 3,
          reason: 'Severe viral fever and doctor advised 3 days complete bed rest',
          supportingDocument: 'https://example.com/medical-fitness-cert.pdf',
          status: 'Pending',
        },
        {
          studentId: 's_demo_2',
          admissionNo: 'ADM-2025-092',
          studentName: 'Ananya Gupta',
          parentPhone: '9816088888',
          className: '12th (+2)',
          section: 'Medical',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-15',
          endDate: '2026-08-16',
          numberOfDays: 2,
          reason: 'Attending family wedding ceremony in Shimla',
          supportingDocument: '',
          status: 'Approved',
          adminRemarks: 'Approved by Class Teacher. Make up missed assignments.',
        },
      ];
      leaves = await StudentLeave.insertMany(demoLeaves);
    }

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Student Leave Status (Approve/Reject)
// @route   PUT /api/admin/student-leaves/:id/status
export const updateStudentLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, adminNote } = req.body;
    const StudentLeave = (await import('../models/StudentLeave.js')).default;

    const leave = await StudentLeave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Student leave application not found' });
    }

    leave.status = status || 'Approved';
    if (adminRemarks !== undefined) leave.adminRemarks = adminRemarks;
    if (adminNote !== undefined) leave.adminNote = adminNote;
    await leave.save();

    try {
      const { sendGenericSMS } = await import('../services/twilioService.js');
      const smsMsg = `Saumyaa Studies: Leave application (${leave.leaveType}) for ${leave.studentName} from ${leave.startDate} to ${leave.endDate} has been ${leave.status}. ${leave.adminRemarks ? 'Remarks: ' + leave.adminRemarks : ''}`;
      await sendGenericSMS(leave.parentPhone || '9816099999', smsMsg);
    } catch (smsErr) {}

    res.json({ success: true, leave, message: `Student leave application ${leave.status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
