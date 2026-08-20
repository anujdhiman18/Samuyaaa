import Student from '../models/Student.js';
import SMSNotificationLog from '../models/SMSNotificationLog.js';
import { sendGenericSMS, formatPhoneNumber } from './twilioService.js';

/**
 * Centralized Notification Service for SMS dispatches
 */

export async function processSMSDispatch({
  studentId,
  studentObj = null,
  notificationType,
  message,
  triggeredBy = 'System',
  relatedRecordId = '',
  eventKeySuffix = '',
}) {
  let student = studentObj;
  if (!student && studentId) {
    try {
      student = await Student.findById(studentId);
    } catch (err) {
      console.warn('[NotificationService] Could not find student by ID in MongoDB:', studentId);
    }
  }

  const stName = student?.fullName || student?.name || 'Student';
  const rawPhone = student?.phone || student?.parentPhone;
  const formattedPhone = formatPhoneNumber(rawPhone);

  if (!formattedPhone) {
    console.warn(`[NotificationService] Skipped SMS for student "${stName}": Invalid or missing phone number.`);
    return {
      success: false,
      reason: 'INVALID_PHONE',
      message: 'Student phone number missing or invalid',
    };
  }

  // Check student SMS notification preference (default: ON / true)
  if (student && student.smsNotificationsEnabled === false) {
    console.log(`[NotificationService] Skipped SMS for ${stName}: SMS notifications disabled by student/admin.`);
    return {
      success: true,
      skipped: true,
      reason: 'DISABLED_BY_PREFERENCE',
    };
  }

  // Deduplication Key Construction: studentId + notificationType + relatedRecordId/suffix
  const eventKey = `${studentId || stName}_${notificationType}_${relatedRecordId || eventKeySuffix || Date.now()}`;

  // Check if duplicate SMS was already successfully sent
  try {
    const existingSentLog = await SMSNotificationLog.findOne({ eventKey, status: 'sent' });
    if (existingSentLog) {
      console.log(`[NotificationService] Duplicate SMS suppressed for eventKey: ${eventKey}`);
      return {
        success: true,
        duplicated: true,
        log: existingSentLog,
      };
    }
  } catch (e) {}

  // Create initial pending log record
  let logRecord = null;
  try {
    logRecord = await SMSNotificationLog.create({
      student: student?._id,
      studentId: String(studentId || student?._id || ''),
      studentName: stName,
      phoneNumber: formattedPhone,
      notificationType,
      message,
      triggeredBy,
      relatedRecordId: String(relatedRecordId || ''),
      eventKey,
      status: 'pending',
    });
  } catch (err) {
    console.warn('[NotificationService] Error creating log record:', err.message);
  }

  // Dispatch SMS (Non-blocking call)
  try {
    const providerResult = await sendGenericSMS({
      phone: formattedPhone,
      text: message,
    });

    if (providerResult && providerResult.success) {
      if (logRecord) {
        logRecord.status = 'sent';
        logRecord.providerMessageId = providerResult.sid || 'SIMULATED_SMS';
        logRecord.sentAt = new Date();
        await logRecord.save();
      }
      return {
        success: true,
        logId: logRecord?._id,
        providerResult,
      };
    } else {
      if (logRecord) {
        logRecord.status = 'failed';
        logRecord.errorMessage = providerResult?.error || providerResult?.message || 'Provider dispatch failed';
        await logRecord.save();
      }
      return {
        success: false,
        logId: logRecord?._id,
        error: providerResult?.error || providerResult?.message || 'Provider dispatch failed',
      };
    }
  } catch (err) {
    console.error(`[NotificationService] Exception during SMS send for ${formattedPhone}:`, err.message);
    if (logRecord) {
      try {
        logRecord.status = 'failed';
        logRecord.errorMessage = err.message;
        await logRecord.save();
      } catch (e) {}
    }
    return {
      success: false,
      logId: logRecord?._id,
      error: err.message,
    };
  }
}

