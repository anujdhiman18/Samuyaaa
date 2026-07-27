import React, { useState, useEffect } from 'react';
import { courses as defaultCourses, courseFilters } from '../data.js';
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
    const interval = setInterval(fetchLiveSubjects, 3000);

    return () => {
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const displayCourses =
    liveSubjects.length > 0
      ? liveSubjects.map((sub, idx) => ({
          id: sub._id || `live-${idx}`,
          title: sub.name,
          category: sub.className ? sub.className.toLowerCase() : '10th',
          tags: [`Class ${sub.className}`, `${sub.totalEnrolled || 15}+ Enrolled`, sub.teacherName || 'Jitender Sharma'],
          description: sub.description || 'Comprehensive conceptual coaching and board exam preparation.',
          batch: sub.batchTime || '5:00 PM - 6:30 PM',
          program: sub.name,
          icon: 'school',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
        }))
      : defaultCourses;

  const visibleCourses = displayCourses.filter(
    (course) => activeFilter === 'all' || course.category.includes(activeFilter.toLowerCase())
  );

  return (
    <section id="courses" className="bg-surface-container-low border-y border-outline-variant/15 py-16 md:py-24 font-body">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-secondary font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
              Empowering Every Grade &bull; Live Batches
            </span>
            <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-on-surface mb-3">
              Our Academic Programs &amp; Active Subjects
            </h2>
            <p className="text-on-surface-variant font-body text-sm md:text-base leading-relaxed">
              Managed live from the Admin Control Panel. Small batch sizes with individual focus by Jitender Sharma.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto bg-white p-1.5 rounded-2xl border border-outline-variant/15 shadow-sm">
            {courseFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-xl font-headings font-semibold text-xs transition-all ${
                  activeFilter === filter.id
                    ? 'bg-secondary text-white shadow-tactile-btn'
                    : 'text-on-surface-variant hover:text-on-surface'
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
              className="course-card bg-white rounded-2xl p-6 shadow-premium hover:shadow-premium-hover border border-outline-variant/15 flex flex-col hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className={`w-12 h-12 ${course.iconBg} flex items-center justify-center rounded-xl mb-6`}>
                <span className={`material-symbols-outlined ${course.iconColor} text-[24px]`}>
                  {course.icon}
                </span>
              </div>
              <h3 className="font-headings font-bold text-xl text-on-surface mb-2">{course.title}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full font-body text-xs font-semibold border border-outline-variant/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-6 flex-grow">
                {course.description}
              </p>
              <div className="border-t border-outline-variant/15 pt-4 mt-auto flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Batch Time
                  </span>
                  <span className="font-body text-xs font-semibold text-secondary">{course.batch}</span>
                </div>
                <button
                  onClick={() => onOpenBooking(course.program)}
                  className="bg-primary text-white hover:bg-primary-container px-4 py-2 rounded-full font-headings font-bold text-xs transition-colors shadow-tactile-btn shadow-premium"
                >
                  Enquire Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
