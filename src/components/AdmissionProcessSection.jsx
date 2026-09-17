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
    color: 'bg-[#0D47A1]',
    lightBg: 'bg-[#E3F2FD] text-[#0D47A1] border-[#90CAF9]/40',
  },
  {
    step: 2,
    title: 'Shortlisted',
    shortDesc: 'Initial screening by Admin & Committee',
    detail: 'Admissions & Academic Recruitment committee reviews application prerequisites, previous records, and eligibility parameters.',
    icon: 'fact_check',
    badge: 'Step 2',
    color: 'bg-[#1976D2]',
    lightBg: 'bg-[#E3F2FD] text-[#1976D2] border-[#90CAF9]/40',
  },
  {
    step: 3,
    title: 'Interview',
    shortDesc: 'Day, Date, Time & Venue provided by Admin',
    detail: 'Admin/Management allocates specific day, date, time slot, and venue/mode (physical/online). Candidate attends the interview & interaction session.',
    icon: 'school',
    badge: 'Step 3 • Core Evaluation',
    color: 'bg-[#0D47A1]',
    lightBg: 'bg-[#BBDEFB]/40 text-[#0D47A1] border-[#90CAF9]/50 ring-1 ring-[#2196F3]',
    highlight: true,
  },
  {
    step: 4,
    title: 'Final Selection',
    shortDesc: 'Merit compilation & decision',
    detail: 'Evaluation scores, interview feedback, and performance rubrics are compiled by senior faculty & director for final selection.',
    icon: 'verified',
    badge: 'Step 4',
    color: 'bg-[#1976D2]',
    lightBg: 'bg-[#E3F2FD] text-[#1976D2] border-[#90CAF9]/40',
  },
  {
    step: 5,
    title: 'Admission / Joining',
    shortDesc: 'Formal enrollment & onboarding',
    detail: 'Successful candidates receive official admission confirmation or faculty offer letter, batch schedule, and credential access.',
    icon: 'how_to_reg',
    badge: 'Step 5 • Final Step',
    color: 'bg-[#0D47A1]',
    lightBg: 'bg-[#90CAF9]/30 text-[#0D47A1] border-[#90CAF9]/50',
  },
];

