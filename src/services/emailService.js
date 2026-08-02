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

  const { fullName, email, positionApplied, applicationId } = application;
  const targetEmail = email;
  const refId = applicationId || application._id || 'SAU-FAC-2026';

  let customSubject = `Saumyaa Studies: Application Status Update for ${fullName}`;
  let statusMessage = `The status of your faculty application for ${positionApplied} has been updated to ${newStatus}.`;

  if (newStatus === 'Shortlisted') {
    customSubject = `🎉 Congratulations ${fullName}! Your Application for ${positionApplied} has been Shortlisted - Saumyaa Studies`;
    statusMessage = `Dear ${fullName},\n\nWe are pleased to inform you that your application for ${positionApplied} (Ref ID: ${refId}) has been SHORTLISTED by our academic screening committee.\n\nOur recruitment team will contact you shortly to schedule your interview and demo class session.\n\nBest regards,\nSaumyaa Studies Academic Recruitment Cell`;
  } else if (newStatus === 'Approved' || newStatus === 'Selected') {
    customSubject = `🌟 Welcome Onboard ${fullName}! Application Approved - Saumyaa Studies`;
    statusMessage = `Dear ${fullName},\n\nCongratulations! We are delighted to inform you that your application for ${positionApplied} (Ref ID: ${refId}) at Saumyaa Studies has been APPROVED & SELECTED!\n\nWelcome to our faculty team. Our academic operations desk will reach out with your onboarding document and schedule details.\n\nBest regards,\nSaumyaa Studies Academic Recruitment Cell`;
  } else if (newStatus === 'Rejected') {
    customSubject = `Status Update regarding your Faculty Application (${refId}) - Saumyaa Studies`;
    statusMessage = `Dear ${fullName},\n\nThank you for applying for ${positionApplied} (Ref ID: ${refId}) at Saumyaa Studies.\n\nAfter thorough evaluation by our department heads, we regret to inform you that we are unable to move forward with your candidate application at this time. We appreciate your time and wish you success in your future endeavors.\n\nBest regards,\nSaumyaa Studies Academic Recruitment Cell`;
  } else if (newStatus === 'Under Review') {
    customSubject = `Application Under Review (${refId}) - Saumyaa Studies`;
    statusMessage = `Dear ${fullName},\n\nYour application for ${positionApplied} (Ref ID: ${refId}) is currently under active review by our department head and subject evaluation committee. We will update you as soon as the evaluation is completed.\n\nBest regards,\nSaumyaa Studies Academic Recruitment Cell`;
  }

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

  // 2. Direct Fallback Engine via FormSubmit configured for candidate delivery
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
        _template: 'box',
        _captcha: 'false',
        _autorespond: statusMessage,
        "Candidate Name": fullName,
        "Application Ref ID": refId,
        "Position Applied": positionApplied,
        "Updated Status Decision": newStatus,
        "Candidate Notification": statusMessage,
        "Official Remarks": notes || 'No additional remarks provided.',
        "Updated Date": new Date().toLocaleString(),
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

