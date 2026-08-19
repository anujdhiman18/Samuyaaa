import StudentApplication from '../models/StudentApplication.js';
import { normalizeClassCode } from '../config/classConfig.js';

// @desc    Submit a new Student Application
// @route   POST /api/student-applications
// @access  Public
export const submitStudentApplication = async (req, res) => {
  try {
    const {
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

    // Generate custom applicationId (e.g., SAU-STU-2026-1084)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const applicationId = `SAU-STU-${year}-${randomCode}`;

    const application = await StudentApplication.create({
      applicationId,
      fullName,
      email,
      contactNumber,
      dob: dob || '',
      academicStage,
      currentClass,
      targetClass,
      branch: branch || 'Main Center',
      subjects: Array.isArray(subjects) ? subjects : subjects ? [subjects] : [],
      previousSchool: previousSchool || '',
      parentName,
      parentContact,
      message: message || '',
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

    const applications = await StudentApplication.find(query).sort({ createdAt: -1 });

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

    if (status) application.status = status;
    if (notes !== undefined) application.notes = notes;

    const historyEntry = {
      status: status || application.status,
      date: new Date(),
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
