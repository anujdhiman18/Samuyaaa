import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  // Submit Feedback Modal — Apple §3: always rendered for interruptibility
  const [modalOpen, setModalOpen] = useState(false);
  const [modalShouldRender, setModalShouldRender] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const modalRef = useRef(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [stars, setStars] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setModalShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setModalVisible(true));
      });
    } else {
      setModalVisible(false);
    }
  }, [modalOpen]);

  const handleModalTransitionEnd = useCallback((e) => {
    if (!modalVisible && e.target === modalRef.current) {
      setModalShouldRender(false);
    }
  }, [modalVisible]);

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

  const next = useCallback(() => {
    setCurrentSlide((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
  }, [maxSlideIndex]);

  const prev = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlideIndex : prev - 1));
  }, [maxSlideIndex]);

  const goTo = (index) => {
    setCurrentSlide(Math.max(0, Math.min(index, maxSlideIndex)));
  };

  const resetAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 7000);
  };

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!name || !quote) return;
    setSubmitting(true);
    try {
      const res = await feedbackService.submitFeedback({
        name,
        role: role || 'Student',
        quote,
        stars,
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
    <section id="testimonials" className="apple-section-white overflow-hidden">
      <div className="apple-container relative">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-20 right-6 z-50 bg-[#1d1d1f] text-white px-5 py-3 rounded-full shadow-lg border border-[#424245] flex items-center gap-2 text-xs font-medium">
            <span className="material-symbols-outlined text-[18px] text-[#0071e3]">check_circle</span>
            Thank you! Your feedback has been published.
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-xl">
            <span className="text-[#6e6e73] font-semibold text-xs tracking-wider uppercase mb-2 block">
              Student &amp; Parent Voices
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[#1d1d1f] mb-3">
              What Our Community Says
            </h2>
            <p className="text-[#6e6e73] text-sm md:text-base leading-relaxed">
              Real feedback from families who have experienced academic transformation with Jitender Sharma.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="apple-btn-secondary px-5 py-2.5 text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">rate_review</span>
              Share Feedback
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  prev();
                  resetAutoplay();
                }}
                className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-[#1d1d1f] transition-colors cursor-pointer"
                aria-label="Previous Testimonial"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <button
                onClick={() => {
                  next();
                  resetAutoplay();
                }}
                className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-[#1d1d1f] transition-colors cursor-pointer"
                aria-label="Next Testimonial"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Testimonial Cards Carousel: #f5f5f7 on white section */}
        <div className="relative overflow-hidden w-full py-2">
          <div
            className="slide-track flex"
            style={{ transform: `translateX(-${currentSlide * slideWidth}%)` }}
          >
            {feedbacks.map((t, idx) => (
              <div key={t._id || t.id || idx} className="w-full md:w-1/2 lg:w-1/3 px-3 shrink-0">
                <div className="apple-card-alt p-7 flex flex-col justify-between h-80">
                  <div>
                    {/* Stars: single accent blue */}
                    <div className="flex text-[#0071e3] gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[16px] ${i < (t.stars || 5) ? 'text-[#0071e3] fill-current' : 'text-[#d2d2d7]'}`}>
                          star
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[#1d1d1f] leading-relaxed italic mb-6 line-clamp-4">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-[#d2d2d7]/50 pt-4 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-white text-[#1d1d1f] flex items-center justify-center font-semibold text-xs border border-[#d2d2d7]">
                      {t.initials || (t.name ? t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SS')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#1d1d1f]">{t.name}</h4>
                      <p className="text-[11px] text-[#6e6e73] font-normal">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: numDots }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial slide ${i + 1}`}
              className={`h-2 rounded-full cursor-pointer transition-all duration-200 ${
                i === currentSlide ? 'bg-[#0071e3] w-6' : 'bg-[#d2d2d7] w-2 hover:bg-[#86868b]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interruptible Feedback Modal */}
      {modalShouldRender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            style={{
              opacity: modalVisible ? 1 : 0,
              transition: 'opacity var(--spring-duration) var(--spring-ease)',
            }}
          />

          <div
            ref={modalRef}
            onTransitionEnd={handleModalTransitionEnd}
            className="bg-white w-full max-w-lg rounded-[24px] shadow-[0_20px_48px_rgba(0,0,0,0.16)] border border-[#d2d2d7] p-7 relative z-10 overflow-hidden"
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(12px)',
              transition: `transform var(--spring-duration) var(--spring-ease),
                           opacity var(--spring-duration-fast) var(--spring-ease)`,
            }}
          >
            <div className="flex items-center justify-between border-b border-[#d2d2d7] pb-4 mb-5">
              <div>
                <h3 className="font-semibold text-lg text-[#1d1d1f]">
                  Share Your Feedback
                </h3>
                <p className="text-xs text-[#6e6e73]">
                  Tell our community about your learning experience
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-[#1d1d1f]">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sneha Sharma"
                  className="px-3.5 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-[#1d1d1f]">
                  Role / Class Batch *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Class 10th Student"
                  className="px-3.5 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-[#1d1d1f]">
                  Rating *
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setStars(starVal)}
                      className={`cursor-pointer ${
                        starVal <= stars ? 'text-[#0071e3]' : 'text-[#d2d2d7] hover:text-[#0071e3]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-[#1d1d1f] ml-2">
                    {stars} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-[#1d1d1f]">
                  Your Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Share details about the teaching methodology, conceptual clarity..."
                  className="px-3.5 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#d2d2d7]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="apple-btn-secondary px-5 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="apple-btn-primary px-5 py-2 text-xs"
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
