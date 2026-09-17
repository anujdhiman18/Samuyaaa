import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { href: '#', label: 'Home' },
  { href: '#about', label: 'About Founder' },
  { href: '#courses', label: 'Academic Programs' },
  { href: '#admission-process', label: 'Admission Process' },
  { href: '#faculty', label: 'Faculty Roster' },
  { href: '#alumni', label: 'Proud Alumni' },
  { href: '#results', label: 'Wall of Excellence' },
  { href: '#testimonials', label: 'Student Testimonials' },
  { href: '#contact', label: 'Contact Us' },
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
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpg"
                  alt="Saumyaa Studies Logo"
                  className="w-9 h-9 object-contain rounded-xl shadow-md bg-white p-0.5 border border-[#90CAF9]/30"
                />
                <span className="font-headings font-extrabold text-lg text-[#0D47A1] tracking-tight">
                  Saumyaa Studies
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#1976D2] hover:bg-[#BBDEFB]/20 transition-colors duration-200"
                aria-label="Close Menu"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-1.5 font-headings text-sm font-semibold">
              {links.map((link) => (
                <a
                  key={link.label}
                  onClick={onClose}
                  href={link.href}
                  className="py-2.5 px-3.5 rounded-xl hover:bg-[#BBDEFB]/20 hover:text-[#0D47A1] transition-colors duration-200 text-[#0D1B2A] flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <span className="material-symbols-outlined text-[16px] text-[#90CAF9]">chevron_right</span>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Actions Section */}
          <div className="border-t border-[#90CAF9]/30 pt-5 mt-6 flex flex-col gap-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={onClose}
                  className="w-full bg-[#D97706] hover:bg-[#B45309] text-white text-center py-3 rounded-xl font-headings font-bold transition-all duration-300 text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Go to {isAdmin ? 'Admin Portal' : isFaculty ? 'Faculty Panel' : 'Student Dashboard'}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-center py-2.5 rounded-xl font-headings font-bold transition-colors duration-200 text-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/student-application"
                    onClick={onClose}
                    className="bg-[#BBDEFB]/40 border border-[#90CAF9]/50 text-[#0D47A1] text-center py-2.5 rounded-xl font-headings font-bold hover:bg-[#BBDEFB]/60 transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#1976D2]">school</span> Apply
                  </Link>
                  <Link
                    to="/faculty-application"
                    onClick={onClose}
                    className="border border-[#90CAF9]/50 text-[#1976D2] text-center py-2.5 rounded-xl font-headings font-bold hover:bg-[#BBDEFB]/20 transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#1976D2]">work</span> Faculty
                  </Link>
                </div>

                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full bg-[#0D47A1] text-white text-center py-2.5 rounded-xl font-headings font-extrabold hover:bg-[#1565C0] transition-colors duration-200 text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span> Login
                </Link>
              </>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="w-full bg-[#0D47A1] text-white hover:bg-[#1565C0] text-center py-2.5 rounded-xl font-headings font-bold shadow-sm transition-colors duration-200 text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-white">event_available</span>
              Book a Free Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

