import React, { useState } from 'react';
import { studentApplicationService } from '../../services/api';

export default function StudentCandidateStatusTracker() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultApp, setResultApp] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setNotFound(false);
    setResultApp(null);

    try {
      const res = await studentApplicationService.getApplications();
      if (res.success && Array.isArray(res.applications)) {
        const q = query.trim().toLowerCase();
        const found = res.applications.find(
          (a) =>
            (a.applicationId && a.applicationId.toLowerCase() === q) ||
            (a.email && a.email.toLowerCase() === q) ||
            (a.contactNumber && a.contactNumber.includes(q))
        );

        if (found) {
          setResultApp(found);
        } else {
          setNotFound(true);
        }
      }
    } catch (err) {
      console.error('Error tracking student application:', err);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold text-xs flex items-center gap-1 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Approved & Enrolled
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 font-extrabold text-xs flex items-center gap-1 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Not Selected
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-extrabold text-xs flex items-center gap-1 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Under Review
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-extrabold text-xs flex items-center gap-1 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Application Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto font-body">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-[28px]">find_in_page</span>
        </div>
        <h2 className="font-headings font-extrabold text-xl text-secondary mb-1">
          Track Your Student Application Status
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-6">
          Enter your Application ID (e.g. <span className="font-mono text-primary font-bold">SAU-STU-2026-1001</span>), Email, or Mobile Number below to check your current admission status.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Application ID, Email, or Mobile"
            className="flex-1 px-4 py-2.5 rounded-2xl border border-outline-variant/30 text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-2xl bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
          >
            {searching ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Track Status</span>
              </>
            )}
          </button>
        </form>

        {notFound && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs font-bold animate-fade-in">
            No application found matching "{query}". Please check your Application ID or Email and try again.
          </div>
        )}

        {resultApp && (
          <div className="bg-surface-container/60 border border-outline-variant/20 rounded-2xl p-6 text-left space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-outline-variant/15 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-primary block">
                  {resultApp.applicationId || resultApp.id}
                </span>
                <h3 className="font-headings font-bold text-base text-secondary">
                  {resultApp.fullName}
                </h3>
              </div>
              <div>{getStatusBadge(resultApp.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-on-surface-variant block text-[11px]">Applying For Class:</span>
                <span className="font-bold text-secondary">{resultApp.targetClass}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px]">Applied Date:</span>
                <span className="font-bold text-secondary">
                  {resultApp.appliedAt ? new Date(resultApp.appliedAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px]">Parent/Guardian:</span>
                <span className="font-bold text-secondary">{resultApp.parentName}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px]">Subjects:</span>
                <span className="font-bold text-secondary">
                  {Array.isArray(resultApp.subjects) ? resultApp.subjects.join(', ') : resultApp.subjects || 'N/A'}
                </span>
              </div>
            </div>

            {resultApp.notes && (
              <div className="pt-3 border-t border-outline-variant/15 text-xs bg-surface-container-lowest p-3 rounded-xl">
                <span className="font-bold text-secondary block mb-1">Admission Team Remarks:</span>
                <p className="text-on-surface-variant leading-relaxed">{resultApp.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
