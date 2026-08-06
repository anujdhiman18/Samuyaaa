import React from 'react';
import founderImg from '../imges/Unknown.jpg';

export default function About({ onOpenBooking }) {
  return (
    <section id="about" className="max-w-container-max mx-auto px-gutter py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-5 relative group mt-4 md:mt-0">
          <div className="absolute -inset-4 bg-secondary/5 rounded-xl -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
          <div className="absolute -inset-2 bg-primary/10 rounded-xl rotate-3 group-hover:rotate-1 transition-transform duration-500" />

          <div className="relative rounded-2xl overflow-hidden shadow-premium aspect-[4/5] bg-surface-container-high border border-outline-variant/10">
            <img
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              alt="Portrait of Jitender Sharma, founder of Saumyaa Studies"
              src={founderImg}
            />
          </div>

        </div>

        <div className="md:col-span-7 flex flex-col justify-center">
          <span className="text-primary font-headings font-bold text-xs tracking-widest uppercase mb-2">
            The Visionary Behind Saumyaa
          </span>
          <h1 className="font-headings font-extrabold text-4xl md:text-5xl leading-tight text-secondary mb-6">
            Meet Jitender Sharma
          </h1>

          <div className="space-y-6 text-on-surface-variant font-body text-base md:text-lg leading-relaxed">
            <p>
              With over 15 years of dedicated experience in the field of education, Jitender Sharma founded{' '}
              <strong className="text-on-surface font-semibold">Saumyaa Studies</strong> on the principle that
              every student possesses a unique intellectual fingerprint. His mission is to bridge the gap
              between rote learning and conceptual mastery.
            </p>

            <div className="education-callout p-5 rounded-lg shadow-sm border border-secondary/10">
              <h3 className="font-headings font-bold text-lg text-secondary mb-1">
                Philosophy: "Clarity Before Completion"
              </h3>
              <p className="font-body text-sm md:text-base italic text-on-surface leading-relaxed">
                "My goal isn't just to help students finish their syllabus; it's to ensure they understand the
                'why' behind every formula and the 'how' behind every concept."
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <h4 className="font-headings font-bold text-xs text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">verified</span> Qualifications
                </h4>
                <ul className="space-y-2 text-sm text-on-surface font-medium">
                  {['M.Sc in Physics', 'B.sc with Physics', 'Certified Pedagogy Expert'].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <h4 className="font-headings font-bold text-xs text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">stars</span> Specializations
                </h4>
                <ul className="space-y-2 text-sm text-on-surface font-medium">
                  {['JEE Foundation', 'Board Exam Strategy', 'Cognitive Coaching'].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
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
                className="bg-primary text-white hover:bg-primary-container px-6 py-3 rounded-lg font-headings font-semibold text-sm transition-all shadow-premium active:scale-95 shadow-tactile-btn"
              >
                Book Live Class
              </button>
              <a
                href="#courses"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white px-6 py-2.5 rounded-lg font-headings font-semibold text-sm transition-all active:scale-95"
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
