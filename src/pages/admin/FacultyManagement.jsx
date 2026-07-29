import React, { useState, useEffect } from 'react';
import { facultyService, getStoredFaculty } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const initialForm = {
  name: '',
  designation: '',
  subject: '',
  qualification: '',
  experience: '',
  photo_url: '',
  display_order: 1,
  is_active: true,
};

export default function FacultyManagement() {
  const [facultyList, setFacultyList] = useState(() => {
    try {
      return getStoredFaculty() || [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // File upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchFaculty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await facultyService.getFaculty();
      if (res && res.faculty) {
        setFacultyList(res.faculty);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch faculty list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm({ ...initialForm, display_order: facultyList.length + 1 });
    setPreviewUrl('');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name || '',
      designation: member.designation || '',
      subject: member.subject || '',
      qualification: member.qualification || '',
      experience: member.experience || '',
      photo_url: member.photo_url || '',
      display_order: member.display_order !== undefined ? member.display_order : 1,
      is_active: member.is_active !== undefined ? Boolean(member.is_active) : true,
    });
    setPreviewUrl(member.photo_url || '');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type & size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Validation Error: Only JPG, PNG, and WEBP files are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Validation Error: Photo size must be 5MB or less.', 'error');
      return;
    }

    // Set temporary local preview
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    setUploading(true);
    setUploadProgress(10);

    try {
      const uploadedUrl = await facultyService.uploadFacultyPhoto(file, (progress) => {
        setUploadProgress(progress);
      });
      setForm((prev) => ({ ...prev, photo_url: uploadedUrl }));
      addToast('Faculty photo uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload Failed: Failed to upload image', 'error');
      setPreviewUrl(form.photo_url || '');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      addToast('Validation Error: Faculty Name is required.', 'error');
      return;
    }

    if (!form.photo_url) {
      addToast('Validation Error: Faculty Photo is required.', 'error');
      return;
    }

    setSaving(true);

    try {
      if (editingMember) {
        const id = editingMember.id || editingMember._id;
        await facultyService.updateFaculty(id, form);
        addToast('Faculty Updated successfully!', 'success');
      } else {
        await facultyService.createFaculty(form);
        addToast('Faculty Added successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err) {
      addToast(err.message || 'Error saving faculty member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const id = deleteTarget.id || deleteTarget._id;
      await facultyService.deleteFaculty(id, deleteTarget.photo_url);
      addToast('Faculty Deleted successfully!', 'success');
      setDeleteTarget(null);
      fetchFaculty();
    } catch (err) {
      addToast(err.message || 'Failed to delete faculty member', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl text-secondary">Faculty Directory</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage academic instructors, department heads, subject experts, and faculty profiles.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center justify-center gap-2 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all shadow-tactile-btn cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          + Add Faculty Member
        </button>
      </div>

      {/* Main List Table / Grid */}
      <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-premium overflow-hidden">
        {loading ? (
          /* Loading Skeletons */
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div className="space-y-2">
                    <div className="w-40 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-3 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : facultyList.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
              badge
            </span>
            <h3 className="font-headings font-bold text-base text-secondary">No Faculty Members Found</h3>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Get started by adding your first academic faculty profile.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-tactile-btn cursor-pointer"
            >
              + Add Faculty
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-4">Faculty Name</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Qualification</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4 text-center">Order</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
                {facultyList.map((member) => (
                  <tr key={member.id || member._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4">
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-secondary shadow-sm"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-headings font-bold text-secondary text-sm">
                      {member.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-[11px]">
                        {member.subject}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-on-surface">
                      {member.designation}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {member.qualification}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {member.experience}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-secondary">
                      #{member.display_order}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          member.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/40'
                            : 'bg-rose-100 text-rose-800 border border-rose-300/40'
                        }`}
                      >
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title="Edit Faculty"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(member)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Faculty"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Faculty Profile' : 'Add New Faculty Member'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
          {/* Faculty Photo Uploader */}
          <div className="space-y-2">
            <label className="font-headings font-bold text-on-surface-variant block">
              Faculty Photo * (JPG, PNG, WEBP &bull; Max 5MB)
            </label>
            <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-headings file:font-bold file:bg-primary file:text-white hover:file:bg-primary-container cursor-pointer"
                />
                {uploading && (
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px] text-on-surface-variant">
                      <span>Uploading image...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faculty Name */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Faculty Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. Jitender Sharma"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Subject Specialization
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Physics & Mechanics"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Designation / Title
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="e.g. Senior Physics HOD"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            {/* Qualification */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Academic Qualification
              </label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="e.g. Ph.D. Physics (IIT Delhi)"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Teaching Experience
              </label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. 15+ Years Teaching"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            {/* Display Order */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Display Order Position
              </label>
              <input
                type="number"
                min="1"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest font-mono"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-outline-variant/15">
            <span className="font-headings font-bold text-on-surface-variant">
              Profile Active Status
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative" />
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant font-headings font-bold hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary-container text-white font-headings font-bold shadow-tactile-btn transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingMember ? 'Update Faculty' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Faculty Member"
        message={`Are you sure you want to remove ${deleteTarget?.name}? This action will permanently remove their profile record and image.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Faculty'}
        isDanger={true}
      />
    </div>
  );
}
