import React, { useState } from 'react';
import { faqs } from '../data.js';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="max-w-[800px] mx-auto px-gutter py-16 md:py-24">
      <div className="text-center mb-12">
        <span className="text-primary font-headings font-bold text-xs tracking-widest uppercase mb-2 block font-semibold">
          Answering Your Doubts
        </span>
        <h2 className="font-headings font-extrabold text-3xl text-on-surface mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-on-surface-variant font-body">
          Everything you need to know about joining Saumyaa Studies.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className={`border rounded-xl bg-white overflow-hidden shadow-sm transition-all duration-300 ${
                isOpen ? 'border-secondary shadow-md' : 'border-surface-container-high'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left px-6 py-4 flex justify-between items-center font-headings font-bold text-base text-secondary hover:bg-surface-container-low transition-colors duration-200"
              >
                <span>{faq.question}</span>
                <span
                  className="material-symbols-outlined text-[20px] transition-transform duration-300 shrink-0 select-none"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? '400px' : '0px' }}
              >
                <div className="px-6 pb-5 pt-1 text-sm text-on-surface-variant leading-relaxed font-body border-t border-surface-container/50">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
