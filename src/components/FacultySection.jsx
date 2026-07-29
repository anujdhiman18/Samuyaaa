import React, { useState, useEffect } from 'react';
import { facultyService } from '../services/api';

export default function FacultySection() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveFaculty();
  }, []);

  const fetchActiveFaculty = async () => {
    try {
      const res = await facultyService.getFaculty({ activeOnly: true });
      if (res && res.faculty) {
        setFaculty(res.faculty);
      }
    } catch (err) {
      console.warn('Error fetching faculty for public website:', err);
    } finally {
      setLoading(false);
    }
  };

  // If loading, show skeleton cards
  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-surface-container-low/40 relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center max-w-2xl mx-auto mb-12 animate-pulse space-y-3">
            <div className="w-32 h-4 bg-slate-200 rounded-full mx-auto" />
            <div className="w-64 h-8 bg-slate-200 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse bg-white/60 p-6 rounded-3xl h-72 border border-outline-variant/15 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto" />
                <div className="w-32 h-4 bg-slate-200 rounded mx-auto" />
                <div className="w-24 h-3 bg-slate-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Hide section automatically if there are no active faculty members
  if (faculty.length === 0) {
    return null;
  }

  return (
    <section id="faculty" className="py-16 md:py-24 bg-surface-container-low/50 relative overflow-hidden font-body">
      {/* Decorative accent blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-container-max mx-auto px-gutter">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-headings text-xs font-extrabold uppercase tracking-[0.2em] text-primary px-3.5 py-1 rounded-full bg-primary/10 inline-block mb-3">
            Distinguished Educators
          </span>
          <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-secondary tracking-tight">
            Meet Our Faculty
          </h2>
          <p className="text-sm text-on-surface-variant mt-3 leading-relaxed font-medium">
            Learn from IITians, Ph.D. scholars, and veteran academic mentors dedicated to radiating knowledge and cognitive excellence.
          </p>
        </div>

        {/* Faculty Responsive Card Grid (1 col Mobile, 2 col Tablet, 4 col Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {faculty.map((member) => (
            <div
              key={member.id || member._id}
              className="group bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/15 shadow-premium hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                {/* Circular Faculty Photo with Glow */}
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 blur-md group-hover:blur-lg transition-all" />
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="relative w-24 h-24 rounded-full object-cover border-3 border-white shadow-md mx-auto group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Name & Designation */}
                <div className="text-center space-y-1">
                  <h3 className="font-headings font-extrabold text-lg text-secondary leading-snug group-hover:text-primary transition-colors">
                    {member.name}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-headings font-bold uppercase tracking-wider">
                    {member.designation}
                  </span>
                </div>

                {/* Subject Pill */}
                <div className="mt-3 text-center">
                  <span className="px-3 py-1 rounded-full bg-primary-fixed/40 text-primary text-xs font-semibold inline-block">
                    {member.subject}
                  </span>
                </div>
              </div>

              {/* Qualification & Experience Details */}
              <div className="mt-5 pt-4 border-t border-outline-variant/15 space-y-2 text-xs text-on-surface-variant font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">school</span>
                  <span className="line-clamp-1" title={member.qualification}>
                    {member.qualification}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">workspace_premium</span>
                  <span>{member.experience}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
