import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import About from '../../components/About';
import CtaHub from '../../components/CtaHub';

export default function AboutPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="font-body animate-fade-in">
      {/* Page Header Banner */}
      <section className="bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1976D2] text-white py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#90CAF9_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
        <div className="max-w-container-max mx-auto px-gutter relative z-10 text-center">
          <span className="inline-block px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-headings font-bold uppercase tracking-wider mb-3 text-[#BBDEFB]">
            About Saumyaa Studies
          </span>
          <h1 className="font-headings font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
            Our Legacy, Founder &amp; Academic Vision
          </h1>
          <p className="text-sm sm:text-base text-[#BBDEFB] max-w-2xl mx-auto leading-relaxed">
            Founded with a passion to nurture conceptual clarity, critical thinking, and student empowerment across Himachal Pradesh.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => openBooking()}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-headings font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-premium cursor-pointer"
            >
              Book a Free Demo Class
            </button>
            <Link
              to="/courses"
              className="bg-white/15 hover:bg-white/25 text-white font-headings font-bold text-xs sm:text-sm px-6 py-3 rounded-full backdrop-blur-md transition-all border border-white/20"
            >
              Explore Academic Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Main About Component */}
      <About onOpenBooking={openBooking} />

      {/* Philosophy & Pillars */}
      <section className="py-14 bg-surface-container-lowest border-t border-outline-variant/15">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#D97706] font-headings font-bold text-xs uppercase tracking-widest block mb-1">
              Core Principles
            </span>
            <h2 className="font-headings font-extrabold text-2xl sm:text-3xl text-[#0D47A1]">
              Why Students Excel with Saumyaa Studies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface-container/40 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[28px]">psychology</span>
              </div>
              <h3 className="font-headings font-bold text-lg text-secondary mb-2">Conceptual Clarity</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                We eliminate blind rote learning through first-principles physics, mathematics logic models, and interactive visualizations.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container/40 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[28px]">target</span>
              </div>
              <h3 className="font-headings font-bold text-lg text-secondary mb-2">Targeted Mentorship</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Small batch sizes ensure personalized diagnostic feedback, doubt resolution, and tailored test strategies for every student.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container/40 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[28px]">verified_user</span>
              </div>
              <h3 className="font-headings font-bold text-lg text-secondary mb-2">Proven Track Record</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Consistent 95%+ board toppers and premier engineering/medical college selections year after year across Himachal Pradesh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CtaHub onOpenBooking={openBooking} />
    </div>
  );
}
