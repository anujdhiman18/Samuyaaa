import React, { useState } from 'react';
import { faqs } from '../data.js';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="apple-section-alt">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[#6e6e73] font-semibold text-xs tracking-wider uppercase mb-2 block">
            Answering Your Doubts
          </span>
          <h2 className="text-3xl sm:text-4xl text-[#1d1d1f] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#6e6e73]">
            Everything you need to know about joining Saumyaa Studies.
          </p>
        </div>

        {/* Accordions: #ffffff on #f5f5f7, 22px radius, no hard borders */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="apple-card-white overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center text-base font-semibold text-[#1d1d1f] cursor-pointer"
                >
                  <span className="pr-4">{faq.question}</span>
                  <span
                    className="material-symbols-outlined text-[20px] text-[#0071e3] transition-transform duration-300 shrink-0 select-none"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isOpen ? '400px' : '0px' }}
                >
                  <div className="px-6 pb-6 pt-1 text-sm text-[#6e6e73] leading-relaxed border-t border-[#d2d2d7]/40">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
