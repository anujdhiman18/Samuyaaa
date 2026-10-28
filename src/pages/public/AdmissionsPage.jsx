import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import AdmissionProcessSection from '../../components/AdmissionProcessSection';
import CtaHub from '../../components/CtaHub';

export default function AdmissionsPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Dark Hero Header */}
      <section className="apple-section-dark border-b border-[#424245]">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-white/10 rounded-full text-xs font-medium uppercase tracking-wider mb-4 text-[#2997ff]">
            Admissions &amp; Enrollment 2026-2027
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#f5f5f7] tracking-[-0.025em] mb-4">
            How to Join Saumyaa Studies
          </h1>
          <p className="text-sm sm:text-base text-[#86868b] max-w-2xl mx-auto leading-relaxed mb-8">
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
              className="apple-btn-secondary px-6 py-3 text-sm text-[#2997ff] border-[#2997ff] hover:bg-[#2997ff]/10"
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
