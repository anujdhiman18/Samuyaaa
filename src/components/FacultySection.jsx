import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { facultyService, getStoredFaculty, subscribeFirestoreCollection } from '../services/api';

const defaultFacultyList = [
  {
    id: 'f-founder',
    name: 'Jitender Sharma',
    designation: 'Founder & Master Physics Mentor',
    subject: 'Physics & Advanced Mechanics',
    qualification: 'M.Sc Physics, B.Ed (15+ Years Experience)',
    experience: '15+ Years Mentoring State Toppers & JEE/NEET Aspirants',
    photo_url: '/Unknown.jpg',
  },
  {
    id: 'f-math',
    name: 'Senior Mathematics Faculty',
    designation: 'HOD Mathematics',
    subject: 'Calculus, Algebra & Coordinate Geometry',
    qualification: 'M.Sc Mathematics (Gold Medalist)',
    experience: '12+ Years Competitive Exam Coaching',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'f-chem',
    name: 'Senior Chemistry Faculty',
    designation: 'Senior Faculty',
    subject: 'Organic & Physical Chemistry',
    qualification: 'M.Sc Chemistry, CSIR-NET Qualified',
    experience: '10+ Years NEET & Board Pedagogy',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'f-bio',
    name: 'Senior Biology Faculty',
    designation: 'Medical Wing Specialist',
    subject: 'Botany & Human Physiology',
    qualification: 'M.Sc Life Sciences',
    experience: '8+ Years NEET Medical Preparation',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
  },
];

export default function FacultySection() {
  const [faculty, setFaculty] = useState(() => {
    try {
      const list = getStoredFaculty();
      const active = list ? list.filter((f) => f.is_active !== false) : [];
      return active.length > 0 ? active : defaultFacultyList;
    } catch (e) {
      return defaultFacultyList;
    }
  });

  useEffect(() => {
    const unsubscribe = subscribeFirestoreCollection('faculty', [], (list) => {
      if (list && list.length > 0) {
        const active = list.filter((f) => f.is_active !== false);
        active.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
        if (active.length > 0) {
          setFaculty(active);
        }
      }
    });

    fetchFacultyFromAPI();
    return () => unsubscribe();
  }, []);

  const fetchFacultyFromAPI = async () => {
    try {
      const data = await facultyService.getFaculty();
      if (data && data.faculty && data.faculty.length > 0) {
        const active = data.faculty.filter((f) => f.is_active !== false);
        active.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
        if (active.length > 0) {
          setFaculty(active);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayedFaculty = faculty && faculty.length > 0 ? faculty : defaultFacultyList;

  return (
    <section id="faculty" className="apple-section-alt">
      <div className="apple-container">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#6e6e73] font-semibold text-xs tracking-wider uppercase mb-2 block">
            Academic Mentors
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#1d1d1f] mb-3">
            Distinguished Faculty Team
          </h2>
          <p className="text-[#6e6e73] text-sm md:text-base leading-relaxed">
            Every faculty member is handpicked through our rigorous multi-stage evaluation protocol to ensure conceptual clarity and inspiring pedagogy.
          </p>
        </div>

        {/* Faculty Card Grid: #ffffff on #f5f5f7, 22px radius, no hard borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedFaculty.map((member) => (
            <div
              key={member.id || member._id}
              className="apple-card-white p-6 flex flex-col justify-between h-full"
            >
              <div>
                {/* Circular Faculty Photo */}
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    loading="lazy"
                    className="w-24 h-24 rounded-full object-cover border border-[#d2d2d7] shadow-xs mx-auto"
                  />
                </div>

                {/* Name & Designation */}
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-lg text-[#1d1d1f] leading-snug">
                    {member.name}
                  </h3>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider">
                    {member.designation}
                  </span>
                </div>

                {/* Subject Pill */}
                <div className="mt-3 text-center">
                  <span className="px-3 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-xs font-semibold inline-block">
                    {member.subject}
                  </span>
                </div>
              </div>

              {/* Qualification & Experience */}
              <div className="mt-6 pt-4 border-t border-[#d2d2d7]/50 space-y-2 text-xs text-[#6e6e73]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3] shrink-0">school</span>
                  <span className="line-clamp-1 text-[#1d1d1f]" title={member.qualification}>
                    {member.qualification}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3] shrink-0">workspace_premium</span>
                  <span className="text-[#6e6e73]">{member.experience}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Join as Faculty Banner: Sleek Apple dark card (#1d1d1f) */}
        <div className="mt-16 bg-[#1d1d1f] text-[#f5f5f7] rounded-[24px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#424245] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-white/10 text-[#86868b] text-[11px] font-medium uppercase tracking-wider px-3 py-1 rounded-full inline-block">
              Career Opportunities
            </span>
            <h3 className="text-2xl md:text-3xl text-[#f5f5f7]">
              Are You a Passionate Educator? Join Our Faculty Team
            </h3>
            <p className="text-xs md:text-sm text-[#86868b] max-w-xl font-normal leading-relaxed">
              We are expanding our academic team. Apply today to teach top competitive JEE, NEET, Board &amp; Foundation batches with state-of-the-art facilities.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to="/faculty-application"
              className="apple-btn-primary px-7 py-3 text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
              Fill Faculty Application Form
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
