import React, { useEffect, useRef, useState } from 'react';
import { studentService, subscribeFirestoreCollection, initialMockToppers } from '../services/api';

function useCountUp(target, animate, { decimal = false, duration = 1500 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!animate) return;
    const stepTime = 15;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setValue(decimal ? Number(current.toFixed(1)) : Math.floor(current));
    }, stepTime);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, target]);

  return value;
}

const defaultToppersList = [
  {
    id: 'top-1',
    student_name: 'Aditya Sharma',
    exam_name: 'HPBOSE 10th Board',
    score: '95.4% (100/100 Math)',
    quote: 'Jitender Sir’s concept-driven pedagogy transformed physics and math from stressful topics into my highest scoring subjects.',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: 'top-2',
    student_name: 'Priyanka Thakur',
    exam_name: 'CBSE 12th Board',
    score: '96.2%',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  },
  {
    id: 'top-3',
    student_name: 'Rohit Verma',
    exam_name: 'JEE Main Qualifier',
    score: '99.1 Percentile',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  },
  {
    id: 'top-4',
    student_name: 'Ananya Rana',
    exam_name: 'NEET Qualifier',
    score: '645/720',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
];

export default function Results() {
  const sectionRef = useRef(null);
  const [animate, setAnimate] = useState(false);
  const [toppers, setToppers] = useState(() => {
    try {
      const list = initialMockToppers;
      return list && list.length > 0 ? list : defaultToppersList;
    } catch (e) {
      return defaultToppersList;
    }
  });
  const [totalStudentsCount, setTotalStudentsCount] = useState(1);

  useEffect(() => {
    // Real-time listener for Toppers data (synced from MongoDB via localStorage cache)
    const unsubscribeToppers = subscribeFirestoreCollection('toppers', initialMockToppers, (list) => {
      if (list && list.length > 0) {
        const active = list.filter((t) => t.is_active !== false);
        active.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
        if (active.length > 0) {
          setToppers(active);
        }
      }
    });

    fetchStudentCount();
    return () => unsubscribeToppers();
  }, []);

  const fetchStudentCount = async () => {
    try {
      const data = await studentService.getStudents({ limit: 50 });
      if (data && data.students) {
        setTotalStudentsCount(data.students.length || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setAnimate(true);
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const mainStat = useCountUp(95.4, animate, { decimal: true });
  const countStat = useCountUp(totalStudentsCount, animate);
  const improveStat = useCountUp(15, animate);
  const clearsStat = useCountUp(92, animate);

  const featuredTopper = toppers[0] || defaultToppersList[0];

  return (
    <section id="results" ref={sectionRef} className="max-w-container-max mx-auto px-gutter py-16 md:py-24 font-body">
      <div className="text-center mb-16">
        <span className="text-[#D97706] font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
          The Proof is in the Progress
        </span>
        <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-[#0D47A1] mb-3">
          Wall of <span className="text-[#D97706]">Excellence</span> &amp; Board Toppers
        </h2>
        <div className="w-16 h-1 bg-[#D97706] mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[160px]">
        {/* Highlight Feature Card */}
        <div className="md:col-span-2 md:row-span-3 bg-gradient-to-br from-[#0D47A1] to-[#0A192F] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-premium group border border-[#90CAF9]/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-20 -translate-y-20 transition-all duration-700 group-hover:scale-110 pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full transition-all duration-700 group-hover:scale-105 pointer-events-none" />

          <div className="relative z-10">
            <span className="bg-white/10 text-[#E3F2FD] text-[10px] font-headings font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
              Center Record Topper
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="font-headings font-extrabold text-6xl md:text-7xl leading-none tracking-tighter text-white">
                {mainStat}
              </span>
              <span className="font-headings font-bold text-3xl text-white/90">%</span>
            </div>
            <h3 className="font-headings font-bold text-xl md:text-2xl mt-3 mb-2 text-white">
              Highest <span className="text-[#FBBF24]">HPBOSE Board Score</span>
            </h3>
            <p className="font-body text-sm text-white/90 leading-relaxed max-w-sm font-normal">
              Our top student Aditya Sharma scored a spectacular 95.4% in HPBOSE Class 10 Boards, recording
              100/100 in Mathematics.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-[#90CAF9]/30 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-[#0D47A1] font-headings font-extrabold text-4xl mb-1">
            <span>{improveStat}</span>
            <span>%</span>
          </div>
          <p className="font-body text-xs font-semibold text-[#1565C0] uppercase tracking-wider">
            Avg. Grade Boost in 3 Months
          </p>
        </div>

        {/* Dynamic Topper Students Managed via Admin Panel Card */}
        <div className="md:col-span-2 md:row-span-2 bg-white border border-[#90CAF9]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-[#90CAF9]/40 shadow-premium relative group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={featuredTopper?.student_name || 'Topper Student'}
              src={featuredTopper?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <span className="inline-flex items-center gap-1 bg-[#E3F2FD] text-[#D97706] border border-[#90CAF9]/40 px-3 py-1 rounded-md text-[10px] font-headings font-semibold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[13px] text-[#D97706]">emoji_events</span>
              Academic Achievers
            </span>
            <div className="font-headings font-bold text-sm text-[#0D1B2A] mb-2 space-y-1">
              {toppers.slice(0, 4).map((t) => (
                <div key={t._id || t.id} className="text-xs font-semibold text-[#0D1B2A] flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-[14px] text-[#D97706]">emoji_events</span>
                  <span>
                    <strong className="text-[#0D47A1]">{t.student_name}</strong> ({t.exam_name}) – <span className="text-[#D97706] font-bold">{t.score}</span>
                  </span>
                </div>
              ))}
            </div>
            {featuredTopper?.quote && (
              <p className="text-xs text-[#1565C0] italic leading-relaxed mt-2">
                "{featuredTopper.quote}"
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-[#90CAF9]/30 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-[#0D47A1] font-headings font-extrabold text-4xl mb-1">
            <span>15</span>
            <span className="text-xl text-[#1976D2] font-medium mx-1">:</span>
            <span>1</span>
          </div>
          <p className="font-body text-xs font-semibold text-[#1565C0] uppercase tracking-wider">
            Student-Teacher Ratio Max
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-[#90CAF9]/30 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-[#0D47A1] font-headings font-extrabold text-4xl mb-1">
            <span>{clearsStat}</span>
            <span>%</span>
          </div>
          <p className="font-body text-xs font-semibold text-[#1565C0] uppercase tracking-wider">
            Board Exam Passing Distinction
          </p>
        </div>
      </div>
    </section>
  );
}
