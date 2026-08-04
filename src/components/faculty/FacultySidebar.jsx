import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/faculty', label: 'Dashboard', icon: 'dashboard' },
  { path: '/faculty/students', label: 'My Students', icon: 'groups' },
  { path: '/faculty/attendance', label: 'Mark Attendance', icon: 'fact_check' },
  { path: '/faculty/marks', label: 'Marks & Grades', icon: 'edit_note' },
  { path: '/faculty/assignments', label: 'Assignments', icon: 'assignment' },
  { path: '/faculty/materials', label: 'Study Materials', icon: 'folder_open' },
  { path: '/faculty/timetable', label: 'My Timetable', icon: 'calendar_month' },
  { path: '/faculty/announcements', label: 'Class Notices', icon: 'campaign' },
  { path: '/faculty/leave', label: 'Leave Requests', icon: 'event_busy' },
  { path: '/faculty/reports', label: 'Academic Reports', icon: 'summarize' },
  { path: '/faculty/profile', label: 'My Profile', icon: 'account_circle' },
];

export default function FacultySidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === '/faculty') {
      return location.pathname === '/faculty' || location.pathname === '/faculty/dashboard';
    }
    return location.pathname.startsWith(path);
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

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-outline-variant/15">
            <Link to="/faculty" className="flex items-center gap-2.5 group">
              <img
                src="/logo.jpg"
                alt="Saumyaa Faculty Logo"
                className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
              />
              <div>
                <span className="font-headings font-extrabold text-sm text-secondary block leading-tight">
                  Saumyaa Portal
                </span>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                  Faculty Panel
                </span>
              </div>
            </Link>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 font-body overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 pb-2 text-[10px] font-headings font-bold uppercase tracking-widest text-on-surface-variant/70">
              Faculty Resources
            </div>
            {navItems.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full font-headings text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-primary text-white shadow-premium shadow-tactile-btn'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? 'text-white' : 'text-primary'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Shortcut */}
        <div className="p-4 border-t border-outline-variant/15">
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
            <div>
              <span className="text-[11px] font-bold text-secondary block leading-tight">Faculty Access Active</span>
              <span className="text-[10px] text-on-surface-variant">Role-based scope enforced</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
