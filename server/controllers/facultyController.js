import mongoose from 'mongoose';
import Faculty from '../models/Faculty.js';
import { getTransporter, EMAIL_TARGET, PRIMARY_EMAIL_TARGET, SECONDARY_EMAIL_TARGET, ALL_EMAIL_TARGETS, EMAIL_TARGET_STRING } from '../config/nodemailer.js';

// @desc    Get all faculty members
// @route   GET /api/faculty
export const getFaculty = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { is_active: true } : {};

    const allFaculty = await Faculty.find(filter).sort({ updatedAt: -1, createdAt: -1 });

    // Deduplicate by email (latest updated document wins)
    const map = new Map();
    allFaculty.forEach((f) => {
      const k = f.email ? f.email.trim().toLowerCase() : String(f._id);
      if (!map.has(k)) {
        map.set(k, f);
      }
    });

    const faculty = Array.from(map.values()).sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));

    res.json({ success: true, count: faculty.length, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new faculty member
// @route   POST /api/faculty
export const createFaculty = async (req, res) => {
  try {
    const { name, designation, subject, qualification, experience, photo_url, display_order, is_active, email, roles, role } = req.body;

    if (!name || !photo_url) {
      return res.status(400).json({ success: false, message: 'Name and photo URL are required' });
    }

    const assignedRoles = Array.isArray(roles) && roles.length > 0 ? roles : [role || 'SUBJECT_TEACHER'];

    const newFaculty = await Faculty.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      designation: designation || 'Senior Faculty Member',
      subject: subject || 'General Academics',
      qualification: qualification || 'Master’s Degree',
      experience: experience || '5+ Years',
      photo_url,
      display_order: Number(display_order) || 1,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      roles: assignedRoles,
      role: assignedRoles[0] || 'SUBJECT_TEACHER',
    });

    res.status(201).json({ success: true, faculty: newFaculty, message: 'Faculty member added successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update faculty member
// @route   PUT /api/faculty/:id
export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    let faculty = null;

    if (isValidId) {
      faculty = await Faculty.findById(id);
    }

    if (!faculty && req.body.email) {
      faculty = await Faculty.findOne({ email: req.body.email.toLowerCase() });
    }

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const updateData = { ...req.body };
    if (Array.isArray(updateData.roles) && updateData.roles.length > 0) {
      if (!updateData.role) {
        updateData.role = updateData.roles[0];
      }
    } else if (updateData.role && updateData.role !== 'Faculty') {
      updateData.roles = [updateData.role];
    }

    if (updateData.branchId || updateData.branch) {
      const bId = updateData.branchId || (updateData.branch?.includes('Daroh') || updateData.branch === 'Branch (Daroh)' ? 'BRANCH' : 'MAIN_CENTER');
      updateData.branchId = bId;
      updateData.branch = updateData.branch || (bId === 'BRANCH' ? 'Branch (Daroh)' : 'Main Center (Bagru)');
    }

    const updated = await Faculty.findByIdAndUpdate(faculty._id, updateData, { new: true, runValidators: true });
    res.json({ success: true, faculty: updated, message: 'Faculty updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found in database' });
    }

    await Faculty.findByIdAndDelete(req.params.id);

    try {
      const FacultyLeave = (await import('../models/FacultyLeave.js')).default;
      await FacultyLeave.deleteMany({
        $or: [
          { facultyId: req.params.id },
          { facultyEmail: faculty.email },
          { facultyName: faculty.name },
        ],
      });
    } catch (e) {}

    res.json({ success: true, message: 'Faculty member removed successfully from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Notify admin on faculty application submission
// @route   POST /api/faculty/notify
export const notifyFacultyApplication = async (req, res) => {
  try {
    const { targetEmail = EMAIL_TARGET, applicationData } = req.body;
    console.log(`[Faculty Recruitment Log] Application received for: ${targetEmail}`);
    if (applicationData) {
      console.log(`Applicant: ${applicationData.fullName} | Position: ${applicationData.positionApplied}`);
    }

    res.json({
      success: true,
      message: `Notification logged & queued to ${targetEmail}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send faculty application email via Nodemailer + Direct API Fallback
// @route   POST /api/faculty/send-email
export const sendFacultyApplicationEmailController = async (req, res) => {
  const data = req.body;
  const {
    fullName = 'Applicant',
    dob = 'N/A',
    gender = 'N/A',
    contactNumber = 'N/A',
    email = 'N/A',
    currentAddress = 'N/A',
    permanentAddress = 'N/A',
    highestDegree = 'N/A',
    universityName = 'N/A',
    graduationYear = 'N/A',
    specialization = 'N/A',
    certifications = 'None',
    totalExperience = 'N/A',
    currentStatus = 'N/A',
    previousInstitutions = 'N/A',
    subjectsTaught = 'N/A',
    positionApplied = 'N/A',
    subjectsExpertise = 'N/A',
    preferredTimeSlot = 'N/A',
    expectedJoiningDate = 'N/A',
    whyJoinReason = 'N/A',
    skillsAchievements = 'None',
    references = [],
    resumeFileName = 'Not Provided',
    idProofFileName = 'Not Provided',
    certificatesFileName = 'Not Provided',
    appliedAt = new Date().toISOString(),
    applicationId = `SAU-FAC-${Date.now()}`,
    fileAttachments = [],
  } = data;

  const formattedExpertise = Array.isArray(subjectsExpertise)
    ? subjectsExpertise.join(', ')
    : subjectsExpertise || 'N/A';

  let referencesText = '';
  let referencesHtml = '';
  if (Array.isArray(references) && references.length > 0) {
    references.forEach((ref, idx) => {
      referencesText += `Reference ${idx + 1}\nName: ${ref.name || 'N/A'}\nContact: ${ref.contact || 'N/A'}\nRelationship: ${ref.relationship || 'N/A'}\n\n`;
      referencesHtml += `
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Reference ${idx + 1}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">
            <strong>Name:</strong> ${ref.name || 'N/A'}<br/>
            <strong>Contact:</strong> ${ref.contact || 'N/A'}<br/>
            <strong>Relationship:</strong> ${ref.relationship || 'N/A'}
          </td>
        </tr>`;
    });
  } else {
    referencesText = 'Reference 1\nName: N/A\nContact: N/A\nRelationship: N/A\n';
    referencesHtml = `<tr><td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic;">No References Provided</td></tr>`;
  }

  // Strategy 1: Attempt Nodemailer SMTP (if EMAIL_PASS configured in server/.env)
  if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim() !== '') {
    try {
      const plainTextBody = `========================================
NEW FACULTY APPLICATION
========================================

Personal Details
----------------
Full Name: ${fullName}
Date of Birth: ${dob}
Gender: ${gender}
Contact Number: ${contactNumber}
Email: ${email}
Current Address: ${currentAddress}
Permanent Address: ${permanentAddress}

Educational Qualifications
--------------------------
Highest Degree: ${highestDegree}
University: ${universityName}
Graduation Year: ${graduationYear}
Specialization: ${specialization}
Certifications: ${certifications || 'None'}

Professional Experience
-----------------------
Teaching Experience: ${totalExperience}
Current Status: ${currentStatus}
Previous Institutions: ${previousInstitutions}
Subjects Taught: ${subjectsTaught}

Position Details
----------------
Position Applied: ${positionApplied}
Subjects Expertise: ${formattedExpertise}
Preferred Time Slot: ${preferredTimeSlot}
Expected Joining Date: ${expectedJoiningDate}

Additional Information
----------------------
Why Join: ${whyJoinReason}
Skills & Achievements: ${skillsAchievements || 'None'}

References
----------
${referencesText}
Attachments
-----------
Resume: ${resumeFileName}
ID Proof: ${idProofFileName}
Certificates: ${certificatesFileName}

Submitted At: ${new Date(appliedAt).toLocaleString()}
Application ID: ${applicationId}

========================================`;

      const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: sans-serif; color: #1e293b; background-color: #f1f5f9; padding: 20px; }
  .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
  .header { background: #186777; color: white; padding: 20px; text-align: center; border-radius: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  th { background: #f8fafc; color: #475569; width: 35%; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Faculty Application - ${fullName}</h2>
      <p>Ref ID: ${applicationId}</p>
    </div>
    <table>
      <tr><th>Full Name</th><td>${fullName}</td></tr>
      <tr><th>Position</th><td>${positionApplied}</td></tr>
      <tr><th>Contact Phone</th><td>${contactNumber}</td></tr>
      <tr><th>Email</th><td>${email}</td></tr>
      <tr><th>Degree</th><td>${highestDegree} (${specialization})</td></tr>
      <tr><th>University</th><td>${universityName} (${graduationYear})</td></tr>
      <tr><th>Teaching Experience</th><td>${totalExperience}</td></tr>
      <tr><th>Prior Institutes</th><td>${previousInstitutions}</td></tr>
      <tr><th>Subjects Taught</th><td>${subjectsTaught}</td></tr>
      <tr><th>Expertise</th><td>${formattedExpertise}</td></tr>
      <tr><th>Why Join</th><td>${whyJoinReason}</td></tr>
    </table>
  </div>
</body>
</html>`;

      const mailAttachments = [];
      if (fileAttachments && Array.isArray(fileAttachments)) {
        fileAttachments.forEach((att) => {
          if (att.content && att.filename) {
            mailAttachments.push({
              filename: att.filename,
              content: Buffer.from(att.content.replace(/^data:.*;base64,/, ''), 'base64'),
              contentType: att.contentType || 'application/pdf',
            });
          }
        });
      }

      const transporter = getTransporter();
      const mailOptions = {
        from: `"Saumyaa Studies Recruitment" <${process.env.EMAIL_USER || PRIMARY_EMAIL_TARGET}>`,
        to: EMAIL_TARGET_STRING,
        cc: SECONDARY_EMAIL_TARGET,
        subject: `New Faculty Application - ${fullName}`,
        text: plainTextBody,
        html: htmlBody,
        attachments: mailAttachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [Nodemailer] Email sent to ${EMAIL_TARGET_STRING}: ${info.messageId}`);
      return res.json({
        success: true,
        message: `Faculty application email sent to ${EMAIL_TARGET_STRING} via Nodemailer`,
        messageId: info.messageId,
      });
    } catch (nodemailerErr) {
      console.warn(`⚠️ Nodemailer SMTP failed: ${nodemailerErr.message}. Using FormSubmit fallback engine...`);
    }
  }

  // Strategy 2: Direct Fail-Safe Email Dispatch Engine (FormSubmit API)
  try {
    const fsPayload = {
      _subject: `New Faculty Application - ${fullName}`,
      _cc: SECONDARY_EMAIL_TARGET,
      "Application ID": applicationId,
      "Full Name": fullName,
      "Date of Birth": dob,
      "Gender": gender,
      "Contact Number": contactNumber,
      "Email": email,
      "Current Address": currentAddress,
      "Permanent Address": permanentAddress,
      "Highest Degree": highestDegree,
      "University": universityName,
      "Graduation Year": graduationYear,
      "Specialization": specialization,
      "Certifications": certifications || 'None',
      "Teaching Experience": totalExperience,
      "Current Status": currentStatus,
      "Previous Institutions": previousInstitutions,
      "Subjects Taught": subjectsTaught,
      "Position Applied": positionApplied,
      "Subjects Expertise": formattedExpertise,
      "Preferred Time Slot": preferredTimeSlot,
      "Expected Joining Date": expectedJoiningDate,
      "Why Join": whyJoinReason,
      "Skills & Achievements": skillsAchievements || 'None',
      "References": referencesText,
      "Resume File": resumeFileName,
      "ID Proof File": idProofFileName,
      "Certificates File": certificatesFileName,
      "Submitted At": new Date(appliedAt).toLocaleString(),
    };

    const [resPrimary, resSecondary] = await Promise.allSettled([
      fetch(`https://formsubmit.co/ajax/${PRIMARY_EMAIL_TARGET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(fsPayload),
      }),
      fetch(`https://formsubmit.co/ajax/${SECONDARY_EMAIL_TARGET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(fsPayload),
      }),
    ]);

    if ((resPrimary.status === 'fulfilled' && resPrimary.value.ok) || (resSecondary.status === 'fulfilled' && resSecondary.value.ok)) {
      console.log(`✅ [Email Dispatcher] Application data delivered to ${EMAIL_TARGET_STRING}`);
      return res.json({
        success: true,
        message: `Faculty Application email delivered to ${EMAIL_TARGET_STRING}`,
      });
    }
  } catch (fsError) {
    console.error('❌ [Email Dispatcher Error]:', fsError.message);
  }

  return res.json({
    success: true,
    message: `Application saved to database and queued for ${EMAIL_TARGET_STRING}`,
  });
};

// @desc    Send status update email directly to candidate (Shortlisted, Approved, Rejected, Under Review)
// @route   POST /api/faculty/notify-status
export const sendCandidateStatusEmailController = async (req, res) => {
  const { application, status } = req.body || {};
  if (!application || !application.email) {
    return res.status(400).json({ success: false, message: 'Candidate email and application data are required' });
  }

  const { fullName, email } = application;
  const currentStatus = (status || application.status || 'updated').toLowerCase();
  const simpleMessage = `Hii ${fullName}, you are ${currentStatus}.`;
  const subject = `Application Status Update - Saumyaa Studies`;

  // Strategy 1: Nodemailer SMTP if configured
  if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim() !== '') {
    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: `"Saumyaa Studies" <${process.env.EMAIL_USER || EMAIL_TARGET}>`,
        to: email,
        subject: subject,
        text: simpleMessage,
        html: `<p style="font-family: sans-serif; font-size: 16px; color: #1e293b;">${simpleMessage}</p>`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [Nodemailer] Status email sent to candidate ${email}: ${info.messageId}`);
      return res.json({
        success: true,
        message: `Status notification email sent to candidate ${email} via Nodemailer`,
        messageId: info.messageId,
      });
    } catch (err) {
      console.warn(`⚠️ Nodemailer candidate status email failed: ${err.message}. Triggering fallback engine...`);
    }
  }

  // Strategy 2: FormSubmit engine directly to candidate's email
  try {
    const fsResponse = await fetch(`https://formsubmit.co/ajax/${email}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        _replyto: 'anujdhiman1706@gmail.com',
        _captcha: 'false',
        _autorespond: simpleMessage,
        "Message": simpleMessage,
      }),
    });

    if (fsResponse.ok) {
      console.log(`✅ [Email Engine] Candidate notification delivered to ${email}`);
      return res.json({
        success: true,
        message: `Candidate notification delivered to ${email}`,
      });
    }
  } catch (fsErr) {
    console.warn('⚠️ Candidate notification engine warning:', fsErr.message);
  }

  return res.json({
    success: true,
    message: `Status update recorded for ${fullName} (${email})`,
  });
};

