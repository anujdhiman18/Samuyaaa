import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Results from '../../components/Results';
import CtaHub from '../../components/CtaHub';

export default function ResultsPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Light Hero Header */}
      <section className="apple-section-white border-b border-[#d2d2d7]/60">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Wall of Academic Excellence
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1d1d1f] tracking-[-0.025em] mb-4">
            Outstanding Board &amp; Competitive Results
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73] max-w-2xl mx-auto leading-relaxed mb-8">
            Celebrating the milestones, state toppers, and 95%+ rank holders nurtured through our structured pedagogy.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/student-application"
              className="apple-btn-primary px-7 py-3.5 text-sm"
            >
              Enroll for Upcoming Session
            </Link>
            <Link
              to="/testimonials"
              className="apple-btn-secondary px-6 py-3 text-sm"
            >
              Read Student Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* Main Results Component */}
      <Results />

      {/* Bottom CTA */}
      <CtaHub onOpenBooking={openBooking} />
    </div>
  );
}
