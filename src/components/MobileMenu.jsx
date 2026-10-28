import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home Overview' },
  { to: '/our-faculty', label: 'Faculty Roster' },
  { to: '/courses', label: 'Academic Programs (S1-S5)' },
  { to: '/about', label: 'About Founder & Vision' },
];

export default function MobileMenu({ open, onClose }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const drawerRef = useRef(null);
  const { user, isAuthenticated, isAdmin, isFaculty, logout } = useAuth();

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
    }
  }, [open]);

  const handleTransitionEnd = useCallback((e) => {
    if (!isVisible && e.target === drawerRef.current) {
      setShouldRender(false);
    }
  }, [isVisible]);

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isFaculty) return '/faculty/dashboard';
    return '/student/dashboard';
  };

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark overlay backdrop — Apple §12: dim to focus */}
      <div
        onClick={onClose}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: `opacity var(--spring-duration, 350ms) var(--spring-ease, cubic-bezier(0.2, 1, 0.3, 1))`,
        }}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        onTransitionEnd={handleTransitionEnd}
        className="absolute inset-y-0 right-0 max-w-full flex"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform var(--spring-duration, 350ms) var(--spring-ease, cubic-bezier(0.2, 1, 0.3, 1))`,
        }}
      >
        <div className="w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between py-6 px-6 relative h-full overflow-y-auto border-l border-[#d2d2d7]">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d2d2d7]">
              <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                <img
                  src="/logo.jpg"
                  alt="Saumyaa Studies Logo"
                  className="w-8 h-8 object-contain rounded-xl bg-white p-0.5 border border-[#d2d2d7]"
                />
                <span className="font-semibold text-base text-[#1d1d1f] tracking-tight">
                  Saumyaa Studies
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                aria-label="Close Menu"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-1 text-sm font-medium">
              {links.map((link) => (
                <Link
                  key={link.label}
                  onClick={onClose}
                  to={link.to}
                  className="py-2.5 px-3 rounded-xl hover:bg-[#f5f5f7] hover:text-[#0066cc] text-[#1d1d1f] flex items-center justify-between transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="material-symbols-outlined text-[16px] text-[#86868b]">chevron_right</span>
                </Link>
              ))}
            </div>

            {/* Applications Box */}
            <div className="mt-6 p-4 bg-[#f5f5f7] rounded-[20px] space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6e6e73] block mb-1">
                Online Applications
              </span>
              <Link
                to="/student-application"
                onClick={onClose}
                className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] hover:text-[#0066cc] bg-white p-2.5 rounded-xl border border-[#d2d2d7]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0071e3]">school</span>
                <span>Student Admission Form</span>
              </Link>
              <Link
                to="/faculty-application"
                onClick={onClose}
                className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] hover:text-[#0066cc] bg-white p-2.5 rounded-xl border border-[#d2d2d7]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0071e3]">work</span>
                <span>Faculty Application</span>
              </Link>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-[#d2d2d7] mt-auto">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={onClose}
                  className="w-full apple-btn-primary py-2.5 text-xs text-center"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Open Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full text-center py-2 text-xs text-[#6e6e73] hover:text-[#1d1d1f]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={onClose}
                className="w-full apple-btn-primary py-2.5 text-xs text-center"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Portal Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
