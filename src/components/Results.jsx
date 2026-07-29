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

export default function Results() {
  const sectionRef = useRef(null);
  const [animate, setAnimate] = useState(false);
  const [toppers, setToppers] = useState(initialMockToppers);
  const [totalStudentsCount, setTotalStudentsCount] = useState(1);

  useEffect(() => {
    // Real-Time Firebase Firestore listener for Toppers
    const unsubscribeToppers = subscribeFirestoreCollection('toppers', initialMockToppers, (list) => {
      if (list && list.length > 0) {
        const active = list.filter((t) => t.is_active !== false);
        active.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
        setToppers(active);
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

  const featuredTopper = toppers[0] || initialMockToppers[0];

  return (
    <section id="results" ref={sectionRef} className="max-w-container-max mx-auto px-gutter py-16 md:py-24 font-body">
      <div className="text-center mb-16">
        <span className="text-primary font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
          The Proof is in the Progress
        </span>
        <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-on-surface mb-3">
          Wall of Excellence &amp; Board Toppers
        </h2>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[160px]">
        {/* Highlight Feature Card */}
        <div className="md:col-span-2 md:row-span-3 bg-gradient-to-br from-primary to-primary-container rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-premium group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-20 -translate-y-20 transition-all duration-700 group-hover:scale-110" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/15 rounded-full transition-all duration-700 group-hover:scale-105" />

          <div className="relative z-10">
            <span className="bg-white/20 text-white text-[10px] font-headings font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
              Center Record Topper
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="font-headings font-extrabold text-6xl md:text-7xl leading-none tracking-tighter">
                {mainStat}
              </span>
              <span className="font-headings font-bold text-3xl">%</span>
            </div>
            <h3 className="font-headings font-bold text-xl md:text-2xl mt-3 mb-2 text-surface">
              Highest HPBOSE Board Score
            </h3>
            <p className="font-body text-sm text-surface-container/90 leading-relaxed max-w-sm">
              Our top student Aditya Sharma scored a spectacular 95.4% in HPBOSE Class 10 Boards, recording
              100/100 in Mathematics.
            </p>
          </div>
        </div>


        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-tertiary font-headings font-extrabold text-4xl mb-1">
            <span>{improveStat}</span>
            <span>%</span>
          </div>
          <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Avg. Grade Boost in 3 Months
          </p>
        </div>

        {/* Dynamic Topper Students Managed via Admin Panel Card */}
        <div className="md:col-span-2 md:row-span-2 bg-surface-container-low border border-surface-container-high rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-md relative group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={featuredTopper?.student_name || 'Topper Student'}
              src={featuredTopper?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <span className="inline-block bg-amber-600 text-white px-3 py-1 rounded-md text-[10px] font-headings font-bold uppercase tracking-wider mb-2">
              🏆 TOPPER STUDENTS (MANAGED LIVE VIA ADMIN PANEL)
            </span>
            <div className="font-headings font-bold text-sm text-on-surface mb-2 space-y-1">
              {toppers.slice(0, 4).map((t) => (
                <div key={t._id || t.id} className="text-xs font-semibold text-secondary flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">emoji_events</span>
                  <span>
                    <strong className="text-primary">{t.student_name}</strong> ({t.exam_name}) – <span className="text-emerald-700 font-extrabold">{t.score}</span>
                  </span>
                </div>
              ))}
            </div>
            {featuredTopper?.quote && (
              <p className="text-xs text-on-surface-variant italic leading-relaxed mt-2">
                "{featuredTopper.quote}"
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-primary font-headings font-extrabold text-4xl mb-1">
            <span>15</span>
            <span className="text-xl text-on-surface-variant font-medium mx-1">:</span>
            <span>1</span>
          </div>
          <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Student-Teacher Ratio Max
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-secondary font-headings font-extrabold text-4xl mb-1">
            <span>{clearsStat}</span>
            <span>%</span>
          </div>
          <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Board Exam Passing Distinction
          </p>
        </div>
      </div>
    </section>
  );
}
