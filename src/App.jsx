import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { RBACProvider } from './context/RBACContext';
import ProtectedRoute from './components/ProtectedRoute';
import ForcePasswordChangeModal from './components/common/ForcePasswordChangeModal';
import { PERMISSIONS } from './config/rbacConfig';

// Public & Auth Pages
import PublicWebsite from './components/PublicWebsite';
import FacultyApplicationPage from './pages/FacultyApplicationPage';
import StudentApplicationPage from './pages/StudentApplicationPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin Portal Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import StudentLeaveManagement from './pages/admin/StudentLeaveManagement';
import StudentDetail from './pages/admin/StudentDetail';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionManagement from './pages/admin/PermissionManagement';
import ActivityLogs from './pages/admin/ActivityLogs';
import AlumniManagement from './pages/admin/AlumniManagement';
import ToppersManagement from './pages/admin/ToppersManagement';
import FeeManagement from './pages/admin/FeeManagement';
import FeeReminders from './pages/admin/FeeReminders';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSMSLogs from './pages/admin/AdminSMSLogs';

// Student Portal Pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMarks from './pages/student/StudentMarks';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentPerformance from './pages/student/StudentPerformance';
import StudentProfile from './pages/student/StudentProfile';
import StudentFee from './pages/student/StudentFee';
import StudentLeave from './pages/student/StudentLeave';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import StudentNotifications from './pages/student/StudentNotifications';

// Faculty Panel Pages
import FacultyLayout from './layouts/FacultyLayout';
import FacultyLogin from './pages/auth/FacultyLogin';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import FacultyMaterials from './pages/faculty/FacultyMaterials';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';
import FacultyLeave from './pages/faculty/FacultyLeave';
import FacultyReports from './pages/faculty/FacultyReports';
import FacultyProfile from './pages/faculty/FacultyProfile';

// RBAC Role Specialized Pages
import FacultyLessonPlans from './pages/faculty/FacultyLessonPlans';
import FacultyDepartmentAnalytics from './pages/faculty/FacultyDepartmentAnalytics';
import FacultyLeaveApprovals from './pages/faculty/FacultyLeaveApprovals';
import FacultyAcademicCalendar from './pages/faculty/FacultyAcademicCalendar';

class PortalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.portalName}] Shell ErrorBoundary caught an error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6 text-center font-body">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-premium border border-outline-variant/15 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h2 className="font-headings font-extrabold text-xl text-secondary">
              {this.props.portalName} Temporary Error
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              An unhandled rendering exception occurred in this portal. Please click below to recover your session.
            </p>
            <div className="p-3 bg-surface-container rounded-xl text-left text-[11px] font-mono text-rose-700 overflow-x-auto">
              {this.state.error?.toString() || 'Unknown error'}
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-md transition-all cursor-pointer"
              >
                Reload Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RBACProvider>
          <ToastProvider>
            <ForcePasswordChangeModal />
            <BrowserRouter>
              <Routes>
                {/* Public Website */}
                <Route path="/" element={<PublicWebsite />} />

                {/* Faculty Online Job Application Form */}
                <Route path="/faculty-application" element={<FacultyApplicationPage />} />

                {/* Student Admissions Application Form */}
                <Route path="/student-application" element={<StudentApplicationPage />} />
                <Route path="/apply-student" element={<StudentApplicationPage />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/faculty-login" element={<FacultyLogin />} />

                {/* Faculty Portal Shell (/faculty/*) */}
                <Route
                  path="/faculty"
                  element={
                    <PortalErrorBoundary portalName="Faculty Portal">
                      <FacultyLayout />
                    </PortalErrorBoundary>
                  }
                >
                  <Route index element={<FacultyDashboard />} />
                  <Route path="dashboard" element={<FacultyDashboard />} />
                  <Route path="students" element={<FacultyStudents />} />
                  <Route path="attendance" element={<FacultyAttendance />} />
                  <Route path="marks" element={<FacultyMarks />} />
                  <Route path="assignments" element={<FacultyAssignments />} />
                  <Route path="materials" element={<FacultyMaterials />} />
                  <Route path="timetable" element={<FacultyTimetable />} />
                  <Route path="announcements" element={<FacultyAnnouncements />} />
                  <Route path="leave" element={<FacultyLeave />} />
                  <Route path="reports" element={<FacultyReports />} />
                  <Route path="profile" element={<FacultyProfile />} />

                  {/* Specialized Role Pages with Permission Protection */}
                  <Route
                    path="lesson-plans"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.APPROVE_LESSON_PLANS}>
                        <FacultyLessonPlans />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="department-analytics"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS}>
                        <FacultyDepartmentAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="leave-approvals"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.APPROVE_FACULTY_LEAVE}>
                        <FacultyLeaveApprovals />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="academic-calendar"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_ACADEMIC_CALENDAR}>
                        <FacultyAcademicCalendar />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Protected Admin Portal Shell (/admin/*) */}
                <Route
                  path="/admin"
                  element={
                    <PortalErrorBoundary portalName="Admin Portal">
                      <AdminLayout />
                    </PortalErrorBoundary>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="students" element={<StudentManagement />} />
                  <Route path="student-leaves" element={<StudentLeaveManagement />} />
                  <Route path="student/leaves" element={<StudentLeaveManagement />} />
                  <Route path="faculty-leaves" element={<Navigate to="/admin/faculty?tab=leaves" replace />} />
                  <Route path="faculty/leaves" element={<Navigate to="/admin/faculty?tab=leaves" replace />} />
                  <Route path="students/:id" element={<StudentDetail />} />
                  <Route path="attendance" element={<AttendanceManagement />} />
                  <Route path="marks" element={<FacultyMarks />} />
                  <Route path="subjects" element={<SubjectManagement />} />
                  <Route path="faculty" element={<FacultyManagement />} />
                  <Route path="roles" element={<RoleManagement />} />
                  <Route path="permissions" element={<PermissionManagement />} />
                  <Route path="activity-logs" element={<ActivityLogs />} />
                  <Route path="alumni" element={<AlumniManagement />} />
                  <Route path="toppers" element={<ToppersManagement />} />
                  <Route path="fees" element={<FeeManagement />} />
                  <Route path="reminders" element={<FeeReminders />} />
                  <Route path="sms-logs" element={<AdminSMSLogs />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>

                {/* Protected Student Portal Shell (/student/*) */}
                <Route
                  path="/student"
                  element={
                    <PortalErrorBoundary portalName="Student Portal">
                      <StudentLayout />
                    </PortalErrorBoundary>
                  }
                >
                  <Route index element={<StudentDashboard />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="marks" element={<StudentMarks />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="performance" element={<StudentPerformance />} />
                  <Route path="subjects" element={<StudentMarks />} />
                  <Route path="fees" element={<StudentFee />} />
                  <Route path="leave" element={<StudentLeave />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="announcements" element={<StudentAnnouncements />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                </Route>

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </RBACProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}