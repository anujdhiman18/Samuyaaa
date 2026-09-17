import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Course from '../../components/Course';
import CtaHub from '../../components/CtaHub';

export default function CoursesPage() {
  const context = useOutletContext() || {};
  const openBooking = context.openBooking || (() => {});

  return (
    <div className="font-body animate-fade-in">
      {/* Page Header Banner */}
      <section className="bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1976D2] text-white py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#90CAF9_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
        <div className="max-w-container-max mx-auto px-gutter relative z-10 text-center">
          <span className="inline-block px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-headings font-bold uppercase tracking-wider mb-3 text-[#BBDEFB]">
            Academic Programs 2026-2027
          </span>
          <h1 className="font-headings font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
            Structured Courses for Every Learning Stage
          </h1>
          <p className="text-sm sm:text-base text-[#BBDEFB] max-w-2xl mx-auto leading-relaxed">
            From Middle School Foundation (S1) to Advanced Senior Secondary JEE/NEET Specialist Coaching (S4).
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/student-application"
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-headings font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-premium"
            >
              Apply for Admission
            </Link>
            <button
              onClick={() => openBooking()}
              className="bg-white/15 hover:bg-white/25 text-white font-headings font-bold text-xs sm:text-sm px-6 py-3 rounded-full backdrop-blur-md transition-all border border-white/20 cursor-pointer"
            >
              Book a Free Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Main Course Component */}
      <Course onOpenBooking={openBooking} />

      {/* Bottom CTA Hub */}
      <CtaHub onOpenBooking={openBooking} />
    </div>
  );
}
