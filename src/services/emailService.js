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
