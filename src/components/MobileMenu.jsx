import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home Overview' },
  { to: '/our-faculty', label: 'Faculty Roster' },
  { to: '/courses', label: 'Academic Programs (S1-S4)' },
  { to: '/alumni', label: 'Proud Alumni' },
  { to: '/about', label: 'About Founder & Vision' },
];

export default function MobileMenu({ open, onClose, onOpenBooking }) {
  const [animateIn, setAnimateIn] = useState(false);
  const { user, isAuthenticated, isAdmin, isFaculty, logout } = useAuth();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(t);
    }
    setAnimateIn(false);
  }, [open]);

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isFaculty) return '/faculty/dashboard';
    return '/student/dashboard';
  };

  if (!open && !animateIn) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${open ? '' : 'hidden'}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Dark overlay backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#0D1B2A]/50 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sliding Mobile Drawer Container */}
      <div
        className={`absolute inset-y-0 right-0 max-w-full flex transform transition-transform duration-300 ease-out ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between py-6 px-6 relative h-full overflow-y-auto border-l border-[#90CAF9]/30">
          {/* Top Header inside Drawer */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#90CAF9]/30">
              <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                <img
                  src="/logo.jpg"
                  alt="Saumyaa Studies Logo"
                  className="w-9 h-9 object-contain rounded-xl shadow-md bg-white p-0.5 border border-[#90CAF9]/30"
                />
                <span className="font-headings font-extrabold text-lg text-[#0D47A1] tracking-tight">
                  Saumyaa Studies
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#1976D2] hover:bg-[#BBDEFB]/20 transition-colors duration-200"
                aria-label="Close Menu"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-1 font-headings text-sm font-semibold">
              {links.map((link) => (
                <Link
                  key={link.label}
                  onClick={onClose}
                  to={link.to}
                  className="py-2 px-3 rounded-xl hover:bg-[#BBDEFB]/20 hover:text-[#0D47A1] transition-colors duration-200 text-[#0D1B2A] flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <span className="material-symbols-outlined text-[16px] text-[#90CAF9]">chevron_right</span>
                </Link>
              ))}
            </div>

            {/* Quick Applications Box */}
            <div className="mt-4 p-3 bg-[#E3F2FD]/50 rounded-2xl border border-[#90CAF9]/30 space-y-2">
              <span className="text-[10px] font-headings font-extrabold uppercase tracking-wider text-[#0D47A1] block">
                Online Admissions &amp; Careers
              </span>
              <Link
                to="/student-application"
                onClick={onClose}
                className="flex items-center gap-2 text-xs font-bold text-[#0D47A1] hover:text-[#1976D2] bg-white p-2 rounded-xl border border-[#90CAF9]/30 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-[#D97706]">school</span>
                <span>Student Admission Form</span>
              </Link>
              <Link
                to="/faculty-application"
                onClick={onClose}
                className="flex items-center gap-2 text-xs font-bold text-[#0D47A1] hover:text-[#1976D2] bg-white p-2 rounded-xl border border-[#90CAF9]/30 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-[#1976D2]">work</span>
                <span>Join Faculty / Careers</span>
              </Link>
            </div>
          </div>

          {/* Bottom Actions Section */}
          <div className="border-t border-[#90CAF9]/30 pt-5 mt-6 flex flex-col gap-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={onClose}
                  className="w-full bg-[#D97706] hover:bg-[#B45309] text-white py-2.5 rounded-xl font-headings font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Portal Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-xl font-headings font-bold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={onClose}
                className="w-full bg-[#0D47A1] hover:bg-[#1565C0] text-white py-2.5 rounded-xl font-headings font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Login to Portal</span>
              </Link>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white py-2.5 rounded-xl font-headings font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              <span>Book a Free Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
