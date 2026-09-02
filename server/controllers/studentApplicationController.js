import StudentApplication from '../models/StudentApplication.js';
import { normalizeClassCode } from '../config/classConfig.js';

const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const formatDateFormatted = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

// @desc    Submit or Modify Student Application
// @route   POST /api/student-applications
// @access  Public
export const submitStudentApplication = async (req, res) => {
  try {
    const {
      applicationId: existingAppId,
      fullName,
      email,
      contactNumber,
      dob,
      academicStage: rawStage,
      currentClass: rawCurrentClass,
      targetClass: rawClass,
      branch,
      subjects,
      previousSchool,
      parentName,
      parentContact,
      message,
    } = req.body;

    const academicStage = rawStage || normalizeClassCode(rawCurrentClass || rawClass);
    const currentClass = rawCurrentClass || (rawClass !== academicStage ? rawClass : '');
    const targetClass = currentClass || academicStage;

    if (!fullName || !email || !contactNumber || !academicStage || !parentName || !parentContact || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Full Name, Email, Contact Number, Academic Stage, Preferred Branch, Parent Name, and Parent Contact.',
      });
    }

    const emailClean = email.trim().toLowerCase();
    const contactClean = contactNumber.trim();

    // 1. BACKEND ENFORCED 30-DAY RESTRICTION CHECK (From APPROVED timestamp)
    const latestApproved = await StudentApplication.findOne({
      $or: [{ email: emailClean }, { contactNumber: contactClean }],
      status: 'Approved',
    }).sort({ approvedAt: -1, updatedAt: -1 });

    if (latestApproved && latestApproved.approvedAt) {
      const approvedDate = new Date(latestApproved.approvedAt);
      const nextAllowedDate = new Date(approvedDate.getTime() + COOLDOWN_MS);
      const now = new Date();

      if (now < nextAllowedDate) {
        const approvedFormatted = formatDateFormatted(approvedDate);
        const nextFormatted = formatDateFormatted(nextAllowedDate);
        const cooldownMessage = `This request was approved on ${approvedFormatted}. You can make another request after ${nextFormatted}.`;

        return res.status(400).json({
          success: false,
          cooldownActive: true,
          message: cooldownMessage,
          approvedAt: approvedDate,
          nextEligibleDate: nextAllowedDate,
          formattedApprovedDate: approvedFormatted,
          formattedNextDate: nextFormatted,
        });
      }
    }

    // 2. Check for active Pending request - allow user to update/modify pending application
    const existingPending = await StudentApplication.findOne({
      $or: [
        ...(existingAppId ? [{ applicationId: existingAppId }] : []),
        { email: emailClean, status: 'Pending' },
        { contactNumber: contactClean, status: 'Pending' },
      ],
      status: 'Pending',
    });

    if (existingPending) {
      existingPending.fullName = fullName.trim();
      existingPending.email = emailClean;
      existingPending.contactNumber = contactClean;
      existingPending.dob = dob || '';
      existingPending.academicStage = academicStage;
      existingPending.currentClass = currentClass;
      existingPending.targetClass = targetClass;
      existingPending.branch = branch;
      existingPending.subjects = Array.isArray(subjects) ? subjects : subjects ? [subjects] : [];
      existingPending.previousSchool = previousSchool || '';
      existingPending.parentName = parentName.trim();
      existingPending.parentContact = parentContact.trim();
      existingPending.message = message || '';
      existingPending.submittedAt = new Date();
      existingPending.appliedAt = new Date();
      await existingPending.save();

      return res.status(200).json({
        success: true,
        message: 'Pending student application updated successfully!',
        applicationId: existingPending.applicationId,
        application: existingPending,
        isUpdate: true,
      });
    }

    // Generate custom applicationId (e.g., SAU-STU-2026-1084)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const applicationId = `SAU-STU-${year}-${randomCode}`;

    const application = await StudentApplication.create({
      applicationId,
      fullName: fullName.trim(),
      email: emailClean,
      contactNumber: contactClean,
      dob: dob || '',
      academicStage,
      currentClass,
      targetClass,
      branch: branch || 'Main Center (Bagru)',
      subjects: Array.isArray(subjects) ? subjects : subjects ? [subjects] : [],
      previousSchool: previousSchool || '',
      parentName: parentName.trim(),
      parentContact: parentContact.trim(),
      message: message || '',
      submittedAt: new Date(),
      appliedAt: new Date(),
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Student application submitted successfully!',
      applicationId: application.applicationId,
      application,
    });
  } catch (error) {
    console.error('Error in submitStudentApplication:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error submitting student application',
    });
  }
};

// @desc    Update/Modify pending application by ID
// @route   PUT /api/student-applications/:id
// @access  Public / Applicant
export const updatePendingStudentApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await StudentApplication.findOne({
      $or: [{ _id: id }, { applicationId: id }],
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved applications are locked and cannot be modified.',
      });
    }

    const updates = req.body;
    const allowedKeys = ['fullName', 'email', 'contactNumber', 'dob', 'academicStage', 'currentClass', 'targetClass', 'branch', 'subjects', 'previousSchool', 'parentName', 'parentContact', 'message'];

    allowedKeys.forEach((key) => {
      if (updates[key] !== undefined) {
        application[key] = updates[key];
      }
    });

    // If previously rejected, re-setting to Pending on edit
    if (application.status === 'Rejected') {
      application.status = 'Pending';
      application.rejectedAt = null;
    }

    application.submittedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: 'Student application updated successfully!',
      application,
    });
  } catch (error) {
    console.error('Error in updatePendingStudentApplication:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating student application',
    });
  }
};

// @desc    Get all Student Applications
// @route   GET /api/student-applications
// @access  Admin / Protected
export const getStudentApplications = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { applicationId: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ];
    }

    const applications = await StudentApplication.find(query).sort({ submittedAt: -1, appliedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Error in getStudentApplications:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching student applications',
    });
  }
};

// @desc    Update Student Application status & notes
// @route   PUT /api/student-applications/:id/status
// @access  Admin / Protected
export const updateStudentApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await StudentApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Student application not found',
      });
    }

    const now = new Date();
    if (status) {
      application.status = status;
      if (status === 'Approved') {
        application.approvedAt = now;
        application.nextEligibleDate = new Date(now.getTime() + COOLDOWN_MS);
        application.lastApprovedRequestId = application._id ? String(application._id) : '';
      } else if (status === 'Rejected') {
        application.rejectedAt = now;
        application.nextEligibleDate = null;
      }
    }

    if (notes !== undefined) application.notes = notes;

    const historyEntry = {
      status: status || application.status,
      date: now,
      notes: notes || '',
      sentTo: application.email,
    };
    application.notificationHistory.push(historyEntry);

    await application.save();

    res.json({
      success: true,
      message: `Student application status updated to ${application.status}`,
      application,
    });
  } catch (error) {
    console.error('Error in updateStudentApplicationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error updating student application status',
    });
  }
};

// @desc    Delete a Student Application
// @route   DELETE /api/student-applications/:id
// @access  Admin / Protected
export const deleteStudentApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await StudentApplication.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Student application not found',
      });
    }

    res.json({
      success: true,
      message: 'Student application deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteStudentApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error deleting student application',
    });
  }
};
