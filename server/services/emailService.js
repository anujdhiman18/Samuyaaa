import { getTransporter, ALL_EMAIL_TARGETS, EMAIL_TARGET_STRING } from '../config/nodemailer.js';

/**
 * Generic email dispatcher with graceful error handling and simulation fallback
 */
export async function sendEmail({ to, subject, html, text, from = null }) {
  const recipient = Array.isArray(to) ? to.join(', ') : to;
  if (!recipient) {
    console.warn('[EmailService] Dispatch skipped: No recipient email specified.');
    return { success: false, reason: 'NO_RECIPIENT' };
  }

  const sender = from || `"Saumyaa Studies" <${process.env.EMAIL_USER || 'noreply@saumyaastudies.com'}>`;

  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: sender,
      to: recipient,
      subject,
      text: text || '',
      html: html || `<p>${text}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email successfully sent to ${recipient}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      recipient,
    };
  } catch (error) {
    console.warn(`[EmailService] SMTP send failed for ${recipient} (${error.message}). Running in mock/safe fallback mode.`);
    return {
      success: false,
      error: error.message,
      simulated: true,
      recipient,
    };
  }
}

/**
 * Notify student regarding profile/academic updates
 */
export async function sendStudentUpdateEmail({ student, updatedFields = 'Profile & Academic Details' }) {
  if (!student?.email) return { success: false, reason: 'NO_STUDENT_EMAIL' };

  const studentName = student.fullName || student.name || 'Student';
  const rollNumber = student.rollNumber || 'N/A';
  const className = student.className || 'N/A';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">Saumyaa Studies</h2>
        <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Excellence in Education</p>
      </div>
      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;">Student Record Updated</h3>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
          Hello <strong>${studentName}</strong>, your student record has been updated by the administration.
        </p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 40%;">Roll Number:</td>
          <td style="padding: 8px 0; color: #1e293b;">${rollNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Class:</td>
          <td style="padding: 8px 0; color: #1e293b;">${className}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Modified Fields:</td>
          <td style="padding: 8px 0; color: #4f46e5; font-weight: 600;">${updatedFields}</td>
        </tr>
      </table>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
        If you have any questions regarding these changes, please contact the administrative desk or your class coordinator.
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Saumyaa Studies. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: student.email,
    subject: `Student Record Updated - ${studentName} (${rollNumber})`,
    html,
    text: `Hello ${studentName}, your student record (${updatedFields}) has been updated. - Saumyaa Studies`,
  });
}

/**
 * Notify faculty regarding profile/teaching assignment updates
 */
export async function sendFacultyUpdateEmail({ faculty, updatedFields = 'Profile & Assignment Details' }) {
  if (!faculty?.email) return { success: false, reason: 'NO_FACULTY_EMAIL' };

  const facultyName = faculty.name || faculty.fullName || 'Faculty Member';
  const role = faculty.role || 'Faculty';
  const branch = faculty.branch || 'Main Center';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0284c7; margin: 0; font-size: 24px; font-weight: 700;">Saumyaa Studies</h2>
        <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Faculty Management System</p>
      </div>
      <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">Faculty Profile / Assignment Updated</h3>
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">
          Dear <strong>${facultyName}</strong>, your faculty profile / assigned details have been updated by administration.
        </p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 40%;">Designation / Role:</td>
          <td style="padding: 8px 0; color: #1e293b;">${role}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Branch:</td>
          <td style="padding: 8px 0; color: #1e293b;">${branch}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Updated Details:</td>
          <td style="padding: 8px 0; color: #0284c7; font-weight: 600;">${updatedFields}</td>
        </tr>
      </table>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Saumyaa Studies. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: faculty.email,
    subject: `Faculty Profile Updated - ${facultyName}`,
    html,
    text: `Dear ${facultyName}, your profile details (${updatedFields}) have been updated. - Saumyaa Studies`,
  });
}

/**
 * Send critical alerts to Admin (Applications, Profile Requests, Leaves)
 */
export async function sendAdminAlertEmail({ alertType, title, details = {}, actionUrl = '' }) {
  const adminRecipients = ALL_EMAIL_TARGETS;

  const rows = Object.entries(details)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 35%;">${key}:</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${typeof val === 'object' ? JSON.stringify(val) : val}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">🚨 Admin Alert: ${alertType}</h2>
        <span style="background-color: #fef2f2; color: #ef4444; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #fecaca;">ATTENTION REQUIRED</span>
      </div>
      <p style="color: #334155; font-size: 15px; font-weight: 600; margin-bottom: 16px;">
        ${title}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        ${rows}
      </table>
      ${
        actionUrl
          ? `<div style="text-align: center; margin-bottom: 24px;">
              <a href="${actionUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">Open Admin Portal</a>
            </div>`
          : ''
      }
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; color: #94a3b8; font-size: 12px; text-align: center;">
        Saumyaa Studies Administration Notification System &bull; ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  return await sendEmail({
    to: adminRecipients,
    subject: `[ADMIN ALERT] ${alertType}: ${title}`,
    html,
    text: `Admin Alert: ${title}. Please check the admin portal for full details.`,
  });
}

/**
 * Send Fee Reminder Email to Student / Parent
 */
export async function sendFeeReminderEmail({ student, dueAmount, className, rollNumber }) {
  if (!student?.email) return { success: false, reason: 'NO_STUDENT_EMAIL' };

  const studentName = student.fullName || student.name || 'Student';
  const formattedDue = Number(dueAmount || student.dueAmount || 0).toLocaleString();
  const cName = className || student.className || 'General';
  const rNum = rollNumber || student.rollNumber || 'N/A';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 700;">Saumyaa Studies</h2>
        <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Fee Management Department</p>
      </div>
      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #9a3412; font-size: 16px;">Tuition Fee Due Reminder</h3>
        <p style="margin: 0; color: #7c2d12; font-size: 14px; line-height: 1.5;">
          Dear Parent / Student, this is a formal reminder that the tuition fee of <strong>₹${formattedDue}</strong> is pending for <strong>${studentName}</strong> (${rNum}, Class ${cName}).
        </p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 40%;">Student Name:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Roll Number:</td>
          <td style="padding: 8px 0; color: #1e293b;">${rNum}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Class:</td>
          <td style="padding: 8px 0; color: #1e293b;">${cName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Pending Due Amount:</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 18px; font-weight: 700;">₹${formattedDue}</td>
        </tr>
      </table>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 13px; color: #475569; margin-bottom: 20px;">
        Kindly clear the dues at your earliest convenience to avoid any disruption in classes or academic resources.
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Saumyaa Studies. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: student.email,
    subject: `Tuition Fee Due Reminder: ₹${formattedDue} for ${studentName} (${rNum})`,
    html,
    text: `Dear Parent/Student, the tuition fee of ₹${formattedDue} for ${studentName} (${rNum}, Class ${cName}) is pending. Kindly pay at the earliest. - Saumyaa Studies`,
  });
}

/**
 * Send Demo Class Confirmation & Schedule Email to Student / Parent
 */
export async function sendDemoScheduleEmail({
  to,
  studentName,
  subject,
  className,
  scheduledDate,
  scheduledTime,
  facultyMentor,
  meetingMode,
  branch,
  bookingId,
  notes,
}) {
  if (!to) return { success: false, reason: 'NO_EMAIL_PROVIDED' };

  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Scheduled Date';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #c7d2fe; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">Saumyaa Studies</h2>
        <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Demo Class Confirmation &amp; Schedule</p>
      </div>
      <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #312e81; font-size: 16px;">🎉 Your Demo Class Has Been Scheduled!</h3>
        <p style="margin: 0; color: #4338ca; font-size: 14px; line-height: 1.5;">
          Dear <strong>${studentName}</strong>, your requested demo session has been scheduled by our academic team. Details are provided below:
        </p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 38%;">Booking ID:</td>
          <td style="padding: 10px 0; color: #1e293b; font-weight: 700;">${bookingId || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Subject &amp; Class:</td>
          <td style="padding: 10px 0; color: #4f46e5; font-weight: 700;">${subject} &bull; ${className}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Date &amp; Time:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${formattedDate} at ${scheduledTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Mode / Campus:</td>
          <td style="padding: 10px 0; color: #0f172a;">${meetingMode || 'Offline Classroom'} (${branch || 'Main Center'})</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Faculty Mentor:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${facultyMentor || 'Assigned Mentor'}</td>
        </tr>
        ${
          notes
            ? `<tr>
                <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Special Notes:</td>
                <td style="padding: 10px 0; color: #334155;">${notes}</td>
              </tr>`
            : ''
        }
      </table>
      <div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; color: #475569; margin-bottom: 20px; line-height: 1.5;">
        <strong>Instructions:</strong> Please arrive 10 minutes prior to the session. Bring your notebook and queries. For any reschedule request, please reply to this email or call our desk at <strong>+91 9816543210</strong>.
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Saumyaa Studies. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to,
    subject: `Demo Class Confirmed: ${subject} (${className}) - ${formattedDate} at ${scheduledTime}`,
    html,
    text: `Dear ${studentName}, your Demo Class for ${subject} (${className}) is scheduled on ${formattedDate} at ${scheduledTime} (${meetingMode}) at ${branch}. Mentor: ${facultyMentor}. - Saumyaa Studies`,
  });
}

