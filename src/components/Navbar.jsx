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
      className={`fixed top-0 w-full z-40 border-b transition-all duration-300 glass-header ${
        scrolled ? 'shadow-md bg-surface border-surface-container-high' : 'border-transparent'
      }`}
    >
      <div className="flex justify-between items-center max-w-container-max mx-auto px-gutter py-4 gap-4">
        <a href="#" className="flex items-center gap-3 group shrink-0">
          <img
            src="/logo.jpg"
            alt="Saumyaa Studies Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
          />
          <span className="font-headings font-extrabold text-xl text-secondary tracking-tight">
            Saumyaa Studies
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-3 xl:gap-6 shrink-0">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link font-medium text-on-surface-variant hover:text-primary transition-all duration-200 text-xs xl:text-sm whitespace-nowrap relative py-2 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          <Link
            to="/apply"
            className="border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 px-3 py-2 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">work</span>
            Join as Faculty
          </Link>
          <button
            onClick={() => onOpenBooking()}
            className="bg-primary text-white hover:bg-primary-container px-3.5 py-2 xl:px-4 rounded-full font-headings font-bold shadow-premium hover:shadow-glow-primary active:scale-95 transform transition-all duration-150 text-xs whitespace-nowrap shadow-tactile-btn"
          >
            Book a Free Demo
          </button>
          <Link
            to="/login"
            className="border border-secondary text-secondary hover:bg-secondary/10 px-3.5 py-2 xl:px-4 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-secondary text-white hover:bg-on-secondary-fixed-variant px-3.5 py-2 xl:px-4 rounded-full font-headings font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Sign Up
          </Link>
        </div>

        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined text-[28px]">menu</span>
        </button>
      </div>
    </nav>
  );
}

export { links as navLinks };
