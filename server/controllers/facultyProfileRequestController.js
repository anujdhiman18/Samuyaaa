import FacultyProfileRequest from '../models/FacultyProfileRequest.js';
import Faculty from '../models/Faculty.js';

const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// Helper to format date cleanly: e.g. "1 September 2026"
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

// @desc    Submit Profile Change Request (Faculty)
// @route   POST /api/faculty-panel/profile-change-request
// @access  Protected (Faculty)
export const createProfileChangeRequest = async (req, res) => {
  try {
    const facultyId = req.user?._id || req.user?.id || req.body.facultyId || 'f_jitender';
    const { requestedValues, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for profile change request is required.',
      });
    }

    if (!requestedValues || typeof requestedValues !== 'object' || Object.keys(requestedValues).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one profile field to update.',
      });
    }

    // 1. Fetch current Faculty profile
    let faculty = await Faculty.findById(facultyId);
    if (!faculty && req.user?.email) {
      faculty = await Faculty.findOne({ email: req.user.email.toLowerCase() });
    }

    // Fallback if user object in memory
    const facultyName = faculty?.name || req.user?.name || 'Prof. Jitender Sharma';
    const facultyEmail = faculty?.email || req.user?.email || 'jitender.sharma@saumyaa.edu.in';

    // 2. Check for active Pending request
    const existingPending = await FacultyProfileRequest.findOne({
      $or: [{ facultyId }, { facultyEmail: facultyEmail.toLowerCase() }],
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending profile change request under review by Administrator.',
      });
    }

    // 3. BACKEND ENFORCED 30-DAY RESTRICTION CHECK
    // Find latest submitted request regardless of status (Pending, Approved, or Rejected)
    const latestRequest = await FacultyProfileRequest.findOne({
      $or: [{ facultyId }, { facultyEmail: facultyEmail.toLowerCase() }],
    }).sort({ requestDate: -1 });

    if (latestRequest && latestRequest.requestDate) {
      const lastDate = new Date(latestRequest.requestDate);
      const nextAllowedDate = new Date(lastDate.getTime() + COOLDOWN_MS);
      const now = new Date();

      if (now < nextAllowedDate) {
        const lastFormatted = formatDateFormatted(lastDate);
        const nextFormatted = formatDateFormatted(nextAllowedDate);

        const cooldownMessage = `Your last profile change request was submitted on ${lastFormatted}. You can submit your next request on ${nextFormatted}.`;

        return res.status(400).json({
          success: false,
          cooldownActive: true,
          message: cooldownMessage,
          lastSubmittedDate: lastDate,
          nextAllowedDate: nextAllowedDate,
          formattedLastDate: lastFormatted,
          formattedNextDate: nextFormatted,
        });
      }
    }

    // 4. Build currentValues snapshot from existing faculty record
    const currentValues = {};
    const allowedKeys = ['name', 'phone', 'designation', 'department', 'photo_url', 'qualification', 'experience', 'email'];

    allowedKeys.forEach((key) => {
      if (requestedValues[key] !== undefined) {
        currentValues[key] = faculty ? (faculty[key] || '') : (req.user ? (req.user[key] || '') : '');
      }
    });

    // Filter out requestedValues that match currentValues exactly (no actual change)
    const filteredRequested = {};
    Object.keys(requestedValues).forEach((key) => {
      if (allowedKeys.includes(key) && String(requestedValues[key]).trim() !== String(currentValues[key] || '').trim()) {
        filteredRequested[key] = String(requestedValues[key]).trim();
      }
    });

    if (Object.keys(filteredRequested).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes detected between your current profile and requested values.',
      });
    }

    // 5. Create new request in DB
    const requestDate = new Date();
    const nextAllowedDate = new Date(requestDate.getTime() + COOLDOWN_MS);

    const newRequest = await FacultyProfileRequest.create({
      facultyId: faculty?._id || facultyId,
      facultyName,
      facultyEmail,
      currentValues,
      requestedValues: filteredRequested,
      reason: reason.trim(),
      requestDate,
      status: 'Pending',
    });

    const lastFormatted = formatDateFormatted(requestDate);
    const nextFormatted = formatDateFormatted(nextAllowedDate);

    return res.status(201).json({
      success: true,
      message: 'Profile change request submitted successfully to Admin for approval.',
      request: newRequest,
      cooldownInfo: {
        lastSubmittedDate: requestDate,
        nextAllowedDate,
        formattedLastDate: lastFormatted,
        formattedNextDate: nextFormatted,
        cooldownMessage: `Your last profile change request was submitted on ${lastFormatted}. You can submit your next request on ${nextFormatted}.`,
      },
    });
  } catch (error) {
    console.error('createProfileChangeRequest error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get My Profile Change Requests & 30-Day Cooldown Status (Faculty)
// @route   GET /api/faculty-panel/profile-change-requests
// @access  Protected (Faculty)
export const getMyProfileChangeRequests = async (req, res) => {
  try {
    const facultyId = req.user?._id || req.user?.id || 'f_jitender';
    const facultyEmail = req.user?.email || '';

    const requests = await FacultyProfileRequest.find({
      $or: [{ facultyId }, { facultyEmail: facultyEmail.toLowerCase() }],
    }).sort({ requestDate: -1 });

    let isCooldownActive = false;
    let lastSubmittedDate = null;
    let nextAllowedDate = null;
    let formattedLastDate = '';
    let formattedNextDate = '';
    let cooldownMessage = '';

    const latestRequest = requests[0];
    if (latestRequest && latestRequest.requestDate) {
      lastSubmittedDate = new Date(latestRequest.requestDate);
      nextAllowedDate = new Date(lastSubmittedDate.getTime() + COOLDOWN_MS);

      if (new Date() < nextAllowedDate) {
        isCooldownActive = true;
      }

      formattedLastDate = formatDateFormatted(lastSubmittedDate);
      formattedNextDate = formatDateFormatted(nextAllowedDate);
      cooldownMessage = `Your last profile change request was submitted on ${formattedLastDate}. You can submit your next request on ${formattedNextDate}.`;
    }

    const hasPending = requests.some((r) => r.status === 'Pending');

    return res.json({
      success: true,
      requests,
      hasPending,
      cooldownInfo: {
        isCooldownActive,
        lastSubmittedDate,
        nextAllowedDate,
        formattedLastDate,
        formattedNextDate,
        cooldownMessage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    View All Profile Change Requests (Admin)
// @route   GET /api/admin/profile-change-requests
// @access  Protected (Admin)
export const getAllProfileChangeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    const requests = await FacultyProfileRequest.find(filter).sort({ requestDate: -1 });

    return res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Profile Change Request (Admin)
// @route   PUT /api/admin/profile-change-requests/:id/approve
// @access  Protected (Admin)
export const approveProfileChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComments } = req.body;

    const request = await FacultyProfileRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Profile change request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been processed as ${request.status}`,
      });
    }

    // 1. Update Faculty Profile in database with requested values ONLY
    let faculty = await Faculty.findById(request.facultyId);
    if (!faculty && request.facultyEmail) {
      faculty = await Faculty.findOne({ email: request.facultyEmail.toLowerCase() });
    }

    if (faculty) {
      const updates = request.requestedValues || {};
      Object.keys(updates).forEach((key) => {
        faculty[key] = updates[key];
      });
      await faculty.save();
    }

    // 2. Mark request as Approved
    request.status = 'Approved';
    request.adminComments = adminComments || 'Approved by System Admin';
    request.reviewedDate = new Date();
    request.reviewedBy = req.user?._id || req.user?.id || null;
    request.reviewedByName = req.user?.name || 'System Admin';

    await request.save();

    return res.json({
      success: true,
      message: 'Faculty profile change request approved and faculty profile updated successfully!',
      request,
      updatedFaculty: faculty,
    });
  } catch (error) {
    console.error('approveProfileChangeRequest error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject Profile Change Request (Admin)
// @route   PUT /api/admin/profile-change-requests/:id/reject
// @access  Protected (Admin)
export const rejectProfileChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComments } = req.body;

    if (!adminComments || !adminComments.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason / admin comment is required when rejecting a request.',
      });
    }

    const request = await FacultyProfileRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Profile change request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been processed as ${request.status}`,
      });
    }

    // Mark request as Rejected (do NOT update Faculty profile)
    request.status = 'Rejected';
    request.adminComments = adminComments.trim();
    request.reviewedDate = new Date();
    request.reviewedBy = req.user?._id || req.user?.id || null;
    request.reviewedByName = req.user?.name || 'System Admin';

    await request.save();

    return res.json({
      success: true,
      message: 'Faculty profile change request rejected.',
      request,
    });
  } catch (error) {
    console.error('rejectProfileChangeRequest error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
