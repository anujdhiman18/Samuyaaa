import React from 'react';
import founderImg from '../imges/Unknown.jpg';

export default function About({ onOpenBooking }) {
  return (
    <section id="about" className="max-w-container-max mx-auto px-gutter py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-5 relative group mt-4 md:mt-0">
          <div className="absolute -inset-4 bg-[#1976D2]/10 rounded-2xl -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
          <div className="absolute -inset-2 bg-[#BBDEFB]/40 rounded-2xl rotate-3 group-hover:rotate-1 transition-transform duration-500" />

          <div className="relative rounded-2xl overflow-hidden shadow-premium aspect-[4/5] bg-white border border-[#90CAF9]/30">
            <img
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              alt="Portrait of Jitender Sharma, founder of Saumyaa Studies"
              src={founderImg}
            />
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col justify-center">
          <span className="text-[#D97706] font-headings font-bold text-xs tracking-widest uppercase mb-2">
            The Visionary Behind Saumyaa Studies
          </span>
          <h1 className="font-headings font-extrabold text-4xl md:text-5xl leading-tight text-[#0D47A1] mb-6">
            Meet <span className="text-[#D97706]">Jitender Sharma</span>
          </h1>

          <div className="space-y-6 text-[#0D1B2A] font-body text-base md:text-lg leading-relaxed">
            <p>
              With over 15 years of dedicated experience in the field of education, Jitender Sharma founded{' '}
              <strong className="text-[#0D47A1] font-bold">Saumyaa Studies</strong> on the principle that
              every student possesses a unique intellectual fingerprint. His mission is to bridge the gap
              between rote learning and conceptual mastery.
            </p>

            <div className="education-callout p-5 rounded-2xl shadow-premium border border-[#D97706]/30">
              <h3 className="font-headings font-bold text-lg text-[#0D47A1] mb-1">
                Philosophy: <span className="text-[#D97706]">"Clarity Before Completion"</span>
              </h3>
              <p className="font-body text-sm md:text-base italic text-[#0D1B2A] leading-relaxed">
                "My goal isn't just to help students finish their syllabus; it's to ensure they understand the
                'why' behind every formula and the 'how' behind every concept."
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="bg-white p-5 rounded-2xl border border-[#90CAF9]/30 shadow-premium">
                <h4 className="font-headings font-bold text-xs text-[#0D47A1] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#D97706]">verified</span> Qualifications
                </h4>
                <ul className="space-y-2 text-sm text-[#0D1B2A] font-medium">
                  {['M.Sc in Physics', 'B.sc with Physics', 'Certified Pedagogy Expert'].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[#1976D2] text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#90CAF9]/30 shadow-premium">
                <h4 className="font-headings font-bold text-xs text-[#0D47A1] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#D97706]">stars</span> Specializations
                </h4>
                <ul className="space-y-2 text-sm text-[#0D1B2A] font-medium">
                  {['JEE Foundation', 'Board Exam Strategy', 'Cognitive Coaching'].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[#1976D2] text-[18px] shrink-0 mt-0.5">
                        school
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => onOpenBooking()}
                className="bg-[#0D47A1] text-white hover:bg-[#1565C0] px-6 py-3 rounded-xl font-headings font-bold text-sm transition-all duration-300 shadow-premium active:scale-95 cursor-pointer"
              >
                Book Live Class
              </button>
              <a
                href="#courses"
                className="border-2 border-[#1976D2] text-[#1976D2] hover:bg-[#1976D2] hover:text-white px-6 py-2.5 rounded-xl font-headings font-bold text-sm transition-all duration-300 active:scale-95 cursor-pointer"
              >
                Explore Courses
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
