import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/admin/Sidebar';
import Topbar from '../components/admin/Topbar';
import Breadcrumbs from '../components/admin/Breadcrumbs';

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // STRICT PROTECTION: If not authenticated or role is not Admin, block access completely!
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex font-body">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        <main className="p-4 md:p-8 flex-grow bg-surface">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
