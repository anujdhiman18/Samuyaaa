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
          ? 'shadow-md bg-surface/95 backdrop-blur-md border-surface-container-high py-2.5'
          : 'bg-surface/90 backdrop-blur-sm border-transparent py-3.5'
      }`}
    >
      <div className="max-w-container-max mx-auto px-gutter flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.jpg"
            alt="Saumyaa Studies Logo"
            className="w-9 h-9 md:w-10 md:h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
          />
          <span className="font-headings font-extrabold text-base sm:text-lg md:text-xl text-secondary tracking-tight whitespace-nowrap">
            Saumyaa Studies
          </span>
        </a>

        {/* Center Nav Links - Responsive Spacing & Compact Labels */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-4 shrink">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link font-medium text-on-surface-variant hover:text-primary transition-colors text-xs xl:text-sm whitespace-nowrap px-1.5 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Buttons Container */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 shrink-0">
          <Link
            to="/apply"
            className="border border-outline-variant/40 hover:border-primary/50 text-on-surface-variant hover:text-primary px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1 bg-surface-container-lowest/60"
            title="Faculty Application Form"
          >
            <span className="material-symbols-outlined text-[15px]">work</span>
            <span className="hidden xl:inline">Join as Faculty</span>
            <span className="xl:hidden">Apply</span>
          </Link>

          <button
            onClick={() => onOpenBooking()}
            className="bg-primary text-white hover:bg-primary-container px-3 py-1.5 xl:px-4 xl:py-2 rounded-full font-headings font-bold shadow-premium hover:shadow-glow-primary active:scale-95 transition-all text-xs whitespace-nowrap shadow-tactile-btn cursor-pointer"
          >
            Book Demo
          </button>

          <Link
            to="/login"
            className="border border-secondary text-secondary hover:bg-secondary/10 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">login</span>
            Login
          </Link>

          <Link
            to="/signup"
            className="bg-secondary text-white hover:bg-on-secondary-fixed-variant px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            Sign Up
          </Link>
        </div>

        {/* Mobile / Tablet Quick Controls */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            to="/apply"
            className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1.5 rounded-full font-headings font-bold text-[11px] flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">work</span>
            Join Faculty
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
