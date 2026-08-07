/**
 * Master Role-Based Access Control (RBAC) System Configuration
 */

// Master List of System Permission Codes
export const PERMISSIONS = {
  // COMMON FACULTY PERMISSIONS (Available to ALL Faculty Members)
  VIEW_DASHBOARD: 'canViewDashboard',
  VIEW_ASSIGNED_CLASSES: 'canViewAssignedClasses',
  MARK_ATTENDANCE: 'canMarkAttendance',
  EDIT_ATTENDANCE: 'canEditAttendance',
  UPLOAD_GRADES: 'canUploadGrades',
  VIEW_CLASS_STUDENTS: 'canViewClassStudents',
  TAKE_ATTENDANCE_MODE: 'canTakeAttendance',
  VIEW_TIMETABLE: 'canViewTimetable',
  VIEW_PERSONAL_PROFILE: 'canViewPersonalProfile',
  APPLY_LEAVE: 'canApplyLeave',
  VIEW_LEAVE_STATUS: 'canViewLeaveStatus',
  RECEIVE_ANNOUNCEMENTS: 'canReceiveAnnouncements',
  UPLOAD_STUDY_MATERIAL: 'canUploadStudyMaterial',
  VIEW_ACADEMIC_CALENDAR: 'canViewAcademicCalendar',
  CHANGE_PASSWORD: 'canChangePassword',
  VIEW_OWN_ATTENDANCE_HISTORY: 'canViewOwnAttendanceHistory',
  VIEW_ASSIGNED_SUBJECTS: 'canViewAssignedSubjects',
  SEND_MESSAGES_TO_ADMIN: 'canSendMessagesToAdmin',

  // ROLE 1: SUBJECT TEACHER PERMISSIONS
  MANAGE_STUDENTS: 'canManageStudents',
  CREATE_ASSIGNMENTS: 'canCreateAssignments',
  CREATE_QUIZZES: 'canCreateQuizzes',
  ENTER_INTERNAL_MARKS: 'canEnterInternalMarks',
  VIEW_STUDENT_ANALYTICS: 'canViewStudentAnalytics',
  GENERATE_CLASS_REPORTS: 'canGenerateClassReports',

  // ROLE 2: SENIOR FACULTY PERMISSIONS
  APPROVE_LESSON_PLANS: 'canApproveLessonPlans',
  REVIEW_GRADES: 'canReviewGrades',
  MENTOR_JUNIOR_FACULTY: 'canMentorJuniorFaculty',
  VIEW_DEPARTMENT_ANALYTICS: 'canViewDepartmentAnalytics',
  CONDUCT_FACULTY_MEETINGS: 'canConductFacultyMeetings',

  // ROLE 3: HEAD OF DEPARTMENT (HOD) PERMISSIONS
  ASSIGN_TEACHERS_TO_CLASSES: 'canAssignTeachersToClasses',
  APPROVE_FACULTY_LEAVE: 'canApproveFacultyLeave',
  VIEW_ALL_DEPARTMENT_STUDENTS: 'canViewAllDepartmentStudents',
  EDIT_FACULTY_WORKLOAD: 'canEditFacultyWorkload',
  APPROVE_EXAM_SCHEDULES: 'canApproveExamSchedules',
  MANAGE_DEPARTMENT_NOTICES: 'canManageDepartmentNotices',
  GENERATE_DEPARTMENT_REPORTS: 'canGenerateDepartmentReports',

  // ROLE 4: ACADEMIC COORDINATOR PERMISSIONS
  MANAGE_ACADEMIC_CALENDAR: 'canManageAcademicCalendar',
  MANAGE_TIMETABLE: 'canManageTimetable',
  ASSIGN_CLASSROOMS: 'canAssignClassrooms',
  CREATE_EXAM_SCHEDULES: 'canCreateExamSchedules',
  ALLOCATE_SUBJECTS: 'canAllocateSubjects',
  MONITOR_ATTENDANCE_ALL: 'canMonitorAttendanceAll',
  GENERATE_INSTITUTE_REPORTS: 'canGenerateInstituteReports',
  COORDINATE_FACULTY_SCHEDULES: 'canCoordinateFacultySchedules',

  // ADMIN PANEL SUPER PERMISSIONS
  MANAGE_FACULTY: 'canManageFaculty',
  ASSIGN_ROLES: 'canAssignRoles',
  MANAGE_ROLES: 'canManageRoles',
  MANAGE_PERMISSIONS: 'canManagePermissions',
  SUSPEND_FACULTY: 'canSuspendFaculty',
  RESET_PASSWORD: 'canResetPassword',
  VIEW_LOGIN_HISTORY: 'canViewLoginHistory',
  VIEW_ACTIVITY_LOGS: 'canViewActivityLogs',
  TRANSFER_FACULTY: 'canTransferFaculty',
  BULK_ASSIGN_PERMISSIONS: 'canBulkAssignPermissions',
  VIEW_ALL_ATTENDANCE: 'canViewAllAttendance',
  VIEW_ALL_GRADES: 'canViewAllGrades',
  MANAGE_ANNOUNCEMENTS: 'canManageAnnouncements',
  MANAGE_SESSIONS: 'canManageSessions',
};

