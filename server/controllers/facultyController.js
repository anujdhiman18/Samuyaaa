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

// @desc    Send faculty application email via Nodemailer
// @route   POST /api/faculty/send-email
export const sendFacultyApplicationEmailController = async (req, res) => {
  try {
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

    // Plain Text Email Body as requested
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

    // HTML Email Body with Tables & Styling
    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #186777 0%, #a83809 100%); padding: 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; tracking-tight; }
    .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
    .content { padding: 28px; }
    .section-title { font-size: 14px; font-weight: 700; color: #186777; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 22px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
    th, td { padding: 9px 12px; text-align: left; border-bottom: 1px solid #edf2f7; }
    th { background-color: #f8fafc; font-weight: 600; color: #475569; width: 34%; }
    td { color: #0f172a; }
    .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 10px; color: #166534; font-size: 13px; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Saumyaa Studies Recruitment Portal</div>
      <h1>New Faculty Application - ${fullName}</h1>
      <p>Application Ref: <strong>${applicationId}</strong> &bull; Submitted: ${new Date(appliedAt).toLocaleString()}</p>
    </div>

    <div class="content">
      <div class="section-title">Personal Details</div>
      <table>
        <tr><th>Full Name</th><td><strong>${fullName}</strong></td></tr>
        <tr><th>Date of Birth</th><td>${dob}</td></tr>
        <tr><th>Gender</th><td>${gender}</td></tr>
        <tr><th>Contact Number</th><td><a href="tel:${contactNumber}">${contactNumber}</a></td></tr>
        <tr><th>Email Address</th><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><th>Current Address</th><td>${currentAddress}</td></tr>
        <tr><th>Permanent Address</th><td>${permanentAddress}</td></tr>
      </table>

      <div class="section-title">Educational Qualifications</div>
      <table>
        <tr><th>Highest Degree</th><td><strong>${highestDegree}</strong></td></tr>
        <tr><th>University</th><td>${universityName}</td></tr>
        <tr><th>Graduation Year</th><td>${graduationYear}</td></tr>
        <tr><th>Specialization</th><td>${specialization}</td></tr>
        <tr><th>Certifications</th><td>${certifications || 'None'}</td></tr>
      </table>

      <div class="section-title">Professional Experience</div>
      <table>
        <tr><th>Teaching Experience</th><td><strong>${totalExperience}</strong></td></tr>
        <tr><th>Current Status</th><td>${currentStatus}</td></tr>
        <tr><th>Previous Institutions</th><td>${previousInstitutions}</td></tr>
        <tr><th>Subjects Taught</th><td>${subjectsTaught}</td></tr>
      </table>

      <div class="section-title">Position Details</div>
      <table>
        <tr><th>Position Applied</th><td><strong style="color: #a83809;">${positionApplied}</strong></td></tr>
        <tr><th>Subjects Expertise</th><td>${formattedExpertise}</td></tr>
        <tr><th>Preferred Time Slot</th><td>${preferredTimeSlot}</td></tr>
        <tr><th>Expected Joining Date</th><td>${expectedJoiningDate}</td></tr>
      </table>

      <div class="section-title">Additional Information</div>
      <table>
        <tr><th>Why Join</th><td><em>${whyJoinReason}</em></td></tr>
        <tr><th>Skills & Achievements</th><td>${skillsAchievements || 'None'}</td></tr>
      </table>

      <div class="section-title">References</div>
      <table>
        ${referencesHtml}
      </table>

      <div class="section-title">Attachments</div>
      <table>
        <tr><th>Resume</th><td>${resumeFileName}</td></tr>
        <tr><th>ID Proof</th><td>${idProofFileName}</td></tr>
        <tr><th>Certificates</th><td>${certificatesFileName}</td></tr>
      </table>

      <div class="highlight-box">
        ✅ Application logged & stored in the database. Log into Admin Portal to review or convert to Active Faculty.
      </div>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Saumyaa Studies Recruitment Portal &bull; Destination: ${EMAIL_TARGET}
    </div>
  </div>
</body>
</html>`;

    // Process file attachments if uploaded in payload
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
    console.log(`✅ [Nodemailer] Faculty Application email sent to ${EMAIL_TARGET}: ${info.messageId}`);

    return res.json({
      success: true,
      message: `Faculty Application email successfully sent to ${EMAIL_TARGET}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('❌ [Nodemailer Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to send faculty application email: ${error.message}`,
    });
  }
};
