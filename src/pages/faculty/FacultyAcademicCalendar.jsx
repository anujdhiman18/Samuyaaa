import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const mockEvents = [
  { id: 'ev_1', title: 'Mid-Term Examinations 2026', date: '2026-09-15 to 2026-09-25', category: 'EXAM', scope: 'Institute Wide' },
  { id: 'ev_2', title: 'Parent-Teacher Meeting (PTM)', date: '2026-08-20', category: 'EVENT', scope: 'All Batches' },
  { id: 'ev_3', title: 'Annual Science & Tech Fair', date: '2026-10-05', category: 'ACADEMIC', scope: 'Science Dept' },
  { id: 'ev_4', title: 'Independence Day Holiday', date: '2026-08-15', category: 'HOLIDAY', scope: 'Institute Closed' },
];

export default function FacultyAcademicCalendar() {
  const [events, setEvents] = useState(mockEvents);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const { addToast } = useToast();

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!title || !date) return;
    const newEv = {
      id: 'ev_' + Date.now(),
      title,
      date,
      category,
      scope: 'Institute Wide',
    };
    setEvents([newEv, ...events]);
    addToast(`Added "${title}" to Academic Calendar!`, 'success');
    setShowModal(false);
    setTitle('');
    setDate('');
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'EXAM':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">📝 Exam Schedule</span>;
      case 'HOLIDAY':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">🌴 Holiday</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">📅 Academic Event</span>;
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-headings font-bold text-[10px] uppercase tracking-wider border border-amber-200">
            ⚡ Academic Coordinator / HOD Power
          </span>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
            Institute Academic Calendar &amp; Exam Timetable
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage academic terms, examination schedules, institute events, holidays, and classroom allocations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2 shadow-md hover:bg-primary-container cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_event</span>
          Add Calendar Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <div key={ev.id} className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-3 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              {getCategoryBadge(ev.category)}
              <span className="font-mono text-xs text-on-surface-variant font-bold">{ev.scope}</span>
            </div>
            <h3 className="font-headings font-extrabold text-base text-secondary">{ev.title}</h3>
            <p className="font-mono text-xs text-primary font-bold">📆 Date(s): {ev.date}</p>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddEvent} className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 font-body text-xs">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-3">
              <h3 className="font-headings font-extrabold text-lg text-secondary">Add Academic Calendar Event</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="font-bold text-secondary block mb-1">Event Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Term 1 Final Examinations"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="font-bold text-secondary block mb-1">Date / Duration *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2026-09-20 to 2026-09-30"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-secondary block mb-1">Event Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
              >
                <option value="ACADEMIC">Academic Event</option>
                <option value="EXAM">Examination Schedule</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 font-bold"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-bold shadow-md">
                Publish to Calendar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
