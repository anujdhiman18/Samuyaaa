import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Public & Auth Pages
import PublicWebsite from './components/PublicWebsite';
import FacultyApplicationPage from './pages/FacultyApplicationPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin Portal Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import StudentDetail from './pages/admin/StudentDetail';
import SubjectManagement from './pages/admin/SubjectManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import AlumniManagement from './pages/admin/AlumniManagement';
import ToppersManagement from './pages/admin/ToppersManagement';
import FeeManagement from './pages/admin/FeeManagement';
import FeeReminders from './pages/admin/FeeReminders';
import AdminProfile from './pages/admin/AdminProfile';

// Student Portal Pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMarks from './pages/student/StudentMarks';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentPerformance from './pages/student/StudentPerformance';
import StudentProfile from './pages/student/StudentProfile';
import StudentFee from './pages/student/StudentFee';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import StudentNotifications from './pages/student/StudentNotifications';

class PortalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.portalName || 'Portal'}] Shell ErrorBoundary caught an error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-6 font-body text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl shadow-premium border border-outline-variant/15 space-y-4">
            <span className="material-symbols-outlined text-5xl text-rose-500">warning</span>
            <h2 className="font-headings font-extrabold text-xl text-secondary">
              {this.props.portalName || 'Portal'} Temporary Error
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              An isolated issue occurred within this section. Other parts of the application remain fully operational.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="bg-primary text-white font-headings font-bold text-xs px-5 py-2.5 rounded-full shadow-premium hover:bg-primary-container transition-all"
              >
                Retry Portal
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors inline-block"
              >
                Go to Public Home
              </a>
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
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website Route (Isolated Shell) */}
              <Route
                path="/"
                element={
                  <PortalErrorBoundary portalName="Public Website">
                    <PublicWebsite />
                  </PortalErrorBoundary>
                }
              />

              {/* Faculty Application Routes */}
              <Route path="/apply" element={<FacultyApplicationPage />} />
              <Route path="/faculty/apply" element={<FacultyApplicationPage />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin/login" element={<LoginPage />} />

              {/* Protected Admin Portal Shell (/admin/* - Isolated Shell) */}
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
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="subjects" element={<SubjectManagement />} />
                <Route path="faculty" element={<FacultyManagement />} />
                <Route path="alumni" element={<AlumniManagement />} />
                <Route path="toppers" element={<ToppersManagement />} />
                <Route path="fees" element={<FeeManagement />} />
                <Route path="reminders" element={<FeeReminders />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              {/* Protected Student Portal Shell (/student/* - Isolated Shell) */}
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
                <Route path="profile" element={<StudentProfile />} />
                <Route path="announcements" element={<StudentAnnouncements />} />
                <Route path="notifications" element={<StudentNotifications />} />
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}