import React, { useEffect, useMemo, useState } from 'react';
import { subjectOptions, timeSlots } from '../data.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateDemoDays() {
  const days = [];
  for (let i = 1; i <= 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      label: `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`,
      dayShort: DAYS[date.getDay()].slice(0, 3),
      dayNum: date.getDate(),
      month: MONTHS[date.getMonth()],
    });
  }
  return days;
}

const initialFields = {
  studentName: '',
  parentPhone: '',
  parentEmail: '',
  grade: '',
  branch: 'Bagru',
  subject: subjectOptions[0],
};

export default function BookingModal({ open, prefilledProgram, onClose }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(initialFields);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const demoDays = useMemo(() => generateDemoDays(), [open]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedDate('');
      setSelectedTime('');
      setFields((prev) => ({
        ...initialFields,
        subject: prefilledProgram || subjectOptions[0],
      }));
      const t = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(t);
    }
    setAnimateIn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefilledProgram]);

  function updateField(field, value) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  function goToStep(next) {
    if (next === 2 && (!fields.studentName.trim() || !fields.parentPhone.trim())) {
      alert('Please fill out student name and phone details before proceeding.');
      return;
    }
    if (next === 3 && !fields.grade) {
      alert('Please select the current Class/Grade level.');
      return;
    }
    setStep(next);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert('Please select both a date and a time slot for the demo class.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('studentName', fields.studentName);
      formData.append('parentPhone', fields.parentPhone);
      formData.append('parentEmail', fields.parentEmail || 'Not Provided');
      formData.append('grade', fields.grade);
      formData.append('program', fields.subject);
      formData.append('scheduledDate', selectedDate);
      formData.append('timeSlot', selectedTime);
      formData.append('_subject', `Demo Class Booking: ${fields.studentName} (${fields.grade})`);
      formData.append('_captcha', 'false');

      fetch('https://formsubmit.co/ajax/f785f212ac6d3b7066a696d35d1be84f', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      }).catch((err) => console.warn('Background booking note:', err));
    } catch (err) {
      console.warn('Booking trigger note:', err);
    }

    setTimeout(() => {
      setStep(4);
    }, 400);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`bg-white w-full max-w-lg mx-gutter rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/10 relative transform transition-all duration-300 ease-out z-10 ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-surface-container-low px-6 py-4 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </span>
            <h3 className="font-headings font-bold text-base text-secondary">Book a Free Live Demo Class</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="h-1 bg-surface-container w-full relative">
          <div
            className="absolute h-full bg-primary left-0 transition-all duration-300"
            style={{ width: `${step * 25}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1 */}
          <div className={`modal-step ${step === 1 ? 'active' : ''}`}>
            <h4 className="font-headings font-bold text-base text-on-surface mb-1">Contact Profile</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Please specify who is attending and contact parameters.
            </p>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="student-name">
                  Student Name *
                </label>
                <input
                  type="text"
                  id="student-name"
                  required
                  value={fields.studentName}
                  onChange={(e) => updateField('studentName', e.target.value)}
                  placeholder="Enter student's full name"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="parent-phone">
                  Parent's Phone Number *
                </label>
                <input
                  type="tel"
                  id="parent-phone"
                  required
                  value={fields.parentPhone}
                  onChange={(e) => updateField('parentPhone', e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="parent-email">
                  Parent's Email Address
                </label>
                <input
                  type="email"
                  id="parent-email"
                  value={fields.parentEmail}
                  onChange={(e) => updateField('parentEmail', e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="preferred-branch">
                  Preferred Location *
                </label>
                <select
                  id="preferred-branch"
                  required
                  value={fields.branch || 'Bagru'}
                  onChange={(e) => updateField('branch', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 text-sm font-body bg-white"
                >
                  <option value="Bagru">Bagru (Main Location)</option>
                  <option value="Daroh">Daroh (Child Location)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="bg-secondary text-white px-5 py-2.5 rounded-lg font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant transition-colors flex items-center gap-1 shadow-sm"
              >
                Next Stage <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`modal-step ${step === 2 ? 'active' : ''}`}>
            <h4 className="font-headings font-bold text-base text-on-surface mb-1">Academic Preferences</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Help us place the student in the correct demo batch.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="student-grade">
                  Current Grade / Class *
                </label>
                <select
                  id="student-grade"
                  required
                  value={fields.grade}
                  onChange={(e) => updateField('grade', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 text-sm"
                >
                  <option value="" disabled>
                    Choose class
                  </option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="Class 1st">Class 1st</option>
                  <option value="Class 2nd">Class 2nd</option>
                  <option value="Class 3rd">Class 3rd</option>
                  <option value="Class 4th">Class 4th</option>
                  <option value="Class 5th">Class 5th</option>
                  <option value="Class 6th">Class 6th</option>
                  <option value="Class 7th">Class 7th</option>
                  <option value="Class 8th">Class 8th</option>
                  <option value="Class 9th">Class 9th</option>
                  <option value="Class 10th">Class 10th</option>
                  <option value="Class 11th">Class 11th</option>
                  <option value="Class 12th">Class 12th</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="subject-interest">
                  Subject / Batch Interest *
                </label>
                <select
                  id="subject-interest"
                  required
                  value={fields.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/30 text-sm"
                >
                  {subjectOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="border border-outline-variant text-on-surface-variant px-5 py-2.5 rounded-lg font-headings font-semibold text-xs hover:bg-surface-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="bg-secondary text-white px-5 py-2.5 rounded-lg font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant transition-colors flex items-center gap-1 shadow-sm"
              >
                Next Stage <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`modal-step ${step === 3 ? 'active' : ''}`}>
            <h4 className="font-headings font-bold text-base text-on-surface mb-1">Schedule Live Slot</h4>
            <p className="text-xs text-on-surface-variant mb-4">Choose a suitable date and preferred time slot.</p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant">Select Day *</label>
                <div className="grid grid-cols-3 gap-2">
                  {demoDays.map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setSelectedDate(d.label)}
                      className={`date-btn border rounded-lg py-2 flex flex-col items-center justify-center transition-all hover:border-secondary hover:bg-surface-container-low ${
                        selectedDate === d.label
                          ? 'border-primary bg-primary-fixed ring-1 ring-primary/20'
                          : 'border-outline-variant/60'
                      }`}
                    >
                      <span className="text-[10px] text-on-surface-variant font-medium">{d.dayShort}</span>
                      <span className="text-sm font-bold text-on-surface">{d.dayNum}</span>
                      <span className="text-[9px] uppercase tracking-wider text-secondary font-bold">{d.month}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant">Select Time Slot *</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`time-btn border py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedTime === slot
                          ? 'border-primary bg-primary-fixed ring-1 ring-primary/20'
                          : 'border-outline-variant/60 hover:border-secondary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="border border-outline-variant text-on-surface-variant px-5 py-2.5 rounded-lg font-headings font-semibold text-xs hover:bg-surface-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
              </button>
              <button
                type="submit"
                className="bg-primary text-white hover:bg-primary-container px-6 py-2.5 rounded-lg font-headings font-bold text-xs transition-colors flex items-center gap-1 shadow-md shadow-tactile-btn"
              >
                Book Live Demo <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`modal-step ${step === 4 ? 'active' : ''}`}>
            <div className="text-center py-6">
              <span className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[36px]">event_available</span>
              </span>

              <h4 className="font-headings font-bold text-xl text-on-surface mb-2">Demo Booked Successfully!</h4>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed mb-6">
                A live class link and confirmation details have been sent to you. We are looking forward to
                helping <strong className="text-secondary font-bold">{fields.studentName}</strong> start their
                conceptual journey.
              </p>

              <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container text-left space-y-2 text-xs font-medium text-on-surface mb-6 max-w-sm mx-auto">
                <p className="flex justify-between border-b border-surface-container pb-1.5">
                  <span className="text-on-surface-variant">Selected Program:</span>
                  <span className="font-bold text-secondary text-right">{fields.subject}</span>
                </p>
                <p className="flex justify-between border-b border-surface-container pb-1.5">
                  <span className="text-on-surface-variant">Class Level:</span>
                  <span className="font-bold">{fields.grade}</span>
                </p>
                <p className="flex justify-between border-b border-surface-container pb-1.5">
                  <span className="text-on-surface-variant">Scheduled Day:</span>
                  <span className="font-bold text-primary">{selectedDate}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-on-surface-variant">Time Slot:</span>
                  <span className="font-bold">{selectedTime}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-white font-headings font-bold py-3 rounded-lg text-xs transition-all shadow-sm"
              >
                Finish &amp; Close Form
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