// Categorized Permission Metadata for UI Displays
export const PERMISSION_CATEGORIES = [
  {
    name: 'Common Faculty Basics',
    description: 'Basic access available to all faculty members',
    permissions: [
      { code: PERMISSIONS.VIEW_DASHBOARD, name: 'View Dashboard' },
      { code: PERMISSIONS.VIEW_ASSIGNED_CLASSES, name: 'View Assigned Classes' },
      { code: PERMISSIONS.MARK_ATTENDANCE, name: 'Mark Daily Attendance' },
      { code: PERMISSIONS.EDIT_ATTENDANCE, name: 'Edit Attendance Before Deadline' },
      { code: PERMISSIONS.UPLOAD_GRADES, name: 'Upload Student Grades & Marks' },
      { code: PERMISSIONS.VIEW_CLASS_STUDENTS, name: 'View Assigned Students' },
      { code: PERMISSIONS.TAKE_ATTENDANCE_MODE, name: 'Take Online/Offline Attendance' },
      { code: PERMISSIONS.VIEW_TIMETABLE, name: 'View Timetable' },
      { code: PERMISSIONS.VIEW_PERSONAL_PROFILE, name: 'View Personal Profile' },
      { code: PERMISSIONS.APPLY_LEAVE, name: 'Apply for Leave' },
      { code: PERMISSIONS.VIEW_LEAVE_STATUS, name: 'View Leave Status' },
      { code: PERMISSIONS.RECEIVE_ANNOUNCEMENTS, name: 'Receive Announcements & Alerts' },
      { code: PERMISSIONS.UPLOAD_STUDY_MATERIAL, name: 'Upload Class Study Materials' },
      { code: PERMISSIONS.VIEW_ACADEMIC_CALENDAR, name: 'View Academic Calendar' },
      { code: PERMISSIONS.CHANGE_PASSWORD, name: 'Change Own Password' },
      { code: PERMISSIONS.VIEW_OWN_ATTENDANCE_HISTORY, name: 'View Attendance History' },
      { code: PERMISSIONS.VIEW_ASSIGNED_SUBJECTS, name: 'View Assigned Subjects' },
      { code: PERMISSIONS.SEND_MESSAGES_TO_ADMIN, name: 'Send Messages to Admin' },
    ],
  },
  {
    name: 'Subject Teacher',
    description: 'Management of assignments, quizzes, and class reports',
    permissions: [
      { code: PERMISSIONS.MANAGE_STUDENTS, name: 'Manage Class Students' },
      { code: PERMISSIONS.CREATE_ASSIGNMENTS, name: 'Create & Publish Assignments' },
      { code: PERMISSIONS.CREATE_QUIZZES, name: 'Create & Host Quizzes' },
      { code: PERMISSIONS.ENTER_INTERNAL_MARKS, name: 'Enter Internal Assessment Marks' },
      { code: PERMISSIONS.VIEW_STUDENT_ANALYTICS, name: 'View Student Analytics' },
      { code: PERMISSIONS.GENERATE_CLASS_REPORTS, name: 'Generate Class Performance Reports' },
    ],
  },
  {
    name: 'Senior Faculty',
    description: 'Lesson plan review, mentoring, and department analytics',
    permissions: [
      { code: PERMISSIONS.APPROVE_LESSON_PLANS, name: 'Approve Lesson Plans' },
      { code: PERMISSIONS.REVIEW_GRADES, name: 'Review Grades Before Final Submission' },
      { code: PERMISSIONS.MENTOR_JUNIOR_FACULTY, name: 'Mentor Junior Faculty' },
      { code: PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS, name: 'View Departmental Analytics' },
      { code: PERMISSIONS.CONDUCT_FACULTY_MEETINGS, name: 'Conduct Faculty Meetings' },
    ],
  },
  {
    name: 'Head of Department (HOD)',
    description: 'Department management, teacher assignments, and leave approvals',
    permissions: [
      { code: PERMISSIONS.ASSIGN_TEACHERS_TO_CLASSES, name: 'Assign Teachers to Classes' },
      { code: PERMISSIONS.APPROVE_FACULTY_LEAVE, name: 'Approve Faculty Leave Requests' },
      { code: PERMISSIONS.VIEW_ALL_DEPARTMENT_STUDENTS, name: 'View All Department Students' },
      { code: PERMISSIONS.EDIT_FACULTY_WORKLOAD, name: 'Edit Faculty Workload' },
      { code: PERMISSIONS.APPROVE_EXAM_SCHEDULES, name: 'Approve Examination Schedules' },
      { code: PERMISSIONS.MANAGE_DEPARTMENT_NOTICES, name: 'Manage Department Notices' },
      { code: PERMISSIONS.GENERATE_DEPARTMENT_REPORTS, name: 'Generate Department Analytics & Reports' },
    ],
  },
  {
    name: 'Academic Coordinator',
    description: 'Institute-wide scheduling, academic calendar, and timetable allocation',
    permissions: [
      { code: PERMISSIONS.MANAGE_ACADEMIC_CALENDAR, name: 'Manage Institute Academic Calendar' },
      { code: PERMISSIONS.MANAGE_TIMETABLE, name: 'Manage Class & Faculty Timetables' },
      { code: PERMISSIONS.ASSIGN_CLASSROOMS, name: 'Assign Classrooms & Labs' },
      { code: PERMISSIONS.CREATE_EXAM_SCHEDULES, name: 'Create Examination Schedules' },
      { code: PERMISSIONS.ALLOCATE_SUBJECTS, name: 'Allocate Subjects Across Batches' },
      { code: PERMISSIONS.MONITOR_ATTENDANCE_ALL, name: 'Monitor Attendance Across All Classes' },
      { code: PERMISSIONS.GENERATE_INSTITUTE_REPORTS, name: 'Generate Institute-Wide Reports' },
      { code: PERMISSIONS.COORDINATE_FACULTY_SCHEDULES, name: 'Coordinate Faculty Schedules' },
    ],
  },
  {
    name: 'Admin System Control',
    description: 'SuperAdmin governance, role assignments, and system logs',
    permissions: [
      { code: PERMISSIONS.MANAGE_FACULTY, name: 'Create, Edit & Delete Faculty Accounts' },
      { code: PERMISSIONS.ASSIGN_ROLES, name: 'Assign Roles to Faculty' },
      { code: PERMISSIONS.MANAGE_ROLES, name: 'Manage System & Custom Roles' },
      { code: PERMISSIONS.MANAGE_PERMISSIONS, name: 'Enable/Disable Individual Permissions' },
      { code: PERMISSIONS.SUSPEND_FACULTY, name: 'Suspend / Reactivate Accounts' },
      { code: PERMISSIONS.RESET_PASSWORD, name: 'Reset Password' },
      { code: PERMISSIONS.VIEW_LOGIN_HISTORY, name: 'View Login History' },
      { code: PERMISSIONS.VIEW_ACTIVITY_LOGS, name: 'View Audit Logs' },
      { code: PERMISSIONS.TRANSFER_FACULTY, name: 'Transfer Faculty Between Classes' },
      { code: PERMISSIONS.BULK_ASSIGN_PERMISSIONS, name: 'Bulk Assign Permissions' },
      { code: PERMISSIONS.VIEW_ALL_ATTENDANCE, name: 'View All Attendance Records' },
      { code: PERMISSIONS.VIEW_ALL_GRADES, name: 'View All Student Grades' },
      { code: PERMISSIONS.MANAGE_ANNOUNCEMENTS, name: 'Manage Announcements' },
      { code: PERMISSIONS.MANAGE_SESSIONS, name: 'Manage Academic Sessions' },
    ],
  },
];

