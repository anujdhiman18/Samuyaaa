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
    <footer className="bg-[#f5f5f7] text-[#6e6e73] border-t border-[#d2d2d7] text-xs">
      <div className="apple-container py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Newsletter */}
        <div className="col-span-1 flex flex-col justify-start">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img
              src="/logo.jpg"
              alt="Saumyaa Studies Logo"
              className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 border border-[#d2d2d7]"
            />
            <span className="font-semibold text-base text-[#1d1d1f]">Saumyaa Studies</span>
          </Link>
          <p className="leading-relaxed mb-6 font-normal">
            Nurturing academic achievements and competitive success through custom logic
            blueprints and dedicated cognitive instruction since 2010.
          </p>

          <div className="space-y-2">
            <h5 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider">
              Academic Newsletter
            </h5>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter parent email"
                className="px-3.5 py-2 rounded-full border border-[#d2d2d7] bg-white text-xs text-[#1d1d1f] placeholder:text-[#86868b] w-full focus:outline-none focus:border-[#0071e3]"
              />
              <button
                type="submit"
                className="apple-btn-primary px-4 py-2 text-xs"
              >
                Join
              </button>
            </form>
            {message && <p className="text-[11px] text-[#0071e3] font-medium">{message}</p>}
          </div>
        </div>

        {/* Quick Navigation */}
        <div>
          <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider mb-4">
            Quick Navigation
          </h4>
          <ul className="space-y-2.5 font-normal">
            {[
              { to: '/', label: 'Home Overview' },
              { to: '/about', label: 'About Founder & Vision' },
              { to: '/courses', label: 'Academic Programs (S1-S5)' },
              { to: '/admissions', label: 'Admission / Joining Process' },
              { to: '/our-faculty', label: 'Faculty Directory' },
              { to: '/results', label: 'Wall of Excellence' },
              { to: '/testimonials', label: 'Student Testimonials' },
              { to: '/contact', label: 'Contact Us & Centers' },
            ].map((link) => (
              <li key={link.label}>
                <Link className="hover:text-[#1d1d1f] hover:underline transition-colors" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Online Applications */}
        <div>
          <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider mb-4">
            Online Applications
          </h4>
          <ul className="space-y-3 font-normal">
            <li>
              <Link to="/student-application" className="text-[#1d1d1f] font-semibold hover:text-[#0071e3] flex items-center gap-2 p-2.5 rounded-[16px] bg-white border border-[#d2d2d7]">
                <span className="material-symbols-outlined text-[16px] text-[#0071e3]">school</span>
                <span>Student Admission Application</span>
              </Link>
            </li>
            <li>
              <Link to="/faculty-application" className="text-[#1d1d1f] font-semibold hover:text-[#0071e3] flex items-center gap-2 p-2.5 rounded-[16px] bg-white border border-[#d2d2d7]">
                <span className="material-symbols-outlined text-[16px] text-[#0071e3]">work</span>
                <span>Careers / Faculty Application</span>
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-[#1d1d1f] flex items-center gap-1.5 pt-2">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>Portal Login (Students &amp; Faculty)</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Academic Centers */}
        <div>
          <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider mb-4">
            Academic Centers
          </h4>
          <div className="space-y-3 font-normal">
            <div>
              <p className="font-semibold text-[#1d1d1f] text-[11px] mb-0.5">Main Center (Bagru)</p>
              <p className="leading-relaxed">
                Saumyaa Studies, Bagru Garh, Jamula, Palaid, HP 176093
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f] text-[11px] mb-0.5">Branch (Daroh)</p>
              <p className="leading-relaxed">
                Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092
              </p>
            </div>
            <p className="flex items-center gap-2 pt-2 border-t border-[#d2d2d7]/50">
              <span className="material-symbols-outlined text-[14px] text-[#0071e3]">call</span>
              <span className="text-[#1d1d1f] font-medium">+91 98164 77341</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#0071e3]">mail</span>
              <span className="text-[#1d1d1f] font-medium">Jitender0585@gmail.com</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#d2d2d7] py-6 text-center text-[11px] text-[#86868b]">
        <div className="apple-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} Saumyaa Studies. All rights reserved.</p>
          <p className="text-[#86868b]">Empowering Minds • Himachal Pradesh</p>
        </div>
      </div>
    </footer>
  );
}
