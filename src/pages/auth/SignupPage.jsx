import React from 'react';
import { Link } from 'react-router-dom';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-outline-variant/15 text-center space-y-6">
        <div className="flex justify-center">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/logo.jpg"
              alt="Saumyaa Studies Logo"
              className="w-12 h-12 object-contain rounded-2xl shadow-md group-hover:scale-105 transition-transform bg-white p-0.5"
            />
            <span className="font-headings font-extrabold text-2xl text-secondary tracking-tight">
              Saumyaa Studies
            </span>
          </Link>
        </div>

        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
          <span className="material-symbols-outlined text-3xl">lock_person</span>
        </div>

        <div className="space-y-2">
          <h2 className="font-headings font-extrabold text-xl text-secondary">
            Student Registration Restricted
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Public student self-registration is disabled. Student profiles and login accounts are created exclusively by the <strong>Saumyaa Studies Academic Administration</strong>.
          </p>
        </div>

        <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/15 text-xs text-on-surface-variant space-y-1 text-left">
          <p className="font-headings font-bold text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[16px]">info</span>
            How to get your Student Account?
          </p>
          <p className="text-[11px] leading-relaxed">
            Please contact your Admin or Class Teacher to receive your assigned <strong>Roll Number / Email</strong> and initial <strong>Login Password</strong>.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-white font-headings font-bold py-3 rounded-full text-xs shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Go to Student & Admin Login
          </Link>

          <Link to="/" className="block text-xs font-semibold text-on-surface-variant hover:text-secondary">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
