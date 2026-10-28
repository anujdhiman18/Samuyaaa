import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import CtaHub from '../../components/CtaHub';
import Content from '../../components/Content';
import founderImg from '../../imges/Unknown.jpg';

export default function HomePage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif] animate-fade-in">
      {/* 1. HERO SECTION: Apple Keynote Dark (#000000) */}
      <section className="apple-section-dark">
        <div className="apple-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#2997ff] text-xs font-medium mb-6 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff] animate-pulse" />
                <span>Admissions Open for Academic Session 2026-2027</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#f5f5f7] leading-[1.1] tracking-[-0.025em] mb-6">
                Clarity Before Completion. <span className="text-[#2997ff]">Excellence</span> in Every Concept.
              </h1>

              <p className="text-base sm:text-lg text-[#86868b] leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
                Welcome to <strong className="text-[#f5f5f7] font-semibold">Saumyaa Studies</strong> — Himachal's premier academic study center. We blend first-principles conceptual coaching, structured logic blueprints, and personalized mentorship from Class 6th to JEE/NEET.
              </p>

              {/* Action Buttons: Primary #0071e3 pill + Secondary transparent pill */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
                <Link
                  to="/student-application"
                  className="apple-btn-primary px-7 py-3.5 text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  Apply for Admission
                </Link>

                <Link
                  to="/courses"
                  className="apple-btn-secondary px-6 py-3 text-sm text-[#2997ff] border-[#2997ff] hover:bg-[#2997ff]/10"
                >
                  Explore Programs &rarr;
                </Link>
              </div>

              {/* Fast Stats Row: #1d1d1f cards on dark section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#424245] text-left">
                <div className="p-4 bg-[#1d1d1f] rounded-[20px] border border-[#424245]">
                  <p className="font-semibold text-xl sm:text-2xl text-[#f5f5f7]">15+ Years</p>
                  <p className="text-[11px] text-[#86868b] uppercase tracking-wider mt-0.5">Proven Legacy</p>
                </div>
                <div className="p-4 bg-[#1d1d1f] rounded-[20px] border border-[#424245]">
                  <p className="font-semibold text-xl sm:text-2xl text-[#2997ff]">95%+</p>
                  <p className="text-[11px] text-[#86868b] uppercase tracking-wider mt-0.5">Top Board Scores</p>
                </div>
                <div className="p-4 bg-[#1d1d1f] rounded-[20px] border border-[#424245]">
                  <p className="font-semibold text-xl sm:text-2xl text-[#f5f5f7]">1000+</p>
                  <p className="text-[11px] text-[#86868b] uppercase tracking-wider mt-0.5">Students Mentored</p>
                </div>
                <div className="p-4 bg-[#1d1d1f] rounded-[20px] border border-[#424245]">
                  <p className="font-semibold text-xl sm:text-2xl text-[#2997ff]">2 Centers</p>
                  <p className="text-[11px] text-[#86868b] uppercase tracking-wider mt-0.5">Bagru &amp; Daroh</p>
                </div>
              </div>
            </div>

            {/* Right Column: Founder Snapshot Card */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative mx-auto max-w-md bg-[#1d1d1f] rounded-[24px] p-4 border border-[#424245] shadow-[0_20px_48px_rgba(0,0,0,0.5)]">
                <div className="relative rounded-[18px] overflow-hidden aspect-[4/4.8] bg-[#000000]">
                  <img
                    src={founderImg}
                    alt="Jitender Sharma - Founder Saumyaa Studies"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-semibold text-[#2997ff] uppercase tracking-wider block">
                      Founder &amp; Master Physics Mentor
                    </span>
                    <h3 className="font-semibold text-xl text-[#f5f5f7] tracking-tight">Jitender Sharma</h3>
                    <p className="text-xs text-[#86868b] line-clamp-2 mt-1">
                      M.Sc in Physics &bull; 15+ Years dedicated pedagogy &bull; Mentored multiple state toppers.
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-4 flex items-center justify-between">
                  <span className="text-xs text-[#86868b] italic">
                    "Learn the 'Why' behind every formula."
                  </span>
                  <Link
                    to="/about"
                    className="apple-link text-xs font-semibold text-[#2997ff] flex items-center gap-1 shrink-0"
                  >
                    Read Story &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHORT VALUE PROPOSITION & PAGE SHORTCUTS: Apple #f5f5f7 / #1d1d1f Section */}
      <section className="apple-section-alt">
        <div className="apple-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#6e6e73] font-semibold text-xs uppercase tracking-wider block mb-2">
              Explore Our Institution
            </span>
            <h2 className="text-3xl sm:text-4xl text-[#1d1d1f] tracking-[-0.02em]">
              Everything You Need for Academic Success
            </h2>
            <p className="text-sm sm:text-base text-[#6e6e73] mt-3 leading-relaxed">
              Explore our curriculum, faculty roster, admission journey, and top results in dedicated sections.
            </p>
          </div>

          {/* 4 Shortcut Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: About */}
            <Link
              to="/about"
              className="p-7 rounded-[22px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between group transition-transform duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[26px]">psychology</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2 tracking-[-0.015em]">
                  About Founder &amp; Philosophy
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed mb-6">
                  Learn about our core philosophy "Clarity Before Completion" and 15-year pedagogical background.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-[#0066cc] group-hover:underline">
                <span>Meet Jitender Sharma</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>

            {/* Card 2: Academic Programs */}
            <Link
              to="/courses"
              className="p-7 rounded-[22px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between group transition-transform duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[26px]">menu_book</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2 tracking-[-0.015em]">
                  Academic Programs (S1-S5)
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed mb-6">
                  Tailored foundation, board preparation, and competitive JEE/NEET tracks from Nursery to Higher Education.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-[#0066cc] group-hover:underline">
                <span>Explore Courses</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>

            {/* Card 3: Admissions */}
            <Link
              to="/admissions"
              className="p-7 rounded-[22px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between group transition-transform duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2 tracking-[-0.015em]">
                  5-Step Admission Process
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed mb-6">
                  Transparent selection workflow: Registration, Entrance Assessment, Interview, and Enrollment.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-[#0066cc] group-hover:underline">
                <span>View Admission Steps</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>

            {/* Card 4: Wall of Excellence */}
            <Link
              to="/results"
              className="p-7 rounded-[22px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between group transition-transform duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[26px]">emoji_events</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2 tracking-[-0.015em]">
                  Results &amp; Rank Holders
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed mb-6">
                  Celebrate our state toppers, 95%+ marks achievers, and top engineering &amp; medical selections.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-[#0066cc] group-hover:underline">
                <span>Wall of Excellence</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FACULTY TEASER: Apple White Section */}
      <section className="apple-section-white">
        <div className="apple-container">
          <div className="bg-[#f5f5f7] rounded-[24px] p-8 md:p-12 border border-[#d2d2d7] flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block mb-1">
                Experienced Educators &amp; Expert Mentors
              </span>
              <h3 className="text-2xl sm:text-3xl text-[#1d1d1f] tracking-tight">
                Learn from the Best Mentors. Achieve Academic Excellence.
              </h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] mt-2 max-w-xl leading-relaxed">
                Our faculty members bring decades of coaching expertise to guide students toward exceptional results.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/our-faculty"
                className="apple-btn-primary px-6 py-3 text-xs"
              >
                Faculty Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA HUB */}
      <CtaHub onOpenBooking={openBooking} />

      {/* 5. CONTACT */}
      <Content isStandalone={false} />
    </div>
  );
}
