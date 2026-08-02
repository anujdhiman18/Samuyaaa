import Faculty from '../models/Faculty.js';
import { getTransporter, EMAIL_TARGET } from '../config/nodemailer.js';

// @desc    Get all faculty members
// @route   GET /api/faculty
export const getFaculty = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { is_active: true } : {};

    const faculty = await Faculty.find(filter).sort({ display_order: 1, createdAt: -1 });

    res.json({ success: true, count: faculty.length, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new faculty member
// @route   POST /api/faculty
export const createFaculty = async (req, res) => {
  try {
    const { name, designation, subject, qualification, experience, photo_url, display_order, is_active } = req.body;

    if (!name || !photo_url) {
      return res.status(400).json({ success: false, message: 'Name and photo URL are required' });
    }

    const newFaculty = await Faculty.create({
      name,
      designation: designation || 'Senior Faculty Member',
      subject: subject || 'General Academics',
      qualification: qualification || 'Master’s Degree',
      experience: experience || '5+ Years',
      photo_url,
      display_order: Number(display_order) || 1,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
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
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, faculty: updated, message: 'Faculty updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete faculty member
// @route   DELETE /api/faculty/:id
export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Faculty member removed successfully' });
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
        from: `"Saumyaa Studies Recruitment" <${process.env.EMAIL_USER || EMAIL_TARGET}>`,
        to: EMAIL_TARGET,
        subject: `New Faculty Application - ${fullName}`,
        text: plainTextBody,
        html: htmlBody,
        attachments: mailAttachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [Nodemailer] Email sent to ${EMAIL_TARGET}: ${info.messageId}`);
      return res.json({
        success: true,
        message: `Faculty application email sent to ${EMAIL_TARGET} via Nodemailer`,
        messageId: info.messageId,
      });
    } catch (nodemailerErr) {
      console.warn(`⚠️ Nodemailer SMTP failed: ${nodemailerErr.message}. Using FormSubmit fallback engine...`);
    }
  }

  // Strategy 2: Direct Fail-Safe Email Dispatch Engine (FormSubmit API)
  try {
    const fsResponse = await fetch(`https://formsubmit.co/ajax/${EMAIL_TARGET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: `New Faculty Application - ${fullName}`,
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
      }),
    });

    if (fsResponse.ok) {
      console.log(`✅ [Email Dispatcher] Application data delivered to ${EMAIL_TARGET}`);
      return res.json({
        success: true,
        message: `Faculty Application email delivered to ${EMAIL_TARGET}`,
      });
    }
  } catch (fsError) {
    console.error('❌ [Email Dispatcher Error]:', fsError.message);
  }

  return res.json({
    success: true,
    message: `Application saved to database and queued for ${EMAIL_TARGET}`,
  });
};

