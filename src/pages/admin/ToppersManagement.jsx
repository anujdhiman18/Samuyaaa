import React, { useState, useEffect, useRef } from 'react';
import { topperService, subscribeFirestoreCollection, initialMockToppers, getStoredToppers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function ToppersManagement() {
  const [toppersList, setToppersList] = useState(() => {
    try {
      return getStoredToppers() || [];
    } catch (e) {
      return initialMockToppers;
    }
  });
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopper, setEditingTopper] = useState(null);

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [examName, setExamName] = useState('');
  const [score, setScore] = useState('');
  const [quote, setQuote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Upload Progress & State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTopper, setDeletingTopper] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeFirestoreCollection('toppers', initialMockToppers, (list) => {
      if (list) {
        const sorted = [...list].sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
        setToppersList(sorted);
        setLoading(false);
      }
    });

    fetchToppers();
    return () => unsubscribe();
  }, []);

  const fetchToppers = async () => {
    setLoading(true);
    try {
      const res = await topperService.getToppers();
      if (res && res.toppers) {
        setToppersList(res.toppers);
      }
    } catch (err) {
      addToast('Error fetching topper roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTopper(null);
    setStudentName('');
    setExamName('');
    setScore('');
    setQuote('');
    setPhotoUrl('');
    setDisplayOrder(toppersList.length + 1);
    setIsActive(true);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const openEditModal = (topper) => {
    setEditingTopper(topper);
    setStudentName(topper.student_name || '');
    setExamName(topper.exam_name || '');
    setScore(topper.score || '');
    setQuote(topper.quote || '');
    setPhotoUrl(topper.photo_url || '');
    setDisplayOrder(topper.display_order || 1);
    setIsActive(topper.is_active !== false);
    setUploadProgress(100);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      const url = await topperService.uploadTopperPhoto(file, (percent) => {
        setUploadProgress(percent);
      });
      setPhotoUrl(url);
      addToast('Topper photo uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Error uploading photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentName.trim()) {
      addToast('Student Name is required', 'warning');
      return;
    }
    if (!score.trim()) {
      addToast('Score/Percentage is required', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      student_name: studentName.trim(),
      exam_name: examName.trim() || 'Board Exam',
      score: score.trim(),
      quote: quote.trim(),
      photo_url: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      display_order: Number(displayOrder),
      is_active: isActive,
    };

    try {
      if (editingTopper) {
        await topperService.updateTopper(editingTopper._id || editingTopper.id, payload);
        addToast('Topper student updated successfully!', 'success');
      } else {
        await topperService.createTopper(payload);
        addToast('Topper student added successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchToppers();
    } catch (err) {
      addToast(err.message || 'Error saving topper record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (topper) => {
    setDeletingTopper(topper);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTopper) return;
    try {
      await topperService.deleteTopper(deletingTopper._id || deletingTopper.id, deletingTopper.photo_url);
      addToast('Topper record deleted successfully!', 'info');
      setIsDeleteModalOpen(false);
      setDeletingTopper(null);
      fetchToppers();
    } catch (err) {
      addToast('Error deleting topper record', 'error');
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">emoji_events</span>
            <h1 className="font-headings font-extrabold text-2xl text-secondary">
              Topper Students Roster
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage Board Exam Toppers and top rankers shown in the Wall of Excellence on the website.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs transition-all shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add New Topper</span>
        </button>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-outline-variant/15 shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-on-surface-variant">Loading Toppers Database...</p>
        </div>
      ) : toppersList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-outline-variant/15 shadow-sm space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">emoji_events</span>
          <p className="text-sm font-bold text-secondary">No Topper Students Listed Yet</p>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            Add your board exam toppers and high scorers to showcase them on the public Wall of Excellence.
          </p>
          <button
            onClick={openAddModal}
            className="bg-primary text-white font-bold text-xs px-5 py-2 rounded-full shadow-md hover:bg-primary-container"
          >
            Add First Topper
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-outline-variant/15 text-on-surface font-headings font-bold">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Exam / Class</th>
                  <th className="py-3.5 px-4">Score / Rank</th>
                  <th className="py-3.5 px-4">Testimonial Quote</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {toppersList.map((t) => (
                  <tr key={t._id || t.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={t.student_name}
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shadow-sm"
                        />
                        <div>
                          <p className="font-headings font-bold text-secondary text-xs">{t.student_name}</p>
                          <p className="text-[10px] text-on-surface-variant">Order #{t.display_order || 1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-on-surface">{t.exam_name}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-headings font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full text-[11px] border border-amber-200">
                        🏆 {t.score}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-on-surface-variant italic line-clamp-2">
                        "{t.quote || 'No testimonial recorded.'}"
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(t);
                          }}
                          className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit Topper"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(t);
                          }}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Topper"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Topper Modal */}
      <Modal
        isOpen={isModalOpen}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopper ? 'Edit Topper Student' : 'Add New Topper Student'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          {/* Photo Uploader */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Student Photo (JPG, PNG, WEBP)
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface-container-low flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors relative overflow-hidden"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant">add_a_photo</span>
                    <span className="text-[9px] font-semibold text-on-surface-variant mt-1">Upload</span>
                  </>
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-[11px] text-on-surface-variant">
                  {uploading ? `Uploading photo... ${uploadProgress}%` : photoUrl ? 'Photo uploaded successfully' : 'Click frame to upload photo file.'}
                </p>

                {uploading && (
                  <div className="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Damini Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Exam / Board Class <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Class 10th HPBOSE Board"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Score / Percentage / Rank <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 98.6% (100/100 Math) or AIR 120"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Student Testimonial / Quote
            </label>
            <textarea
              rows="3"
              placeholder="Share their words of advice or experience at Saumyaa Studies..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/15">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Display Order</label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span>Active Profile</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="bg-primary text-white font-headings font-bold px-6 py-2 rounded-full text-xs shadow-premium hover:shadow-glow-primary active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTopper ? 'Update Topper' : 'Save Topper'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Topper"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-on-surface font-body">
          <p>
            Are you sure you want to delete topper student profile for{' '}
            <strong className="text-secondary">{deletingTopper?.student_name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-rose-600 text-white font-bold px-5 py-2 rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition-all"
            >
              Delete Topper
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
