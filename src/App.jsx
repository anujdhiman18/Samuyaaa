import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Public & Auth Pages
import PublicWebsite from './components/PublicWebsite';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin Portal Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import StudentDetail from './pages/admin/StudentDetail';
import SubjectManagement from './pages/admin/SubjectManagement';
import FeeManagement from './pages/admin/FeeManagement';
import FeeReminders from './pages/admin/FeeReminders';

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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website Route */}
              <Route path="/" element={<PublicWebsite />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin/login" element={<LoginPage />} />

              {/* Protected Admin Portal Shell (/admin/*) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="subjects" element={<SubjectManagement />} />
                <Route path="fees" element={<FeeManagement />} />
                <Route path="reminders" element={<FeeReminders />} />
              </Route>

              {/* Protected Student Portal Shell (/student/*) */}
              <Route path="/student" element={<StudentLayout />}>
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