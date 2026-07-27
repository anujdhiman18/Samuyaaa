import React, { useEffect, useRef, useState } from 'react';
import { studentService } from '../services/api';

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
  const [liveStudents, setLiveStudents] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(3);

  const fetchLiveStudents = async () => {
    try {
      const data = await studentService.getStudents({ limit: 50 });
      if (data && data.students) {
        setLiveStudents(data.students);
        setTotalStudentsCount(data.total || data.students.length || 3);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLiveStudents();

    // Event listeners for real-time live sync when Admin Panel updates data
    const handleUpdate = () => fetchLiveStudents();
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Auto-polling interval for multi-tab sync
    const interval = setInterval(fetchLiveStudents, 3000);

    return () => {
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

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

  const defaultToppers = [
    'Damini Sharma (Class 10th) - Mathematics 100/100',
    'Rahul Gupta (Class 10th) - Mathematics Advanced 98/100',
    'Aryan Mehta (Class 11th) - Physics IIT-JEE 96/100',
  ];

  const topperList =
    liveStudents.length > 0
      ? liveStudents.map(
          (s) => `${s.fullName} (${s.className}) - Roll: ${s.rollNumber} (${s.status})`
        )
      : defaultToppers;

  return (
    <section id="results" ref={sectionRef} className="max-w-container-max mx-auto px-gutter py-16 md:py-24 font-body">
      <div className="text-center mb-16">
        <span className="text-primary font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
          The Proof is in the Progress
        </span>
        <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-on-surface mb-3">
          Wall of Excellence &amp; Live Student Roster
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
              Center Record Topper 2025
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

        {/* Live Enrolled Students Counter Card */}
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-baseline justify-center text-secondary font-headings font-extrabold text-4xl mb-1">
            <span>{countStat}</span>
            <span className="text-2xl">+</span>
          </div>
          <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Active Batch Enrolled Students
          </p>
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

        {/* Achievement Quote Card with Dynamic Toppers & Enrolled Students */}
        <div className="md:col-span-2 md:row-span-2 bg-surface-container-low border border-surface-container-high rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-md relative group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="Student Top Scorer"
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <span className="inline-block bg-secondary text-white px-3 py-1 rounded-md text-[10px] font-headings font-bold uppercase tracking-wider mb-2">
              🏆 Enrolled Students (Managed Live via Admin Panel)
            </span>
            <div className="font-headings font-bold text-sm text-on-surface mb-2 space-y-1">
              {topperList.slice(0, 4).map((line) => (
                <div key={line} className="text-xs font-semibold text-secondary flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant italic leading-relaxed mt-2">
              "Jitender sir's focus on logic instead of memorization made Organic Chemistry feel like a set of
              logical puzzles. My school score shot up from 72% to a massive 95% in pre-boards."
            </p>
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
