import React, { useState } from 'react';
import { facultyApplicationService } from '../../services/api';

export default function CandidateStatusTracker({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultApp, setResultApp] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearched(true);
    setResultApp(null);

    try {
      const res = await facultyApplicationService.getApplications();
      if (res && res.applications) {
        const query = searchQuery.trim().toLowerCase();
        const found = res.applications.find(
          (a) =>
            (a.applicationId && a.applicationId.toLowerCase() === query) ||
            (a._id && String(a._id).toLowerCase() === query) ||
            (a.id && String(a.id).toLowerCase() === query) ||
            (a.email && a.email.toLowerCase() === query)
        );
        setResultApp(found || null);
      }
    } catch (err) {
      console.error('Error tracking application:', err);
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Selected':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'Shortlisted':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'Shortlisted':
        return '🎉 Congratulations! Your application has been Shortlisted. Our recruitment team will contact you shortly regarding the next round of interview / demo class.';
      case 'Approved':
      case 'Selected':
        return '🌟 Congratulations! Your application has been Approved & Selected. Welcome to the Saumyaa Studies faculty team! Check your email for onboarding details.';
      case 'Rejected':
        return 'Thank you for your interest in joining Saumyaa Studies. After review, we are unable to proceed with your application at this time. We wish you success in your future endeavors.';
      case 'Under Review':
        return '⏳ Your application is currently under active review by our academic head and evaluation committee.';
      default:
        return '📋 Your application has been received and is pending initial screening.';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant/15 shadow-xl max-w-xl mx-auto font-body text-xs text-on-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">manage_search</span>
          </div>
          <div>
            <h3 className="font-headings font-extrabold text-base text-secondary">Track Application Status</h3>
            <p className="text-[11px] text-on-surface-variant">Check your faculty recruitment application progress & notifications</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="space-y-3">
        <label className="font-headings font-bold text-secondary block text-xs">
          Enter Application Ref ID or Registered Email:
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. SAU-FAC-2026-8784 or candidate@gmail.com"
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-headings font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {searching ? (
              <span>Checking...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">search</span>
                Check Status
              </>
            )}
          </button>
        </div>
      </form>

      {/* Result View */}
      {searched && (
        <div className="mt-6 pt-5 border-t border-outline-variant/15">
          {resultApp ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-headings font-extrabold text-sm text-secondary">{resultApp.fullName}</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Ref ID: <span className="font-mono font-bold text-primary">{resultApp.applicationId || resultApp.id}</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant">Role: {resultApp.positionApplied}</p>
                </div>

                <div className="text-right">
                  <span className={`px-3.5 py-1 rounded-full text-xs font-headings font-bold border inline-block ${getStatusBadge(resultApp.status)}`}>
                    Status: {resultApp.status}
                  </span>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Applied: {new Date(resultApp.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Dynamic Status Banner */}
              <div className={`p-4 rounded-2xl border ${getStatusBadge(resultApp.status)} leading-relaxed text-xs font-medium`}>
                {getStatusMessage(resultApp.status)}
              </div>

              {/* Notification History Log */}
              {resultApp.notificationHistory && resultApp.notificationHistory.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="font-headings font-bold text-secondary text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">notifications</span>
                    Status Notifications Delivered
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {resultApp.notificationHistory.map((log, i) => (
                      <div key={i} className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/15 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-headings font-bold text-secondary text-xs">Status set to: {log.status}</p>
                          {log.notes && <p className="text-on-surface-variant italic mt-0.5 text-[11px]">"{log.notes}"</p>}
                          <p className="text-[10px] text-on-surface-variant/80 mt-1">Notified to: {log.sentTo || resultApp.email}</p>
                        </div>
                        <span className="text-[10px] text-on-surface-variant shrink-0">
                          {new Date(log.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-on-surface-variant space-y-1">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">sentiment_dissatisfied</span>
              <p className="font-headings font-bold text-secondary">No Application Found</p>
              <p className="text-[11px]">We could not find an application matching "<strong>{searchQuery}</strong>". Please check your Ref ID or Email and try again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
