import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/our-faculty', label: 'Faculty' },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
];

export default function Navbar({ onOpenMobileMenu }) {
  const [scrolled, setScrolled] = useState(false);
  const [applyMenuOpen, setApplyMenuOpen] = useState(false);
  const applyDropdownRef = useRef(null);
  const applyBtnRef = useRef(null);
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
      className={`fixed top-0 w-full z-40 border-b ${
        scrolled ? 'py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]' : 'py-3'
      }`}
      style={{
        background: 'var(--apple-nav-glass)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderColor: 'var(--apple-nav-border)',
        transition: `background var(--spring-duration, 350ms) var(--spring-ease, cubic-bezier(0.2, 1, 0.3, 1)),
                     border-color var(--spring-duration, 350ms) var(--spring-ease, cubic-bezier(0.2, 1, 0.3, 1)),
                     padding var(--spring-duration, 350ms) var(--spring-ease, cubic-bezier(0.2, 1, 0.3, 1))`,
      }}
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.jpg"
            alt="Saumyaa Studies Logo"
            className="w-8 h-8 object-contain rounded-xl shadow-xs bg-white p-0.5 border border-[#d2d2d7]"
          />
          <span className="font-semibold text-base sm:text-lg text-[var(--apple-text-primary)] tracking-[-0.02em] whitespace-nowrap">
            Saumyaa Studies
          </span>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-xs sm:text-[13px] font-medium tracking-normal transition-colors duration-150 ${
                  isActive
                    ? 'text-[var(--apple-text-primary)] font-semibold'
                    : 'text-[var(--apple-text-secondary)] hover:text-[#0066cc]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Action Buttons Container (Desktop) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Apply Dropdown (Secondary Button: transparent with #0071e3 outline/text) */}
          <div className="relative" ref={applyDropdownRef}>
            <button
              ref={applyBtnRef}
              onClick={() => setApplyMenuOpen(!applyMenuOpen)}
              className="apple-btn-secondary px-3.5 py-1.5 text-xs font-medium cursor-pointer"
            >
              <span>Apply</span>
              <span
                className="material-symbols-outlined text-[14px]"
                style={{
                  transform: applyMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--spring-duration) var(--spring-ease)',
                }}
              >
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            <div
              style={{
                transformOrigin: 'top right',
                opacity: applyMenuOpen ? 1 : 0,
                transform: applyMenuOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-4px)',
                pointerEvents: applyMenuOpen ? 'auto' : 'none',
                transition: `transform var(--spring-duration) var(--spring-ease),
                             opacity var(--spring-duration-fast) var(--spring-ease)`,
              }}
              className="absolute top-full right-0 mt-2 w-52 bg-white rounded-[18px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-[#d2d2d7] py-2 z-50 overflow-hidden"
            >
              <Link
                to="/student-application"
                onClick={() => setApplyMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0071e3]">school</span>
                <div>
                  <div className="font-semibold">Student Admission</div>
                  <div className="text-[10px] text-[#6e6e73]">Online application</div>
                </div>
              </Link>
              <div className="h-[1px] bg-[#d2d2d7] my-1 opacity-50"></div>
              <Link
                to="/faculty-application"
                onClick={() => setApplyMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0071e3]">work</span>
                <div>
                  <div className="font-semibold">Join Faculty</div>
                  <div className="text-[10px] text-[#6e6e73]">Teaching opportunities</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Primary Button: background #0071e3, white text, hover #0077ed, active #006edb, pill shape */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={getDashboardPath()}
                className="apple-btn-primary px-4 py-1.5 text-xs"
              >
                <span className="material-symbols-outlined text-[15px]">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              id="navbar-login-btn"
              className="apple-btn-primary px-4 py-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile / Tablet Quick Controls */}
        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              className="apple-btn-primary px-3 py-1 text-[11px]"
            >
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="apple-btn-secondary px-3 py-1 text-[11px]"
            >
              <span>Login</span>
            </Link>
          )}

          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-xl text-[var(--apple-text-primary)] hover:bg-[var(--apple-card-on-white)]"
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
