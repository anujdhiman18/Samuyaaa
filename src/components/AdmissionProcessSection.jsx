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
  },
  {
    step: 2,
    title: 'Shortlisted',
    shortDesc: 'Initial screening by Admin & Committee',
    detail: 'Admissions & Academic Recruitment committee reviews application prerequisites, previous records, and eligibility parameters.',
    icon: 'fact_check',
    badge: 'Step 2',
  },
  {
    step: 3,
    title: 'Interview',
    shortDesc: 'Day, Date, Time & Venue provided by Admin',
    detail: 'Admin/Management allocates specific day, date, time slot, and venue/mode (physical/online). Candidate attends the interview & interaction session.',
    icon: 'school',
    badge: 'Step 3 • Core Evaluation',
    highlight: true,
  },
  {
    step: 4,
    title: 'Final Selection',
    shortDesc: 'Merit compilation & decision',
    detail: 'Evaluation scores, interview feedback, and performance rubrics are compiled by senior faculty & director for final selection.',
    icon: 'verified',
    badge: 'Step 4',
  },
  {
    step: 5,
    title: 'Admission / Joining',
    shortDesc: 'Formal enrollment & onboarding',
    detail: 'Successful candidates receive official admission confirmation or faculty offer letter, batch schedule, and credential access.',
    icon: 'how_to_reg',
    badge: 'Step 5 • Final Step',
  },
];

