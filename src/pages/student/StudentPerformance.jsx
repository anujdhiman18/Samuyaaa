import React from 'react';

export default function StudentPerformance() {
  return (
    <div className="space-y-6 font-body">
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Student Performance Analysis
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Comprehensive academic appraisal, teacher feedback, strengths, and improvement suggestions.
        </p>
      </div>

      {/* Grid: Teacher Remarks & Overall Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rating & Overall Score */}
        <div className="lg:col-span-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-headings font-bold tracking-widest bg-white/20 px-3.5 py-1 rounded-full">
              Overall Academic Rating
            </span>
            <h2 className="font-headings font-extrabold text-5xl mt-4">4.9 / 5.0</h2>
            <div className="flex text-amber-300 text-lg mt-2">★★★★★</div>
            <p className="text-xs text-orange-100 mt-4 leading-relaxed font-body">
              Consistently exceptional performance across Mathematics &amp; Sciences with strong analytical problem-solving skills.
            </p>
          </div>
          <div className="pt-6 border-t border-white/20 text-xs font-headings font-bold">
            <span>Faculty Lead:</span> Jitender Sharma
          </div>
        </div>

        {/* Director / Teacher Remarks */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col justify-between">
          <div>
            <h3 className="font-headings font-bold text-base text-secondary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">rate_review</span>
              Teacher Remarks &amp; Feedback
            </h3>
            <p className="text-xs text-on-surface leading-relaxed italic bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 font-body">
              "Rahul shows exceptional clarity in advanced calculus and physics mechanics. He approaches complex numerical problems with structured logic. Keep up the consistent mock test practice for board exams!"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-headings text-[10px] font-bold uppercase text-emerald-800 block">
                Key Strengths
              </span>
              <p className="font-bold text-emerald-900 mt-1">
                Algebraic Speed, Numerical Physics, Conceptual Depth
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="font-headings text-[10px] font-bold uppercase text-amber-800 block">
                Areas for Focus
              </span>
              <p className="font-bold text-amber-900 mt-1">
                Speed in multi-step organic chemistry equations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments & Improvement Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <h3 className="font-headings font-bold text-base text-secondary mb-4">
            Recent Homework &amp; Assignments Status
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex justify-between items-center">
              <div>
                <p className="font-bold text-on-surface">Calculus Integration Set #4</p>
                <p className="text-[10px] text-on-surface-variant">Mathematics Advanced</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Submitted 10/10
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex justify-between items-center">
              <div>
                <p className="font-bold text-on-surface">Newtonian Mechanics Numerical Sheet</p>
                <p className="text-[10px] text-on-surface-variant">Integrated Science</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Submitted 9.5/10
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <h3 className="font-headings font-bold text-base text-secondary mb-4">
            Faculty Improvement Plan
          </h3>
          <ul className="space-y-2.5 text-xs text-on-surface-variant font-body">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              <span>Complete weekly 30-minute timed mock tests for board exam speed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              <span>Review NCERT Exemplar problems in Chemistry prior to monthly test.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              <span>Attend Friday doubt clearing session with Jitender Sharma.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
