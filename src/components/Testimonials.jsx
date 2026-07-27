import React, { useEffect, useRef, useState } from 'react';
import { feedbackService } from '../services/api.js';

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
    fetchLiveFeedbacks();
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
      className="bg-surface-container-low border-y border-outline-variant/15 py-16 md:py-24 overflow-hidden font-body"
    >
      <div className="max-w-container-max mx-auto px-gutter relative">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-headings font-bold text-xs animate-fadeIn">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Thank you! Your feedback has been published to our community voices.
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="text-left max-w-xl">
            <span className="text-secondary font-headings font-bold text-xs tracking-widest uppercase mb-2 block">
              Student &amp; Parent Voices
            </span>
            <h2 className="font-headings font-extrabold text-3xl md:text-4xl text-on-surface mb-3">
              What Our Community Says
            </h2>
            <p className="text-on-surface-variant font-body text-sm md:text-base leading-relaxed">
              Real feedback from families who have experienced academic transformation with Jitender Sharma.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-3 rounded-full text-xs flex items-center gap-2 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">rate_review</span>
              + Share Your Feedback
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  prev();
                  resetAutoplay();
                }}
                className="w-11 h-11 rounded-full border border-outline-variant/30 hover:bg-white flex items-center justify-center transition-all focus:outline-none hover:shadow-premium active:scale-95 bg-white text-secondary"
                aria-label="Previous Testimonial"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button
                onClick={() => {
                  next();
                  resetAutoplay();
                }}
                className="w-11 h-11 rounded-full border border-outline-variant/30 hover:bg-white flex items-center justify-center transition-all focus:outline-none hover:shadow-premium active:scale-95 bg-white text-secondary"
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
                <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col justify-between h-80 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300">
                  <div>
                    {/* Fixed Star Rating Display */}
                    <div className="flex text-amber-500 gap-1 mb-4 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (t.stars || 5) ? 'text-amber-500 font-bold' : 'text-slate-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed font-body italic mb-6 line-clamp-4">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-outline-variant/15 pt-4 mt-auto">
                    <div
                      className={`w-10 h-10 rounded-full ${
                        t.initialsBg || 'bg-secondary/15'
                      } flex items-center justify-center font-headings font-bold ${
                        t.initialsColor || 'text-secondary'
                      } text-sm`}
                    >
                      {t.initials || 'SB'}
                    </div>
                    <div>
                      <h4 className="font-headings font-bold text-xs text-on-surface">{t.name}</h4>
                      <p className="text-[11px] text-on-surface-variant font-medium">{t.role}</p>
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
              className={`h-2.5 rounded-full transition-all focus:outline-none ${
                i === currentSlide ? 'bg-secondary w-6' : 'bg-outline-variant/40 w-2.5'
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
            className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-premium border border-outline-variant/15 p-6 relative z-10 overflow-hidden animate-fadeIn font-body">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4 mb-4">
              <div>
                <h3 className="font-headings font-extrabold text-lg text-secondary">
                  Submit Student / Parent Feedback
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Share your experience with Saumyaa Studies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sneha Sharma / Mr. Rajesh Gupta"
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Role / Class Batch *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Class 10th Student or Parent of Grade 9 Student"
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Rating *
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setStars(starVal)}
                      className={`text-2xl transition-transform ${
                        starVal <= stars ? 'text-amber-500 scale-110' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-secondary ml-2">
                    {stars} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Your Feedback / Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Write your review about the teaching methodology, conceptual clarity, or results..."
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-body text-on-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-container text-white px-5 py-2 rounded-full text-xs font-headings font-bold transition-all shadow-tactile-btn shadow-premium flex items-center gap-1.5"
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
