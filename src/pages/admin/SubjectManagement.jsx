import React, { useState, useEffect } from 'react';
import { subjectService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const initialSubjectForm = {
  name: '',
  className: '10th',
  description: '',
  teacherName: 'Jitender Sharma',
  batchTime: '5:00 PM - 6:30 PM',
};

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(initialSubjectForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getSubjects();
      if (data && data.subjects) {
        setSubjects(data.subjects);
      }
    } catch (err) {
      addToast(err.message || 'Error fetching subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setForm(initialSubjectForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setEditingSubject(subject);
    setForm({ ...subject });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject._id, form);
        addToast('Subject updated successfully', 'success');
      } else {
        await subjectService.createSubject(form);
        addToast('New subject created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      addToast(err.message || 'Error saving subject', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await subjectService.deleteSubject(deleteTarget._id);
      addToast('Subject deleted successfully', 'success');
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      addToast(err.message || 'Error deleting subject', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Subjects &amp; Batch Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Configure active subject offerings, faculty assignments, and batch timings.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Subject Offering
        </button>
      </div>

      {/* Grid of Subject Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs animate-pulse">Loading active subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-premium border border-outline-variant/15">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
            menu_book
          </span>
          <h4 className="font-headings font-bold text-base text-on-surface">No Subjects Configured</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col justify-between hover:scale-[1.01] transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-xs">
                    Class {sub.className}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {sub.totalEnrolled || 15} Students
                  </span>
                </div>

                <h3 className="font-headings font-bold text-lg text-on-surface mb-1">
                  {sub.name}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  {sub.description || 'Comprehensive conceptual coaching and board exam preparation.'}
                </p>
              </div>

              <div className="border-t border-outline-variant/15 pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Faculty:</span>
                  <strong className="text-secondary font-bold">{sub.teacherName}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Batch Timing:</span>
                  <strong className="text-primary font-mono">{sub.batchTime}</strong>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                    title="Edit Subject"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sub)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    title="Delete Subject"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject Offering' : 'Add New Subject'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-body">
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mathematics Advanced"
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Class / Grade *
              </label>
              <select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              >
                {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Olympiad'].map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Batch Time *
              </label>
              <input
                type="text"
                required
                value={form.batchTime}
                onChange={(e) => setForm({ ...form, batchTime: e.target.value })}
                placeholder="5:00 PM - 6:30 PM"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Faculty / Teacher Name *
            </label>
            <input
              type="text"
              required
              value={form.teacherName}
              onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
              placeholder="Jitender Sharma"
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Course Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed syllabus focus..."
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-body"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-tactile-btn shadow-premium"
            >
              {editingSubject ? 'Update Subject' : 'Save Subject'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={`Delete Subject ${deleteTarget?.name}?`}
        message="Are you sure you want to remove this subject from active offerings?"
      />
    </div>
  );
}
