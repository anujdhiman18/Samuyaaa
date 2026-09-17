import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleNewsletter(event) {
    event.preventDefault();
    setMessage('Adding to mailing list...');
    setTimeout(() => {
      setMessage('Thank you for subscribing to Saumyaa updates.');
      setEmail('');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  }

  return (
    <footer className="bg-[#0A192F] text-[#E3F2FD] border-t border-[#90CAF9]/20 font-body">
      <div className="max-w-container-max mx-auto px-gutter py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 flex flex-col justify-start">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img
              src="/logo.jpg"
              alt="Saumyaa Studies Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-premium bg-white p-0.5 border border-[#90CAF9]/30"
            />
            <span className="font-headings font-extrabold text-lg text-[#E3F2FD]">Saumyaa Studies</span>
          </Link>
          <p className="text-xs text-[#90CAF9] leading-relaxed mb-6 font-medium">
            Nurturing grade-level academic achievements and competitive success through custom-planned logic
            blueprints and dedicated cognitive instruction since 2010.
          </p>

          <div className="space-y-2">
            <h5 className="font-headings font-bold text-xs text-[#E3F2FD] uppercase tracking-wider">
              Academic Newsletter
            </h5>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter parent email"
                className="px-3 py-2 rounded-lg border border-[#90CAF9]/30 bg-[#0D1B2A] text-xs text-[#E3F2FD] placeholder:text-[#90CAF9]/60 w-full focus:outline-none focus:border-[#42A5F5] transition-colors duration-200"
              />
              <button
                type="submit"
                className="bg-[#1976D2] hover:bg-[#0D47A1] text-white px-4 py-2 rounded-lg font-headings font-bold text-xs transition-colors duration-200 cursor-pointer shadow-premium"
              >
                Join
              </button>
            </form>
            {message && <p className="text-[10px] text-[#90CAF9] font-semibold">{message}</p>}
          </div>
        </div>

        <div>
          <h4 className="font-headings font-bold text-xs text-[#E3F2FD] uppercase tracking-wider mb-4">
            Quick Navigation
          </h4>
          <ul className="space-y-2.5 text-xs text-[#90CAF9] font-medium">
            {[
              { to: '/', label: 'Home Overview' },
              { to: '/about', label: 'About Founder & Vision' },
              { to: '/courses', label: 'Academic Programs (S1-S4)' },
              { to: '/admissions', label: 'Admission / Joining Process' },
              { to: '/our-faculty', label: 'Faculty Directory' },
              { to: '/alumni', label: 'Proud Alumni Network' },
              { to: '/results', label: 'Wall of Excellence' },
              { to: '/testimonials', label: 'Student Testimonials' },
              { to: '/contact', label: 'Contact Us & Centers' },
            ].map((link) => (
              <li key={link.label}>
                <Link className="hover:text-[#E3F2FD] transition-colors duration-200" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-headings font-bold text-xs text-[#E3F2FD] uppercase tracking-wider mb-4">
            Online Applications
          </h4>
          <ul className="space-y-3 text-xs text-[#90CAF9] font-medium">
            <li>
              <Link to="/student-application" className="text-[#E3F2FD] font-bold hover:text-white flex items-center gap-1.5 transition-colors duration-200 bg-white/5 p-2 rounded-xl border border-white/10 hover:border-white/20">
                <span className="material-symbols-outlined text-[16px] text-[#D97706]">school</span>
                <span>Student Admission Application</span>
              </Link>
            </li>
            <li>
              <Link to="/faculty-application" className="text-[#E3F2FD] font-bold hover:text-white flex items-center gap-1.5 transition-colors duration-200 bg-white/5 p-2 rounded-xl border border-white/10 hover:border-white/20">
                <span className="material-symbols-outlined text-[16px] text-[#42A5F5]">work</span>
                <span>Careers / Faculty Application</span>
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-[#E3F2FD] flex items-center gap-1.5 pt-2">
                <span className="material-symbols-outlined text-[14px] text-[#90CAF9]">lock</span>
                <span>Portal Login (Students &amp; Faculty)</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-headings font-bold text-xs text-[#E3F2FD] uppercase tracking-wider mb-4">
            Academic Centers
          </h4>
          <div className="space-y-3 text-xs text-[#90CAF9] font-medium">
            <div>
              <p className="font-bold text-[#E3F2FD] text-[11px] mb-0.5">Main Center (Bagru)</p>
              <p className="flex items-start gap-1.5 leading-relaxed">
                <span className="material-symbols-outlined text-[14px] text-[#42A5F5] mt-0.5 shrink-0">location_on</span>
                <span>Saumyaa Studies, Bagru Garh, Jamula, Palaid, HP 176093</span>
              </p>
            </div>
            <div>
              <p className="font-bold text-[#E3F2FD] text-[11px] mb-0.5">Branch (Daroh)</p>
              <p className="flex items-start gap-1.5 leading-relaxed">
                <span className="material-symbols-outlined text-[14px] text-[#42A5F5] mt-0.5 shrink-0">location_on</span>
                <span>Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092</span>
              </p>
            </div>
            <p className="flex items-center gap-2 pt-1 border-t border-[#90CAF9]/20">
              <span className="material-symbols-outlined text-[14px] text-[#42A5F5]">call</span>
              <span className="text-[#E3F2FD]">+91 98164 77341</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#42A5F5]">mail</span>
              <span className="text-[#E3F2FD]">Jitender0585@gmail.com</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#90CAF9]/15 py-6 text-center text-xs text-[#90CAF9]/80">
        <p>&copy; {new Date().getFullYear()} Saumyaa Studies. All rights reserved. Transforming education in Himachal Pradesh.</p>
      </div>
    </footer>
  );
}
