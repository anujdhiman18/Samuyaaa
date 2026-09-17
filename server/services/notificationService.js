import mongoose from 'mongoose';
import Student from '../models/Student.js';
import SMSNotificationLog from '../models/SMSNotificationLog.js';
import Notification from '../models/Notification.js';
import Admin from '../models/Admin.js';
import { sendGenericSMS, formatPhoneNumber } from './twilioService.js';
import {
  sendStudentUpdateEmail,
  sendFacultyUpdateEmail,
  sendAdminAlertEmail,
  sendFeeReminderEmail,
  sendDemoScheduleEmail,
} from './emailService.js';

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

/**
 * 5. Complete Student Update Multi-Channel Dispatch (SMS + Email + In-App Notification)
 */
export async function notifyStudentUpdate({
  student,
  updatedFields = 'Profile & Academic Details',
  triggeredBy = 'Admin',
}) {
  if (!student) return { success: false, message: 'No student provided' };

  const stName = student.fullName || student.name || 'Student';
  const phone = student.parentPhone || student.phone;
  const smsText = `Saumyaa Update: Details (${updatedFields}) for ${stName} (${student.rollNumber || 'N/A'}, Class ${student.className || 'General'}) have been updated. - Saumyaa Studies`;

  // 1. Dispatch SMS
  let smsResult = null;
  if (phone) {
    try {
      smsResult = await processSMSDispatch({
        studentId: student._id,
        studentObj: student,
        notificationType: 'AccountUpdate',
        message: smsText,
        triggeredBy,
        relatedRecordId: student._id,
        eventKeySuffix: `${String(updatedFields).replace(/\s+/g, '_')}_${Date.now()}`,
      });
    } catch (e) {
      smsResult = { success: false, error: e.message };
    }
  }

  // 2. Dispatch Email
  let emailResult = null;
  if (student.email) {
    try {
      emailResult = await sendStudentUpdateEmail({ student, updatedFields });
    } catch (e) {
      emailResult = { success: false, error: e.message };
    }
  }

  // 3. Create In-App Notification
  let inAppResult = null;
  if (mongoose.connection.readyState === 1) {
    try {
      inAppResult = await Notification.create({
        recipientId: String(student._id),
        recipientRole: 'Student',
        student: student._id,
        rollNumber: student.rollNumber,
        title: 'Profile / Academic Record Updated',
        message: `Your details (${updatedFields}) were updated by ${triggeredBy}.`,
        type: 'Profile',
      });
    } catch (err) {
      console.warn('[NotificationService] In-App notification creation failed:', err.message);
    }
  }

  return { success: true, sms: smsResult, email: emailResult, inApp: inAppResult };
}

/**
 * 6. Complete Faculty Update Multi-Channel Dispatch (SMS + Email + In-App Notification)
 */
export async function notifyFacultyUpdate({
  faculty,
  updatedFields = 'Profile & Assignment Details',
  triggeredBy = 'Admin',
}) {
  if (!faculty) return { success: false, message: 'No faculty provided' };

  const facName = faculty.name || faculty.fullName || 'Faculty Member';
  const smsText = `Saumyaa Faculty: Your profile / assigned details (${updatedFields}) have been updated by ${triggeredBy}. - Saumyaa Studies`;

  // 1. Dispatch SMS
  let smsResult = null;
  if (faculty.phone) {
    try {
      smsResult = await sendGenericSMS({
        phone: faculty.phone,
        text: smsText,
      });
    } catch (e) {
      smsResult = { success: false, error: e.message };
    }
  }

  // 2. Dispatch Email
  let emailResult = null;
  if (faculty.email) {
    try {
      emailResult = await sendFacultyUpdateEmail({ faculty, updatedFields });
    } catch (e) {
      emailResult = { success: false, error: e.message };
    }
  }

  // 3. Create In-App Notification
  let inAppResult = null;
  if (mongoose.connection.readyState === 1) {
    try {
      inAppResult = await Notification.create({
        recipientId: String(faculty._id),
        recipientRole: 'Faculty',
        faculty: faculty._id,
        title: 'Profile / Assignment Updated',
        message: `Your faculty profile details (${updatedFields}) were updated by ${triggeredBy}.`,
        type: 'Profile',
      });
    } catch (err) {
      console.warn('[NotificationService] In-App notification creation failed for faculty:', err.message);
    }
  }

  return { success: true, sms: smsResult, email: emailResult, inApp: inAppResult };
}