// Common Basic Permissions List
export const COMMON_FACULTY_PERMISSIONS = [
  PERMISSIONS.VIEW_DASHBOARD,
  PERMISSIONS.VIEW_ASSIGNED_CLASSES,
  PERMISSIONS.MARK_ATTENDANCE,
  PERMISSIONS.EDIT_ATTENDANCE,
  PERMISSIONS.UPLOAD_GRADES,
  PERMISSIONS.VIEW_CLASS_STUDENTS,
  PERMISSIONS.TAKE_ATTENDANCE_MODE,
  PERMISSIONS.VIEW_TIMETABLE,
  PERMISSIONS.VIEW_PERSONAL_PROFILE,
  PERMISSIONS.APPLY_LEAVE,
  PERMISSIONS.VIEW_LEAVE_STATUS,
  PERMISSIONS.RECEIVE_ANNOUNCEMENTS,
  PERMISSIONS.UPLOAD_STUDY_MATERIAL,
  PERMISSIONS.VIEW_ACADEMIC_CALENDAR,
  PERMISSIONS.CHANGE_PASSWORD,
  PERMISSIONS.VIEW_OWN_ATTENDANCE_HISTORY,
  PERMISSIONS.VIEW_ASSIGNED_SUBJECTS,
  PERMISSIONS.SEND_MESSAGES_TO_ADMIN,
];

