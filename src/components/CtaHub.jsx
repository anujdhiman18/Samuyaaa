import React from 'react';

export default function CtaHub({ onOpenBooking }) {
  return (
    <section className="max-w-[1000px] mx-auto px-gutter py-8 mb-16">
      <div className="bg-gradient-to-tr from-secondary to-on-secondary-container rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-white text-center relative overflow-hidden shadow-premium">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary-container/10 rounded-full blur-2xl" />

        <h2 className="font-headings font-extrabold text-3xl md:text-4xl mb-4 relative z-10">
          Start Your Academic Transformation
        </h2>
        <p className="font-body text-sm md:text-base mb-8 opacity-90 max-w-xl mx-auto relative z-10 leading-relaxed">
          Join a community where curiosity is rewarded and excellence is coached. Book a discovery session or
          enquire about the next batches with Jitender Sharma today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
          <button
            onClick={() => onOpenBooking()}
            className="w-full sm:w-auto bg-primary text-white hover:bg-primary-container px-8 py-4 rounded-full font-headings font-bold text-base shadow-xl hover:shadow-glow-primary hover:scale-105 active:scale-95 transition-all shadow-tactile-btn"
          >
            Schedule a Free Demo
          </button>
          <a
            href="#courses"
            className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-headings font-semibold text-base transition-all text-center"
          >
            View All Batches
          </a>
        </div>
      </div>
    </section>
  );
}
