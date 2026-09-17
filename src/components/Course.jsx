import React, { useState, useEffect } from 'react';
import { courseFilters } from '../data.js';
import { subjectService } from '../services/api.js';

export default function Courses({ onOpenBooking }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [liveSubjects, setLiveSubjects] = useState([]);

  const fetchLiveSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      if (data && data.subjects && data.subjects.length > 0) {
        setLiveSubjects(data.subjects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLiveSubjects();

    const handleUpdate = () => fetchLiveSubjects();
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(fetchLiveSubjects, 20000);

    return () => {
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Group live subjects by distinct subject name to build clean course cards
  const distinctSubjectsMap = new Map();
  liveSubjects.forEach((sub) => {
    const sName = sub.name ? sub.name.trim() : '';
    if (sName && !distinctSubjectsMap.has(sName)) {
      distinctSubjectsMap.set(sName, {
        id: sub._id || sName,
        title: sName,
        teacherName: sub.teacherName || 'Jitender Sharma',
        description: sub.description || 'Comprehensive conceptual coaching and board exam preparation.',
        program: sName,
        icon: sName.toLowerCase().includes('math')
          ? 'functions'
          : sName.toLowerCase().includes('physic')
          ? 'bolt'
          : sName.toLowerCase().includes('chem')
          ? 'science'
          : sName.toLowerCase().includes('bio')
          ? 'biotech'
          : 'school',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
      });
    }
  });

  const displayCourses = Array.from(distinctSubjectsMap.values());

  const visibleCourses = displayCourses.filter((course) => {
    if (activeFilter === 'all') return true;
    const t = course.title.toLowerCase();
    if (activeFilter === 'math') return t.includes('math');
    if (activeFilter === 'science') return t.includes('physic') || t.includes('chem') || t.includes('bio') || t.includes('sci');
    if (activeFilter === 'english') return t.includes('eng') || t.includes('comm');
    return true;
  });

  return (
    <section id="courses" className="bg-[#BBDEFB]/25 border-y border-[#90CAF9]/30 py-16 md:py-24 font-body">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-[#D97706] font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
              Empowering Every Grade &bull; Live Batches
            </span>
            <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-[#0D47A1] mb-3">
              Our Academic Programs &amp; <span className="text-[#D97706]">Active Courses</span>
            </h2>
            <p className="text-[#1565C0] font-body text-sm md:text-base leading-relaxed">
              Managed live from the Admin Control Panel. Small batch sizes with individual focus by Jitender Sharma &amp; Expert Faculty.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto bg-white p-1.5 rounded-2xl border border-[#90CAF9]/30 shadow-premium">
            {courseFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-xl font-headings font-semibold text-xs transition-all duration-200 cursor-pointer ${
                  activeFilter === filter.id
                    ? 'bg-[#0D47A1] text-white shadow-premium'
                    : 'text-[#1976D2] hover:text-[#0D47A1]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map((course) => (
            <div
              key={course.id}
              className="course-card bg-white rounded-2xl p-6 shadow-premium hover:shadow-premium-hover border border-[#90CAF9]/30 flex flex-col hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-[#E3F2FD] flex items-center justify-center rounded-xl mb-4 border border-[#90CAF9]/40">
                <span className="material-symbols-outlined text-[#0D47A1] text-[24px]">
                  {course.icon}
                </span>
              </div>

              <h3 className="font-headings font-bold text-xl text-[#0D47A1] mb-2">{course.title}</h3>

              {course.teacherName && (
                <div className="flex items-center gap-1.5 text-xs text-[#1976D2] font-semibold mb-3">
                  <span className="material-symbols-outlined text-[#1976D2] text-[16px]">person</span>
                  <span>{course.teacherName}</span>
                </div>
              )}

              <p className="text-[#0D1B2A] font-body text-sm leading-relaxed mb-6 flex-grow">
                {course.description}
              </p>

              <div className="border-t border-[#90CAF9]/30 pt-4 mt-auto flex justify-end items-center">
                <button
                  onClick={() => onOpenBooking(course.program)}
                  className="bg-[#0D47A1] text-white hover:bg-[#1565C0] px-6 py-2.5 rounded-full font-headings font-bold text-xs transition-all duration-300 shadow-premium flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Enquire Now</span>
                  <span className="material-symbols-outlined text-[16px] text-white">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
