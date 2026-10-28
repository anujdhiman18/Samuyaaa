import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import AdmissionProcessSection from '../../components/AdmissionProcessSection';
import CtaHub from '../../components/CtaHub';

export default function AdmissionsPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Light Hero Header */}
      <section className="apple-section-white border-b border-[#d2d2d7]/60">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Admissions &amp; Enrollment 2026-2027
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1d1d1f] tracking-[-0.025em] mb-4">
            How to Join Saumyaa Studies
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73] max-w-2xl mx-auto leading-relaxed mb-8">
            A transparent 5-stage selection and onboarding process designed to evaluate cognitive aptitude and ensure academic excellence.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/student-application"
              className="apple-btn-primary px-7 py-3.5 text-sm"
            >
              Start Online Application
            </Link>
            <Link
              to="/courses"
              className="apple-btn-secondary px-6 py-3 text-sm"
            >
              View Class Categories &amp; Stages
            </Link>
          </div>
        </div>
      </section>

      {/* Main Admission Process Component */}
      <AdmissionProcessSection />

      {/* Bottom CTA */}
      <CtaHub onOpenBooking={openBooking} />
    </div>
  );
}
