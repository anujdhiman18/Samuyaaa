import React from 'react';

export default function CtaHub({ onOpenBooking }) {
  return (
    <section className="max-w-[1000px] mx-auto px-gutter py-8 mb-16 font-body">
      <div className="bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#0A192F] rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-white text-center relative overflow-hidden shadow-premium border border-[#90CAF9]/30">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <h2 className="font-headings font-extrabold text-3xl md:text-4xl mb-4 relative z-10 text-white">
          Start Your Academic <span className="text-[#FBBF24]">Transformation</span>
        </h2>
        <p className="font-body text-sm md:text-base mb-8 text-white/90 max-w-xl mx-auto relative z-10 leading-relaxed font-normal">
          Join a community where curiosity is rewarded and excellence is coached. Book a discovery session or
          enquire about the next batches with Jitender Sharma today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
          <button
            onClick={() => onOpenBooking()}
            className="w-full sm:w-auto bg-white text-[#0D47A1] hover:bg-[#E3F2FD] px-8 py-4 rounded-full font-headings font-bold text-base shadow-premium hover:shadow-premium-hover hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            Schedule a Free Demo
          </button>
          <a
            href="#courses"
            className="w-full sm:w-auto bg-transparent border-2 border-white/40 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-headings font-semibold text-base transition-all duration-300 text-center"
          >
            View All Batches
          </a>
        </div>
      </div>
    </section>
  );
}