/**
 * 7. Admin Critical Event Dispatch (Email + SMS + In-App Notification to Admin)
 */
export async function notifyAdminCriticalEvent({
  alertType = 'General Alert',
  title,
  details = {},
  actionUrl = '',
  triggeredBy = 'System',
}) {
  console.log(`[NotificationService] Dispatching Admin Alert: ${alertType} - ${title}`);

  // 1. Fetch SuperAdmin contact info (or fallback)
  let adminPhone = '+91 9816543210';
  try {
    const adminUser = await Admin.findOne({ role: { $in: ['SuperAdmin', 'Admin'] } });
    if (adminUser?.phone) adminPhone = adminUser.phone;
  } catch (e) {}

  // 2. Dispatch Email to Admin
  let emailResult = null;
  try {
    emailResult = await sendAdminAlertEmail({
      alertType,
      title,
      details,
      actionUrl,
    });
  } catch (e) {
    emailResult = { success: false, error: e.message };
  }

  // 3. Dispatch SMS to Admin
  let smsResult = null;
  try {
    const detailSummary = Object.entries(details)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(', ');
    const adminSmsText = `🚨 Saumyaa Admin Alert [${alertType}]: ${title}${detailSummary ? ' | ' + detailSummary : ''}`;
    smsResult = await sendGenericSMS({
      phone: adminPhone,
      text: adminSmsText.slice(0, 160),
    });
  } catch (e) {
    smsResult = { success: false, error: e.message };
  }

  // 4. In-App Notification for Admin
  let inAppResult = null;
  if (mongoose.connection.readyState === 1) {
    try {
      inAppResult = await Notification.create({
        recipientRole: 'Admin',
        title: `[${alertType}] ${title}`,
        message: `${title}. Check portal for details.`,
        type: 'System',
        link: actionUrl,
      });
    } catch (err) {
      console.warn('[NotificationService] Admin in-app alert failed:', err.message);
    }
  }

  return { success: true, email: emailResult, sms: smsResult, inApp: inAppResult };
}

/**
 * 8. Dispatch Demo Class Scheduled Notification (SMS + Email)
 */
export async function notifyDemoClassSchedule({
  studentName,
  phone,
  email,
  subject,
  className,
  scheduledDate,
  scheduledTime,
  facultyMentor,
  meetingMode,
  branch,
  bookingId,
  notes,
  triggeredBy = 'Admin',
}) {
  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Scheduled Date';

  // 1. Dispatch SMS
  let smsResult = null;
  const smsText = `Dear ${studentName || 'Student'}, your Demo Class for ${subject || 'Demo'} (${className || 'General'}) is scheduled on ${formattedDate} at ${scheduledTime || '04:30 PM'} (${meetingMode || 'Offline Classroom'}) at ${branch || 'Main Center'}. Mentor: ${facultyMentor || 'Jitender Sharma'}. - Saumyaa Studies`;

  if (phone) {
    try {
      smsResult = await sendGenericSMS({
        phone,
        text: smsText,
      });
    } catch (e) {
      smsResult = { success: false, error: e.message };
    }
  }

  // 2. Dispatch Email
  let emailResult = null;
  if (email && email.includes('@')) {
    try {
      emailResult = await sendDemoScheduleEmail({
        to: email,
        studentName: studentName || 'Student',
        subject: subject || 'Demo Class',
        className: className || 'General',
        scheduledDate,
        scheduledTime: scheduledTime || '04:30 PM',
        facultyMentor: facultyMentor || 'Jitender Sharma',
        meetingMode: meetingMode || 'Offline Classroom',
        branch: branch || 'Main Center',
        bookingId: bookingId || 'DM-DEMO',
        notes,
      });
    } catch (e) {
      emailResult = { success: false, error: e.message };
    }
  }

  // 3. Create Admin / System Notification
  if (mongoose.connection.readyState === 1) {
    try {
      await Notification.create({
        recipientRole: 'Admin',
        title: `Demo Scheduled: ${studentName || 'Student'}`,
        message: `Demo for ${studentName} (${subject}) scheduled on ${formattedDate} at ${scheduledTime}. SMS: ${smsResult?.success ? 'Sent' : 'Attempted'}, Email: ${emailResult?.success ? 'Sent' : 'Skipped/Sent'}`,
        type: 'Announcement',
      });
    } catch (e) {}
  }

  return {
    success: true,
    sms: smsResult,
    email: emailResult,
    smsText,
  };
}