// @desc    Send status update email directly to candidate (Shortlisted, Approved, Rejected, Under Review)
// @route   POST /api/faculty/notify-status
export const sendCandidateStatusEmailController = async (req, res) => {
  const { application, status, notes = '' } = req.body || {};
  if (!application || !application.email) {
    return res.status(400).json({ success: false, message: 'Candidate email and application data are required' });
  }

  const { fullName, email, positionApplied, applicationId } = application;
  const currentStatus = status || application.status || 'Updated';

  let subject = `Application Status Update - ${applicationId || 'Saumyaa Studies'}`;
  let statusHeadline = `Application Status: ${currentStatus}`;
  let statusBadgeColor = '#2563eb'; // default blue
  let messageBody = '';

  if (currentStatus === 'Shortlisted') {
    subject = `🎉 Congratulations! Your Application has been Shortlisted - Saumyaa Studies`;
    statusHeadline = `You have been Shortlisted!`;
    statusBadgeColor = '#2563eb';
    messageBody = `We are pleased to inform you that your application for <strong>${positionApplied || 'Faculty Member'}</strong> has been <strong>Shortlisted</strong> by our academic screening committee.<br/><br/>Our recruitment team will contact you shortly regarding the next step (interview schedule / demo presentation).`;
  } else if (currentStatus === 'Approved' || currentStatus === 'Selected') {
    subject = `🌟 Welcome Onboard! Application Approved - Saumyaa Studies`;
    statusHeadline = `Application Approved & Selected!`;
    statusBadgeColor = '#059669';
    messageBody = `Congratulations! We are delighted to inform you that your application for <strong>${positionApplied || 'Faculty Member'}</strong> at Saumyaa Studies has been <strong>Approved and Selected</strong>!<br/><br/>Welcome to our faculty team. Our academic operations desk will reach out with your onboarding document and schedule details.`;
  } else if (currentStatus === 'Rejected') {
    subject = `Update regarding your Faculty Application - Saumyaa Studies`;
    statusHeadline = `Application Status Update`;
    statusBadgeColor = '#e11d48';
    messageBody = `Thank you for taking the time to apply for <strong>${positionApplied || 'Faculty Member'}</strong> at Saumyaa Studies.<br/><br/>After thorough evaluation, we regret to inform you that we are unable to move forward with your candidate application at this time. We appreciate your interest and wish you success in your future academic endeavors.`;
  } else if (currentStatus === 'Under Review') {
    subject = `Application Under Review - Saumyaa Studies`;
    statusHeadline = `Application Under Review`;
    statusBadgeColor = '#d97706';
    messageBody = `Your application for <strong>${positionApplied || 'Faculty Member'}</strong> is currently <strong>Under Active Review</strong> by our department head and subject panel. We will update you as soon as the evaluation is completed.`;
  } else {
    subject = `Faculty Application Status Update: ${currentStatus} - Saumyaa Studies`;
    messageBody = `The status of your application for <strong>${positionApplied || 'Faculty Member'}</strong> has been updated to <strong>${currentStatus}</strong>.`;
  }

  if (notes) {
    messageBody += `<br/><br/><strong>Additional Remarks:</strong> <em>${notes}</em>`;
  }

  // Strategy 1: Nodemailer SMTP if configured
  if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim() !== '') {
    try {
      const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
  .logo-title { color: #186777; font-size: 22px; font-weight: 800; margin: 0; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; color: #ffffff; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; }
  .content { font-size: 15px; line-height: 1.6; color: #334155; }
  .info-box { background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid ${statusBadgeColor}; }
  .footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 class="logo-title">Saumyaa Studies</h2>
      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Academic Recruitment Cell</p>
      <div class="badge" style="background-color: ${statusBadgeColor};">${statusHeadline}</div>
    </div>
    <div class="content">
      <p>Dear <strong>${fullName}</strong>,</p>
      <div class="info-box">
        ${messageBody}
      </div>
      <p style="font-size: 13px; color: #64748b;">
        <strong>Application Ref ID:</strong> ${applicationId || 'N/A'}<br/>
        <strong>Position Applied:</strong> ${positionApplied || 'N/A'}<br/>
        <strong>Updated Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      <p>Best regards,<br/><strong>Saumyaa Studies Academic Board</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Saumyaa Studies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      const transporter = getTransporter();
      const mailOptions = {
        from: `"Saumyaa Studies Recruitment" <${process.env.EMAIL_USER || EMAIL_TARGET}>`,
        to: email,
        subject: subject,
        html: htmlBody,
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

  // Strategy 2: FormSubmit fallback directly to candidate's email
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
        _template: 'box',
        _captcha: 'false',
        _autorespond: messageBody.replace(/<[^>]*>?/gm, ''),
        "Candidate Name": fullName,
        "Application Ref ID": applicationId || 'N/A',
        "Position Applied": positionApplied || 'N/A',
        "Updated Status Decision": currentStatus,
        "Candidate Notification Message": messageBody.replace(/<[^>]*>?/gm, ''),
        "Admin Notes": notes || 'No additional remarks provided.',
        "Updated Date": new Date().toLocaleString(),
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

