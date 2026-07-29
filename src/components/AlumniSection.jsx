import React, { useState, useEffect } from 'react';
import { alumniService } from '../services/api';

export default function AlumniSection() {
  const [alumniList, setAlumniList] = useState(() => {
    try {
      const data = localStorage.getItem('saumyaa_alumni');
      return data ? JSON.parse(data).filter((a) => a.is_active !== false) : [];
    } catch (e) {
      return [];
    }
  });

  const [featuredAlumni, setFeaturedAlumni] = useState(() => {
    try {
      const data = localStorage.getItem('saumyaa_alumni');
      const list = data ? JSON.parse(data).filter((a) => a.is_active !== false) : [];
      const feat = list.filter((a) => a.is_featured);
      return feat.length > 0 ? feat : list.slice(0, 3);
    } catch (e) {
      return [];
    }
  });

  const [stats, setStats] = useState({
    totalAlumni: 120,
    studentsPlaced: 115,
    topRecruiters: 28,
    averagePackage: '28.5 LPA',
    highestPackage: '45 LPA',
  });

  // Featured Carousel Index
  const [activeSlide, setActiveSlide] = useState(0);

  // Testimonial Index
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    fetchAlumniData();
  }, []);

  const fetchAlumniData = async () => {
    try {
      const [alumniRes, statsRes] = await Promise.all([
        alumniService.getAlumni({ activeOnly: true }),
        alumniService.getAlumniStats(),
      ]);

      if (alumniRes && alumniRes.alumni && alumniRes.alumni.length > 0) {
        setAlumniList(alumniRes.alumni);
        const featured = alumniRes.alumni.filter((a) => a.is_featured);
        setFeaturedAlumni(featured.length > 0 ? featured : alumniRes.alumni.slice(0, 3));
      }

      if (statsRes && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.warn('Error loading alumni section:', err);
    }
  };

  // Featured Carousel Autoplay
  useEffect(() => {
    if (featuredAlumni.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % featuredAlumni.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredAlumni.length]);

  // Testimonial Carousel Autoplay
  const testimonialsList = alumniList.filter((a) => a.testimonial && a.testimonial.trim().length > 0);
  useEffect(() => {
    if (testimonialsList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonialsList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonialsList.length]);

  if (!loading && alumniList.length === 0) {
    return null; // Automatically hide section if no active alumni exist
  }

  const currentFeatured = featuredAlumni[activeSlide] || featuredAlumni[0];
  const currentTestimonial = testimonialsList[activeTestimonial] || testimonialsList[0];

  return (
    <section id="alumni" className="py-20 bg-surface-container-lowest relative overflow-hidden font-body">
      {/* Background Glow Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-headings font-bold text-xs px-4 py-1.5 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>PROUD HERITAGE &amp; ALUMNI NETWORK</span>
          </div>
          <h2 className="font-headings font-extrabold text-3xl sm:text-4xl md:text-5xl text-secondary tracking-tight">
            Our Proud Alumni
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            From top global tech giants to premier medical institutes, explore how Saumyaa Studies alumni are leading the future across India and the world.
          </p>
        </div>

        {/* 1. Dynamic Alumni Statistics Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/15 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-primary mb-1">groups</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
              {stats?.totalAlumni || 120}+
            </h3>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
              Total Alumni
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/15 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-emerald-600 mb-1">workspace_premium</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-emerald-700">
              {stats?.studentsPlaced || 115}+
            </h3>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
              Students Placed
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/15 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-secondary mb-1">domain</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
              {stats?.topRecruiters || 28}+
            </h3>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
              Top Recruiters
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/15 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-amber-600 mb-1">trending_up</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-amber-700">
              {stats?.averagePackage || '28.5 LPA'}
            </h3>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
              Average Package
            </p>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/15 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-rose-600 mb-1">military_tech</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-rose-600">
              {stats?.highestPackage || '45 LPA'}
            </h3>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
              Highest Package
            </p>
          </div>
        </div>

        {/* 2. Featured Alumni Spotlight Carousel */}
        {currentFeatured && (
          <div className="bg-gradient-to-br from-secondary via-secondary-container to-secondary rounded-3xl p-6 sm:p-10 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
              {/* Photo */}
              <div className="relative shrink-0">
                <img
                  src={currentFeatured.photo_url}
                  alt={currentFeatured.full_name}
                  loading="lazy"
                  className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl border-4 border-white/20"
                />
                <span className="absolute -top-3 -right-3 bg-amber-400 text-secondary text-[11px] font-headings font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">star</span>
                  FEATURED ALUMNI
                </span>
              </div>

              {/* Story Details */}
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div className="space-y-1">
                  <div className="inline-block bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-primary-light mb-2">
                    Class of {currentFeatured.graduation_year} • {currentFeatured.course || 'JEE / NEET Alumni'}
                  </div>
                  <h3 className="font-headings font-extrabold text-2xl sm:text-3xl text-white">
                    {currentFeatured.full_name}
                  </h3>
                  <p className="text-primary-light font-semibold text-sm sm:text-base">
                    {currentFeatured.current_position} at{' '}
                    <strong className="text-amber-300 font-extrabold">{currentFeatured.current_company}</strong>
                  </p>
                </div>

                {currentFeatured.achievement && (
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 text-xs text-white/90 font-medium inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-300 text-[18px]">verified</span>
                    <span>{currentFeatured.achievement}</span>
                  </div>
                )}

                {currentFeatured.testimonial && (
                  <p className="text-xs sm:text-sm text-white/80 italic leading-relaxed max-w-2xl">
                    "{currentFeatured.testimonial}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  {currentFeatured.package_ctc && (
                    <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">
                      Package: {currentFeatured.package_ctc}
                    </span>
                  )}
                  {currentFeatured.location && (
                    <span className="bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {currentFeatured.location}
                    </span>
                  )}

                  {currentFeatured.linkedin_url && (
                    <a
                      href={currentFeatured.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-primary-container text-white font-headings font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg transition-all hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Carousel Controls */}
            {featuredAlumni.length > 1 && (
              <div className="flex items-center justify-center lg:justify-end gap-2 pt-6">
                {featuredAlumni.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      idx === activeSlide ? 'bg-amber-400 w-8' : 'bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Rotating Alumni Testimonials Slider */}
        {currentTestimonial && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-premium relative text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-primary opacity-40">format_quote</span>
            <p className="font-headings text-base sm:text-lg md:text-xl text-secondary font-bold max-w-3xl mx-auto italic leading-relaxed">
              "{currentTestimonial.testimonial}"
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <img
                src={currentTestimonial.photo_url}
                alt={currentTestimonial.full_name}
                loading="lazy"
                className="w-11 h-11 rounded-full object-cover border-2 border-primary shadow-md"
              />
              <div className="text-left">
                <p className="font-headings font-bold text-xs text-secondary">{currentTestimonial.full_name}</p>
                <p className="text-[11px] font-semibold text-primary">
                  {currentTestimonial.current_position} @ {currentTestimonial.current_company} (Class of {currentTestimonial.graduation_year})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Proud Alumni Cards Responsive Grid (4 Desktop, 2 Tablet, 1 Mobile) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headings font-extrabold text-xl sm:text-2xl text-secondary">
              Distinguished Alumni Roster
            </h3>
            <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
              {alumniList.length} Graduates Featured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {alumniList.map((a) => (
              <div
                key={a._id || a.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/15 shadow-premium hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between h-full group"
              >
                <div className="space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      <img
                        src={a.photo_url}
                        alt={a.full_name}
                        loading="lazy"
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary transition-colors shadow-md"
                      />
                      {a.is_featured && (
                        <span
                          title="Featured Alumni"
                          className="absolute -bottom-1 -right-1 bg-amber-400 text-secondary w-5 h-5 rounded-full flex items-center justify-center shadow-md text-[12px]"
                        >
                          <span className="material-symbols-outlined text-[12px]">star</span>
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full inline-block">
                        Class of {a.graduation_year}
                      </span>
                      {a.package_ctc && (
                        <p className="font-headings font-extrabold text-xs text-emerald-700 mt-1">
                          {a.package_ctc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div>
                    <h4 className="font-headings font-bold text-base text-secondary group-hover:text-primary transition-colors">
                      {a.full_name}
                    </h4>
                    <p className="text-xs font-semibold text-primary mt-0.5">{a.current_position}</p>
                    <p className="text-xs font-bold text-secondary flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">apartment</span>
                      {a.current_company}
                    </p>
                  </div>

                  {/* Course & Location */}
                  <div className="space-y-1 text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10">
                    {a.course && (
                      <p className="font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">book</span>
                        <span className="truncate">{a.course}</span>
                      </p>
                    )}
                    {a.location && (
                      <p className="font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-rose-500">location_on</span>
                        <span className="truncate">{a.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Short Achievement */}
                  {a.achievement && (
                    <p className="text-[11px] font-semibold text-on-surface line-clamp-2 bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-100">
                      🏆 {a.achievement}
                    </p>
                  )}

                  {/* Short Testimonial Quote */}
                  {a.testimonial && (
                    <p className="text-[11px] text-on-surface-variant italic line-clamp-2">
                      "{a.testimonial}"
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-outline-variant/10 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-on-surface-variant font-semibold">
                    Saumyaa Alumni Network
                  </span>

                  {a.linkedin_url ? (
                    <a
                      href={a.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-headings font-bold text-primary hover:text-primary-container inline-flex items-center gap-1 transition-colors"
                    >
                      <span>LinkedIn</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-on-surface-variant">Verified Graduate</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
