import React from 'react';

const WEEKLY_SCHEDULE = [
  {
    day: 'Monday',
    slots: [
      { time: '09:00 AM - 10:30 AM', className: '10th Standard', subject: 'Mathematics Advanced', room: 'Hall A' },
      { time: '11:00 AM - 12:30 PM', className: '11th (+1)', subject: 'Physics IIT-JEE Prep', room: 'Lab 2' },
      { time: '02:00 PM - 03:30 PM', className: '12th (+2)', subject: 'Mathematics Advanced', room: 'Hall C' },
    ],
  },
  {
    day: 'Tuesday',
    slots: [
      { time: '09:00 AM - 10:30 AM', className: '11th (+1)', subject: 'Physics IIT-JEE Prep', room: 'Lab 2' },
      { time: '11:00 AM - 12:30 PM', className: '10th Standard', subject: 'Mathematics Advanced', room: 'Hall A' },
    ],
  },
  {
    day: 'Wednesday',
    slots: [
      { time: '09:00 AM - 10:30 AM', className: '12th (+2)', subject: 'Mathematics Advanced', room: 'Hall C' },
      { time: '01:30 PM - 03:00 PM', className: '10th Standard', subject: 'Mathematics Advanced', room: 'Hall A' },
    ],
  },
  {
    day: 'Thursday',
    slots: [
      { time: '09:00 AM - 10:30 AM', className: '10th Standard', subject: 'Mathematics Advanced', room: 'Hall A' },
      { time: '11:00 AM - 12:30 PM', className: '11th (+1)', subject: 'Physics IIT-JEE Prep', room: 'Lab 2' },
    ],
  },
  {
    day: 'Friday',
    slots: [
      { time: '09:00 AM - 10:30 AM', className: '11th (+1)', subject: 'Physics IIT-JEE Prep', room: 'Lab 2' },
      { time: '02:00 PM - 03:30 PM', className: '12th (+2)', subject: 'Mathematics Advanced', room: 'Hall C' },
    ],
  },
  {
    day: 'Saturday',
    slots: [
      { time: '09:00 AM - 12:00 PM', className: '10th & 12th', subject: 'Special Olympiad & Board Mock Series', room: 'Main Auditorium' },
    ],
  },
];

export default function FacultyTimetable() {
  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
          Weekly Class Timetable
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Your scheduled teaching slots across assigned classes for Term 1 (2026).
        </p>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WEEKLY_SCHEDULE.map((dayItem) => (
          <div
            key={dayItem.day}
            className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <h3 className="font-headings font-extrabold text-base text-secondary">{dayItem.day}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                {dayItem.slots.length} Lectures
              </span>
            </div>

            <div className="space-y-3">
              {dayItem.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-outline-variant/15 bg-surface-container-lowest space-y-1"
                >
                  <span className="px-2 py-0.5 rounded bg-surface-container font-mono font-bold text-[10px] text-primary">
                    {slot.time}
                  </span>
                  <h4 className="font-bold text-xs text-secondary mt-1">{slot.subject}</h4>
                  <p className="text-[11px] text-on-surface-variant">Class: {slot.className} &bull; Room: {slot.room}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
