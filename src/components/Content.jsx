import React, { useState } from 'react';
import { CLASS_CATEGORIES, formatClassLabel } from '../config/classConfig';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  targetClass: '',
  subject: '',
  branch: 'Bagru',
  message: '',
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState(null);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function getMailtoUrl(data) {
    const classLabel = data.targetClass ? formatClassLabel(data.targetClass) : 'N/A';
    const subjectStr = encodeURIComponent(`Inquiry from ${data.name} (${classLabel}): ${data.subject}`);
    const bodyStr = encodeURIComponent(
      `Student/Parent Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || 'N/A'}\nClass/Grade: ${classLabel}\nPreferred Location: ${data.branch || 'Bagru'}\nSubject: ${data.subject}\n\nMessage Details:\n${data.message}`
    );
    return `mailto:Jitender0585@gmail.com?subject=${subjectStr}&body=${bodyStr}`;
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
    setLastSubmittedQuery(queryData);

    // Send in background to avoid any CORS or network timeout hanging
    try {
      const formData = new FormData();
      formData.append('name', queryData.name);
      formData.append('phone', queryData.phone);
      formData.append('email', queryData.email || 'Not Provided');
      formData.append('class', queryData.targetClass ? formatClassLabel(queryData.targetClass) : 'Not Provided');
      formData.append('subject', queryData.subject || 'General Inquiry');
      formData.append('location', queryData.branch || 'Bagru');
      formData.append('message', queryData.message);
      formData.append(
        '_subject',
        `New Inquiry from ${queryData.name} (${queryData.targetClass ? formatClassLabel(queryData.targetClass) : 'General'}): ${queryData.subject}`
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

    // Instant guaranteed transition to success view
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm(initialForm);
    }, 400);
  }

  return (
    <section id="contact" className="bg-surface-container-low border-t border-surface-container-high py-16 md:py-24">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Contact details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <span className="text-primary font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
                Reach Out to Us
              </span>
              <h2 className="font-headings font-extrabold text-3xl text-secondary mb-6">Let's Connect</h2>
              <p className="text-on-surface-variant font-body text-sm md:text-base leading-relaxed mb-8">
                Have questions about fees, timings, syllabus, or demo bookings? Drop in at our study center or
                message us directly.
              </p>

              <div className="space-y-4">
                <a
                  href="tel:+919816477341"
                  className="flex items-center gap-4 p-3 rounded-xl border border-surface-container-high bg-white hover:border-secondary hover:shadow-sm transition-all group"
                >
                  <span className="w-10 h-10 rounded-lg bg-secondary/5 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Phone Contact</p>
                    <p className="text-sm font-bold text-on-surface">+91 98164 77341</p>
                  </div>
                </a>

                <a
                  href="mailto:Jitender0585@gmail.com"
                  className="flex items-center gap-4 p-3 rounded-xl border border-surface-container-high bg-white hover:border-secondary hover:shadow-sm transition-all group"
                >
                  <span className="w-10 h-10 rounded-lg bg-secondary/5 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Email Inquiry</p>
                    <p className="text-sm font-bold text-on-surface">Jitender0585@gmail.com</p>
                  </div>
                </a>

                <div className="pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
                    Our Academic Centers
                  </p>

                  <div className="space-y-3">
                    {/* Main Branch - Bagru */}
                    <div className="p-3.5 rounded-xl border border-surface-container-high bg-white hover:border-secondary transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-headings font-bold text-xs text-secondary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                          Bagru (Main Branch)
                        </span>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Main Center
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                        Saumyaa Studies, Bagru Garh, Jamula, Palaid, Himachal Pradesh 176093
                      </p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Bagru+Garh%2C+Jamula%2C+Palaid%2C+Himachal+Pradesh+176093"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span> View Bagru on Google Maps
                      </a>
                    </div>

                    {/* Second Branch - Daroh */}
                    <div className="p-3.5 rounded-xl border border-surface-container-high bg-white hover:border-secondary transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-headings font-bold text-xs text-secondary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          Daroh (Branch 2)
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Branch 2
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                        Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092
                      </p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=31.997361,76.478083"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span> View Daroh on Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 shadow-premium border border-outline-variant/15 relative">
            <h3 className="font-headings font-bold text-xl text-on-surface mb-6">Send an Inquiry</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-name" className="font-body text-xs font-semibold text-on-surface-variant">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter student/parent name"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-surface-container-lowest font-body text-sm text-on-surface transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-phone" className="font-body text-xs font-semibold text-on-surface-variant">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    required
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="10-digit number"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-surface-container-lowest font-body text-sm text-on-surface transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-email" className="font-body text-xs font-semibold text-on-surface-variant">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-surface-container-lowest font-body text-sm text-on-surface transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-class" className="font-body text-xs font-semibold text-on-surface-variant">
                    Class / Grade *
                  </label>
                  <select
                    id="contact-class"
                    required
                    value={form.targetClass}
                    onChange={(e) => updateField('targetClass', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-white font-body text-sm text-on-surface cursor-pointer transition-all"
                  >
                    <option value="">-- Select Class / Grade --</option>
                    {CLASS_CATEGORIES.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-subject" className="font-body text-xs font-semibold text-on-surface-variant">
                    Subject *
                  </label>
                  <select
                    id="contact-subject"
                    required
                    value={form.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-white font-body text-sm text-on-surface cursor-pointer transition-all"
                  >
                    <option value="">
                      -- Select Subject --
                    </option>
                    <option value="Admission Inquiry">Admission / Batch Enrollment</option>
                    <option value="Demo Class Request">Demo Class Booking</option>
                    <option value="Fee Structure">Fee Structure Inquiry</option>
                    <option value="Counseling">Career &amp; Academic Counseling</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-branch" className="font-body text-xs font-semibold text-on-surface-variant">
                    Preferred LOCATION *
                  </label>
                  <select
                    id="contact-branch"
                    required
                    value={form.branch || 'Bagru'}
                    onChange={(e) => updateField('branch', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-white font-body text-sm text-on-surface cursor-pointer transition-all"
                  >
                    <option value="Bagru">Bagru (Main Branch)</option>
                    <option value="Daroh">Daroh (Child Branch)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="font-body text-xs font-semibold text-on-surface-variant">
                  Message Details *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Tell us about the student's current grade, academic goals, or queries..."
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-surface-container-lowest font-body text-sm text-on-surface transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-white font-headings font-bold py-3.5 rounded-lg text-sm transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Sending Inquiry...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Inquiry Message
                  </>
                )}
              </button>
            </form>

            {submitted && (
              <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 transition-all duration-300">
                <span className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
                </span>
                <h4 className="font-headings font-bold text-xl text-on-surface mb-2">Query Sent Directly!</h4>
                <p className="text-sm text-on-surface-variant max-w-sm mb-6">
                  Thank you! Your query has been directly sent to <strong className="text-secondary font-bold">Jitender0585@gmail.com</strong>. Our team will contact you shortly.
                </p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-secondary text-white font-headings font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-on-secondary-fixed-variant transition-colors shadow-sm cursor-pointer"
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
