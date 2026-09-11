import React, { useState } from 'react';
import { studentApplicationService } from '../../services/api';
import { formatClassLabel } from '../../config/classConfig';

const STAGES = [
  { id: 'submitted', label: 'Application Submitted', icon: 'assignment' },
  { id: 'shortlisted', label: 'Shortlisted', icon: 'fact_check' },
  { id: 'exam_interview', label: 'Entrance Exam cum Interview', icon: 'school' },
  { id: 'final_selection', label: 'Final Selection', icon: 'verified' },
  { id: 'enrolled', label: 'Admission / Joining', icon: 'how_to_reg' },
];

export default function StudentCandidateStatusTracker({ onEditApplication }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultApp, setResultApp] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const formatDateFormatted = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

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

  const getActiveStageIndex = (status) => {
    switch (status) {
      case 'Approved':
      case 'Enrolled':
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
      case 'Enrolled':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-extrabold text-xs flex items-center gap-1 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            🟢 Admission Confirmed &amp; Enrolled
          </span>
        );
      case 'Final Selection':
        return (
          <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 font-extrabold text-xs flex items-center gap-1 border border-teal-500/20">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            🔵 Final Selection Review
          </span>
        );
      case 'Entrance Exam cum Interview':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 font-extrabold text-xs flex items-center gap-1 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            🟠 Exam cum Interview Scheduled
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 font-extrabold text-xs flex items-center gap-1 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            🟣 Candidate Shortlisted
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 font-extrabold text-xs flex items-center gap-1 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            🔴 Not Selected / Rejected
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 font-extrabold text-xs flex items-center gap-1 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            🟡 Under Review
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 font-extrabold text-xs flex items-center gap-1 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            🔵 Application Submitted (Pending Screening)
          </span>
        );
    }
  };

  const schedule = resultApp?.examInterviewSchedule;
  const isRejected = resultApp?.status === 'Rejected';
  const activeStepIdx = getActiveStageIndex(resultApp?.status);

  return (
    <div className="max-w-3xl mx-auto font-body">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-[28px]">find_in_page</span>
        </div>
        <h2 className="font-headings font-extrabold text-xl sm:text-2xl text-secondary mb-1">
          Track Your Student Application Status
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-6 leading-relaxed">
          Enter your Application ID (e.g. <span className="font-mono text-primary font-bold">SAU-STU-2026-1001</span>), Email, or Contact Number to view your real-time evaluation stage and entrance schedule.
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
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs font-bold animate-fade-in text-left">
            No application found matching "{query}". Please check your Application ID or Email and try again.
          </div>
        )}

        {resultApp && (
          <div className="bg-surface-container/60 border border-outline-variant/20 rounded-3xl p-6 sm:p-8 text-left space-y-6 animate-fade-in mt-4">
            {/* Header with Applicant & Badge */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-outline-variant/15 pb-4">
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
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-headings font-extrabold text-lg shrink-0">
                    {resultApp.fullName ? resultApp.fullName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div>
                  <span className="font-mono text-xs font-bold text-primary block">
                    {resultApp.applicationId || resultApp.id}
                  </span>
                  <h3 className="font-headings font-extrabold text-lg sm:text-xl text-secondary">
                    {resultApp.fullName}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {resultApp.email} &bull; {resultApp.contactNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(resultApp.status)}
              </div>
            </div>

            {/* MANDATORY NOTICE REMINDER BANNER */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5 shrink-0">gavel</span>
              <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                <strong>Selection Policy:</strong> Submitting an application does not guarantee admission. Applicants are initially treated as shortlisted candidates and are evaluated through the Entrance Exam cum Interview scheduled by Admin/Management.
              </p>
            </div>

            {/* 5-STAGE STATUS FLOW PROGRESS BAR */}
            {!isRejected && (
              <div className="py-2">
                <h4 className="text-[11px] font-headings font-extrabold uppercase tracking-wider text-secondary mb-3">
                  Selection Progress Flow
                </h4>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {STAGES.map((stg, i) => {
                    const isCompleted = activeStepIdx > i;
                    const isCurrent = activeStepIdx === i;
                    return (
                      <div key={stg.id} className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-amber-500 text-white shadow-lg ring-4 ring-amber-500/20 scale-105'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-surface-container-high text-on-surface-variant/50'
                          }`}
                        >
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">check</span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">{stg.icon}</span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] font-headings font-bold mt-1.5 leading-tight line-clamp-2 ${
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

            {/* SCHEDULED ENTRANCE EXAM CUM INTERVIEW ADMIT CARD / SLIP */}
            {schedule && (schedule.date || schedule.day || schedule.time) && (
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">event</span>
                    </div>
                    <div>
                      <h4 className="font-headings font-extrabold text-sm text-secondary">
                        Entrance Exam cum Interview Admit Details
                      </h4>
                      <p className="text-[10px] text-amber-800 font-medium">Official slot allocated by Admin/Management</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-headings font-bold text-[10px] uppercase tracking-wider">
                    Scheduled
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {(resultApp.photoUrl || resultApp.photo) && (
                    <div className="p-2 bg-white rounded-xl border border-amber-500/30 text-center shrink-0 self-center md:self-start">
                      <div className="w-24 h-32 rounded-lg overflow-hidden border border-outline-variant/30">
                        <img
                          src={resultApp.photoUrl || resultApp.photo}
                          alt="Admit Photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="block text-[8px] font-headings font-extrabold text-secondary uppercase tracking-wider mt-1">
                        Admit Card Photo
                      </span>
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs w-full">
                    <div className="p-3 bg-white rounded-xl border border-amber-500/20">
                      <span className="text-on-surface-variant text-[10px] block font-semibold uppercase tracking-wider">Day</span>
                      <span className="font-headings font-bold text-sm text-secondary">{schedule.day || 'To Be Announced'}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-500/20">
                      <span className="text-on-surface-variant text-[10px] block font-semibold uppercase tracking-wider">Date</span>
                      <span className="font-headings font-bold text-sm text-secondary">{schedule.date || 'To Be Announced'}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-500/20">
                      <span className="text-on-surface-variant text-[10px] block font-semibold uppercase tracking-wider">Time Slot</span>
                      <span className="font-headings font-bold text-sm text-secondary">{schedule.time || '10:00 AM'}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-500/20">
                      <span className="text-on-surface-variant text-[10px] block font-semibold uppercase tracking-wider">Venue / Mode</span>
                      <span className="font-headings font-bold text-sm text-primary">{schedule.venueMode || resultApp.branch || 'Main Center (Bagru)'}</span>
                    </div>
                  </div>
                </div>

                {schedule.instructions && (
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-500/20 text-xs">
                    <span className="font-bold text-secondary block mb-0.5">Instructions &amp; Requirements:</span>
                    <p className="text-on-surface-variant leading-relaxed text-[11px]">{schedule.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Approved 30-Day Lock Banner */}
            {resultApp.status === 'Approved' && (resultApp.approvedAt || resultApp.updatedAt) && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm text-emerald-700">lock</span>
                  <span>🔒 30-Day Application Lock Active</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  This request was approved on <strong>{formatDateFormatted(resultApp.approvedAt || resultApp.updatedAt)}</strong>. You can make another request after <strong>{formatDateFormatted(resultApp.nextEligibleDate || new Date(new Date(resultApp.approvedAt || resultApp.updatedAt).getTime() + 30 * 24 * 60 * 60 * 1000))}</strong>.
                </p>
              </div>
            )}

            {/* Pending Modifiable Banner & Action */}
            {(resultApp.status === 'Pending' || resultApp.status === 'Under Review') && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-900 text-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="space-y-0.5">
                  <span className="font-bold block">Application is Under Screening</span>
                  <p className="text-[11px] text-blue-800">
                    You can edit and correct your application details anytime before final Admin approval.
                  </p>
                </div>
                {onEditApplication && (
                  <button
                    onClick={() => onEditApplication(resultApp)}
                    className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm"
                  >
                    Edit Application
                  </button>
                )}
              </div>
            )}

            {/* Rejected Resubmission Banner & Action */}
            {resultApp.status === 'Rejected' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-900 text-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="space-y-0.5">
                  <span className="font-bold block">Application Not Approved</span>
                  <p className="text-[11px] text-rose-800">
                    Your application was not approved. You can edit and resubmit your application immediately with NO 30-day restriction.
                  </p>
                </div>
                {onEditApplication && (
                  <button
                    onClick={() => onEditApplication(resultApp)}
                    className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm"
                  >
                    Edit &amp; Resubmit
                  </button>
                )}
              </div>
            )}

            {/* Application Overview Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15">
              <div>
                <span className="text-on-surface-variant block text-[11px]">Applying For Class:</span>
                <span className="font-bold text-secondary">{formatClassLabel(resultApp.targetClass)}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px]">Preferred Center:</span>
                <span className="font-bold text-secondary">
                  {resultApp.branch?.includes('Daroh') || resultApp.branch === 'Branch (Daroh)' ? 'Branch (Daroh)' : 'Main Center (Bagru)'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px]">Applied Date:</span>
                <span className="font-bold text-secondary">
                  {resultApp.appliedAt ? new Date(resultApp.appliedAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px]">Parent / Guardian:</span>
                <span className="font-bold text-secondary">{resultApp.parentName} ({resultApp.parentContact})</span>
              </div>
              <div className="col-span-2">
                <span className="text-on-surface-variant block text-[11px]">Subjects of Interest:</span>
                <span className="font-bold text-secondary">
                  {Array.isArray(resultApp.subjects) ? resultApp.subjects.join(', ') : resultApp.subjects || 'N/A'}
                </span>
              </div>
            </div>

            {resultApp.notes && (
              <div className="text-xs bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/15">
                <span className="font-bold text-secondary block mb-1">Admissions Team Remarks:</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">{resultApp.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
