import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const links = [
  { href: '#', label: 'Home' },
  { href: '#about', label: 'About Founder' },
  { href: '#courses', label: 'Academic Programs' },
  { href: '#faculty', label: 'Faculty Roster' },
  { href: '#alumni', label: 'Proud Alumni' },
  { href: '#results', label: 'Wall of Excellence' },
  { href: '#testimonials', label: 'Student Testimonials' },
  { href: '#contact', label: 'Contact Us' },
];

export default function MobileMenu({ open, onClose, onOpenBooking }) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(t);
    }
    setAnimateIn(false);
  }, [open]);

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
        className={`absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sliding Mobile Drawer Container */}
      <div
        className={`absolute inset-y-0 right-0 max-w-full flex transform transition-transform duration-300 ease-out ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="w-80 max-w-[85vw] bg-surface shadow-2xl flex flex-col justify-between py-6 px-6 relative h-full overflow-y-auto">
          {/* Top Header inside Drawer */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-high">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpg"
                  alt="Saumyaa Studies Logo"
                  className="w-9 h-9 object-contain rounded-xl shadow-sm bg-white p-0.5"
                />
                <span className="font-headings font-extrabold text-lg text-secondary tracking-tight">
                  Saumyaa Studies
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Close Menu"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-2 font-headings text-base font-semibold">
              {links.map((link) => {
                if (link.isRoute) {
                  return (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={onClose}
                      className={`py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between ${
                        link.highlight
                          ? 'bg-primary/10 text-primary font-extrabold border border-primary/20 shadow-sm'
                          : 'hover:bg-surface-container-low hover:text-primary'
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  );
                }
                return (
                  <a
                    key={link.label}
                    onClick={onClose}
                    href={link.href}
                    className="py-2.5 px-3.5 rounded-xl hover:bg-surface-container-low hover:text-primary transition-all text-on-surface"
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions Section */}
          <div className="border-t border-surface-container-high pt-5 mt-6 flex flex-col gap-2.5 shrink-0">
            <Link
              to="/apply"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-secondary to-primary text-white text-center py-3 rounded-xl font-headings font-bold hover:opacity-95 transition-all text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">work</span>
              Join as Faculty (Apply Now)
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="border border-secondary text-secondary text-center py-2.5 rounded-xl font-headings font-bold hover:bg-secondary/10 transition-colors text-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">login</span> Login
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="bg-secondary text-white text-center py-2.5 rounded-xl font-headings font-bold hover:bg-on-secondary-fixed-variant transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span> Sign Up
              </Link>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="w-full bg-primary text-white text-center py-2.5 rounded-xl font-headings font-bold shadow-premium shadow-tactile-btn hover:bg-primary-container transition-colors text-xs flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">event_available</span>
              Book a Free Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
