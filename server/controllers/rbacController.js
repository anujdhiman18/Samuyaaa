import mongoose from 'mongoose';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import ActivityLog from '../models/ActivityLog.js';
import LoginHistory from '../models/LoginHistory.js';
import Faculty from '../models/Faculty.js';

export const SYSTEM_DEFAULT_ROLES = [
  {
    code: 'SUBJECT_TEACHER',
    name: 'Subject Teacher',
    badge: '🎓 Subject Teacher',
    color: 'purple',
    description: 'Class teacher with assignment, quiz, internal marks, and student management capabilities.',
    isSystem: true,
    permissions: [
      'canViewDashboard', 'canViewAssignedClasses', 'canMarkAttendance', 'canEditAttendance',
      'canUploadGrades', 'canViewClassStudents', 'canTakeAttendance', 'canViewTimetable',
      'canViewPersonalProfile', 'canApplyLeave', 'canViewLeaveStatus', 'canReceiveAnnouncements',
      'canUploadStudyMaterial', 'canViewAcademicCalendar', 'canChangePassword',
      'canViewOwnAttendanceHistory', 'canViewAssignedSubjects', 'canSendMessagesToAdmin',
      'canManageStudents', 'canCreateAssignments', 'canCreateQuizzes', 'canEnterInternalMarks',
      'canViewStudentAnalytics', 'canGenerateClassReports'
    ],
  },
  {
    code: 'SENIOR_FACULTY',
    name: 'Senior Faculty',
    badge: '⭐ Senior Faculty',
    color: 'blue',
    description: 'Senior teacher with lesson plan review, grade submission review, and faculty mentoring rights.',
    isSystem: true,
    permissions: [
      'canViewDashboard', 'canViewAssignedClasses', 'canMarkAttendance', 'canEditAttendance',
      'canUploadGrades', 'canViewClassStudents', 'canTakeAttendance', 'canViewTimetable',
      'canViewPersonalProfile', 'canApplyLeave', 'canViewLeaveStatus', 'canReceiveAnnouncements',
      'canUploadStudyMaterial', 'canViewAcademicCalendar', 'canChangePassword',
      'canViewOwnAttendanceHistory', 'canViewAssignedSubjects', 'canSendMessagesToAdmin',
      'canManageStudents', 'canCreateAssignments', 'canCreateQuizzes', 'canEnterInternalMarks',
      'canViewStudentAnalytics', 'canGenerateClassReports', 'canApproveLessonPlans',
      'canReviewGrades', 'canMentorJuniorFaculty', 'canViewDepartmentAnalytics', 'canConductFacultyMeetings'
    ],
  },
  {
    code: 'HEAD_OF_DEPARTMENT',
    name: 'Head of Department (HOD)',
    badge: '👑 HOD',
    color: 'emerald',
    description: 'Department head managing faculty workloads, teacher class allocations, and leave approvals.',
    isSystem: true,
    permissions: [
      'canViewDashboard', 'canViewAssignedClasses', 'canMarkAttendance', 'canEditAttendance',
      'canUploadGrades', 'canViewClassStudents', 'canTakeAttendance', 'canViewTimetable',
      'canViewPersonalProfile', 'canApplyLeave', 'canViewLeaveStatus', 'canReceiveAnnouncements',
      'canUploadStudyMaterial', 'canViewAcademicCalendar', 'canChangePassword',
      'canViewOwnAttendanceHistory', 'canViewAssignedSubjects', 'canSendMessagesToAdmin',
      'canManageStudents', 'canCreateAssignments', 'canCreateQuizzes', 'canEnterInternalMarks',
      'canViewStudentAnalytics', 'canGenerateClassReports', 'canApproveLessonPlans',
      'canReviewGrades', 'canMentorJuniorFaculty', 'canViewDepartmentAnalytics',
      'canConductFacultyMeetings', 'canAssignTeachersToClasses', 'canApproveFacultyLeave',
      'canViewAllDepartmentStudents', 'canEditFacultyWorkload', 'canApproveExamSchedules',
      'canManageDepartmentNotices', 'canGenerateDepartmentReports'
    ],
  },
  {
    code: 'ACADEMIC_COORDINATOR',
    name: 'Academic Coordinator',
    badge: '⚡ Academic Coordinator',
    color: 'amber',
    description: 'Institute-wide coordinator managing academic calendar, timetables, exam schedules, and attendance.',
    isSystem: true,
    permissions: [
      'canViewDashboard', 'canViewAssignedClasses', 'canMarkAttendance', 'canEditAttendance',
      'canUploadGrades', 'canViewClassStudents', 'canTakeAttendance', 'canViewTimetable',
      'canViewPersonalProfile', 'canApplyLeave', 'canViewLeaveStatus', 'canReceiveAnnouncements',
      'canUploadStudyMaterial', 'canViewAcademicCalendar', 'canChangePassword',
      'canViewOwnAttendanceHistory', 'canViewAssignedSubjects', 'canSendMessagesToAdmin',
      'canManageAcademicCalendar', 'canManageTimetable', 'canAssignClassrooms',
      'canCreateExamSchedules', 'canAllocateSubjects', 'canMonitorAttendanceAll',
      'canGenerateInstituteReports', 'canCoordinateFacultySchedules'
    ],
  },
  {
    code: 'ADMIN',
    name: 'Super Admin',
    badge: '🛡️ Super Admin',
    color: 'rose',
    description: 'Full administrative access and governance over institute operations, RBAC roles, and users.',
    isSystem: true,
    permissions: [
      'canViewDashboard', 'canViewAssignedClasses', 'canMarkAttendance', 'canEditAttendance',
      'canUploadGrades', 'canViewClassStudents', 'canTakeAttendance', 'canViewTimetable',
      'canViewPersonalProfile', 'canApplyLeave', 'canViewLeaveStatus', 'canReceiveAnnouncements',
      'canUploadStudyMaterial', 'canViewAcademicCalendar', 'canChangePassword',
      'canViewOwnAttendanceHistory', 'canViewAssignedSubjects', 'canSendMessagesToAdmin',
      'canManageStudents', 'canCreateAssignments', 'canCreateQuizzes', 'canEnterInternalMarks',
      'canViewStudentAnalytics', 'canGenerateClassReports', 'canApproveLessonPlans',
      'canReviewGrades', 'canMentorJuniorFaculty', 'canViewDepartmentAnalytics',
      'canConductFacultyMeetings', 'canAssignTeachersToClasses', 'canApproveFacultyLeave',
      'canViewAllDepartmentStudents', 'canEditFacultyWorkload', 'canApproveExamSchedules',
      'canManageDepartmentNotices', 'canGenerateDepartmentReports', 'canManageAcademicCalendar',
      'canManageTimetable', 'canAssignClassrooms', 'canCreateExamSchedules', 'canAllocateSubjects',
      'canMonitorAttendanceAll', 'canGenerateInstituteReports', 'canCoordinateFacultySchedules',
      'canManageFaculty', 'canAssignRoles', 'canManageRoles', 'canManagePermissions',
      'canSuspendFaculty', 'canResetPassword', 'canViewLoginHistory', 'canViewActivityLogs',
      'canTransferFaculty', 'canBulkAssignPermissions', 'canViewAllAttendance', 'canViewAllGrades',
      'canManageAnnouncements', 'canManageSessions'
    ],
  },
];

