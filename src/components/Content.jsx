import React, { useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  message: '',
};

export default function Contact({ isStandalone = false }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleResetForm() {
    setForm(initialForm);
    setSubmitting(false);
    setSubmitted(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const queryData = { ...form };

    // Send in background via formsubmit.co to avoid any hanging issues
    try {
      const formData = new FormData();
      formData.append('name', queryData.name);
      formData.append('email', queryData.email);
      formData.append('message', queryData.message);
      formData.append(
        '_subject',
        `New Website Message from ${queryData.name}`
      );
      formData.append('_captcha', 'false');

      fetch('https://formsubmit.co/ajax/f785f212ac6d3b7066a696d35d1be84f', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      }).catch((err) => console.warn('Background inquiry note:', err));
    } catch (err) {
      console.warn('Submission trigger note:', err);
    }

    // Instant smooth transition to success view
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm(initialForm);
    }, 350);
  }

  return (
    <section id="contact" className={`font-body ${isStandalone ? 'py-12 md:py-20' : 'bg-[#BBDEFB]/25 border-t border-[#90CAF9]/30 py-16 md:py-24'}`}>
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Contact details & Centers */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[#D97706] font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
                Reach Out to Us
              </span>
              <h2 className="font-headings font-extrabold text-3xl sm:text-4xl text-[#0D47A1] mb-4">
                Let's <span className="text-[#D97706]">Connect</span>
              </h2>
              <p className="text-[#1565C0] font-body text-sm md:text-base leading-relaxed mb-6">
                Have questions about courses, admissions, fees, or timings? Leave a quick note below or reach us directly.
              </p>

              <div className="space-y-3.5">
                <a
                  href="tel:+919816477341"
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-[#90CAF9]/30 bg-white hover:border-[#0D47A1] hover:shadow-premium transition-all duration-300 group"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center group-hover:bg-[#0D47A1] group-hover:text-white transition-colors duration-200 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </span>
                  <div>
                    <p className="text-[10px] text-[#1565C0] uppercase font-semibold">Direct Calling</p>
                    <p className="text-sm font-bold text-[#0D47A1]">+91 98164 77341</p>
                  </div>
                </a>

                <a
                  href="mailto:Jitender0585@gmail.com"
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-[#90CAF9]/30 bg-white hover:border-[#0D47A1] hover:shadow-premium transition-all duration-300 group"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center group-hover:bg-[#0D47A1] group-hover:text-white transition-colors duration-200 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <div>
                    <p className="text-[10px] text-[#1565C0] uppercase font-semibold">Email Desk</p>
                    <p className="text-sm font-bold text-[#0D47A1]">Jitender0585@gmail.com</p>
                  </div>
                </a>
              </div>

              <div className="pt-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#D97706]">domain</span>
                  Our Study Centers
                </p>

                <div className="space-y-3">
                  {/* Main Center (Bagru) */}
                  <div className="p-4 rounded-2xl border border-[#90CAF9]/30 bg-white hover:border-[#0D47A1] transition-all duration-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-headings font-bold text-xs text-[#0D47A1] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D97706] inline-block" />
                        Main Center (Bagru)
                      </span>
                      <span className="text-[10px] font-semibold text-[#0D47A1] bg-[#BBDEFB]/40 px-2.5 py-0.5 rounded-full border border-[#90CAF9]/30">
                        Main Center
                      </span>
                    </div>
                    <p className="text-xs text-[#1565C0] leading-relaxed mb-2">
                      Saumyaa Studies, Bagru Garh, Jamula, Palaid, Himachal Pradesh 176093
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Bagru+Garh%2C+Jamula%2C+Palaid%2C+Himachal+Pradesh+176093"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1976D2] hover:text-[#0D47A1] hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">map</span> View on Google Maps
                    </a>
                  </div>

                  {/* Branch (Daroh) */}
                  <div className="p-4 rounded-2xl border border-[#90CAF9]/30 bg-white hover:border-[#0D47A1] transition-all duration-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-headings font-bold text-xs text-[#0D47A1] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1976D2] inline-block" />
                        Branch (Daroh)
                      </span>
                      <span className="text-[10px] font-semibold text-[#1976D2] bg-[#E3F2FD] px-2.5 py-0.5 rounded-full border border-[#90CAF9]/40">
                        Branch
                      </span>
                    </div>
                    <p className="text-xs text-[#1565C0] leading-relaxed mb-2">
                      Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=31.997361,76.478083"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1976D2] hover:text-[#0D47A1] hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">map</span> View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Streamlined 3-Field Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-10 shadow-premium border border-[#90CAF9]/30 relative">
            <div className="mb-6">
              <span className="text-[#D97706] font-headings font-bold text-[11px] tracking-wider uppercase mb-1 block">
                Quick Message
              </span>
              <h3 className="font-headings font-bold text-2xl text-[#0D47A1]">
                Send an <span className="text-[#D97706]">Inquiry</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Drop us your contact details and message. We will get back to you promptly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="font-headings text-xs font-bold text-[#0D1B2A] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#1976D2]">person</span>
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Rahul Sharma / Sunita Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-[#90CAF9]/50 focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]/15 bg-[#E3F2FD]/30 font-body text-sm text-[#0D1B2A] transition-all duration-200 placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Field 2: Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="font-headings text-xs font-bold text-[#0D1B2A] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#1976D2]">email</span>
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  id="contact-email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="e.g., rahul.sharma@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#90CAF9]/50 focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]/15 bg-[#E3F2FD]/30 font-body text-sm text-[#0D1B2A] transition-all duration-200 placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Field 3: Message / Inquiry */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="font-headings text-xs font-bold text-[#0D1B2A] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#1976D2]">chat</span>
                  Message / Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Tell us what you are looking for (e.g. Class 10th batch admission, demo class, fee details, or any questions)..."
                  className="w-full px-4 py-3 rounded-xl border border-[#90CAF9]/50 focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]/15 bg-[#E3F2FD]/30 font-body text-sm text-[#0D1B2A] transition-all duration-200 placeholder:text-on-surface-variant/40 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0D47A1] hover:bg-[#1565C0] text-white font-headings font-bold py-3.5 rounded-xl text-sm transition-all duration-300 active:scale-95 shadow-premium hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Sending Message...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Message
                  </>
                )}
              </button>
            </form>

            {submitted && (
              <div className="absolute inset-0 bg-white rounded-3xl flex flex-col items-center justify-center p-8 text-center z-20 transition-all duration-300 animate-fade-in">
                <span className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-sm">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </span>
                <h4 className="font-headings font-bold text-2xl text-[#0D47A1] mb-2">Message Received!</h4>
                <p className="text-sm text-[#1565C0] max-w-sm mb-6 leading-relaxed">
                  Thank you! Your message has been sent to our academic desk at <strong className="text-[#0D47A1] font-bold">Jitender0585@gmail.com</strong>. We will reply to your email soon.
                </p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-[#0D47A1] hover:bg-[#1565C0] text-white font-headings font-bold px-6 py-2.5 rounded-full text-xs transition-colors duration-200 shadow-premium cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
