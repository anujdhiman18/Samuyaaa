import React, { useEffect, useRef, useState } from 'react';
import { feedbackService, subscribeFirestoreCollection } from '../services/api.js';

function getVisibleCount() {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 768) return 2;
  return 1;
}

export default function Testimonials() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);

  // Submit Feedback Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [stars, setStars] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeFirestoreCollection('feedbacks', [], (list) => {
      if (list && list.length > 0) {
        setFeedbacks(list);
      }
    });

    fetchLiveFeedbacks();
    return () => unsubscribe();
  }, []);

  const fetchLiveFeedbacks = async () => {
    try {
      const data = await feedbackService.getFeedbacks();
      if (data && data.feedbacks && data.feedbacks.length > 0) {
        setFeedbacks(data.feedbacks);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const totalSlides = Math.max(1, feedbacks.length);
  const maxSlideIndex = Math.max(0, totalSlides - visibleCount);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, maxSlideIndex));
  }, [maxSlideIndex]);

  const resetAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 5000);
  };

  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSlideIndex]);

  function next() {
    setCurrentSlide((prev) => (prev < maxSlideIndex ? prev + 1 : 0));
  }

  function prev() {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : maxSlideIndex));
  }

  function goTo(index) {
    setCurrentSlide(index);
    resetAutoplay();
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) return;

    setSubmitting(true);
    try {
      const res = await feedbackService.createFeedback({
        name,
        role: role.trim() || 'Student / Community Member',
        quote,
        stars: Number(stars),
      });

      if (res && (res.feedback || res.success)) {
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 5000);
        setName('');
        setRole('');
        setQuote('');
        setStars(5);
        setModalOpen(false);
        fetchLiveFeedbacks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const slideWidth = 100 / visibleCount;
  const numDots = maxSlideIndex + 1;

  return (
    <section
      id="testimonials"
      className="bg-surface border-y border-[#90CAF9]/30 py-16 md:py-24 overflow-hidden font-body"
    >
      <div className="max-w-container-max mx-auto px-gutter relative">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-20 right-6 z-50 bg-[#0D47A1] text-white px-5 py-3 rounded-2xl shadow-premium border border-[#90CAF9]/40 flex items-center gap-2 font-headings font-bold text-xs animate-fadeIn">
            <span className="material-symbols-outlined text-[20px] text-[#FBBF24]">check_circle</span>
            Thank you! Your feedback has been published to our community voices.
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="text-left max-w-xl">
            <span className="text-[#D97706] font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
              Student &amp; Parent Voices
            </span>
            <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-[#0D47A1] mb-3">
              What Our <span className="text-[#D97706]">Community</span> Says
            </h2>
            <p className="text-[#1565C0] font-body text-sm md:text-base leading-relaxed">
              Real feedback from families who have experienced academic transformation with Jitender Sharma.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#0D47A1] hover:bg-[#1565C0] text-white font-headings font-bold px-5 py-3 rounded-full text-xs flex items-center gap-2 shadow-premium active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-white">rate_review</span>
              + Share Your Feedback
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  prev();
                  resetAutoplay();
                }}
                className="w-11 h-11 rounded-full border border-[#90CAF9]/50 hover:bg-[#E3F2FD] flex items-center justify-center transition-all duration-200 focus:outline-none shadow-premium active:scale-95 bg-white text-[#1976D2] hover:text-[#0D47A1] cursor-pointer"
                aria-label="Previous Testimonial"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button
                onClick={() => {
                  next();
                  resetAutoplay();
                }}
                className="w-11 h-11 rounded-full border border-[#90CAF9]/50 hover:bg-[#E3F2FD] flex items-center justify-center transition-all duration-200 focus:outline-none shadow-premium active:scale-95 bg-white text-[#1976D2] hover:text-[#0D47A1] cursor-pointer"
                aria-label="Next Testimonial"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Slide Track */}
        <div className="relative overflow-hidden w-full py-4">
          <div
            className="slide-track transition-transform duration-500 ease-out flex"
            style={{ transform: `translateX(-${currentSlide * slideWidth}%)` }}
          >
            {feedbacks.map((t, idx) => (
              <div key={t._id || t.id || idx} className="w-full md:w-1/2 lg:w-1/3 px-3 shrink-0">
                <div className="bg-white rounded-2xl p-6 shadow-premium border border-[#90CAF9]/30 flex flex-col justify-between h-80 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300">
                  <div>
                    {/* Star Rating Display */}
                    <div className="flex text-[#D97706] gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[16px] ${i < (t.stars || 5) ? 'text-[#D97706] fill-current' : 'text-[#90CAF9]/40'}`}>
                          star
                        </span>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-[#1565C0] leading-relaxed font-body italic mb-6 line-clamp-4">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-[#90CAF9]/20 pt-4 mt-auto">
                    <div
                      className="w-10 h-10 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center font-headings font-bold text-sm border border-[#90CAF9]/40"
                    >
                      {t.initials || (t.name ? t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SS')}
                    </div>
                    <div>
                      <h4 className="font-headings font-bold text-xs text-[#0D47A1]">{t.name}</h4>
                      <p className="text-[11px] text-[#1565C0] font-medium">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: numDots }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                i === currentSlide ? 'bg-[#0D47A1] w-6' : 'bg-[#90CAF9]/50 w-2.5 hover:bg-[#90CAF9]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Feedback Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-[#0D1B2A]/50 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-premium border border-[#90CAF9]/30 p-6 relative z-10 overflow-hidden animate-fadeIn font-body">
            <div className="flex items-center justify-between border-b border-[#90CAF9]/30 pb-4 mb-4">
              <div>
                <h3 className="font-headings font-extrabold text-lg text-[#0D47A1]">
                  Submit Student / Parent <span className="text-[#D97706]">Feedback</span>
                </h3>
                <p className="text-xs text-[#1565C0]">
                  Share your experience with Saumyaa Studies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-[#1976D2] hover:bg-[#E3F2FD] transition-colors duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-[#0D1B2A]">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sneha Sharma / Mr. Rajesh Gupta"
                  className="px-3.5 py-2.5 rounded-xl border border-[#90CAF9]/50 bg-[#E3F2FD]/50 text-xs font-semibold text-[#0D1B2A] focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1]/20 transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-[#0D1B2A]">
                  Role / Class Batch *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Class 10th Student or Parent of Grade 9 Student"
                  className="px-3.5 py-2.5 rounded-xl border border-[#90CAF9]/50 bg-[#E3F2FD]/50 text-xs font-semibold text-[#0D1B2A] focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1]/20 transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-[#0D1B2A]">
                  Rating *
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setStars(starVal)}
                      className={`p-0.5 transition-transform duration-200 cursor-pointer ${
                        starVal <= stars ? 'text-[#D97706] scale-105' : 'text-[#90CAF9]/40 hover:text-[#D97706]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#D97706] ml-2">
                    {stars} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-[#0D1B2A]">
                  Your Feedback / Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Write your review about the teaching methodology, conceptual clarity, or results..."
                  className="px-3.5 py-2.5 rounded-xl border border-[#90CAF9]/50 bg-[#E3F2FD]/50 text-xs font-body text-[#0D1B2A] focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1]/20 transition-all duration-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#90CAF9]/20">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#90CAF9]/50 text-xs font-headings font-bold text-[#1976D2] hover:text-[#0D47A1] transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-5 py-2 rounded-full text-xs font-headings font-bold transition-all duration-300 shadow-premium flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
