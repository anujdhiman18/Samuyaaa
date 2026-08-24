import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const links = [
  { href: '#', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#alumni', label: 'Alumni' },
  { href: '#results', label: 'Results' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar({ onOpenBooking, onOpenMobileMenu }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`fixed top-0 w-full z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'shadow-md bg-surface/95 backdrop-blur-md border-surface-container-high py-2'
          : 'bg-surface/90 backdrop-blur-sm border-transparent py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 xl:gap-6">
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2 group shrink-0">
          <img
            src="/logo.jpg"
            alt="Saumyaa Studies Logo"
            className="w-9 h-9 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
          />
          <span className="font-headings font-extrabold text-base xl:text-lg text-secondary tracking-tight whitespace-nowrap">
            Saumyaa Studies
          </span>
        </a>

        {/* Center Nav Links - Responsive Breakpoints & Clean Spacing */}
        <div className="hidden xl:flex items-center gap-3 2xl:gap-5 shrink">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link font-medium text-on-surface-variant hover:text-primary transition-colors text-xs 2xl:text-sm whitespace-nowrap px-1 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
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
              className="nav-link font-medium text-on-surface-variant hover:text-primary transition-colors text-xs whitespace-nowrap px-1 py-1"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Buttons Container */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            to="/student-application"
            className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-3 py-1.5 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Student Online Admissions Application"
          >
            <span className="material-symbols-outlined text-[15px]">school</span>
            <span>Apply as Student</span>
          </Link>

          <Link
            to="/faculty-application"
            className="border border-outline-variant/50 hover:border-primary text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1.5 bg-surface-container-lowest/80 shadow-2xs"
            title="Faculty Recruitment Application"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">work</span>
            <span>Join Faculty</span>
          </Link>

          <button
            onClick={() => onOpenBooking()}
            className="bg-primary text-white hover:bg-primary-container px-3.5 py-1.5 rounded-full font-headings font-bold shadow-sm hover:shadow-md active:scale-95 transition-all text-xs whitespace-nowrap cursor-pointer"
          >
            Book Demo
          </button>

          <Link
            to="/login"
            className="border border-secondary text-secondary hover:bg-secondary/10 px-3 py-1.5 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">login</span>
            Login
          </Link>

          <Link
            to="/signup"
            className="bg-secondary text-white hover:bg-on-secondary-fixed-variant px-3 py-1.5 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            Sign Up
          </Link>
        </div>

        {/* Mobile / Tablet Quick Controls (< 1024px) */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            to="/student-application"
            className="bg-primary/10 text-primary border border-primary/20 px-2 py-1.5 rounded-full font-headings font-bold text-[10px] flex items-center gap-1 shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px]">school</span>
            Apply
          </Link>
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export { links as navLinks };
