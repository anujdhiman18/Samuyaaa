import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Course from '../../components/Course';
import CtaHub from '../../components/CtaHub';

export default function CoursesPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Light Hero Header */}
      <section className="apple-section-white border-b border-[#d2d2d7]/60">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Academic Programs 2026-2027
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1d1d1f] tracking-[-0.025em] mb-4">
            Structured Courses for Every Learning Stage
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73] max-w-2xl mx-auto leading-relaxed mb-8">
            From Primary Foundation (S1) and Junior/Middle Wing (S5) to Advanced Senior Secondary JEE/NEET Specialist Coaching (S3/S4).
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/student-application"
              className="apple-btn-primary px-7 py-3.5 text-sm"
            >
              Apply for Admission
            </Link>
            <a
              href="#courses"
              className="apple-btn-secondary px-6 py-3 text-sm"
            >
              Explore Batch Details
            </a>
          </div>
        </div>
      </section>

      {/* Main Course Component (#f5f5f7 section) */}
      <Course onOpenBooking={openBooking} />

      {/* Bottom CTA Hub (#000000 section) */}
      <CtaHub onOpenBooking={openBooking} />
    </div>
  );
}