// Default Preset System Roles
export const SYSTEM_ROLES = [
  {
    id: 'role_subject_teacher',
    code: 'SUBJECT_TEACHER',
    name: 'Subject Teacher',
    badge: '🎓 Subject Teacher',
    color: 'purple',
    description: 'Class teacher with assignment, quiz, internal marks, and student management capabilities.',
    isSystem: true,
    permissions: [
      ...COMMON_FACULTY_PERMISSIONS,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.CREATE_ASSIGNMENTS,
      PERMISSIONS.CREATE_QUIZZES,
      PERMISSIONS.ENTER_INTERNAL_MARKS,
      PERMISSIONS.VIEW_STUDENT_ANALYTICS,
      PERMISSIONS.GENERATE_CLASS_REPORTS,
    ],
  },
  {
    id: 'role_senior_faculty',
    code: 'SENIOR_FACULTY',
    name: 'Senior Faculty',
    badge: '⭐ Senior Faculty',
    color: 'blue',
    description: 'Senior teacher with lesson plan review, grade submission review, and faculty mentoring rights.',
    isSystem: true,
    permissions: [
      ...COMMON_FACULTY_PERMISSIONS,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.CREATE_ASSIGNMENTS,
      PERMISSIONS.CREATE_QUIZZES,
      PERMISSIONS.ENTER_INTERNAL_MARKS,
      PERMISSIONS.VIEW_STUDENT_ANALYTICS,
      PERMISSIONS.GENERATE_CLASS_REPORTS,
      PERMISSIONS.APPROVE_LESSON_PLANS,
      PERMISSIONS.REVIEW_GRADES,
      PERMISSIONS.MENTOR_JUNIOR_FACULTY,
      PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS,
      PERMISSIONS.CONDUCT_FACULTY_MEETINGS,
    ],
  },
  {
    id: 'role_hod',
    code: 'HEAD_OF_DEPARTMENT',
    name: 'Head of Department (HOD)',
    badge: '👑 HOD',
    color: 'emerald',
    description: 'Department head managing faculty workloads, teacher class allocations, and leave approvals.',
    isSystem: true,
    permissions: [
      ...COMMON_FACULTY_PERMISSIONS,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.CREATE_ASSIGNMENTS,
      PERMISSIONS.CREATE_QUIZZES,
      PERMISSIONS.ENTER_INTERNAL_MARKS,
      PERMISSIONS.VIEW_STUDENT_ANALYTICS,
      PERMISSIONS.GENERATE_CLASS_REPORTS,
      PERMISSIONS.APPROVE_LESSON_PLANS,
      PERMISSIONS.REVIEW_GRADES,
      PERMISSIONS.MENTOR_JUNIOR_FACULTY,
      PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS,
      PERMISSIONS.CONDUCT_FACULTY_MEETINGS,
      PERMISSIONS.ASSIGN_TEACHERS_TO_CLASSES,
      PERMISSIONS.APPROVE_FACULTY_LEAVE,
      PERMISSIONS.VIEW_ALL_DEPARTMENT_STUDENTS,
      PERMISSIONS.EDIT_FACULTY_WORKLOAD,
      PERMISSIONS.APPROVE_EXAM_SCHEDULES,
      PERMISSIONS.MANAGE_DEPARTMENT_NOTICES,
      PERMISSIONS.GENERATE_DEPARTMENT_REPORTS,
    ],
  },
  {
    id: 'role_academic_coordinator',
    code: 'ACADEMIC_COORDINATOR',
    name: 'Academic Coordinator',
    badge: '⚡ Academic Coordinator',
    color: 'amber',
    description: 'Institute-wide coordinator managing academic calendar, timetables, exam schedules, and attendance.',
    isSystem: true,
    permissions: [
      ...COMMON_FACULTY_PERMISSIONS,
      PERMISSIONS.MANAGE_ACADEMIC_CALENDAR,
      PERMISSIONS.MANAGE_TIMETABLE,
      PERMISSIONS.ASSIGN_CLASSROOMS,
      PERMISSIONS.CREATE_EXAM_SCHEDULES,
      PERMISSIONS.ALLOCATE_SUBJECTS,
      PERMISSIONS.MONITOR_ATTENDANCE_ALL,
      PERMISSIONS.GENERATE_INSTITUTE_REPORTS,
      PERMISSIONS.COORDINATE_FACULTY_SCHEDULES,
    ],
  },
  {
    id: 'role_admin',
    code: 'ADMIN',
    name: 'Super Admin',
    badge: '🛡️ Super Admin',
    color: 'rose',
    description: 'Full administrative access and governance over institute operations, RBAC roles, and users.',
    isSystem: true,
    permissions: Object.values(PERMISSIONS),
  },
];

