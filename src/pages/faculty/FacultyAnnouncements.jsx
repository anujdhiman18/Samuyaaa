import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import { CLASS_CATEGORIES, formatClassLabel } from '../../config/classConfig';

export default function FacultyAnnouncements() {
  const { addToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetClass, setTargetClass] = useState('S2');
  const [category, setCategory] = useState('Academic');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAnnouncements();
      if (res && res.announcements) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      console.warn('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await announcementService.createAnnouncement({
        title,
        content,
        targetClass,
        category,
        authorName: 'Prof. Jitender Sharma (Faculty)',
      });

      if (res && res.success) {
        addToast('Class announcement published!', 'success');
        setModalOpen(false);
        setTitle('');
        setContent('');
        fetchAnnouncements();
      }
    } catch (err) {
      addToast('Error publishing announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">campaign</span>
            Class Announcements & Notifications
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Dispatch announcements directly to students in your assigned classes.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_notification</span>
          Post Announcement
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
          Loading class notices...
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-white rounded-2xl border border-outline-variant/15">
          No active announcements found.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((anc) => (
            <div
              key={anc._id || anc.id}
              className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                    {anc.category || 'Academic'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-bold text-[10px]">
                    Target: {formatClassLabel(anc.targetClass)}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  {new Date(anc.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-headings font-extrabold text-base text-secondary">{anc.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">{anc.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post Class Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4 font-body">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="e.g. Upcoming Mock Exam & Special Revision Session"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Notice Content *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="Write notice details for students..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Target Class</label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                {CLASS_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
                <option value="All">All Assigned Categories</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                <option value="Academic">Academic</option>
                <option value="Exam">Exam / Test</option>
                <option value="Assignment">Assignment</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