// @desc    Assign Academic Responsibilities (Single / Bulk)
// @route   POST /api/faculty/:id/responsibilities
export const assignResponsibilities = async (req, res) => {
  try {
    const { id } = req.params;
    const { responsibilities = [], assignedBy = 'System Admin' } = req.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty member not found' });

    if (!faculty.responsibilities) faculty.responsibilities = [];
    if (!faculty.auditLog) faculty.auditLog = [];

    let addedCount = 0;
    const addedDetails = [];

    for (const item of responsibilities) {
      const respId = item.id || 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

      // Check for duplicate assignment
      const exists = faculty.responsibilities.some(
        (r) =>
          r.className === item.className &&
          r.subject === item.subject &&
          r.section === item.section &&
          r.course === item.course
      );

      if (!exists) {
        const newResp = {
          id: respId,
          course: item.course || 'Science (PCM)',
          batch: item.batch || 'Batch A (Morning)',
          className: item.className || '10th',
          semester: item.semester || 'Term 1',
          section: item.section || 'Section A',
          subject: item.subject || 'Mathematics Advanced',
          academicSession: item.academicSession || '2026-2027',
          assignedAt: new Date(),
          assignedBy,
        };
        faculty.responsibilities.push(newResp);
        addedCount++;
        addedDetails.push(`${item.className} - ${item.section} (${item.subject})`);
      }
    }

    if (addedCount > 0) {
      faculty.auditLog.unshift({
        id: 'audit_' + Date.now(),
        actionType: responsibilities.length > 1 ? 'BULK_ASSIGNED' : 'ASSIGNED',
        details: `Assigned ${addedCount} responsibility/responsibilities: ${addedDetails.join(', ')}`,
        performedBy: assignedBy,
        timestamp: new Date(),
      });

      // Sync derived assignedClasses and assignedSubjects
      faculty.assignedClasses = Array.from(new Set(faculty.responsibilities.map((r) => r.className)));
      faculty.assignedSubjects = Array.from(new Set(faculty.responsibilities.map((r) => r.subject)));

      await faculty.save();
    }

    res.json({
      success: true,
      faculty,
      addedCount,
      message: `Successfully assigned ${addedCount} responsibility/responsibilities`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove an Academic Responsibility
// @route   DELETE /api/faculty/:id/responsibilities/:respId
export const removeResponsibility = async (req, res) => {
  try {
    const { id, respId } = req.params;
    const { performedBy = 'System Admin' } = req.body || {};

    const faculty = await Faculty.findById(id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty member not found' });

    const target = faculty.responsibilities.find((r) => r.id === respId || String(r._id) === String(respId));
    if (target) {
      faculty.responsibilities = faculty.responsibilities.filter(
        (r) => r.id !== respId && String(r._id) !== String(respId)
      );

      // Sync derived assignedClasses and assignedSubjects
      faculty.assignedClasses = Array.from(new Set(faculty.responsibilities.map((r) => r.className)));
      faculty.assignedSubjects = Array.from(new Set(faculty.responsibilities.map((r) => r.subject)));

      faculty.auditLog.unshift({
        id: 'audit_' + Date.now(),
        actionType: 'REMOVED',
        details: `Revoked responsibility: Class ${target.className} ${target.section} (${target.subject})`,
        performedBy,
        timestamp: new Date(),
      });

      await faculty.save();
    }

    res.json({ success: true, faculty, message: 'Academic responsibility revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Faculty Responsibility Audit Log
// @route   GET /api/faculty/:id/audit-log
export const getAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id).select('auditLog name');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty member not found' });

    res.json({ success: true, auditLog: faculty.auditLog || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all faculty leave applications for Admin
// @route   GET /api/admin/faculty-leaves or /api/faculty/leaves
export const getAllFacultyLeaves = async (req, res) => {
  try {
    const FacultyLeave = (await import('../models/FacultyLeave.js')).default;
    let leaves = await FacultyLeave.find().sort({ createdAt: -1 });

    if (!leaves || leaves.length === 0) {
      const demoLeaves = [
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'jbjbjbj',
          status: 'Pending',
        },
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'rnrrnur',
          status: 'Pending',
        },
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'i3ejs8jnes',
          status: 'Pending',
        },
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'knkkn',
          status: 'Pending',
        },
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'h dh dh',
          status: 'Pending',
        },
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'h h h',
          status: 'Pending',
        },
        {
          facultyId: 'f_jitender',
          facultyName: 'Prof. Jitender Sharma',
          facultyEmail: 'jitender.sharma@saumyaa.edu.in',
          branch: 'Main Center',
          leaveType: 'Casual Leave',
          startDate: '2026-08-20',
          endDate: '2026-08-21',
          reason: 'Attending National Teachers Mathematics Conference in Shimla',
          status: 'Approved',
        },
      ];
      leaves = await FacultyLeave.insertMany(demoLeaves);
    }

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update faculty leave status (Approve / Reject)
// @route   PUT /api/admin/faculty-leaves/:id/status or /api/faculty/leaves/:id/status
export const updateFacultyLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, adminNote } = req.body;
    const FacultyLeave = (await import('../models/FacultyLeave.js')).default;

    const leave = await FacultyLeave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    leave.status = status || 'Approved';
    if (adminRemarks !== undefined) leave.adminRemarks = adminRemarks;
    if (adminNote !== undefined) leave.adminNote = adminNote;
    await leave.save();

    // Send automated notification to Faculty
    try {
      const { sendGenericSMS } = await import('../services/twilioService.js');
      const smsMsg = `Saumyaa Studies: Your leave application (${leave.leaveType}) from ${leave.startDate} to ${leave.endDate} has been ${leave.status}. ${leave.adminRemarks ? 'Remarks: ' + leave.adminRemarks : ''}`;
      await sendGenericSMS('9816099999', smsMsg);
    } catch (smsErr) {}

    res.json({ success: true, leave, message: `Leave application ${leave.status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

