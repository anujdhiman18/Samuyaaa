import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

// @desc    Get attendance records (by studentId, date, subject, or all)
// @route   GET /api/attendance
export const getAttendance = async (req, res) => {
  try {
    const { studentId, date, subject, className } = req.query;
    const query = {};

    if (studentId) {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        query.student = studentId;
      } else {
        const st = await Student.findOne({ $or: [{ id: studentId }, { rollNumber: studentId }] });
        if (st) query.student = st._id;
      }
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'fullName rollNumber className admissionNumber course batch')
      .sort({ date: -1 });

    let stats = null;
    if (studentId) {
      const presentDays = attendance.filter((a) => a.status === 'Present').length;
      const absentDays = attendance.filter((a) => a.status === 'Absent').length;
      const lateDays = attendance.filter((a) => a.status === 'Late').length;
      const totalDays = attendance.length;
      const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100;

      stats = {
        presentDays,
        absentDays,
        lateDays,
        totalDays,
        attendancePercentage,
      };
    }

    res.json({ success: true, attendance, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save batch attendance for a specific date & subject (edit past or current classes)
// @route   POST /api/attendance/batch
export const saveBatchAttendance = async (req, res) => {
  try {
    const { date, subject, className, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Date and records are required' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const savedRecords = [];

    for (const rec of records) {
      const { studentId, status, remarks, rollNumber: recRoll } = rec;
      if (!studentId) continue;

      let student = null;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await Student.findById(studentId);
      }
      if (!student) {
        student = await Student.findOne({
          $or: [
            { id: studentId },
            { rollNumber: recRoll || studentId },
            { admissionNumber: studentId },
          ],
        });
      }

      const studentMongoId = student ? student._id : (mongoose.Types.ObjectId.isValid(studentId) ? studentId : null);
      if (!studentMongoId) continue;

      const studentName = student ? student.fullName : 'Student';
      const rollNumber = student ? student.rollNumber : (recRoll || '');

      // Find existing attendance record for this student, date, and subject
      const query = {
        student: studentMongoId,
        date: { $gte: startOfDay, $lte: endOfDay },
      };
      if (subject && subject !== 'All') {
        query.subject = subject;
      }

      let existing = await Attendance.findOne(query);

      if (existing) {
        existing.status = status || 'Present';
        existing.remarks = remarks || '';
        if (subject) existing.subject = subject;
        await existing.save();
        savedRecords.push(existing);
      } else {
        const created = await Attendance.create({
          student: studentMongoId,
          studentName,
          rollNumber,
          date: targetDate,
          status: status || 'Present',
          subject: subject || 'General Lecture',
          remarks: remarks || '',
        });
        savedRecords.push(created);
      }

      // Update student's overall attendance percentage
      const allStudentAtt = await Attendance.find({ student: studentMongoId });
      const presentCount = allStudentAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const totalCount = allStudentAtt.length;
      const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

      if (student) {
        student.attendancePercentage = pct;
        await student.save();
      }
    }

    res.json({
      success: true,
      message: `Attendance saved for ${savedRecords.length} students on ${date}`,
      savedRecords,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single attendance log entry
// @route   DELETE /api/attendance/:id
export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const studentId = record.student;
    await Attendance.findByIdAndDelete(req.params.id);

    // Recalculate student attendance %
    if (studentId) {
      const allStudentAtt = await Attendance.find({ student: studentId });
      const presentCount = allStudentAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const totalCount = allStudentAtt.length;
      const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

      await Student.findByIdAndUpdate(studentId, { attendancePercentage: pct });
    }

    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
