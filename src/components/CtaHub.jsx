import React from 'react';
import { Link } from 'react-router-dom';

export default function CtaHub() {
  return (
    <section className="apple-section-white">
      <div className="max-w-[960px] mx-auto px-6 text-center">
        <div className="bg-[#f5f5f7] rounded-[28px] p-10 md:p-16 border border-[#d2d2d7] shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 text-[#1d1d1f] tracking-[-0.02em]">
            Start Your Academic Transformation
          </h2>
          <p className="text-sm md:text-base mb-8 text-[#6e6e73] max-w-xl mx-auto leading-relaxed">
            Join a community where curiosity is rewarded and excellence is coached. Enquire about admissions and
            upcoming batches with Jitender Sharma today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/student-application"
              className="w-full sm:w-auto apple-btn-primary px-8 py-3.5 text-sm"
            >
              Apply for Admission
            </Link>
            <Link
              to="/courses"
              className="w-full sm:w-auto apple-btn-secondary px-8 py-3 text-sm"
            >
              View All Batches
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
