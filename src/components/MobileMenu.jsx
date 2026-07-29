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
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`absolute inset-y-0 right-0 max-w-full flex pl-10 transform transition-transform duration-300 ease-out ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="w-80 bg-surface shadow-2xl flex flex-col py-6 px-6 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <img
                src="/logo.jpg"
                alt="Saumyaa Studies Logo"
                className="w-9 h-9 object-contain rounded-xl shadow-sm bg-white p-0.5"
              />
              <span className="font-headings font-extrabold text-lg text-secondary">Saumyaa Studies</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <div className="flex flex-col space-y-4 font-headings text-lg font-semibold flex-grow">
            {links.map((link) => (
              <a
                key={link.label}
                onClick={onClose}
                href={link.href}
                className="py-2 px-3 rounded-lg hover:bg-surface-container-low hover:text-primary transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="border-t border-surface-container-high pt-6 flex flex-col gap-2.5">
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
              className="w-full bg-primary text-white text-center py-2.5 rounded-xl font-headings font-bold shadow-premium shadow-tactile-btn hover:bg-primary-container transition-colors text-xs"
            >
              Book a Free Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
