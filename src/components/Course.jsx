import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courses as defaultCourses, courseFilters } from '../data.js';
import { subjectService } from '../services/api.js';

const OTHER_SUBJECT_COURSE = {
  id: 'custom-other-offering',
  title: 'Other Subjects & Custom Requests',
  teacherName: 'Jitender Sharma & Expert Faculty',
  description:
    'Need coaching in a subject or curriculum not listed above? We offer customized 1-on-1 and small batch coaching for any curriculum, language, or competitive exam (e.g. Sanskrit, Economics, Accounts, Regional Languages, Computer Applications, Olympiads, and more). Apply now to request your subject!',
  program: 'Personalized Coaching Track',
  icon: 'edit_note',
  iconBg: 'bg-amber-100',
  iconColor: 'text-[#D97706]',
  badge: 'Any Subject Available',
  isCustom: true,
};

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
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        isCustom: false,
      });
    }
  });

  // Fallback to default catalog if live subjects haven't loaded
  const baseCourses = distinctSubjectsMap.size > 0
    ? Array.from(distinctSubjectsMap.values())
    : defaultCourses.filter((c) => c.id !== 'other').map((c) => ({
        id: c.id,
        title: c.title,
        teacherName: 'Jitender Sharma',
        description: c.description,
        program: c.program,
        icon: c.icon,
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        isCustom: false,
      }));

  const filteredStandardCourses = baseCourses.filter((course) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'other') return false;
    const t = course.title.toLowerCase();
    if (activeFilter === 'math') return t.includes('math');
    if (activeFilter === 'science') return t.includes('physic') || t.includes('chem') || t.includes('bio') || t.includes('sci');
    if (activeFilter === 'english') return t.includes('eng') || t.includes('comm');
    if (activeFilter === 'homework') return t.includes('homework') || t.includes('home work');
    return true;
  });

  // Always show Other / Custom offering on 'all' and 'other' tabs
  const coursesToRender = activeFilter === 'other'
    ? [OTHER_SUBJECT_COURSE]
    : activeFilter === 'all'
    ? [...filteredStandardCourses, OTHER_SUBJECT_COURSE]
    : filteredStandardCourses;

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
              Managed live from the Admin Control Panel. Small batch sizes with individual focus by Jitender Sharma &amp; Expert Faculty. Can't find your subject? Apply for any subject below!
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
          {coursesToRender.map((course) => {
            const isCustomCard = course.isCustom;
            return (
              <div
                key={course.id}
                className={`course-card rounded-2xl p-6 shadow-premium hover:shadow-premium-hover flex flex-col hover:-translate-y-1.5 transition-all duration-300 ${
                  isCustomCard
                    ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 border-2 border-amber-400/80 hover:border-amber-500 shadow-md ring-2 ring-amber-400/20'
                    : 'bg-white border border-[#90CAF9]/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-xl border ${
                      isCustomCard
                        ? 'bg-amber-100 border-amber-300 text-[#D97706]'
                        : 'bg-[#E3F2FD] border-[#90CAF9]/40 text-[#0D47A1]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {course.icon}
                    </span>
                  </div>

                  {isCustomCard && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-headings font-extrabold tracking-wide uppercase bg-[#D97706] text-white shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>Any Subject Available</span>
                    </span>
                  )}
                </div>

                <h3 className="font-headings font-bold text-xl text-[#0D47A1] mb-2">{course.title}</h3>

                {course.teacherName && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${
                      isCustomCard ? 'text-[#D97706]' : 'text-[#1976D2]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>{course.teacherName}</span>
                  </div>
                )}

                <p className="text-[#0D1B2A] font-body text-sm leading-relaxed mb-6 flex-grow">
                  {course.description}
                </p>

                <div
                  className={`border-t pt-4 mt-auto flex justify-between items-center ${
                    isCustomCard ? 'border-amber-200' : 'border-[#90CAF9]/30'
                  }`}
                >
                  <span className="text-[11px] font-bold text-on-surface-variant/70">
                    {isCustomCard ? 'All Grades & Curriculums' : course.program || 'Active Batch'}
                  </span>

                  <Link
                    to={isCustomCard ? '/student-application?subject=Other' : `/student-application?subject=${encodeURIComponent(course.title)}`}
                    className={`px-5 py-2.5 rounded-full font-headings font-bold text-xs transition-all duration-300 shadow-premium flex items-center gap-1.5 ${
                      isCustomCard
                        ? 'bg-[#D97706] text-white hover:bg-[#B45309]'
                        : 'bg-[#0D47A1] text-white hover:bg-[#1565C0]'
                    }`}
                  >
                    <span>{isCustomCard ? 'Apply for Other Subject' : 'Enquire Now'}</span>
                    <span className="material-symbols-outlined text-[16px] text-white">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Subject Offering Banner */}
        <div className="mt-12 bg-gradient-to-r from-white via-amber-50/50 to-white border-2 border-amber-300/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-premium">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-[#D97706]">
              <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-headings font-bold text-lg sm:text-xl text-[#0D47A1]">
                  Need Coaching in Any Subject Not Listed Here?
                </h3>
                <span className="bg-[#D97706] text-white text-[10px] font-headings font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Open For All
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#0D1B2A]/85 max-w-2xl leading-relaxed">
                Can't find your subject or board curriculum? Saumyaa Studies provides personalized coaching and dedicated faculty for <strong>any subject upon request</strong> — including Sanskrit, Economics, Accountancy, Business Studies, Computer Science / IT, Regional Languages, or Specialized Competitive &amp; Olympiad preparation.
              </p>
            </div>
          </div>
          <Link
            to="/student-application?subject=Other"
            className="bg-[#D97706] hover:bg-[#B45309] text-white font-headings font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-premium shrink-0 flex items-center gap-2"
          >
            <span>Apply for Other Subject</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
