import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import FacultySection from '../../components/FacultySection';

export default function FacultyPage() {
  const context = useOutletContext() || {};

  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Light Hero Header */}
      <section className="apple-section-white border-b border-[#d2d2d7]/60">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Expert Teaching Faculty
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1d1d1f] tracking-[-0.025em] mb-4">
            Meet Our Distinguished Mentors
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73] max-w-2xl mx-auto leading-relaxed mb-8">
            Passionate educators and subject specialists committed to unlocking the highest intellectual potential of every student.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/faculty-application"
              className="apple-btn-primary px-7 py-3.5 text-sm"
            >
              Join Our Faculty
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

      {/* Main Faculty Component */}
      <FacultySection />
    </div>
  );
}
