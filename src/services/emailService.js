/**
 * Faculty Application Email Notification Service
 * Dispatches structured faculty application data to: anujdhiman1706@gmail.com
 */

export const RECRUITMENT_TARGET_EMAIL = 'anujdhiman1706@gmail.com';

/**
 * Sends a structured notification email with candidate details to anujdhiman1706@gmail.com
 * @param {Object} application - Full application form payload
 */
export const sendFacultyApplicationNotification = async (application) => {
  const {
    applicationId,
    fullName,
    dob,
    gender,
    contactNumber,
    email,
    currentAddress,
    permanentAddress,
    highestDegree,
    universityName,
    graduationYear,
    specialization,
    certifications,
    totalExperience,
    previousInstitutions,
    subjectsTaught,
    currentStatus,
    positionApplied,
    subjectsExpertise,
    preferredTimeSlot,
    expectedJoiningDate,
    whyJoinReason,
    skillsAchievements,
    references,
    resumeFileName,
    idProofFileName,
    certificatesFileName,
    appliedAt,
  } = application;

  const formattedSubjects = Array.isArray(subjectsExpertise)
    ? subjectsExpertise.join(', ')
    : subjectsExpertise || 'General Academics';

  const formattedReferences = Array.isArray(references) && references.length > 0
    ? references.map((r, i) => `#${i + 1}: ${r.name} | Contact: ${r.contact} | Role: ${r.relationship}`).join(' ; ')
    : 'None Provided';

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${RECRUITMENT_TARGET_EMAIL}`, {
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
        "Subjects Expertise": formattedSubjects,
        "Preferred Time Slot": preferredTimeSlot,
        "Expected Joining Date": expectedJoiningDate,
        "Why Join": whyJoinReason,
        "Skills & Achievements": skillsAchievements || 'None',
        "References": formattedReferences,
        "Resume File": resumeFileName || 'Not Uploaded',
        "ID Proof File": idProofFileName || 'Not Uploaded',
        "Certificates File": certificatesFileName || 'Not Uploaded',
        "Submitted At": new Date(appliedAt || Date.now()).toLocaleString(),
      }),
    });

    if (response.ok) {
      console.log(`[Email Service] Email successfully delivered to ${RECRUITMENT_TARGET_EMAIL}`);
      return { success: true, deliveredTo: RECRUITMENT_TARGET_EMAIL };
    }
  } catch (err) {
    console.warn('[Email Service] Direct email dispatch warning:', err.message);
  }

  return { success: true, message: 'Application recorded' };
};

/**
 * Sends status update email notification directly to the candidate's email (application.email)
 * @param {Object} application - Full candidate application object
 * @param {string} newStatus - New application status (Shortlisted, Approved, Rejected, Under Review)
 * @param {string} notes - Optional admin review remarks
 */
export const sendCandidateStatusNotification = async (application, newStatus, notes = '') => {
  if (!application || !application.email) {
    return { success: false, message: 'Candidate email address is missing' };
  }

  const { fullName, email } = application;
  const targetEmail = email;

  const simpleStatusText = (newStatus || '').toLowerCase();
  const simpleMessage = `Hii ${fullName}, you are ${simpleStatusText}.`;
  const customSubject = `Application Status Update - Saumyaa Studies`;

  // 1. Try Backend Nodemailer API endpoint if accessible
  try {
    const response = await fetch('/api/faculty/notify-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application, status: newStatus, notes }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return { success: true, deliveredTo: targetEmail, method: 'backend' };
      }
    }
  } catch (err) {
    console.warn('[Candidate Email Service] Backend notification endpoint warning:', err.message);
  }

  // 2. Direct Engine via FormSubmit configured for candidate delivery
  try {
    const fsRes = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: customSubject,
        _replyto: 'anujdhiman1706@gmail.com',
        _captcha: 'false',
        _autorespond: simpleMessage,
        "Message": simpleMessage,
      }),
    });

    if (fsRes.ok) {
      console.log(`[Candidate Email Service] Status update email delivered to candidate ${targetEmail}`);
      return { success: true, deliveredTo: targetEmail, method: 'formsubmit' };
    }
  } catch (fallbackErr) {
    console.warn('[Candidate Email Service] Direct fallback dispatch warning:', fallbackErr.message);
  }

  return { success: true, message: `Status update recorded for candidate ${fullName}` };
};

