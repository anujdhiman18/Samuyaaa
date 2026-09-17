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

    fetchActiveFaculty();
    return () => unsubscribe();
  }, []);

  const fetchActiveFaculty = async () => {
    try {
      const res = await facultyService.getFaculty({ activeOnly: true });
      if (res && res.faculty && res.faculty.length > 0) {
        setFaculty(res.faculty);
      }
    } catch (err) {
      console.warn('Error fetching faculty for public website:', err);
    }
  };

  const displayedFaculty = faculty && faculty.length > 0 ? faculty : defaultFacultyList;

  return (
    <section id="faculty" className="py-16 md:py-24 bg-surface relative overflow-hidden font-body">
      {/* Decorative accent blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0D47A1]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1976D2]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-container-max mx-auto px-gutter">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-headings text-xs font-extrabold uppercase tracking-[0.2em] text-[#D97706] px-3.5 py-1 rounded-full bg-[#E3F2FD] border border-[#90CAF9]/40 inline-block mb-3">
            Distinguished Educators
          </span>
          <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-[#0D47A1] tracking-tight">
            Meet Our <span className="text-[#D97706]">Distinguished Faculty</span>
          </h2>
          <p className="text-sm text-[#1565C0] mt-3 leading-relaxed font-medium">
            Learn from IITians, Ph.D. scholars, and veteran academic mentors dedicated to radiating knowledge and cognitive excellence.
          </p>
        </div>

        {/* Faculty Responsive Card Grid (1 col Mobile, 2 col Tablet, 4 col Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedFaculty.map((member) => (
            <div
              key={member.id || member._id}
              className="group bg-white rounded-3xl p-6 border border-[#90CAF9]/30 shadow-premium hover:shadow-premium-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                {/* Circular Faculty Photo with Subtle Aura */}
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-[#1976D2]/15 blur-md group-hover:blur-lg transition-all duration-300" />
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    loading="lazy"
                    className="relative w-24 h-24 rounded-full object-cover border-2 border-[#BBDEFB] shadow-premium mx-auto group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Name & Designation */}
                <div className="text-center space-y-1">
                  <h3 className="font-headings font-extrabold text-lg text-[#0D47A1] leading-snug group-hover:text-[#D97706] transition-colors duration-200">
                    {member.name}
                  </h3>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[11px] font-headings font-bold uppercase tracking-wider">
                    {member.designation}
                  </span>
                </div>

                {/* Subject Pill */}
                <div className="mt-3 text-center">
                  <span className="px-3 py-1 rounded-full bg-[#BBDEFB]/40 text-[#0D47A1] text-xs font-semibold inline-block">
                    {member.subject}
                  </span>
                </div>
              </div>

              {/* Qualification & Experience Details */}
              <div className="mt-5 pt-4 border-t border-[#90CAF9]/30 space-y-2 text-xs text-[#1565C0] font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#D97706] shrink-0">school</span>
                  <span className="line-clamp-1 text-[#0D1B2A]" title={member.qualification}>
                    {member.qualification}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#D97706] shrink-0">workspace_premium</span>
                  <span className="text-[#0D1B2A]">{member.experience}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Join as Faculty CTA Banner */}
        <div className="mt-14 bg-gradient-to-r from-[#0D47A1] to-[#0A192F] text-white rounded-3xl p-8 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-[#90CAF9]/30">
          <div className="space-y-2 text-center md:text-left z-10">
            <span className="bg-white/10 text-[#E3F2FD] font-headings font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border border-white/20 inline-block">
              Career Opportunities
            </span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-white">
              Are You a Passionate Educator? <span className="text-[#FBBF24]">Join Our Faculty Team!</span>
            </h3>
            <p className="text-xs md:text-sm text-white/90 max-w-xl font-normal">
              We are expanding our academic team. Apply today to teach top competitive JEE, NEET, Board &amp; Foundation batches with state-of-the-art facilities.
            </p>
          </div>
          <div className="z-10 shrink-0">
            <Link
              to="/faculty-application"
              className="bg-white text-[#0D47A1] hover:bg-[#E3F2FD] font-headings font-bold text-xs px-7 py-3.5 rounded-full shadow-premium hover:shadow-premium-hover transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0D47A1]">assignment_ind</span>
              Fill Faculty Application Form
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