export default function AdmissionProcessSection() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'faculty'

  return (
    <section id="admission-process" className="py-16 md:py-24 bg-surface relative overflow-hidden font-body text-[#0D1B2A]">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#0D47A1]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#1976D2]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E3F2FD] text-[#D97706] border border-[#90CAF9]/40 text-xs font-headings font-extrabold uppercase tracking-wider mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#D97706]">account_tree</span>
            Transparent Evaluation Policy
          </div>
          
          <h2 className="font-headings font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#0D47A1] tracking-tight mb-4">
            Admission &amp; <span className="text-[#D97706]">Joining Process</span>
          </h2>
          
          <p className="text-sm sm:text-base text-[#1565C0] leading-relaxed">
            At <strong>Saumyaa Studies</strong>, academic excellence and faculty quality are built on a structured, merit-based selection system. Every applicant undergoes a transparent, multi-stage review.
          </p>
        </div>

        {/* PROMINENT MANDATORY POLICY NOTICE BANNER */}
        <div className="mb-14 max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#90CAF9]/50 p-6 sm:p-8 shadow-premium">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#0D47A1] text-white flex items-center justify-center shrink-0 shadow-premium">
                <span className="material-symbols-outlined text-[32px] text-white">gavel</span>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1976D2] text-white font-headings font-extrabold text-[11px] uppercase tracking-wider">
                    Important Official Notice
                  </span>
                  <span className="text-xs font-bold text-[#0D47A1] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#D97706]">verified_user</span>
                    Mandatory Candidate Selection Policy
                  </span>
                </div>

                <blockquote className="text-xs sm:text-sm font-medium text-[#0D1B2A] leading-relaxed italic border-l-4 border-[#D97706] pl-3 my-1">
                  “Students or faculty applying through this website will not be given direct admission or joining. Applicants will first be treated as shortlisted candidates and will therefore be called for an Interview on a particular day, date, and time as provided by the Admin/Management. Final admission or joining will be subject to successful completion of the selection process.”
                </blockquote>

                <p className="text-[11px] text-[#1565C0] flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[15px] text-[#1976D2]">info</span>
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
            <span className="text-xs font-headings font-extrabold uppercase tracking-widest text-[#D97706]">
              Standard 5-Stage Selection Pipeline
            </span>
            <h3 className="font-headings font-bold text-2xl text-[#0D47A1] mt-1">
              How Your Application <span className="text-[#D97706]">Progresses</span>
            </h3>
          </div>

          {/* Desktop & Tablet Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {FLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-hover bg-white ${
                  step.highlight
                    ? 'border-[#0D47A1]/60 shadow-premium ring-2 ring-[#2196F3]/30'
                    : 'border-[#90CAF9]/30 shadow-premium'
                }`}
              >
                {/* Connecting arrow indicator for desktop */}
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-[#90CAF9]/50 items-center justify-center text-[#1976D2] shadow-xs text-xs">
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${step.color} text-white flex items-center justify-center shadow-premium`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-white">{step.icon}</span>
                    </div>
                    <span className={`text-[10px] font-headings font-extrabold px-2 py-0.5 rounded-full border ${step.lightBg}`}>
                      {step.badge}
                    </span>
                  </div>

                  <h4 className="font-headings font-bold text-sm text-[#0D47A1] mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-[#1976D2] mb-2">
                    {step.shortDesc}
                  </p>
                  <p className="text-[11px] text-[#0D1B2A]/80 leading-relaxed">
                    {step.detail}
                  </p>
                </div>

                {step.highlight && (
                  <div className="mt-3 pt-2.5 border-t border-[#90CAF9]/30 flex items-center gap-1 text-[10px] font-bold text-[#0D47A1]">
                    <span className="material-symbols-outlined text-[14px] text-[#D97706]">event</span>
                    <span>Admin Dispatched Schedule</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Flow Indicator Pill */}
          <div className="mt-6 flex items-center justify-center flex-wrap gap-2 text-xs text-[#1565C0] font-medium">
            <span className="font-bold text-[#0D47A1]">Status Flow:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#E3F2FD] font-mono text-[11px] text-[#0D1B2A]">Application Submitted</span>
            <span className="text-[#1976D2]">&rarr;</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#E3F2FD] font-mono text-[11px] text-[#0D1B2A]">Shortlisted</span>
            <span className="text-[#1976D2]">&rarr;</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#BBDEFB]/50 text-[#0D47A1] font-bold font-mono text-[11px] border border-[#90CAF9]/40">Interview</span>
            <span className="text-[#1976D2]">&rarr;</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#E3F2FD] font-mono text-[11px] text-[#0D1B2A]">Final Selection</span>
            <span className="text-[#1976D2]">&rarr;</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#90CAF9]/30 text-[#0D47A1] font-bold font-mono text-[11px] border border-[#90CAF9]/40">Admission/Joining</span>
          </div>
        </div>

        {/* DUAL WORKFLOW TABS: STUDENT vs FACULTY */}
        <div className="bg-white border border-[#90CAF9]/30 rounded-3xl p-6 sm:p-10 shadow-premium max-w-5xl mx-auto">
          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#E3F2FD] p-1.5 rounded-full border border-[#90CAF9]/40 inline-flex items-center gap-2">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-5 py-2 rounded-full font-headings font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-[#0D47A1] text-white shadow-premium'
                    : 'text-[#1976D2] hover:text-[#0D47A1]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                Student Admission Path
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-5 py-2 rounded-full font-headings font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'faculty'
                    ? 'bg-[#0D47A1] text-white shadow-premium'
                    : 'text-[#1976D2] hover:text-[#0D47A1]'
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
              <div className="border-b border-[#90CAF9]/30 pb-4">
                <h4 className="font-headings font-extrabold text-xl text-[#0D47A1]">
                  Student Admission <span className="text-[#D97706]">Evaluation Protocol</span>
                </h4>
                <p className="text-xs text-[#1565C0] mt-1">
                  For prospective students applying for Foundation, Board Booster, Olympiad, and JEE/NEET competitive coaching batches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">quiz</span>
                      <span>1. Diagnostic Entrance Assessment</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      A structured written test measuring fundamental conceptual clarity in Mathematics, Science, and logical aptitude according to the target academic stage.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">groups</span>
                      <span>2. Student &amp; Parent Counseling Session</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      One-on-one dialogue with the Academic Director to understand the student's learning goals, school syllabus, and personalized coaching schedule.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">schedule</span>
                      <span>3. Management Slot Allocation</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      Admin issues the exact Day, Date, Time, and Center Venue (Main Center Bagru or Branch Daroh) directly to the applicant's online tracker.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">app_registration</span>
                      <span>4. Official Enrollment &amp; Roll Number</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      Upon qualifying, the student receives their Admission Number, batch time, study modules, and student portal login credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#90CAF9]/30 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#1565C0]">
                  <span className="font-bold text-[#0D47A1]">Ready to apply?</span> Fill out the student application form to begin.
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/student-application"
                    className="px-6 py-2.5 rounded-full bg-[#0D47A1] hover:bg-[#1565C0] text-white font-headings font-bold text-xs shadow-premium transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-white">school</span>
                    Apply as Student
                  </Link>
                  <Link
                    to="/student-application"
                    className="px-4 py-2.5 rounded-full border border-[#90CAF9]/60 hover:bg-[#E3F2FD] text-[#1976D2] hover:text-[#0D47A1] font-headings font-bold text-xs transition-colors duration-200"
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
              <div className="border-b border-[#90CAF9]/30 pb-4">
                <h4 className="font-headings font-extrabold text-xl text-[#0D47A1]">
                  Faculty Recruitment &amp; <span className="text-[#D97706]">Joining Protocol</span>
                </h4>
                <p className="text-xs text-[#1565C0] mt-1">
                  For subject teachers, senior lecturers, HODs, and competitive exam mentors seeking to join the Saumyaa Studies faculty roster.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">co_present</span>
                      <span>1. Subject Mastery Written Test</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      In-depth assessment of high-school, +1/+2 board, or competitive level syllabus (JEE/NEET) subject expertise and problem-solving pedagogy.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">cast_for_education</span>
                      <span>2. Live Classroom Demonstration (Demo Class)</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      A 20-minute live demonstration lecture before our academic board and student panel to evaluate student engagement and communication clarity.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">record_voice_over</span>
                      <span>3. Director &amp; Board Panel Interview</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      Comprehensive discussion on teaching philosophy, curriculum planning, past experience, and alignment with the institute's mission.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#E3F2FD]/50 border border-[#90CAF9]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0D47A1] font-bold">
                      <span className="material-symbols-outlined text-[18px] text-[#D97706]">badge</span>
                      <span>4. Final Selection &amp; Faculty Onboarding</span>
                    </div>
                    <p className="text-[#0D1B2A]/80 leading-relaxed">
                      Shortlisted candidates who successfully clear all rounds receive the official appointment letter, class assignments, and faculty portal credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#90CAF9]/30 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#1565C0]">
                  <span className="font-bold text-[#0D47A1]">Passionate about teaching?</span> Submit your faculty joining application.
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/faculty-application"
                    className="px-6 py-2.5 rounded-full bg-[#0D47A1] hover:bg-[#1565C0] text-white font-headings font-bold text-xs shadow-premium transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-white">work</span>
                    Apply for Faculty Position
                  </Link>
                  <Link
                    to="/faculty-application"
                    className="px-4 py-2.5 rounded-full border border-[#90CAF9]/60 hover:bg-[#E3F2FD] text-[#1976D2] hover:text-[#0D47A1] font-headings font-bold text-xs transition-colors duration-200"
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
