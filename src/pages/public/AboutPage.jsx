import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import About from '../../components/About';
import Results from '../../components/Results';
import CtaHub from '../../components/CtaHub';

export default function AboutPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Light Hero Header */}
      <section className="apple-section-white border-b border-[#d2d2d7]/60">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            About Saumyaa Studies
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1d1d1f] tracking-[-0.025em] mb-4">
            Our Legacy, Founder &amp; Academic Vision
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73] max-w-2xl mx-auto leading-relaxed mb-8">
            Founded with a passion to nurture conceptual clarity, critical thinking, and student empowerment across Himachal Pradesh.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/student-application"
              className="apple-btn-primary px-7 py-3.5 text-sm"
            >
              Apply for Admission
            </Link>
            <Link
              to="/courses"
              className="apple-btn-secondary px-6 py-3 text-sm"
            >
              Explore Academic Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Main About Component */}
      <About onOpenBooking={openBooking} />

      {/* Wall of Excellence */}
      <Results />

      {/* Core Principles: Apple #f5f5f7 section */}
      <section className="apple-section-alt">
        <div className="apple-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#6e6e73] font-semibold text-xs uppercase tracking-wider block mb-2">
              Core Principles
            </span>
            <h2 className="text-3xl sm:text-4xl text-[#1d1d1f] tracking-[-0.02em]">
              Why Students Excel with Saumyaa Studies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="apple-card-white p-7">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[26px]">psychology</span>
              </div>
              <h3 className="font-semibold text-lg text-[#1d1d1f] mb-2 tracking-[-0.015em]">Conceptual Clarity</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                We eliminate blind rote learning through first-principles physics, mathematics logic models, and interactive visualizations.
              </p>
            </div>

            <div className="apple-card-white p-7">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[26px]">target</span>
              </div>
              <h3 className="font-semibold text-lg text-[#1d1d1f] mb-2 tracking-[-0.015em]">Targeted Mentorship</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Small batch sizes ensure personalized diagnostic feedback, doubt resolution, and tailored test strategies for every student.
              </p>
            </div>

            <div className="apple-card-white p-7">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[26px]">verified_user</span>
              </div>
              <h3 className="font-semibold text-lg text-[#1d1d1f] mb-2 tracking-[-0.015em]">Proven Track Record</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
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