/**
 * Compute merged unique permissions array for a user based on their roles and custom overrides
 */
export const computePermissionsForUser = (userRoleCodes = [], customPermissionOverrides = {}, userRoleName = '', customRoles = []) => {
  // If SuperAdmin or Admin role code
  if (userRoleCodes.includes('ADMIN') || userRoleCodes.includes('SuperAdmin') || userRoleName === 'SuperAdmin') {
    return Object.values(PERMISSIONS);
  }

  const permissionsSet = new Set(COMMON_FACULTY_PERMISSIONS);

  const allAvailableRoles = [...SYSTEM_ROLES, ...customRoles];

  // Merge permissions from all assigned roles
  userRoleCodes.forEach((code) => {
    const roleObj = allAvailableRoles.find((r) => r.code === code || r.id === code || r.name === code);
    if (roleObj && Array.isArray(roleObj.permissions)) {
      roleObj.permissions.forEach((p) => permissionsSet.add(p));
    }
  });

  // Apply custom explicit permission overrides (true to add, false to revoke)
  if (customPermissionOverrides && typeof customPermissionOverrides === 'object') {
    Object.entries(customPermissionOverrides).forEach(([permCode, isAllowed]) => {
      if (isAllowed === true) {
        permissionsSet.add(permCode);
      } else if (isAllowed === false) {
        permissionsSet.delete(permCode);
      }
    });
  }

  return Array.from(permissionsSet);
};
