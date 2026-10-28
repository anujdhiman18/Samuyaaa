import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courses as defaultCourses, courseFilters } from '../data.js';
import { subjectService } from '../services/api.js';

export default function Courses() {
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
          : sName.toLowerCase().includes('homework') || sName.toLowerCase().includes('home work')
          ? 'assignment'
          : 'school',
      });
    }
  });

  const baseCourses = distinctSubjectsMap.size > 0
    ? Array.from(distinctSubjectsMap.values())
    : defaultCourses.map((c) => ({
        id: c.id,
        title: c.title,
        teacherName: 'Jitender Sharma',
        description: c.description,
        program: c.program,
        icon: c.icon,
      }));

  const visibleCourses = baseCourses.filter((course) => {
    if (activeFilter === 'all') return true;
    const t = course.title.toLowerCase();
    if (activeFilter === 'math') return t.includes('math');
    if (activeFilter === 'science') return t.includes('physic') || t.includes('chem') || t.includes('bio') || t.includes('sci');
    if (activeFilter === 'english') return t.includes('eng') || t.includes('comm');
    if (activeFilter === 'homework') return t.includes('homework') || t.includes('home work');
    return true;
  });

  return (
    <section id="courses" className="apple-section-alt">
      <div className="apple-container">
        {/* Section Header & Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-[#6e6e73] font-semibold text-xs tracking-wider uppercase mb-2 block">
              Empowering Every Grade • Active Batches
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#1d1d1f] mb-3">
              Academic Programs &amp; Courses
            </h2>
            <p className="text-[#6e6e73] text-sm md:text-base leading-relaxed">
              Personalized small batch sizes with conceptual clarity led by Jitender Sharma &amp; Expert Faculty.
            </p>
          </div>

          {/* Filter Pills (Apple Segmented Style) */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#d2d2d7]">
            {courseFilters.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    active
                      ? 'bg-[#0071e3] text-white shadow-xs'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course Cards Grid: #ffffff on #f5f5f7, 22px radius, no hard borders, soft neutral shadows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map((course) => (
            <div
              key={course.id}
              className="apple-card-white p-7 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-5 text-[#0071e3]">
                  <span className="material-symbols-outlined text-[24px]">
                    {course.icon}
                  </span>
                </div>

                <h3 className="font-semibold text-xl text-[#1d1d1f] mb-2 tracking-[-0.015em]">
                  {course.title}
                </h3>

                {course.teacherName && (
                  <div className="flex items-center gap-1.5 text-xs text-[#6e6e73] font-medium mb-3">
                    <span className="material-symbols-outlined text-[16px] text-[#6e6e73]">person</span>
                    <span>{course.teacherName}</span>
                  </div>
                )}

                <p className="text-[#6e6e73] text-sm leading-relaxed mb-6">
                  {course.description}
                </p>
              </div>

              <div className="border-t border-[#d2d2d7]/50 pt-5 mt-auto flex justify-between items-center">
                <span className="text-xs font-medium text-[#86868b]">
                  {course.program || 'Active Batch'}
                </span>
                <Link
                  to={`/student-application?subject=${encodeURIComponent(course.title)}`}
                  className="apple-btn-primary px-5 py-2 text-xs"
                >
                  <span>Enquire</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
