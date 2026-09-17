import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { href: '#', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses' },
  { href: '#admission-process', label: 'Admissions' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#alumni', label: 'Alumni' },
  { href: '#results', label: 'Results' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar({ onOpenBooking, onOpenMobileMenu }) {
  const [scrolled, setScrolled] = useState(false);
  const [applyMenuOpen, setApplyMenuOpen] = useState(false);
  const applyDropdownRef = useRef(null);
  const { user, isAuthenticated, isAdmin, isFaculty, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (applyDropdownRef.current && !applyDropdownRef.current.contains(event.target)) {
        setApplyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isFaculty) return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <nav
      id="navbar"
      className={`fixed top-0 w-full z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'shadow-md bg-white/95 backdrop-blur-md border-[#90CAF9]/30 py-2.5'
          : 'bg-white/90 backdrop-blur-sm border-[#90CAF9]/20 py-3'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2 group shrink-0">
          <img
            src="/logo.jpg"
            alt="Saumyaa Studies Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 bg-white p-0.5 border border-[#90CAF9]/30"
          />
          <span className="font-headings font-extrabold text-sm sm:text-base xl:text-lg text-[#0D47A1] tracking-tight whitespace-nowrap">
            Saumyaa Studies
          </span>
        </a>

        {/* Center Nav Links (Visible on Large Screens) */}
        <div className="hidden xl:flex items-center gap-3 2xl:gap-5 shrink">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link font-semibold text-[#1976D2] hover:text-[#0D47A1] transition-colors duration-200 text-xs 2xl:text-[13px] whitespace-nowrap px-1 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#0D47A1] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Medium Screen Compact Nav Links (1024px - 1279px) */}
        <div className="hidden lg:flex xl:hidden items-center gap-2 shrink">
          {links.slice(0, 5).map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link font-semibold text-[#1976D2] hover:text-[#0D47A1] transition-colors duration-200 text-xs whitespace-nowrap px-1 py-1"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Buttons Container (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Apply Dropdown */}
          <div className="relative" ref={applyDropdownRef}>
            <button
              onClick={() => setApplyMenuOpen(!applyMenuOpen)}
              className="bg-[#BBDEFB]/30 text-[#0D47A1] border border-[#90CAF9]/50 hover:bg-[#BBDEFB]/60 px-3 py-1.5 rounded-full font-headings font-bold transition-all duration-200 text-xs whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#1976D2]">description</span>
              <span>Apply</span>
              <span className="material-symbols-outlined text-[14px] transition-transform duration-200" style={{ transform: applyMenuOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </button>

            {applyMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#90CAF9]/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <Link
                  to="/student-application"
                  onClick={() => setApplyMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#0D1B2A] hover:bg-[#BBDEFB]/20 hover:text-[#0D47A1] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#1976D2]">school</span>
                  <div>
                    <div className="font-bold">Student Admission</div>
                    <div className="text-[10px] text-[#555]">Online application form</div>
                  </div>
                </Link>
                <div className="h-[1px] bg-[#90CAF9]/20 my-1"></div>
                <Link
                  to="/faculty-application"
                  onClick={() => setApplyMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#0D1B2A] hover:bg-[#BBDEFB]/20 hover:text-[#0D47A1] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#1976D2]">work</span>
                  <div>
                    <div className="font-bold">Join Faculty</div>
                    <div className="text-[10px] text-[#555]">Teaching opportunities</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Book Demo Button */}
          <button
            onClick={() => onOpenBooking()}
            className="bg-[#0D47A1] text-white hover:bg-[#1565C0] px-3.5 py-1.5 rounded-full font-headings font-bold shadow-sm hover:shadow active:scale-95 transition-all duration-200 text-xs whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">event_available</span>
            <span>Book Demo</span>
          </button>

          {/* Authenticated vs Guest Actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <Link
                to={getDashboardPath()}
                className="bg-[#D97706] hover:bg-[#B45309] text-white px-3.5 py-1.5 rounded-full font-headings font-bold transition-all duration-200 text-xs whitespace-nowrap flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-full text-[#555] hover:text-[#c62828] hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              id="navbar-login-btn"
              className="bg-[#0D47A1] text-white hover:bg-[#1565C0] px-4 py-1.5 rounded-full font-headings font-bold transition-all duration-200 text-xs whitespace-nowrap flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile / Tablet Quick Controls (< 1024px) */}
        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              className="bg-[#D97706] text-white px-2.5 py-1 rounded-full font-headings font-bold text-[11px] flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[13px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-white border border-[#0D47A1] text-[#0D47A1] hover:bg-[#0D47A1] hover:text-white px-2.5 py-1 rounded-full font-headings font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">login</span>
              <span>Login</span>
            </Link>
          )}

          <button
            onClick={() => onOpenBooking()}
            className="bg-[#0D47A1] text-white px-2.5 py-1 rounded-full font-headings font-bold text-[11px] flex items-center gap-1 shadow-xs"
          >
            <span>Demo</span>
          </button>

          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-xl text-[#0D47A1] hover:bg-[#BBDEFB]/20 transition-colors duration-200"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export { links as navLinks };

