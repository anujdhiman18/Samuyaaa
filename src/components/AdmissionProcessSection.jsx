import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FLOW_STEPS = [
  {
    step: 1,
    title: 'Application Submitted',
    shortDesc: 'Online submission through portal',
    detail: 'Candidate submits application with academic credentials and contact details. A unique reference tracking ID is instantly generated.',
    icon: 'assignment',
    badge: 'Step 1',
    color: 'from-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    step: 2,
    title: 'Shortlisted',
    shortDesc: 'Initial screening by Admin & Committee',
    detail: 'Admissions & Academic Recruitment committee reviews application prerequisites, previous records, and eligibility parameters.',
    icon: 'fact_check',
    badge: 'Step 2',
    color: 'from-indigo-600 to-violet-600',
    lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    step: 3,
    title: 'Entrance Exam cum Interview',
    shortDesc: 'Day, Date, Time & Venue provided by Admin',
    detail: 'Admin/Management allocates specific day, date, time slot, and venue/mode (physical/online). Candidate attends written exam and personal interview.',
    icon: 'school',
    badge: 'Step 3 • Core Evaluation',
    color: 'from-amber-600 to-orange-600',
    lightBg: 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/30',
    highlight: true,
  },
  {
    step: 4,
    title: 'Final Selection',
    shortDesc: 'Merit compilation & decision',
    detail: 'Evaluation scores, interview feedback, and performance rubrics are compiled by senior faculty & director for final selection.',
    icon: 'verified',
    badge: 'Step 4',
    color: 'from-teal-600 to-emerald-600',
    lightBg: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    step: 5,
    title: 'Admission / Joining',
    shortDesc: 'Formal enrollment & onboarding',
    detail: 'Successful candidates receive official admission confirmation or faculty offer letter, batch schedule, and credential access.',
    icon: 'how_to_reg',
    badge: 'Step 5 • Final Step',
    color: 'from-emerald-600 to-green-600',
    lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export default function AdmissionProcessSection() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'faculty'

  return (
    <section id="admission-process" className="py-16 md:py-24 bg-surface relative overflow-hidden font-body text-on-surface">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-headings font-extrabold uppercase tracking-wider mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            Transparent Evaluation Policy
          </div>
          
          <h2 className="font-headings font-extrabold text-3xl sm:text-4xl lg:text-5xl text-secondary tracking-tight mb-4">
            Admission &amp; Joining Process
          </h2>
          
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            At <strong>Saumyaa Studies</strong>, academic excellence and faculty quality are built on a structured, merit-based selection system. Every applicant undergoes a transparent, multi-stage review.
          </p>
        </div>

        {/* PROMINENT MANDATORY POLICY NOTICE BANNER */}
        <div className="mb-14 max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-rose-500/5 border-2 border-amber-500/40 p-6 sm:p-8 shadow-xl shadow-amber-500/5">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <span className="material-symbols-outlined text-[32px]">gavel</span>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white font-headings font-extrabold text-[11px] uppercase tracking-wider">
                    Important Official Notice
                  </span>
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">verified_user</span>
                    Mandatory Candidate Selection Policy
                  </span>
                </div>

                <blockquote className="text-xs sm:text-sm font-medium text-amber-950/90 leading-relaxed italic border-l-4 border-amber-500 pl-3 my-1">
                  “Students or faculty applying through this website will not be given direct admission or joining. Applicants will first be treated as shortlisted candidates and will therefore be called for an Entrance Exam cum Interview on a particular day, date, and time as provided by the Admin/Management. Final admission or joining will be subject to successful completion of the selection process.”
                </blockquote>

                <p className="text-[11px] text-amber-900/80 flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[15px] text-amber-700">info</span>
                  <span>
                    The Admin/Management will schedule and communicate the exact <strong>Day, Date, Time, and Venue/Mode</strong> for your evaluation round.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5-STAGE STATUS FLOW TIMELINE */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <span className="text-xs font-headings font-extrabold uppercase tracking-widest text-primary">
              Standard 5-Stage Selection Pipeline
            </span>
            <h3 className="font-headings font-bold text-2xl text-secondary mt-1">
              How Your Application Progresses
            </h3>
          </div>

          {/* Desktop & Tablet Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {FLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white ${
                  step.highlight
                    ? 'border-amber-400/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/20'
                    : 'border-outline-variant/20 shadow-md'
                }`}
              >
                {/* Connecting arrow indicator for desktop */}
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-outline-variant/30 items-center justify-center text-on-surface-variant shadow-sm text-xs">
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                    </div>
                    <span className={`text-[10px] font-headings font-extrabold px-2 py-0.5 rounded-full border ${step.lightBg}`}>
                      {step.badge}
                    </span>
                  </div>

                  <h4 className="font-headings font-bold text-sm text-secondary mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-primary mb-2">
                    {step.shortDesc}
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {step.detail}
                  </p>
                </div>

                {step.highlight && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center gap-1 text-[10px] font-bold text-amber-800">
                    <span className="material-symbols-outlined text-[14px] text-amber-600">event</span>
                    <span>Admin Dispatched Schedule</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Flow Indicator Pill */}
          <div className="mt-6 flex items-center justify-center flex-wrap gap-2 text-xs text-on-surface-variant font-medium">
            <span className="font-bold text-secondary">Status Flow:</span>
            <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-[11px]">Application Submitted</span>
            <span>&rarr;</span>
            <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-[11px]">Shortlisted</span>
            <span>&rarr;</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold font-mono text-[11px]">Entrance Exam cum Interview</span>
            <span>&rarr;</span>
            <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-[11px]">Final Selection</span>
            <span>&rarr;</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold font-mono text-[11px]">Admission/Joining</span>
          </div>
        </div>

        {/* DUAL WORKFLOW TABS: STUDENT vs FACULTY */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 sm:p-10 shadow-xl max-w-5xl mx-auto">
          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-surface-container p-1.5 rounded-full border border-outline-variant/20 inline-flex items-center gap-2">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-5 py-2 rounded-full font-headings font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                Student Admission Path
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-5 py-2 rounded-full font-headings font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'faculty'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">work</span>
                Faculty Joining Path
              </button>
            </div>
          </div>

          {/* Student Admission Details */}
          {activeTab === 'student' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-outline-variant/15 pb-4">
                <h4 className="font-headings font-extrabold text-xl text-secondary">
                  Student Admission Evaluation Protocol
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  For prospective students applying for Foundation, Board Booster, Olympiad, and JEE/NEET competitive coaching batches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-[18px]">quiz</span>
                      <span>1. Diagnostic Entrance Assessment</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      A structured written test measuring fundamental conceptual clarity in Mathematics, Science, and logical aptitude according to the target academic stage.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-[18px]">groups</span>
                      <span>2. Student &amp; Parent Counseling Session</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      One-on-one dialogue with the Academic Director to understand the student's learning goals, school syllabus, and personalized coaching schedule.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <span>3. Management Slot Allocation</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Admin issues the exact Day, Date, Time, and Center Venue (Main Center Bagru or Branch Daroh) directly to the applicant's online tracker.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-[18px]">app_registration</span>
                      <span>4. Official Enrollment &amp; Roll Number</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Upon qualifying, the student receives their Admission Number, batch time, study modules, and student portal login credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-on-surface-variant">
                  <span className="font-bold text-secondary">Ready to apply?</span> Fill out the student application form to begin.
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/student-application"
                    className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white font-headings font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    Apply as Student
                  </Link>
                  <Link
                    to="/student-application"
                    className="px-4 py-2.5 rounded-full border border-outline-variant/40 hover:bg-surface-container text-secondary font-headings font-bold text-xs transition-colors"
                  >
                    Track Application
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Joining Details */}
          {activeTab === 'faculty' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-outline-variant/15 pb-4">
                <h4 className="font-headings font-extrabold text-xl text-secondary">
                  Faculty Recruitment &amp; Joining Protocol
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  For subject teachers, senior lecturers, HODs, and competitive exam mentors seeking to join the Saumyaa Studies faculty roster.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                      <span className="material-symbols-outlined text-[18px]">co_present</span>
                      <span>1. Subject Mastery Written Test</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      In-depth assessment of high-school, +1/+2 board, or competitive level syllabus (JEE/NEET) subject expertise and problem-solving pedagogy.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                      <span className="material-symbols-outlined text-[18px]">cast_for_education</span>
                      <span>2. Live Classroom Demonstration (Demo Class)</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      A 20-minute live demonstration lecture before our academic board and student panel to evaluate student engagement and communication clarity.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                      <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
                      <span>3. Director &amp; Board Panel Interview</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Comprehensive discussion on teaching philosophy, curriculum planning, past experience, and alignment with the institute's mission.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                      <span>4. Final Selection &amp; Faculty Onboarding</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Shortlisted candidates who successfully clear all rounds receive the official appointment letter, class assignments, and faculty portal credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-on-surface-variant">
                  <span className="font-bold text-secondary">Passionate about teaching?</span> Submit your faculty joining application.
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/faculty-application"
                    className="px-6 py-2.5 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-white font-headings font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">work</span>
                    Apply for Faculty Position
                  </Link>
                  <Link
                    to="/faculty-application"
                    className="px-4 py-2.5 rounded-full border border-outline-variant/40 hover:bg-surface-container text-secondary font-headings font-bold text-xs transition-colors"
                  >
                    Track Status
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
