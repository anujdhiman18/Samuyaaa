import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const studentNavItems = [
  { path: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/student/marks', label: 'Marks & Results', icon: 'grade' },
  { path: '/student/attendance', label: 'Attendance Record', icon: 'calendar_month' },
  { path: '/student/performance', label: 'Performance Report', icon: 'analytics' },
  { path: '/student/subjects', label: 'Enrolled Subjects', icon: 'menu_book' },
  { path: '/student/fees', label: 'Fee Status', icon: 'payments' },
  { path: '/student/profile', label: 'Personal Information', icon: 'badge' },
  { path: '/student/announcements', label: 'Announcements', icon: 'campaign' },
  { path: '/student/notifications', label: 'Notifications', icon: 'notifications' },
];

export default function StudentSidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation();

  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-outline-variant/15">
            <Link to="/student/dashboard" className="flex items-center gap-2.5 group">
              <span className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </span>
              <div className="flex flex-col">
                <span className="font-headings font-extrabold text-[18px] leading-tight text-secondary tracking-tight">
                  Saumyaa Student
                </span>
                <span className="font-headings text-[10px] uppercase tracking-[0.2em] font-semibold text-primary -mt-0.5">
                  Learning Portal
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
          <nav className="p-4 space-y-1 font-body overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
            <div className="px-3 pb-2 text-[10px] font-headings font-bold uppercase tracking-widest text-on-surface-variant/70">
              Student Menu
            </div>
            {studentNavItems.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full font-headings text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-secondary text-white shadow-premium shadow-tactile-btn'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-secondary'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? 'text-white' : 'text-secondary'
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

        {/* Footer Link */}
        <div className="p-4 border-t border-outline-variant/15">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-full bg-surface-container-low hover:bg-surface-container text-xs font-headings font-bold text-primary transition-colors border border-outline-variant/15 shadow-sm"
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
