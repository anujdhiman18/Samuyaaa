import React from 'react';
import Content from '../../components/Content';

export default function ContactPage() {
  return (
    <div className="animate-fade-in font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      {/* Apple Dark Hero Header */}
      <section className="apple-section-dark border-b border-[#424245]">
        <div className="apple-container text-center max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-white/10 rounded-full text-xs font-medium uppercase tracking-wider mb-4 text-[#2997ff]">
            We're Here to Help
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#f5f5f7] tracking-[-0.025em] mb-4">
            Contact Saumyaa Studies
          </h1>
          <p className="text-sm sm:text-base text-[#86868b] max-w-2xl mx-auto leading-relaxed">
            Visit our study centers in Bagru &amp; Daroh, call our helpline, or send a quick inquiry message below.
          </p>
        </div>
      </section>

      {/* Main Streamlined Contact Component */}
      <Content isStandalone={true} />
    </div>
  );
}
