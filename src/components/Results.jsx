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
  }, [animate, target, decimal, duration]);

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
  const improveStat = useCountUp(15, animate);
  const clearsStat = useCountUp(92, animate);

  const featuredTopper = toppers[0] || defaultToppersList[0];

  return (
    <section id="results" ref={sectionRef} className="apple-section-dark">
      <div className="apple-container">
        <div className="text-center mb-16">
          <span className="text-[#2997ff] font-semibold text-xs tracking-wider uppercase mb-2 block">
            The Proof is in the Progress
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#f5f5f7] mb-3">
            Wall of Excellence &amp; Board Toppers
          </h2>
          <p className="text-sm sm:text-base text-[#86868b] max-w-xl mx-auto">
            Decade-long legacy of academic milestones and top rankers coached by Jitender Sharma.
          </p>
        </div>

        {/* Bento Grid: #1d1d1f cards on #000000, 22px radius, #424245 subtle borders */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[160px]">
          {/* Highlight Card */}
          <div className="md:col-span-2 md:row-span-3 apple-card-dark p-8 flex flex-col justify-between">
            <div>
              <span className="bg-white/10 text-[#86868b] text-[11px] font-medium uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                Center Record Topper
              </span>
            </div>

            <div className="mt-auto">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl md:text-7xl font-semibold leading-none tracking-[-0.03em] text-[#f5f5f7]">
                  {mainStat}
                </span>
                <span className="text-3xl font-normal text-[#86868b]">%</span>
              </div>
              <h3 className="text-xl md:text-2xl mt-4 mb-2 text-[#f5f5f7]">
                Highest HPBOSE Board Score
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed max-w-sm">
                Our top student Aditya Sharma scored a spectacular 95.4% in HPBOSE Class 10 Boards, recording
                100/100 in Mathematics.
              </p>
            </div>
          </div>

          {/* Metric 1 */}
          <div className="apple-card-dark p-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-baseline justify-center text-[#2997ff] text-4xl font-semibold mb-1">
              <span>{improveStat}</span>
              <span>%</span>
            </div>
            <p className="text-xs text-[#86868b] uppercase tracking-wider font-medium">
              Avg. Grade Boost in 3 Months
            </p>
          </div>

          {/* Topper Student Showcase */}
          <div className="md:col-span-2 md:row-span-2 apple-card-dark p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-[#424245]">
              <img
                className="w-full h-full object-cover"
                alt={featuredTopper?.student_name || 'Topper Student'}
                src={featuredTopper?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              />
            </div>
            <div className="flex-grow text-center md:text-left">
              <span className="inline-flex items-center gap-1 bg-white/10 text-[#2997ff] px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[13px]">emoji_events</span>
                Academic Achievers
              </span>
              <div className="text-xs text-[#f5f5f7] mb-2 space-y-1">
                {toppers.slice(0, 4).map((t) => (
                  <div key={t._id || t.id} className="flex items-center gap-1.5 justify-center md:justify-start">
                    <span className="material-symbols-outlined text-[14px] text-[#2997ff]">check</span>
                    <span>
                      <strong className="text-[#f5f5f7] font-semibold">{t.student_name}</strong> ({t.exam_name}) — <span className="text-[#2997ff]">{t.score}</span>
                    </span>
                  </div>
                ))}
              </div>
              {featuredTopper?.quote && (
                <p className="text-xs text-[#86868b] italic leading-relaxed mt-2">
                  "{featuredTopper.quote}"
                </p>
              )}
            </div>
          </div>

          {/* Metric 2 */}
          <div className="apple-card-dark p-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-baseline justify-center text-[#f5f5f7] text-4xl font-semibold mb-1">
              <span>15</span>
              <span className="text-xl text-[#86868b] font-normal mx-1">:</span>
              <span>1</span>
            </div>
            <p className="text-xs text-[#86868b] uppercase tracking-wider font-medium">
              Student-Teacher Ratio Max
            </p>
          </div>

          {/* Metric 3 */}
          <div className="apple-card-dark p-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-baseline justify-center text-[#2997ff] text-4xl font-semibold mb-1">
              <span>{clearsStat}</span>
              <span>%</span>
            </div>
            <p className="text-xs text-[#86868b] uppercase tracking-wider font-medium">
              Board Exam Distinction
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
