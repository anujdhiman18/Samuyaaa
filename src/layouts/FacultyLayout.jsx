import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FacultySidebar from '../components/faculty/FacultySidebar';
import FacultyTopbar from '../components/faculty/FacultyTopbar';
import Breadcrumbs from '../components/admin/Breadcrumbs';

export default function FacultyLayout() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFaculty = Boolean(user && user.role === 'Faculty');

  // STRICT ROLE-BASED ACCESS CONTROL (RBAC)
  // If not logged in or role is not Faculty, block access & redirect to faculty login!
  if (!isAuthenticated || !isFaculty) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex font-body">
      {/* Faculty Sidebar Navigation */}
      <FacultySidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Faculty Shell */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <FacultyTopbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        <main className="p-4 md:p-8 flex-grow bg-surface">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
