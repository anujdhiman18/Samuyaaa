import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRBAC } from '../../context/RBACContext';
import { useAuth } from '../../context/AuthContext';

const mainNavItems = [
  { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/students', label: 'Students', icon: 'groups' },
  { path: '/admin/student-leaves', label: 'Student Leaves', icon: 'event_busy' },
  { path: '/admin/faculty', label: 'Faculty Directory', icon: 'badge' },
  { path: '/admin/faculty?tab=leaves', label: 'Faculty Leaves', icon: 'event_busy' },
  { path: '/admin/profile-requests', label: 'Profile Change Requests', icon: 'edit_attributes' },
  { path: '/admin/roles', label: 'Role Management (RBAC)', icon: 'admin_panel_settings' },
  { path: '/admin/permissions', label: 'Permission Matrix', icon: 'fact_check' },
  { path: '/admin/activity-logs', label: 'Activity Audit Logs', icon: 'history_toggle_off' },
  { path: '/admin/alumni', label: 'Alumni Directory', icon: 'school' },
  { path: '/admin/toppers', label: 'Topper Students', icon: 'emoji_events' },
  { path: '/admin/fees', label: 'Fee Management', icon: 'payments' },
  { path: '/admin/reminders', label: 'Fee Reminders', icon: 'notifications_active' },
  { path: '/admin/sms-logs', label: 'SMS Notification Logs', icon: 'sms' },
  { path: '/admin/profile', label: 'Admin Profile', icon: 'manage_accounts' },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { hasPermission } = useRBAC();
  const { user } = useAuth();

  const canMarkAttendance = hasPermission('MARK_ATTENDANCE') || hasPermission('canMarkAttendance');
  const canUploadGrades = hasPermission('UPLOAD_GRADES') || hasPermission('canUploadGrades');
  const canManageClasses = hasPermission('MANAGE_CLASSES') || hasPermission('canManageClasses');

  const academicItems = [
    canMarkAttendance && { path: '/admin/attendance', label: 'Attendance', icon: 'fact_check' },
    canUploadGrades && { path: '/admin/marks', label: 'Grades', icon: 'edit_note' },
    canManageClasses && { path: '/admin/subjects', label: 'Classes & Subjects', icon: 'menu_book' },
  ].filter(Boolean);

  const isLinkActive = (itemPath) => {
    if (itemPath === '/admin') {
      return location.pathname === '/admin';
    }
    if (itemPath.includes('?tab=')) {
      const basePath = itemPath.split('?tab=')[0];
      const tabParam = itemPath.split('?tab=')[1];
      return location.pathname.startsWith(basePath) && location.search.includes(`tab=${tabParam}`);
    }
    if (itemPath === '/admin/students') {
      return location.pathname === '/admin/students' && (!location.search || !location.search.includes('tab=leaves'));
    }
    if (itemPath === '/admin/faculty') {
      return location.pathname === '/admin/faculty' && (!location.search || !location.search.includes('tab=leaves'));
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-outline-variant/15">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <img
                src="/logo.jpg"
                alt="Saumyaa Admin Logo"
                className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
              />
              <span className="font-headings font-extrabold text-base text-secondary tracking-tight">
                Saumyaa Admin
              </span>
            </Link>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-3 font-body flex-1 overflow-y-auto max-h-[calc(100vh-130px)] sidebar-scroll">
            {/* Academic Operations Section */}
            {academicItems.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-headings font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  Academic Operations
                </div>
                {academicItems.map((item) => {
                  const active = isLinkActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-4 py-2 rounded-full font-headings text-xs font-bold transition-all duration-200 ${
                        active
                          ? 'bg-primary text-white shadow-premium shadow-tactile-btn'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          active ? 'text-white' : 'text-primary'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Core Admin Control Center */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-headings font-bold uppercase tracking-widest text-on-surface-variant/70">
                Control Center
              </div>
              {mainNavItems.map((item) => {
                const active = isLinkActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full font-headings text-xs font-bold transition-all duration-200 ${
                      active
                        ? 'bg-primary text-white shadow-premium shadow-tactile-btn'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        active ? 'text-white' : 'text-primary'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Footer info & Website shortcut */}
        <div className="p-4 border-t border-outline-variant/15">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-full bg-surface-container-low hover:bg-surface-container text-xs font-headings font-bold text-secondary transition-colors border border-outline-variant/15 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">public</span>
              <span>Saumyaa Website</span>
            </div>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