export const notificationService = {
  /**
   * 1. Attendance SMS Notification
   */
  sendAttendanceSMS: async ({
    studentId,
    studentObj = null,
    subject = 'General',
    date = '',
    status = 'Present',
    attendancePercentage = 90,
    triggeredBy = 'Faculty',
    relatedRecordId = '',
  }) => {
    const formattedDate = date || new Date().toISOString().split('T')[0];
    const stName = studentObj?.fullName || studentObj?.name || 'Student';
    const message = `Dear ${stName}, your attendance for ${subject} on ${formattedDate} has been marked as ${status}. Current attendance: ${attendancePercentage}%.`;

    return await processSMSDispatch({
      studentId,
      studentObj,
      notificationType: 'Attendance',
      message,
      triggeredBy,
      relatedRecordId,
      eventKeySuffix: `${subject}_${formattedDate}_${status}`,
    });
  },

  /**
   * 2. Grade Published SMS Notification
   */
  sendGradePublishedSMS: async ({
    studentId,
    studentObj = null,
    subject = '',
    examType = '',
    marks = 0,
    totalMax = 100,
    grade = 'A',
    triggeredBy = 'Faculty',
    relatedRecordId = '',
  }) => {
    const stName = studentObj?.fullName || studentObj?.name || 'Student';
    const subjectInfo = subject ? `${subject} (${examType || 'Exam'})` : examType || 'recent exam';
    const message = `Dear ${stName}, your marks for ${subjectInfo} have been published (${marks}/${totalMax}, Grade: ${grade}). Please log in to your student portal to view your result.`;

    return await processSMSDispatch({
      studentId,
      studentObj,
      notificationType: 'GradePublished',
      message,
      triggeredBy,
      relatedRecordId,
      eventKeySuffix: `${subject}_${examType}_published`,
    });
  },

  /**
   * 3. Grade Updated SMS Notification
   */
  sendGradeUpdatedSMS: async ({
    studentId,
    studentObj = null,
    subject = '',
    examType = '',
    marks = 0,
    totalMax = 100,
    grade = 'A',
    triggeredBy = 'Faculty',
    relatedRecordId = '',
  }) => {
    const stName = studentObj?.fullName || studentObj?.name || 'Student';
    const subjectInfo = subject ? `${subject} (${examType || 'Exam'})` : examType || 'recent exam';
    const message = `Dear ${stName}, your marks for ${subjectInfo} have been updated (${marks}/${totalMax}, Grade: ${grade}). Please log in to your student portal for details.`;

    return await processSMSDispatch({
      studentId,
      studentObj,
      notificationType: 'GradeUpdated',
      message,
      triggeredBy,
      relatedRecordId,
      eventKeySuffix: `${subject}_${examType}_updated_${Date.now()}`,
    });
  },

  /**
   * 4. Important Student Account Update SMS Notification
   */
  sendAccountUpdateSMS: async ({
    studentId,
    studentObj = null,
    updatedFields = 'Academic Details',
    triggeredBy = 'Admin',
    relatedRecordId = '',
  }) => {
    const stName = studentObj?.fullName || studentObj?.name || 'Student';
    const message = `Dear ${stName}, important information on your account (${updatedFields}) has been updated by authorized staff. Please log in to your student portal for details.`;

    return await processSMSDispatch({
      studentId,
      studentObj,
      notificationType: 'AccountUpdate',
      message,
      triggeredBy,
      relatedRecordId,
      eventKeySuffix: `${updatedFields.replace(/\s+/g, '_')}_${Date.now()}`,
    });
  },

  /**
   * Retry failed SMS notification
   */
  retrySMSNotification: async (logId) => {
    try {
      const log = await SMSNotificationLog.findById(logId);
      if (!log) {
        return { success: false, message: 'Log record not found' };
      }

      log.status = 'pending';
      log.errorMessage = '';
      await log.save();

      const providerResult = await sendGenericSMS({
        phone: log.phoneNumber,
        text: log.message,
      });

      if (providerResult && providerResult.success) {
        log.status = 'sent';
        log.providerMessageId = providerResult.sid || 'SIMULATED_SMS_RETRY';
        log.sentAt = new Date();
        await log.save();
        return { success: true, message: 'SMS retry succeeded', log };
      } else {
        log.status = 'failed';
        log.errorMessage = providerResult?.error || providerResult?.message || 'Retry failed';
        await log.save();
        return { success: false, message: log.errorMessage, log };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};
