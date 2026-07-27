import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentSidebar from '../components/student/StudentSidebar';
import StudentTopbar from '../components/student/StudentTopbar';
import Breadcrumbs from '../components/admin/Breadcrumbs';

export default function StudentLayout() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex font-body">
      <StudentSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <StudentTopbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        <main className="p-4 md:p-8 flex-grow bg-surface">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
