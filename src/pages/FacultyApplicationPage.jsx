import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FacultyApplicationForm from '../components/faculty/FacultyApplicationForm';
import CandidateStatusTracker from '../components/faculty/CandidateStatusTracker';

export default function FacultyApplicationPage() {
  const [activeView, setActiveView] = useState('apply'); // 'apply' | 'track'

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/15 px-gutter py-3">
        <div className="max-w-container-max mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.jpg"
              alt="Saumyaa Studies Logo"
              className="w-9 h-9 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform bg-white p-0.5"
            />
            <span className="font-headings font-extrabold text-lg text-secondary tracking-tight">
              Saumyaa Studies
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher */}
            <div className="bg-surface-container p-1 rounded-full border border-outline-variant/20 flex items-center gap-1">
              <button
                onClick={() => setActiveView('apply')}
                className={`px-3 py-1 rounded-full text-xs font-headings font-bold transition-all cursor-pointer ${
                  activeView === 'apply'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                Apply Now
              </button>
              <button
                onClick={() => setActiveView('track')}
                className={`px-3 py-1 rounded-full text-xs font-headings font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'track'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">track_changes</span>
                Track Status
              </button>
            </div>

            <Link
              to="/"
              className="text-xs font-headings font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 hidden md:flex"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </Link>
            <Link
              to="/admin/login"
              className="bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-headings font-bold px-3.5 py-1.5 rounded-full transition-colors hidden sm:inline-block"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-gutter">
        {activeView === 'apply' ? (
          <FacultyApplicationForm centerName="Saumyaa Studies" />
        ) : (
          <div className="py-6">
            <CandidateStatusTracker />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

