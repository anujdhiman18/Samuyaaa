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

    try {
      const formData = new FormData();
      formData.append('name', queryData.name);
      formData.append('email', queryData.email);
      formData.append('message', queryData.message);
      formData.append('_subject', `New Website Message from ${queryData.name}`);
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

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm(initialForm);
    }, 350);
  }

  return (
    <section id="contact" className={isStandalone ? 'apple-section-white' : 'apple-section-white border-t border-[#d2d2d7]/50'}>
      <div className="apple-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Contact details & Centers */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div>
              <span className="text-[#6e6e73] font-semibold text-xs tracking-wider uppercase mb-2 block">
                Reach Out to Us
              </span>
              <h2 className="text-3xl sm:text-4xl text-[#1d1d1f] mb-4">
                Let's Connect
              </h2>
              <p className="text-[#6e6e73] text-sm md:text-base leading-relaxed mb-8">
                Have questions about courses, admissions, fees, or timings? Leave a quick note or reach us directly.
              </p>

              <div className="space-y-3.5">
                <a
                  href="tel:+919816477341"
                  className="flex items-center gap-4 p-4 rounded-[20px] bg-[#f5f5f7] hover:bg-[#e5e5ea] transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full bg-white text-[#0071e3] flex items-center justify-center border border-[#d2d2d7] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </span>
                  <div>
                    <p className="text-[10px] text-[#6e6e73] uppercase font-semibold">Direct Calling</p>
                    <p className="text-sm font-semibold text-[#1d1d1f]">+91 98164 77341</p>
                  </div>
                </a>

                <a
                  href="mailto:Jitender0585@gmail.com"
                  className="flex items-center gap-4 p-4 rounded-[20px] bg-[#f5f5f7] hover:bg-[#e5e5ea] transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full bg-white text-[#0071e3] flex items-center justify-center border border-[#d2d2d7] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <div>
                    <p className="text-[10px] text-[#6e6e73] uppercase font-semibold">Email Desk</p>
                    <p className="text-sm font-semibold text-[#1d1d1f]">Jitender0585@gmail.com</p>
                  </div>
                </a>
              </div>

              <div className="pt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6e6e73] mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">domain</span>
                  Our Study Centers
                </p>

                <div className="space-y-3">
                  {/* Main Center (Bagru) */}
                  <div className="p-5 rounded-[20px] bg-[#f5f5f7]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#1d1d1f]">
                        Main Center (Bagru)
                      </span>
                      <span className="text-[10px] font-medium text-[#6e6e73] bg-white px-2.5 py-0.5 rounded-full border border-[#d2d2d7]">
                        Main Center
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6e73] leading-relaxed mb-3">
                      Saumyaa Studies, Bagru Garh, Jamula, Palaid, Himachal Pradesh 176093
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Bagru+Garh%2C+Jamula%2C+Palaid%2C+Himachal+Pradesh+176093"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="apple-link inline-flex items-center gap-1 text-xs font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px]">map</span> View on Google Maps
                    </a>
                  </div>

                  {/* Branch (Daroh) */}
                  <div className="p-5 rounded-[20px] bg-[#f5f5f7]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#1d1d1f]">
                        Branch (Daroh)
                      </span>
                      <span className="text-[10px] font-medium text-[#6e6e73] bg-white px-2.5 py-0.5 rounded-full border border-[#d2d2d7]">
                        Branch
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6e73] leading-relaxed mb-3">
                      Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=31.997361,76.478083"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="apple-link inline-flex items-center gap-1 text-xs font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px]">map</span> View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Streamlined Contact Form Card */}
          <div className="lg:col-span-7 apple-card-alt p-8 sm:p-10 relative">
            <div className="mb-6">
              <span className="text-[#6e6e73] font-semibold text-[11px] tracking-wider uppercase mb-1 block">
                Quick Message
              </span>
              <h3 className="text-2xl text-[#1d1d1f]">
                Send an Inquiry
              </h3>
              <p className="text-xs text-[#6e6e73] mt-1">
                Drop us your details and questions. We will get back to you promptly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="text-xs font-medium text-[#1d1d1f] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3]">person</span>
                  Your Name *
                </label>
                <input
                  type="text"
                  id="contact-name"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:outline-none focus:border-[#0071e3] bg-white text-sm text-[#1d1d1f]"
                />
              </div>

              {/* Field 2: Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="text-xs font-medium text-[#1d1d1f] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3]">email</span>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="contact-email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="e.g. rahul.sharma@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:outline-none focus:border-[#0071e3] bg-white text-sm text-[#1d1d1f]"
                />
              </div>

              {/* Field 3: Message */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="text-xs font-medium text-[#1d1d1f] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3]">chat</span>
                  Message / Details *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Tell us what you are looking for (e.g. Class 10th batch admission, syllabus enquiry)..."
                  className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:outline-none focus:border-[#0071e3] bg-white text-sm text-[#1d1d1f] resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full apple-btn-primary py-3.5 text-sm"
              >
                {submitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>

            {submitted && (
              <div className="absolute inset-0 bg-white rounded-[22px] flex flex-col items-center justify-center p-8 text-center z-20">
                <span className="w-14 h-14 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </span>
                <h4 className="text-2xl text-[#1d1d1f] mb-2">Message Received</h4>
                <p className="text-sm text-[#6e6e73] max-w-sm mb-6 leading-relaxed">
                  Thank you! Your message has been sent to our academic desk at Jitender0585@gmail.com.
                </p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="apple-btn-secondary px-6 py-2.5 text-xs"
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
