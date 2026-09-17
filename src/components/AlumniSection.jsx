import React, { useState, useEffect } from 'react';
import { alumniService, getStoredAlumni, subscribeFirestoreCollection } from '../services/api';

export default function AlumniSection() {
  const [alumniList, setAlumniList] = useState(() => {
    try {
      const list = getStoredAlumni();
      return list ? list.filter((a) => a.is_active !== false) : [];
    } catch (e) {
      return [];
    }
  });

  const [featuredAlumni, setFeaturedAlumni] = useState(() => {
    try {
      const list = getStoredAlumni().filter((a) => a.is_active !== false);
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
    const unsubscribe = subscribeFirestoreCollection('alumni', [], (list) => {
      if (list && list.length > 0) {
        const active = list.filter((a) => a.is_active !== false);
        active.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.display_order || 1) - (b.display_order || 1));
        setAlumniList(active);
        const feat = active.filter((a) => a.is_featured);
        setFeaturedAlumni(feat.length > 0 ? feat : active.slice(0, 3));
      }
    });

    fetchAlumniData();
    return () => unsubscribe();
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
  const testimonialsList = (alumniList || []).filter(
    (a) => a && typeof a.testimonial === 'string' && a.testimonial.trim().length > 0
  );
  useEffect(() => {
    if (testimonialsList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonialsList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonialsList.length]);

  const safeFeatured = (featuredAlumni || []).filter((a) => a && a.is_active !== false);

  if (!alumniList || alumniList.length === 0) {
    return null;
  }

  const currentFeatured = safeFeatured[activeSlide] || safeFeatured[0] || alumniList[0];
  const currentTestimonial = testimonialsList[activeTestimonial] || testimonialsList[0];

  return (
    <section id="alumni" className="py-20 bg-surface relative overflow-hidden font-body">
      {/* Background Glow Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0D47A1]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1976D2]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#E3F2FD] text-[#D97706] border border-[#90CAF9]/40 font-headings font-bold text-xs px-4 py-1.5 rounded-full shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#D97706]">school</span>
            <span>PROUD HERITAGE &amp; ALUMNI NETWORK</span>
          </div>
          <h2 className="font-headings font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0D47A1] tracking-tight">
            Our Proud <span className="text-[#D97706]">Alumni Network</span>
          </h2>
          <p className="text-sm text-[#1565C0] leading-relaxed">
            From top premier engineering institutions to medical colleges, explore how Saumyaa Studies alumni are shaping the future across India and beyond.
          </p>
        </div>

        {/* 1. Dynamic Alumni Statistics Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#90CAF9]/30 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-[#D97706] mb-1">groups</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-[#0D47A1]">
              {stats?.totalAlumni || 120}+
            </h3>
            <p className="text-[11px] font-bold text-[#1565C0] uppercase tracking-wider mt-1">
              Total Alumni
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#90CAF9]/30 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-[#D97706] mb-1">workspace_premium</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-[#0D47A1]">
              {stats?.studentsPlaced || 115}+
            </h3>
            <p className="text-[11px] font-bold text-[#1565C0] uppercase tracking-wider mt-1">
              Students Placed
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#90CAF9]/30 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-[#D97706] mb-1">domain</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-[#0D47A1]">
              {stats?.topRecruiters || 28}+
            </h3>
            <p className="text-[11px] font-bold text-[#1565C0] uppercase tracking-wider mt-1">
              Top Recruiters
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#90CAF9]/30 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-[#D97706] mb-1">trending_up</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-[#0D47A1]">
              {stats?.averagePackage || '28.5 LPA'}
            </h3>
            <p className="text-[11px] font-bold text-[#1565C0] uppercase tracking-wider mt-1">
              Average Package
            </p>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white rounded-2xl p-5 border border-[#90CAF9]/30 shadow-premium text-center hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl text-[#D97706] mb-1">military_tech</span>
            <h3 className="font-headings font-extrabold text-2xl md:text-3xl text-[#0D47A1]">
              {stats?.highestPackage || '45 LPA'}
            </h3>
            <p className="text-[11px] font-bold text-[#1565C0] uppercase tracking-wider mt-1">
              Highest Package
            </p>
          </div>
        </div>

        {/* 2. Featured Alumni Spotlight Carousel */}
        {currentFeatured && (
          <div className="bg-gradient-to-br from-[#0D47A1] to-[#0A192F] rounded-3xl p-6 sm:p-10 shadow-premium text-white relative overflow-hidden border border-[#90CAF9]/30">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
              {/* Photo */}
              <div className="relative shrink-0">
                <img
                  src={currentFeatured.photo_url}
                  alt={currentFeatured.full_name}
                  loading="lazy"
                  className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-premium border-4 border-white/20"
                />
                <span className="absolute -top-3 -right-3 bg-[#D97706] text-white text-[11px] font-headings font-extrabold px-3 py-1 rounded-full shadow-premium flex items-center gap-1 border border-white/20">
                  <span className="material-symbols-outlined text-[14px]">star</span>
                  FEATURED ALUMNI
                </span>
              </div>

              {/* Story Details */}
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div className="space-y-1">
                  <div className="inline-block bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white/90 mb-2">
                    Class of {currentFeatured.graduation_year} &bull; {currentFeatured.course || 'JEE / NEET Alumni'}
                  </div>
                  <h3 className="font-headings font-extrabold text-2xl sm:text-3xl text-white">
                    {currentFeatured.full_name}
                  </h3>
                  <p className="text-white/90 font-semibold text-sm sm:text-base">
                    {currentFeatured.current_position} at{' '}
                    <strong className="text-white font-extrabold">{currentFeatured.current_company}</strong>
                  </p>
                </div>

                {currentFeatured.achievement && (
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 text-xs text-white font-medium inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FBBF24] text-[18px]">verified</span>
                    <span>{currentFeatured.achievement}</span>
                  </div>
                )}

                {currentFeatured.testimonial && (
                  <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed max-w-2xl">
                    "{currentFeatured.testimonial}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  {currentFeatured.package_ctc && (
                    <span className="bg-white/15 border border-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                      Package: {currentFeatured.package_ctc}
                    </span>
                  )}
                  {currentFeatured.location && (
                    <span className="bg-white/10 text-white/90 text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-white">location_on</span>
                      {currentFeatured.location}
                    </span>
                  )}

                  {currentFeatured.linkedin_url && (
                    <a
                      href={currentFeatured.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-[#0D47A1] hover:bg-[#E3F2FD] font-headings font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-premium transition-all duration-300 hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#0D47A1]">link</span>
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
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === activeSlide ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/60 w-2.5'
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#90CAF9]/30 shadow-premium relative text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-[#D97706] opacity-60">format_quote</span>
            <p className="font-headings text-base sm:text-lg md:text-xl text-[#0D47A1] font-bold max-w-3xl mx-auto italic leading-relaxed">
              "{currentTestimonial.testimonial}"
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <img
                src={currentTestimonial.photo_url}
                alt={currentTestimonial.full_name}
                loading="lazy"
                className="w-11 h-11 rounded-full object-cover border-2 border-[#90CAF9]/40 shadow-premium"
              />
              <div className="text-left">
                <p className="font-headings font-bold text-xs text-[#0D47A1]">{currentTestimonial.full_name}</p>
                <p className="text-[11px] font-semibold text-[#1565C0]">
                  {currentTestimonial.current_position} @ {currentTestimonial.current_company} (Class of {currentTestimonial.graduation_year})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Proud Alumni Cards Responsive Grid (4 Desktop, 2 Tablet, 1 Mobile) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headings font-extrabold text-xl sm:text-2xl text-[#0D47A1]">
              Distinguished Alumni <span className="text-[#D97706]">Roster</span>
            </h3>
            <span className="text-xs font-semibold text-[#1976D2] bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#90CAF9]/40">
              {alumniList.length} Graduates Featured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {alumniList.map((a) => (
              <div
                key={a._id || a.id}
                className="bg-white rounded-2xl p-5 border border-[#90CAF9]/30 shadow-premium hover:shadow-premium-hover transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between h-full group"
              >
                <div className="space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      <img
                        src={a.photo_url}
                        alt={a.full_name}
                        loading="lazy"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#90CAF9]/30 group-hover:border-[#0D47A1] transition-colors duration-200 shadow-premium"
                      />
                      {a.is_featured && (
                        <span
                          title="Featured Alumni"
                          className="absolute -bottom-1 -right-1 bg-[#D97706] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-premium text-[12px]"
                        >
                          <span className="material-symbols-outlined text-[12px]">star</span>
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="bg-[#BBDEFB]/40 text-[#0D47A1] text-[10px] font-bold px-2.5 py-1 rounded-full inline-block">
                        Class of {a.graduation_year}
                      </span>
                      {a.package_ctc && (
                        <p className="font-headings font-extrabold text-xs text-[#D97706] mt-1">
                          {a.package_ctc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div>
                    <h4 className="font-headings font-bold text-base text-[#0D47A1] group-hover:text-[#D97706] transition-colors duration-200">
                      {a.full_name}
                    </h4>
                    <p className="text-xs font-semibold text-[#1976D2] mt-0.5">{a.current_position}</p>
                    <p className="text-xs font-bold text-[#0D1B2A] flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px] text-[#D97706]">apartment</span>
                      {a.current_company}
                    </p>
                  </div>

                  {/* Course & Location */}
                  <div className="space-y-1 text-[11px] text-[#1565C0] bg-[#E3F2FD] p-2.5 rounded-xl border border-[#90CAF9]/30">
                    {a.course && (
                      <p className="font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#1976D2]">book</span>
                        <span className="truncate text-[#0D1B2A]">{a.course}</span>
                      </p>
                    )}
                    {a.location && (
                      <p className="font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#1976D2]">location_on</span>
                        <span className="truncate text-[#0D1B2A]">{a.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Short Achievement */}
                  {a.achievement && (
                    <div className="text-[11px] font-medium text-[#0D47A1] bg-[#E3F2FD] p-2.5 rounded-lg border border-[#90CAF9]/30 flex items-start gap-1.5 leading-relaxed">
                      <span className="material-symbols-outlined text-[14px] text-[#D97706] shrink-0 mt-0.5">workspace_premium</span>
                      <span className="line-clamp-2">{a.achievement}</span>
                    </div>
                  )}

                  {/* Short Testimonial Quote */}
                  {a.testimonial && (
                    <p className="text-[11px] text-[#1565C0] italic line-clamp-2">
                      "{a.testimonial}"
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-[#90CAF9]/30 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-[#1565C0] font-semibold">
                    Saumyaa Alumni Network
                  </span>

                  {a.linkedin_url ? (
                    <a
                      href={a.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-headings font-bold text-[#1976D2] hover:text-[#0D47A1] inline-flex items-center gap-1 transition-colors duration-200"
                    >
                      <span>LinkedIn</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-[#1565C0]">Verified Graduate</span>
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
