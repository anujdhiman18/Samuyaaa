import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/students', label: 'Students', icon: 'groups' },
  { path: '/admin/attendance', label: 'Attendance Register', icon: 'fact_check' },
  { path: '/admin/subjects', label: 'Subjects & Batches', icon: 'menu_book' },
  { path: '/admin/faculty', label: 'Faculty Directory', icon: 'badge' },
  { path: '/faculty', label: 'Faculty Panel Portal', icon: 'co_present' },
  { path: '/admin/alumni', label: 'Alumni Directory', icon: 'school' },
  { path: '/admin/toppers', label: 'Topper Students', icon: 'emoji_events' },
  { path: '/admin/fees', label: 'Fee Management', icon: 'payments' },
  { path: '/admin/reminders', label: 'Fee Reminders', icon: 'notifications_active' },
  { path: '/admin/profile', label: 'Admin Profile', icon: 'manage_accounts' },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
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
          <nav className="p-4 space-y-1.5 font-body">
            <div className="px-3 pb-2 text-[10px] font-headings font-bold uppercase tracking-widest text-on-surface-variant/70">
              Control Center
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
