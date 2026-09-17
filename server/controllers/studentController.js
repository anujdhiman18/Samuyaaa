import Student from '../models/Student.js';
import { cacheGet, cacheSet, cacheInvalidate } from '../utils/cache.js';
import { notifyStudentUpdate, notifyAdminCriticalEvent } from '../services/notificationService.js';

// @desc    Get all students with filter, search, pagination, sorting
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, className, course, batch, semester, status, feeStatus, sortBy, sortOrder } = req.query;

    const query = {};

    if (className && className !== 'All') query.className = className;
    if (course && course !== 'All') query.course = course;
    if (batch && batch !== 'All') query.batch = batch;
    if (semester && semester !== 'All') query.semester = semester;
    if (status && status !== 'All') query.status = status;
    if (feeStatus && feeStatus !== 'All') query.feesPaid = feeStatus === 'paid';

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

    // Cache key — unique per query params so filtered queries don't pollute base list
    const cacheKey = `students:${JSON.stringify({ page, limit, skip, search, className, course, batch, semester, status, feeStatus, sortBy, sortOrder })}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort(sortOptions).skip(skip).limit(limit).lean();

    const payload = { success: true, students, page, pages: Math.ceil(total / limit) || 1, total };
    cacheSet(cacheKey, payload, 60); // Cache for 60 seconds

    res.json(payload);
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

/**
 * Helper to normalize name for sibling comparison
 */
export const normalizeName = (name) => {
  if (!name) return '';
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Helper to extract clean 10-digit mobile number
 */
export const cleanDigitsPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/**
 * Validates duplicity of student phone and email, enforcing the sibling rule:
 * - Each student must have unique phone / parentPhone and email.
 * - Sibling exception: Same phone / email is permitted ONLY if BOTH Father's Name AND Mother's Name match!
 */
export const checkStudentDuplicityWithSiblingRule = async ({
  studentId = null,
  phone = '',
  parentPhone = '',
  email = '',
  fatherName = '',
  motherName = '',
}) => {
  const normPhone = cleanDigitsPhone(phone);
  const normParentPhone = cleanDigitsPhone(parentPhone);
  const normEmail = (email || '').trim().toLowerCase();
  const normFather = normalizeName(fatherName);
  const normMother = normalizeName(motherName);

  // Build query to find potential duplicates
  const matchConditions = [];
  const phonesToCheck = [normPhone, normParentPhone].filter((p) => p && p.length >= 10);

  if (phonesToCheck.length > 0) {
    phonesToCheck.forEach((p) => {
      matchConditions.push({ phone: new RegExp(`${p}$`) });
      matchConditions.push({ parentPhone: new RegExp(`${p}$`) });
    });
  }

  if (normEmail && normEmail.includes('@')) {
    matchConditions.push({ email: normEmail });
  }

  if (matchConditions.length === 0) {
    return { valid: true };
  }

  const query = { $or: matchConditions };
  if (studentId) {
    query._id = { $ne: studentId };
  }

  const conflictingStudents = await Student.find(query).lean();

  for (const existing of conflictingStudents) {
    const existFather = normalizeName(existing.fatherName);
    const existMother = normalizeName(existing.motherName);

    // Sibling Match: BOTH Father AND Mother names must match
    // (If existing student was saved before motherName was introduced and has empty motherName, matching father is accepted)
    const isSibling = Boolean(
      normFather &&
      existFather &&
      normFather === existFather &&
      (
        (normMother && existMother && normMother === existMother) ||
        (!existMother)
      )
    );

    if (isSibling) {
      // Allowed under sibling exception
      continue;
    }

    // Not verified siblings — check which contact field conflicted
    const existPhone = cleanDigitsPhone(existing.phone);
    const existParentPhone = cleanDigitsPhone(existing.parentPhone);
    const existEmail = (existing.email || '').trim().toLowerCase();

    const phoneMatched =
      (normPhone && (normPhone === existPhone || normPhone === existParentPhone)) ||
      (normParentPhone && (normParentPhone === existPhone || normParentPhone === existParentPhone));

    if (phoneMatched) {
      const conflictNum = normPhone === existPhone || normPhone === existParentPhone ? phone : parentPhone;
      return {
        valid: false,
        field: 'phone',
        conflictingStudent: existing.fullName,
        message: `Phone number "${conflictNum}" is already registered with student "${existing.fullName}" (${existing.rollNumber || 'N/A'}). Sibling exception requires matching Father's and Mother's names.`,
      };
    }

    if (normEmail && normEmail === existEmail) {
      return {
        valid: false,
        field: 'email',
        conflictingStudent: existing.fullName,
        message: `Email "${email}" is already registered with student "${existing.fullName}" (${existing.rollNumber || 'N/A'}). Sibling exception requires matching Father's and Mother's names.`,
      };
    }
  }

  return { valid: true };
};

// @desc    Create student
// @route   POST /api/students
export const createStudent = async (req, res) => {
  try {
    let { rollNumber, className, admissionNumber } = req.body;

    // Validate phone & email duplicity with sibling exception rule
    const duplicityCheck = await checkStudentDuplicityWithSiblingRule({
      phone: req.body.phone,
      parentPhone: req.body.parentPhone,
      email: req.body.email,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
    });

    if (!duplicityCheck.valid) {
      return res.status(400).json({
        success: false,
        field: duplicityCheck.field,
        message: duplicityCheck.message,
      });
    }

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
    cacheInvalidate('students:'); // Bust the student list cache
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

    // Validate phone & email duplicity with sibling exception rule
    const duplicityCheck = await checkStudentDuplicityWithSiblingRule({
      studentId: student._id,
      phone: req.body.phone !== undefined ? req.body.phone : student.phone,
      parentPhone: req.body.parentPhone !== undefined ? req.body.parentPhone : student.parentPhone,
      email: req.body.email !== undefined ? req.body.email : student.email,
      fatherName: req.body.fatherName !== undefined ? req.body.fatherName : student.fatherName,
      motherName: req.body.motherName !== undefined ? req.body.motherName : student.motherName,
    });

    if (!duplicityCheck.valid) {
      return res.status(400).json({
        success: false,
        field: duplicityCheck.field,
        message: duplicityCheck.message,
      });
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });


    // Multi-channel notifications: SMS + Email + In-App notification
    try {
      const changedKeys = Object.keys(req.body).filter(k => !['_id', '__v', 'updatedAt', 'createdAt'].includes(k)).join(', ') || 'Academic & Profile Details';
      await notifyStudentUpdate({
        student: updated,
        updatedFields: changedKeys,
        triggeredBy: req.user?.name || 'Admin',
      });
    } catch (notifyErr) {
      console.warn('[studentController] Error in notifyStudentUpdate:', notifyErr.message);
    }

    cacheInvalidate('students:'); // Bust the student list cache
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

    cacheInvalidate('students:'); // Bust the student list cache
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

// @desc    Send automated Email reminder
// @route   POST /api/students/:id/remind-email
export const remindEmail = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const studentEmail = student.email || req.body.email;
    if (!studentEmail) {
      return res.status(400).json({ success: false, message: 'Student registered email is missing or empty' });
    }

    const dueAmount = student.totalFeeAmount ? (student.totalFeeAmount - (student.amountPaid || 0)) : (student.monthlyFee || 2500);
    const { sendFeeReminderEmail } = await import('../services/emailService.js');
    const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;

    const emailRes = await sendFeeReminderEmail({
      student,
      dueAmount,
      className: student.className,
      rollNumber: student.rollNumber,
    });

    const log = await FeeReminderLog.create({
      student: student._id,
      studentName: student.fullName,
      parentPhone: student.parentPhone || student.phone || studentEmail,
      amountDue: Number(dueAmount),
      monthYear: req.body.monthYear || 'July 2026',
      channel: 'Email',
      status: emailRes.success ? 'sent' : 'failed',
      message: emailRes.success ? `Email fee reminder sent to ${studentEmail}` : (emailRes.error || 'Failed to send email'),
    });

    return res.json({
      success: emailRes.success,
      message: emailRes.success ? `Email reminder dispatched to ${student.fullName} (${studentEmail})` : `Failed to send email: ${emailRes.error}`,
      email: emailRes,
      log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    1-Click Bulk SMS Fee Reminders to all unpaid students
// @route   POST /api/students/bulk-remind-sms
export const bulkRemindDueFeesSMS = async (req, res) => {
  try {
    const students = await Student.find({
      $or: [
        { feesPaid: false },
        { $expr: { $gt: [{ $subtract: [{ $ifNull: ['$totalFeeAmount', 0] }, { $ifNull: ['$amountPaid', 0] }] }, 0] } }
      ]
    });

    const unpaidStudents = students.filter(s => {
      const due = (s.totalFeeAmount || 0) - (s.amountPaid || 0);
      return !s.feesPaid || due > 0;
    });

    if (unpaidStudents.length === 0) {
      return res.json({ success: true, message: 'No students with pending fees found', sentCount: 0, failedCount: 0, total: 0 });
    }

    const { sendSMSReminder } = await import('../services/twilioService.js');
    const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;

    let sentCount = 0;
    let failedCount = 0;
    const failures = [];

    for (const student of unpaidStudents) {
      const phone = student.parentPhone || student.phone;
      if (!phone || String(phone).replace(/\D/g, '').length < 10) {
        failedCount++;
        failures.push({ name: student.fullName, reason: 'Invalid or missing phone' });
        continue;
      }

      const dueAmount = student.totalFeeAmount ? (student.totalFeeAmount - (student.amountPaid || 0)) : (student.monthlyFee || 2500);

      try {
        const twilioRes = await sendSMSReminder({
          studentPhone: phone,
          studentName: student.fullName,
          dueAmount,
          rollNumber: student.rollNumber,
          className: student.className,
        });

        await FeeReminderLog.create({
          student: student._id,
          studentName: student.fullName,
          parentPhone: phone,
          amountDue: Number(dueAmount),
          monthYear: req.body.monthYear || 'July 2026',
          channel: 'SMS',
          status: 'sent',
          message: twilioRes.message,
        });
        sentCount++;
      } catch (err) {
        failedCount++;
        failures.push({ name: student.fullName, reason: err.message });
      }

      await new Promise(r => setTimeout(r, 150));
    }

    res.json({
      success: true,
      message: `Bulk SMS completed: ${sentCount} sent, ${failedCount} failed`,
      sentCount,
      failedCount,
      total: unpaidStudents.length,
      failures,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    1-Click Bulk Email Fee Reminders to all unpaid students
// @route   POST /api/students/bulk-remind-email
export const bulkRemindDueFeesEmail = async (req, res) => {
  try {
    const students = await Student.find({
      $or: [
        { feesPaid: false },
        { $expr: { $gt: [{ $subtract: [{ $ifNull: ['$totalFeeAmount', 0] }, { $ifNull: ['$amountPaid', 0] }] }, 0] } }
      ]
    });

    const unpaidStudents = students.filter(s => {
      const due = (s.totalFeeAmount || 0) - (s.amountPaid || 0);
      return !s.feesPaid || due > 0;
    });

    if (unpaidStudents.length === 0) {
      return res.json({ success: true, message: 'No students with pending fees found', sentCount: 0, failedCount: 0, total: 0 });
    }

    const { sendFeeReminderEmail } = await import('../services/emailService.js');
    const FeeReminderLog = (await import('../models/FeeReminderLog.js')).default;

    let sentCount = 0;
    let failedCount = 0;
    const failures = [];

    for (const student of unpaidStudents) {
      if (!student.email || !student.email.includes('@')) {
        failedCount++;
        failures.push({ name: student.fullName, reason: 'Invalid or missing email' });
        continue;
      }

      const dueAmount = student.totalFeeAmount ? (student.totalFeeAmount - (student.amountPaid || 0)) : (student.monthlyFee || 2500);

      try {
        const emailRes = await sendFeeReminderEmail({
          student,
          dueAmount,
          className: student.className,
          rollNumber: student.rollNumber,
        });

        await FeeReminderLog.create({
          student: student._id,
          studentName: student.fullName,
          parentPhone: student.email,
          amountDue: Number(dueAmount),
          monthYear: req.body.monthYear || 'July 2026',
          channel: 'Email',
          status: emailRes.success ? 'sent' : 'failed',
          message: emailRes.success ? `Bulk Email sent to ${student.email}` : emailRes.error,
        });

        if (emailRes.success) sentCount++;
        else {
          failedCount++;
          failures.push({ name: student.fullName, reason: emailRes.error });
        }
      } catch (err) {
        failedCount++;
        failures.push({ name: student.fullName, reason: err.message });
      }

      await new Promise(r => setTimeout(r, 150));
    }

    res.json({
      success: true,
      message: `Bulk Email completed: ${sentCount} sent, ${failedCount} failed`,
      sentCount,
      failedCount,
      total: unpaidStudents.length,
      failures,
    });
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

    // Notify Admin via Email + SMS + In-App
    try {
      await notifyAdminCriticalEvent({
        alertType: 'Student Leave Application',
        title: `New Leave Application from ${studentName} (${className})`,
        details: {
          'Student Name': studentName,
          'Admission No': admissionNo,
          'Class & Section': `${className} - ${section}`,
          'Leave Type': leaveType,
          'Period': `${startDate} to ${endDate} (${numberOfDays} days)`,
          'Reason': reason,
        },
        actionUrl: '/admin/leaves',
        triggeredBy: studentName,
      });
    } catch (e) {
      console.warn('[studentController] Admin alert error for student leave:', e.message);
    }

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
    const cacheKey = 'leaves:student:all';
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const StudentLeave = (await import('../models/StudentLeave.js')).default;
    const leaves = await StudentLeave.find().sort({ createdAt: -1 }).lean();
    const payload = { success: true, count: leaves.length, leaves };
    cacheSet(cacheKey, payload, 30);
    res.json(payload);
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
    cacheInvalidate('leaves:'); // Bust leaves cache after status update

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
