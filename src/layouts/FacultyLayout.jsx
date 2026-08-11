import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FacultySidebar from '../components/faculty/FacultySidebar';
import FacultyTopbar from '../components/faculty/FacultyTopbar';
import Breadcrumbs from '../components/admin/Breadcrumbs';

export default function FacultyLayout() {
  const { isAuthenticated, user, isFaculty: isFacultyContext } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFaculty = Boolean(
    isFacultyContext ||
      (user &&
        !user.isStudent &&
        (user.isFaculty ||
          user.role === 'Faculty' ||
          ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR'].includes(user.role) ||
          (Array.isArray(user.roles) && user.roles.some((r) => ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR', 'FACULTY'].includes(r)))))
  );

  // STRICT ROLE-BASED ACCESS CONTROL (RBAC)
  if (!isAuthenticated || !isFaculty) {
    return <Navigate to="/faculty/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex font-body max-w-full overflow-x-hidden">
      {/* Faculty Sidebar Navigation */}
      <FacultySidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Faculty Shell */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 max-w-full overflow-x-hidden">
        <FacultyTopbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        <main className="p-4 md:p-8 flex-grow bg-surface w-full max-w-full overflow-x-hidden">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
