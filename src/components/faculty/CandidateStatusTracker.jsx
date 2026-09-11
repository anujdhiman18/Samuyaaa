import React, { useState } from 'react';
import { facultyApplicationService } from '../../services/api';

const FACULTY_STAGES = [
  { id: 'submitted', label: 'Application Submitted', icon: 'assignment' },
  { id: 'shortlisted', label: 'Shortlisted', icon: 'fact_check' },
  { id: 'exam_interview', label: 'Exam / Demo cum Interview', icon: 'co_present' },
  { id: 'final_selection', label: 'Final Selection', icon: 'verified' },
  { id: 'onboarded', label: 'Admission / Joining', icon: 'how_to_reg' },
];

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

  const getActiveStageIndex = (status) => {
    switch (status) {
      case 'Approved':
      case 'Selected':
        return 4; // Step 5
      case 'Final Selection':
        return 3; // Step 4
      case 'Entrance Exam cum Interview':
      case 'Exam Scheduled':
        return 2; // Step 3
      case 'Shortlisted':
        return 1; // Step 2
      case 'Under Review':
        return 1; // Step 2
      case 'Pending':
      default:
        return 0; // Step 1
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Selected':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'Final Selection':
        return 'bg-teal-500/10 text-teal-700 border-teal-500/20';
      case 'Entrance Exam cum Interview':
        return 'bg-amber-500/15 text-amber-900 border-amber-500/30';
      case 'Shortlisted':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20';
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
        return '🎉 Congratulations! Your application has been Shortlisted. The Admin/Management is scheduling your Entrance Exam cum Interview slot.';
      case 'Entrance Exam cum Interview':
        return '📅 Your Entrance Exam / Demo Lecture cum Interview has been scheduled by Admin/Management! Please review the allocated date, time, and venue below.';
      case 'Final Selection':
        return '🌟 You have cleared the evaluation rounds! Your dossier is in Final Selection review with the Board of Directors.';
      case 'Approved':
      case 'Selected':
        return '🌟 Congratulations! Your application has been Approved & Selected. Welcome to the Saumyaa Studies faculty team! Check your email for onboarding details.';
      case 'Rejected':
        return 'Thank you for your interest in joining Saumyaa Studies. After review, we are unable to proceed with your application at this time. We wish you success in your future endeavors.';
      case 'Under Review':
        return '⏳ Your application is currently under initial screening by our academic head and evaluation committee.';
      default:
        return '📋 Your application has been received and is pending initial screening.';
    }
  };

  const schedule = resultApp?.examInterviewSchedule;
  const isRejected = resultApp?.status === 'Rejected';
  const activeStepIdx = getActiveStageIndex(resultApp?.status);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant/15 shadow-xl max-w-2xl mx-auto font-body text-xs text-on-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">manage_search</span>
          </div>
          <div>
            <h3 className="font-headings font-extrabold text-base text-secondary">Track Faculty Application Status</h3>
            <p className="text-[11px] text-on-surface-variant">Check your faculty recruitment progress, interview schedule &amp; notifications</p>
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
              {/* Applicant Summary */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  {resultApp.photoUrl || resultApp.photo ? (
                    <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md bg-white shrink-0">
                      <img
                        src={resultApp.photoUrl || resultApp.photo}
                        alt={resultApp.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-headings font-extrabold text-lg shrink-0">
                      {resultApp.fullName ? resultApp.fullName.charAt(0).toUpperCase() : 'F'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-headings font-extrabold text-base text-secondary">{resultApp.fullName}</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Ref ID: <span className="font-mono font-bold text-primary">{resultApp.applicationId || resultApp.id}</span>
                    </p>
                    <p className="text-[11px] text-on-surface-variant">Position: <strong>{resultApp.positionApplied}</strong></p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className={`px-3.5 py-1 rounded-full text-xs font-headings font-bold border inline-block ${getStatusBadge(resultApp.status)}`}>
                    Status: {resultApp.status}
                  </span>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Applied: {new Date(resultApp.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Policy Notice Reminder */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-[11px] text-amber-950 font-medium flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-700 text-sm mt-0.5 shrink-0">gavel</span>
                <p>
                  <strong>Recruitment Policy:</strong> Submitting an application does not guarantee joining. Shortlisted candidates must complete the Entrance Assessment and Live Demonstration cum Interview.
                </p>
              </div>

              {/* 5-STAGE PROGRESS FLOW */}
              {!isRejected && (
                <div className="py-2 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15">
                  <h5 className="text-[10px] font-headings font-extrabold uppercase tracking-wider text-secondary mb-3 text-center">
                    Faculty Recruitment Pipeline
                  </h5>
                  <div className="grid grid-cols-5 gap-1">
                    {FACULTY_STAGES.map((stg, i) => {
                      const isCompleted = activeStepIdx > i;
                      const isCurrent = activeStepIdx === i;
                      return (
                        <div key={stg.id} className="flex flex-col items-center text-center">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400 scale-105'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-surface-container-high text-on-surface-variant/50'
                            }`}
                          >
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">{stg.icon}</span>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-headings font-bold mt-1 leading-tight line-clamp-2 ${
                              isCurrent ? 'text-amber-800' : isCompleted ? 'text-emerald-700' : 'text-on-surface-variant/60'
                            }`}
                          >
                            {stg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCHEDULED INTERVIEW & DEMO SLIP */}
              {schedule && (schedule.date || schedule.day || schedule.time) && (
                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-lg">event</span>
                      <h5 className="font-headings font-bold text-xs text-secondary">
                        Entrance Exam / Demo Class cum Interview Schedule
                      </h5>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-headings font-bold text-[9px] uppercase">
                      Confirmed
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {(resultApp.photoUrl || resultApp.photo) && (
                      <div className="p-1.5 bg-white rounded-xl border border-amber-500/30 text-center shrink-0 self-center sm:self-start">
                        <div className="w-20 h-26 rounded-lg overflow-hidden border border-outline-variant/30">
                          <img
                            src={resultApp.photoUrl || resultApp.photo}
                            alt="Candidate"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="block text-[8px] font-headings font-extrabold text-secondary uppercase tracking-wider mt-0.5">
                          Interview Slip
                        </span>
                      </div>
                    )}

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs w-full">
                      <div className="p-2.5 bg-white rounded-xl border border-amber-500/20">
                        <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Day</span>
                        <span className="font-headings font-bold text-secondary">{schedule.day || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-amber-500/20">
                        <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Date</span>
                        <span className="font-headings font-bold text-secondary">{schedule.date || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-amber-500/20">
                        <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Time Slot</span>
                        <span className="font-headings font-bold text-secondary">{schedule.time || '10:00 AM'}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-amber-500/20">
                        <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Venue / Mode</span>
                        <span className="font-headings font-bold text-primary truncate">{schedule.venueMode || 'Main Center (Bagru)'}</span>
                      </div>
                    </div>
                  </div>

                  {schedule.instructions && (
                    <div className="p-2.5 bg-white/80 rounded-xl border border-amber-500/20 text-[11px]">
                      <span className="font-bold text-secondary block mb-0.5">Demo Topic / Instructions:</span>
                      <p className="text-on-surface-variant leading-relaxed">{schedule.instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Status Banner */}
              <div className={`p-3.5 rounded-2xl border ${getStatusBadge(resultApp.status)} leading-relaxed text-xs font-medium`}>
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
