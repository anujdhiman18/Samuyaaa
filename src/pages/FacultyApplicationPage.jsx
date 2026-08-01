import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FacultyApplicationForm from '../components/faculty/FacultyApplicationForm';

export default function FacultyApplicationPage() {
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

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-headings font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Website
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
      <main className="flex-1 py-6">
        <FacultyApplicationForm centerName="Saumyaa Studies" />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
