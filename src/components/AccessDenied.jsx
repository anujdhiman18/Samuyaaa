import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AccessDenied({ requiredPermission = '', requiredRole = '' }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-surface-container-low p-6 font-body text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-premium border border-outline-variant/15 space-y-5 relative overflow-hidden">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[36px]">gpp_bad</span>
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-headings font-bold text-[10px] uppercase tracking-wider border border-rose-200">
            HTTP 403 &bull; Unauthorized Access
          </span>
          <h2 className="font-headings font-extrabold text-2xl text-secondary mt-3">
            Access Denied
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
            You do not have the required permissions or elevated role access to view this page.
          </p>
        </div>

        {(requiredPermission || requiredRole) && (
          <div className="p-3.5 bg-surface-container-low border border-outline-variant/15 rounded-2xl text-left text-xs font-mono space-y-1">
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
              Security Restriction Details:
            </div>
            {requiredPermission && (
              <div className="text-rose-700 flex justify-between items-center">
                <span>Required Permission:</span>
                <span className="font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{requiredPermission}</span>
              </div>
            )}
            {requiredRole && (
              <div className="text-secondary flex justify-between items-center">
                <span>Required Role:</span>
                <span className="font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">{requiredRole}</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-headings font-bold text-secondary hover:bg-surface-container transition-all cursor-pointer shadow-sm"
          >
            ← Go Back
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-all shadow-premium inline-flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Dashboard Home
          </Link>
        </div>
      </div>
    </div>
  );
}
