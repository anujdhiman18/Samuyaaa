import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import CtaHub from '../../components/CtaHub';
import Content from '../../components/Content';
import founderImg from '../../imges/Unknown.jpg';

export default function HomePage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="font-body animate-fade-in">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E3F2FD]/50 via-white to-white py-12 md:py-20 border-b border-[#90CAF9]/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#90CAF9]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#D97706]/10 blur-3xl pointer-events-none" />

        <div className="max-w-container-max mx-auto px-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D47A1]/10 text-[#0D47A1] text-xs font-headings font-bold mb-5 border border-[#0D47A1]/15">
                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                <span>Admissions Open for Academic Session 2026-2027</span>
              </div>

              <h1 className="font-headings font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#0D47A1] leading-[1.15] tracking-tight mb-5">
                Clarity Before <span className="text-[#D97706]">Completion</span>. Excellence in Every Concept.
              </h1>

              <p className="text-base sm:text-lg text-[#1565C0] font-body leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
                Welcome to <strong className="text-[#0D47A1] font-bold">Saumyaa Studies</strong> — Himachal's premier academic study center. We blend first-principles conceptual coaching, structured logic blueprints, and personalized mentorship from Class 6th to JEE/NEET.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 mb-10">
                <Link
                  to="/student-application"
                  className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-7 py-3.5 rounded-full font-headings font-bold text-sm transition-all duration-300 shadow-premium hover:shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  Apply for Admission
                </Link>

                <button
                  onClick={() => openBooking()}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-3.5 rounded-full font-headings font-bold text-sm transition-all duration-300 shadow-premium hover:shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  Book a Free Live Demo
                </button>

                <Link
                  to="/courses"
                  className="bg-white hover:bg-surface-container text-[#0D47A1] border border-[#90CAF9]/50 px-5 py-3.5 rounded-full font-headings font-bold text-sm transition-all duration-200 shadow-sm hover:shadow"
                >
                  Explore Programs &rarr;
                </Link>
              </div>

              {/* Fast Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#90CAF9]/30 text-left">
                <div className="p-3 bg-white rounded-2xl border border-[#90CAF9]/30 shadow-xs">
                  <p className="font-headings font-extrabold text-xl sm:text-2xl text-[#0D47A1]">15+ Years</p>
                  <p className="text-[11px] font-semibold text-[#1565C0] uppercase">Proven Legacy</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#90CAF9]/30 shadow-xs">
                  <p className="font-headings font-extrabold text-xl sm:text-2xl text-[#D97706]">95%+</p>
                  <p className="text-[11px] font-semibold text-[#1565C0] uppercase">Top Board Scores</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#90CAF9]/30 shadow-xs">
                  <p className="font-headings font-extrabold text-xl sm:text-2xl text-[#0D47A1]">1000+</p>
                  <p className="text-[11px] font-semibold text-[#1565C0] uppercase">Students Mentored</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#90CAF9]/30 shadow-xs">
                  <p className="font-headings font-extrabold text-xl sm:text-2xl text-[#D97706]">2 Centers</p>
                  <p className="text-[11px] font-semibold text-[#1565C0] uppercase">Bagru &amp; Daroh</p>
                </div>
              </div>
            </div>

            {/* Right Column: Founder & Vision Snapshot Card */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-4 shadow-xl border border-[#90CAF9]/40 group hover:shadow-2xl transition-all duration-300">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/4.8] bg-[#E3F2FD]">
                  <img
                    src={founderImg}
                    alt="Jitender Sharma - Founder Saumyaa Studies"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block">
                      Founder &amp; Master Physics Mentor
                    </span>
                    <h3 className="font-headings font-extrabold text-xl">Jitender Sharma</h3>
                    <p className="text-xs text-[#BBDEFB] line-clamp-2 mt-1 font-body">
                      M.Sc in Physics &bull; 15+ Years dedicated pedagogy &bull; Mentored multiple state toppers.
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0D47A1]">
                    "Learn the 'Why' behind every formula."
                  </span>
                  <Link
                    to="/about"
                    className="text-xs font-bold font-headings text-[#D97706] hover:text-[#B45309] flex items-center gap-1 shrink-0"
                  >
                    Read Story &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHORT VALUE PROPOSITION & PAGE SHORTCUTS */}
      <section className="py-14 md:py-20 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#D97706] font-headings font-bold text-xs uppercase tracking-widest block mb-1">
              Explore Our Institution
            </span>
            <h2 className="font-headings font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0D47A1]">
              Everything You Need for Academic Success
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Explore our curriculum, faculty roster, admission journey, and top results in dedicated sections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: About */}
            <Link
              to="/about"
              className="p-6 rounded-3xl bg-white border border-[#90CAF9]/30 shadow-premium hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-[28px]">psychology</span>
                </div>
                <h3 className="font-headings font-bold text-lg text-[#0D47A1] mb-2 group-hover:text-primary transition-colors">
                  About Founder &amp; Philosophy
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Learn about our core philosophy "Clarity Before Completion" and 15-year pedagogical background.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                <span>Meet Jitender Sharma</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>

            {/* Card 2: Academic Programs */}
            <Link
              to="/courses"
              className="p-6 rounded-3xl bg-white border border-[#90CAF9]/30 shadow-premium hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center mb-4 group-hover:bg-[#D97706] group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-[28px]">menu_book</span>
                </div>
                <h3 className="font-headings font-bold text-lg text-[#0D47A1] mb-2 group-hover:text-[#D97706] transition-colors">
                  Academic Programs (S1-S4)
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tailored foundation, board preparation, and competitive JEE/NEET tracks for classes 6th to 12th.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-[#D97706] group-hover:translate-x-1 transition-transform">
                <span>Explore Courses</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>

            {/* Card 3: Admissions */}
            <Link
              to="/admissions"
              className="p-6 rounded-3xl bg-white border border-[#90CAF9]/30 shadow-premium hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
                </div>
                <h3 className="font-headings font-bold text-lg text-[#0D47A1] mb-2 group-hover:text-emerald-600 transition-colors">
                  5-Step Admission Process
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Transparent selection workflow: Registration, Entrance Assessment, Interview, and Enrollment.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>View Admission Steps</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>

            {/* Card 4: Wall of Excellence */}
            <Link
              to="/results"
              className="p-6 rounded-3xl bg-white border border-[#90CAF9]/30 shadow-premium hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-[28px]">emoji_events</span>
                </div>
                <h3 className="font-headings font-bold text-lg text-[#0D47A1] mb-2 group-hover:text-purple-600 transition-colors">
                  Results &amp; Rank Holders
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Celebrate our state toppers, 95%+ marks achievers, and top engineering &amp; medical selections.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                <span>Wall of Excellence</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FACULTY & ALUMNI TEASER BANNER */}
      <section className="py-12 bg-gradient-to-r from-[#0D47A1] to-[#1565C0] text-white">
        <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-headings font-bold text-[#D97706] uppercase tracking-wider block mb-1">
              Experienced Educators &amp; Inspiring Alumni
            </span>
            <h3 className="font-headings font-extrabold text-xl sm:text-2xl md:text-3xl text-white">
              Learn from the Best Mentors. Connect with Successful Alumni.
            </h3>
            <p className="text-xs sm:text-sm text-[#BBDEFB] mt-1 max-w-xl">
              Our faculty members bring decades of coaching expertise, while our alumni mentor the next generation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/our-faculty"
              className="px-5 py-2.5 rounded-full bg-white text-[#0D47A1] hover:bg-[#E3F2FD] font-headings font-bold text-xs shadow-md transition-all"
            >
              Faculty Directory
            </Link>
            <Link
              to="/alumni"
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-headings font-bold text-xs backdrop-blur-md border border-white/30 transition-all"
            >
              Alumni Network
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CTA HUB */}
      <CtaHub onOpenBooking={openBooking} />

      {/* 6. COMPACT CONTACT PREVIEW */}
      <Content isStandalone={false} />
    </div>
  );
}