// Seed System Roles if missing
async function ensureSystemRolesExist() {
  try {
    for (const sysRole of SYSTEM_DEFAULT_ROLES) {
      const exists = await Role.findOne({ code: sysRole.code });
      if (!exists) {
        await Role.create(sysRole);
      }
    }
  } catch (err) {
    console.warn('System roles seeding warning:', err.message);
  }
}

// GET all system & custom roles
export const getRoles = async (req, res) => {
  try {
    await ensureSystemRolesExist();
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE new custom role
export const createRole = async (req, res) => {
  try {
    const { name, code, badge, color, description, permissions } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Role name and code are required' });
    }

    const existing = await Role.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Role code ${code} already exists` });
    }

    const newRole = await Role.create({
      code: code.toUpperCase(),
      name,
      badge: badge || `🎓 ${name}`,
      color: color || 'purple',
      description: description || '',
      isSystem: false,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'ROLE_CREATED',
      category: 'RBAC',
      details: `Created new custom role: ${name} (${code})`,
      status: 'SUCCESS',
    }).catch(() => {});

    res.json({ success: true, role: newRole, message: 'Custom role created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE role permissions
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, badge, color, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (name) role.name = name;
    if (badge) role.badge = badge;
    if (color) role.color = color;
    if (description !== undefined) role.description = description;
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'ROLE_UPDATED',
      category: 'RBAC',
      details: `Updated role: ${role.name} (${role.permissions.length} permissions)`,
      status: 'SUCCESS',
    }).catch(() => {});

    res.json({ success: true, role, message: 'Role updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE custom role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'System default roles cannot be deleted' });
    }

    await Role.findByIdAndDelete(id);

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'ROLE_DELETED',
      category: 'RBAC',
      details: `Deleted custom role: ${role.name}`,
      status: 'SUCCESS',
    }).catch(() => {});

    res.json({ success: true, message: 'Role deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ASSIGN roles to faculty member
export const assignFacultyRoles = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { roles, permissionOverrides, status, email, name, designation, department } = req.body;

    const isValidId = mongoose.Types.ObjectId.isValid(facultyId);
    let faculty = null;

    if (isValidId) {
      faculty = await Faculty.findById(facultyId);
    }

    if (!faculty) {
      const conditions = [];
      if (isValidId) conditions.push({ _id: facultyId });
      if (email) conditions.push({ email: email.toLowerCase() });

      if (conditions.length > 0) {
        faculty = await Faculty.findOne({ $or: conditions });
      }
    }

    const newRoles = Array.isArray(roles) ? roles : ['SUBJECT_TEACHER'];
    const primaryRole = newRoles[0] || 'SUBJECT_TEACHER';
    const isActiveBool = status !== undefined ? status === 'Active' : true;

    if (faculty) {
      faculty.roles = newRoles;
      faculty.role = primaryRole;
      if (permissionOverrides !== undefined) faculty.permissionOverrides = permissionOverrides;
      faculty.is_active = isActiveBool;
      faculty.markModified('roles');
      faculty.markModified('permissionOverrides');
      await faculty.save();
    } else {
      // Create new Faculty document in DB if it was previously client-only/mock
      faculty = await Faculty.create({
        name: name || 'Faculty Member',
        email: email ? email.toLowerCase() : `faculty_${Date.now()}@saumyaa.edu.in`,
        designation: designation || 'Senior Faculty Member',
        department: department || 'Science & Mathematics',
        roles: newRoles,
        role: primaryRole,
        permissionOverrides: permissionOverrides || {},
        is_active: isActiveBool,
      });
    }

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'FACULTY_ROLES_ASSIGNED',
      category: 'RBAC',
      details: `Assigned roles [${newRoles.join(', ')}] to ${faculty?.name || facultyId}`,
      status: 'SUCCESS',
    }).catch(() => {});

    res.json({ success: true, faculty, message: `Roles updated successfully in database!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET Activity Logs
export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE Activity Log entry
export const logActivity = async (req, res) => {
  try {
    const { action, category, details, status } = req.body;
    const log = await ActivityLog.create({
      userId: req.user?._id || req.user?.id || 'unknown',
      userName: req.user?.name || req.user?.fullName || 'User',
      userRole: req.user?.role || 'Faculty',
      action: action || 'USER_ACTION',
      category: category || 'GENERAL',
      details: details || '',
      status: status || 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
    });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET Login History
export const getLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

