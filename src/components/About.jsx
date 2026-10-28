import React from 'react';
import { Link } from 'react-router-dom';
import founderImg from '../imges/Unknown.jpg';

export default function About() {
  return (
    <section id="about" className="apple-section-white">
      <div className="apple-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Founder Portrait with sleek Apple depth */}
          <div className="md:col-span-5 relative group">
            <div className="relative rounded-[24px] overflow-hidden bg-[#f5f5f7] border border-[#d2d2d7] shadow-[0_12px_36px_rgba(0,0,0,0.06)] aspect-[4/5]">
              <img
                className="w-full h-full object-cover object-top"
                alt="Portrait of Jitender Sharma, founder of Saumyaa Studies"
                src={founderImg}
              />
            </div>
          </div>

          {/* Hero Content */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <span className="text-[#0071e3] font-semibold text-xs tracking-wider uppercase mb-3">
              The Visionary Behind Saumyaa Studies
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-[#1d1d1f] mb-6 tracking-[-0.025em]">
              Meet Jitender Sharma
            </h1>

            <div className="space-y-6 text-[#6e6e73] text-base md:text-lg leading-relaxed">
              <p>
                With over 15 years of dedicated experience in the field of education, Jitender Sharma founded{' '}
                <strong className="text-[#1d1d1f] font-semibold">Saumyaa Studies</strong> on the principle that
                every student possesses a unique intellectual fingerprint. His mission is to bridge the gap
                between rote learning and conceptual mastery.
              </p>

              {/* Philosophy Callout Card */}
              <div className="p-6 rounded-[22px] bg-[#f5f5f7] border border-[#d2d2d7]">
                <h3 className="font-semibold text-lg text-[#1d1d1f] mb-1 tracking-[-0.015em]">
                  Philosophy: "Clarity Before Completion"
                </h3>
                <p className="text-sm md:text-base italic text-[#6e6e73] leading-relaxed">
                  "My goal isn't just to help students finish their syllabus; it's to ensure they understand the
                  'why' behind every formula and the 'how' behind every concept."
                </p>
              </div>

              {/* Qualifications & Specializations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white p-5 rounded-[22px] border border-[#d2d2d7] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#0071e3]">verified</span>
                    Qualifications
                  </h4>
                  <ul className="space-y-2 text-sm text-[#6e6e73]">
                    {['M.Sc in Physics', 'B.Sc with Physics', 'Certified Pedagogy Expert'].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#0071e3] text-[18px] shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-[22px] border border-[#d2d2d7] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#0071e3]">stars</span>
                    Specializations
                  </h4>
                  <ul className="space-y-2 text-sm text-[#6e6e73]">
                    {['JEE Foundation', 'Board Exam Strategy', 'Cognitive Coaching'].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#0071e3] text-[18px] shrink-0 mt-0.5">
                          school
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Buttons: Primary #0071e3 pill + Secondary transparent pill with outline */}
              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <Link
                  to="/student-application"
                  className="apple-btn-primary px-7 py-3.5 text-sm"
                >
                  Apply for Admission
                </Link>
                <Link
                  to="/courses"
                  className="apple-btn-secondary px-7 py-3 text-sm"
                >
                  Explore Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
