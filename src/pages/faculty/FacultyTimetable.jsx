import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  '09:00 AM - 10:30 AM',
  '11:00 AM - 12:30 PM',
  '02:00 PM - 03:30 PM',
  '03:45 PM - 05:15 PM',
];

export default function FacultyTimetable() {
  const { user } = useAuth();
  const responsibilities = user?.responsibilities || [];

  // Generate dynamic weekly schedule from assigned responsibilities
  const weeklySchedule = DAYS.map((day, dayIdx) => {
    if (responsibilities.length === 0) {
      return { day, slots: [] };
    }

    // Distribute assigned responsibilities across days
    const daySlots = responsibilities
      .filter((_, respIdx) => (respIdx + dayIdx) % 2 === 0 || responsibilities.length === 1 || dayIdx === 5)
      .map((resp, slotIdx) => ({
        time: TIME_SLOTS[slotIdx % TIME_SLOTS.length],
        className: `Class ${resp.className} (${resp.section || 'Sec A'})`,
        subject: resp.subject,
        room: `Hall ${String.fromCharCode(65 + ((slotIdx + dayIdx) % 5))}`,
        session: resp.academicSession || '2026-2027',
      }));

    return { day, slots: daySlots };
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
            Weekly Class Timetable
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Real-time scheduled teaching slots generated directly from your assigned academic responsibilities.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold">
          {responsibilities.length} Active Responsibility / Responsibilities
        </div>
      </div>

      {/* Empty State Banner when 0 Responsibilities */}
      {responsibilities.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-premium border border-outline-variant/15 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">event_busy</span>
          </div>
          <h3 className="font-headings font-extrabold text-xl text-secondary">
            No Weekly Timetable Scheduled
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            You do not have any active academic responsibilities assigned to your account by the System Administrator yet. 
            Once classes, sections, and subjects are allocated to you in the Admin Panel, your weekly timetable will generate automatically here.
          </p>
          <div className="pt-2">
            <span className="px-4 py-2 rounded-full bg-surface-container text-secondary text-xs font-mono font-bold border border-outline-variant/20 inline-block">
              Status: Awaiting Admin Assignment
            </span>
          </div>
        </div>
      ) : (
        /* Timetable Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeklySchedule.map((dayItem) => (
            <div
              key={dayItem.day}
              className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4 hover:border-primary/30 transition-all"
            >
              <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                <h3 className="font-headings font-extrabold text-base text-secondary">{dayItem.day}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                  {dayItem.slots.length} Lecture{dayItem.slots.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-3">
                {dayItem.slots.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant/70 italic py-2">No lectures scheduled for {dayItem.day}.</p>
                ) : (
                  dayItem.slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-outline-variant/15 bg-surface-container-lowest space-y-1 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded bg-primary/10 font-mono font-bold text-[10px] text-primary">
                          {slot.time}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">{slot.session}</span>
                      </div>
                      <h4 className="font-bold text-xs text-secondary mt-1">{slot.subject}</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {slot.className} &bull; Room: <strong className="text-secondary">{slot.room}</strong>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