export default function AdmissionProcessSection() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'faculty'

  return (
    <section id="admission-process" className="apple-section-white">
      <div className="apple-container">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#6e6e73] font-semibold text-xs tracking-wider uppercase mb-2 block">
            Transparent Evaluation Policy
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#1d1d1f] mb-4">
            Admission &amp; Joining Process
          </h2>
          
          <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
            At <strong>Saumyaa Studies</strong>, academic excellence and faculty quality are built on a structured, merit-based selection system. Every applicant undergoes a transparent, multi-stage review.
          </p>
        </div>

        {/* Mandatory Policy Notice Card: #f5f5f7 on white section */}
        <div className="mb-16 max-w-4xl mx-auto">
          <div className="apple-card-alt p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1d1d1f] text-[11px] font-semibold border border-[#d2d2d7]">
                    Official Policy
                  </span>
                  <span className="text-xs font-medium text-[#6e6e73]">
                    Mandatory Candidate Selection Policy
                  </span>
                </div>

                <blockquote className="text-xs sm:text-sm text-[#1d1d1f] leading-relaxed border-l-2 border-[#0071e3] pl-3 my-2">
                  “Students or faculty applying through this website will not be given direct admission or joining. Applicants will first be treated as shortlisted candidates and will therefore be called for an Interview on a particular day, date, and time as provided by the Admin/Management. Final admission or joining will be subject to successful completion of the selection process.”
                </blockquote>

                <p className="text-xs text-[#6e6e73] flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3]">info</span>
                  <span>
                    The Admin/Management schedules and communicates the exact <strong>Day, Date, Time, and Venue/Mode</strong> for your evaluation round.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Stage Status Flow Timeline */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6e6e73]">
              Standard 5-Stage Selection Pipeline
            </span>
            <h3 className="text-2xl sm:text-3xl text-[#1d1d1f] mt-1">
              How Your Application Progresses
            </h3>
          </div>

          {/* Timeline Grid: #f5f5f7 cards on white section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {FLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className={`apple-card-alt p-5 flex flex-col justify-between ${
                  step.highlight ? 'ring-2 ring-[#0071e3]/40' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white text-[#0071e3] flex items-center justify-center border border-[#d2d2d7]">
                      <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#6e6e73] border border-[#d2d2d7]">
                      {step.badge}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-[#1d1d1f] mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] font-medium text-[#6e6e73] mb-2">
                    {step.shortDesc}
                  </p>
                  <p className="text-[11px] text-[#86868b] leading-relaxed">
                    {step.detail}
                  </p>
                </div>

                {step.highlight && (
                  <div className="mt-4 pt-2.5 border-t border-[#d2d2d7]/50 flex items-center gap-1 text-[10px] font-medium text-[#0071e3]">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    <span>Admin Dispatched Schedule</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Status Flow Breadcrumb */}
          <div className="mt-8 flex items-center justify-center flex-wrap gap-2 text-xs text-[#6e6e73]">
            <span className="font-semibold text-[#1d1d1f]">Status Flow:</span>
            <span className="px-3 py-1 rounded-full bg-[#f5f5f7] text-[11px]">Submitted</span>
            <span className="text-[#86868b]">&rarr;</span>
            <span className="px-3 py-1 rounded-full bg-[#f5f5f7] text-[11px]">Shortlisted</span>
            <span className="text-[#86868b]">&rarr;</span>
            <span className="px-3 py-1 rounded-full bg-[#0071e3] text-white font-medium text-[11px]">Interview</span>
            <span className="text-[#86868b]">&rarr;</span>
            <span className="px-3 py-1 rounded-full bg-[#f5f5f7] text-[11px]">Final Selection</span>
            <span className="text-[#86868b]">&rarr;</span>
            <span className="px-3 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-semibold text-[11px] border border-[#d2d2d7]">Admission</span>
          </div>
        </div>

        {/* Dual Workflow Card: #f5f5f7 on white section */}
        <div className="apple-card-alt p-6 sm:p-10 max-w-4xl mx-auto">
          {/* Segmented Control Pill */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-full border border-[#d2d2d7] inline-flex items-center gap-1 shadow-xs">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'student'
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                Student Admission Path
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'faculty'
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">work</span>
                Faculty Joining Path
              </button>
            </div>
          </div>

          {/* Student Admission Details */}
          {activeTab === 'student' && (
            <div className="space-y-6">
              <div className="border-b border-[#d2d2d7] pb-4">
                <h4 className="text-xl text-[#1d1d1f]">
                  Student Admission Protocol
                </h4>
                <p className="text-xs text-[#6e6e73] mt-1">
                  For prospective students applying for Foundation, Board Booster, Olympiad, and JEE/NEET competitive coaching batches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">quiz</span>
                    <span>1. Diagnostic Entrance Assessment</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    A structured written test measuring fundamental conceptual clarity in Mathematics, Science, and logical aptitude according to the target academic stage.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">groups</span>
                    <span>2. Student &amp; Parent Counseling Session</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    One-on-one dialogue with the Academic Director to understand the student's learning goals, school syllabus, and personalized coaching schedule.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">schedule</span>
                    <span>3. Management Slot Allocation</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    Admin issues the exact Day, Date, Time, and Center Venue (Main Center Bagru or Branch Daroh) directly to the applicant's online tracker.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">app_registration</span>
                    <span>4. Official Enrollment &amp; Roll Number</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    Upon qualifying, the student receives their Admission Number, batch time, study modules, and student portal login credentials.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#d2d2d7] flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#6e6e73]">
                  Ready to apply? Complete the student application form to begin.
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/student-application"
                    className="apple-btn-primary px-6 py-2.5 text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    Apply as Student
                  </Link>
                  <Link
                    to="/student-application"
                    className="apple-btn-secondary px-5 py-2 text-xs"
                  >
                    Track Application
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Joining Details */}
          {activeTab === 'faculty' && (
            <div className="space-y-6">
              <div className="border-b border-[#d2d2d7] pb-4">
                <h4 className="text-xl text-[#1d1d1f]">
                  Faculty Recruitment &amp; Joining Protocol
                </h4>
                <p className="text-xs text-[#6e6e73] mt-1">
                  For subject teachers, senior lecturers, HODs, and competitive exam mentors seeking to join the Saumyaa Studies faculty roster.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">co_present</span>
                    <span>1. Subject Mastery Written Test</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    In-depth assessment of high-school, +1/+2 board, or competitive level syllabus (JEE/NEET) subject expertise and problem-solving pedagogy.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">cast_for_education</span>
                    <span>2. Live Classroom Teaching Presentation</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    A 20-minute live presentation lecture before our academic board and student panel to evaluate student engagement and communication clarity.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">record_voice_over</span>
                    <span>3. Director &amp; Board Panel Interview</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    Comprehensive discussion on teaching philosophy, curriculum planning, past experience, and alignment with the institute's mission.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7]/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">badge</span>
                    <span>4. Final Selection &amp; Faculty Onboarding</span>
                  </div>
                  <p className="text-[#6e6e73] leading-relaxed">
                    Shortlisted candidates who successfully clear all rounds receive the official appointment letter, class assignments, and faculty portal credentials.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#d2d2d7] flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#6e6e73]">
                  Passionate about teaching? Submit your faculty joining application.
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/faculty-application"
                    className="apple-btn-primary px-6 py-2.5 text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">work</span>
                    Apply for Faculty
                  </Link>
                  <Link
                    to="/faculty-application"
                    className="apple-btn-secondary px-5 py-2 text-xs"
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
