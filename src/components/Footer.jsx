import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleNewsletter(event) {
    event.preventDefault();
    setMessage('Adding to mailing list...');
    setTimeout(() => {
      setMessage('✓ Successfully joined Saumyaa Newsletter!');
      setEmail('');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  }

  return (
    <footer className="bg-surface-container-lowest border-t border-surface-container-high">
      <div className="max-w-container-max mx-auto px-gutter py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 flex flex-col justify-start">
          <a href="#" className="flex items-center gap-2 mb-4">
            <img
              src="/logo.jpg"
              alt="Saumyaa Studies Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-sm bg-white p-0.5"
            />
            <span className="font-headings font-extrabold text-lg text-secondary">Saumyaa Studies</span>
          </a>
          <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-medium">
            Nurturing grade-level academic achievements and competitive success through custom-planned logic
            blueprints and dedicated cognitive instruction since 2010.
          </p>

          <div className="space-y-2">
            <h5 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider">
              Academic Newsletter
            </h5>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter parent email"
                className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs w-full focus:outline-none focus:border-secondary"
              />
              <button
                type="submit"
                className="bg-secondary text-white px-3 py-2 rounded-lg font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant transition-colors"
              >
                Join
              </button>
            </form>
            {message && <p className="text-[10px] text-primary font-semibold">{message}</p>}
          </div>
        </div>

        <div>
          <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider mb-4">
            Quick Navigation
          </h4>
          <ul className="space-y-3 text-xs text-on-surface-variant font-medium">
            {[
              { href: '#', label: 'Home Overview' },
              { href: '#about', label: 'About Founder' },
              { href: '#courses', label: 'Academic Courses' },
              { href: '#results', label: 'Wall of Excellence' },
              { href: '#testimonials', label: 'Testimonials' },
              { href: '#contact', label: 'Contact Us' },
            ].map((link) => (
              <li key={link.label}>
                <a className="hover:text-primary transition-colors hover:underline decoration-primary/20" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/apply" className="text-primary font-bold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">work</span>
                Careers / Faculty Application
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider mb-4">
            Academic Centers
          </h4>
          <div className="space-y-3 text-xs text-on-surface-variant font-medium">
            <div>
              <p className="font-bold text-secondary text-[11px] mb-0.5">Bagru (Main Branch)</p>
              <p className="flex items-start gap-1.5 leading-relaxed">
                <span className="material-symbols-outlined text-[14px] text-primary mt-0.5 shrink-0">location_on</span>
                <span>Saumyaa Studies, Bagru Garh, Jamula, Palaid, HP 176093</span>
              </p>
            </div>
            <div>
              <p className="font-bold text-secondary text-[11px] mb-0.5">Daroh (Branch 2)</p>
              <p className="flex items-start gap-1.5 leading-relaxed">
                <span className="material-symbols-outlined text-[14px] text-emerald-600 mt-0.5 shrink-0">location_on</span>
                <span>Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092</span>
              </p>
            </div>
            <p className="flex items-center gap-2 pt-1 border-t border-surface-container-high/60">
              <span className="material-symbols-outlined text-[14px] text-primary">call</span>
              <span>+91 98164 77341</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-primary">mail</span>
              <span>Jitender0585@gmail.com</span>
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider mb-4">
            Follow Student Updates
          </h4>
          <p className="text-xs text-on-surface-variant font-medium mb-4 leading-relaxed">
            Follow our social channels for standard revision blueprints, syllabus notifications, and student
            toppers highlights.
          </p>
          <div className="flex gap-3">
            {['groups', 'video_library', 'map', 'admin_panel_settings'].map((icon) => (
              <a
                key={icon}
                className="w-9 h-9 bg-surface-container-low border border-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant hover:bg-secondary hover:text-white hover:-translate-y-1 transition-all"
                href="#"
                aria-label={icon}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-surface-container-high py-6 text-center bg-surface-container-low">
        <p className="text-[11px] text-on-surface-variant opacity-75 font-medium">
          &copy; 2026 Saumyaa Studies. All rights reserved. &bull; Designed for Approaching Excellence. Degined By
          Anuj Dhiman
        </p>
      </div>
    </footer>
  );
}
