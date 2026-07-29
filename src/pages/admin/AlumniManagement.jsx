import React, { useState, useEffect, useRef } from 'react';
import { alumniService, subscribeFirestoreCollection, getStoredAlumni } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function AlumniManagement() {
  const [alumniList, setAlumniList] = useState(() => {
    try {
      return getStoredAlumni() || [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [course, setCourse] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [packageCtc, setPackageCtc] = useState('');
  const [location, setLocation] = useState('');
  const [achievement, setAchievement] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Upload Progress & State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAlumni, setDeletingAlumni] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeFirestoreCollection('alumni', [], (list) => {
      if (list) {
        let filtered = [...list];
        if (filterFeatured) filtered = filtered.filter((a) => a.is_featured);
        if (filterActive) filtered = filtered.filter((a) => a.is_active !== false);
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.display_order || 1) - (b.display_order || 1));
        setAlumniList(filtered);
        setLoading(false);
      }
    });

    fetchAlumni();
    return () => unsubscribe();
  }, [filterFeatured, filterActive]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await alumniService.getAlumni({
        featuredOnly: filterFeatured ? true : undefined,
        activeOnly: filterActive ? true : undefined,
      });
      if (res && res.alumni) {
        setAlumniList(res.alumni);
      }
    } catch (err) {
      addToast('Error fetching alumni roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAlumni(null);
    setFullName('');
    setGraduationYear(new Date().getFullYear());
    setCourse('');
    setCurrentCompany('');
    setCurrentPosition('');
    setPackageCtc('');
    setLocation('');
    setAchievement('');
    setTestimonial('');
    setLinkedinUrl('');
    setPhotoUrl('');
    setDisplayOrder(alumniList.length + 1);
    setIsFeatured(false);
    setIsActive(true);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const openEditModal = (alumnus) => {
    setEditingAlumni(alumnus);
    setFullName(alumnus.full_name || '');
    setGraduationYear(alumnus.graduation_year || new Date().getFullYear());
    setCourse(alumnus.course || '');
    setCurrentCompany(alumnus.current_company || '');
    setCurrentPosition(alumnus.current_position || '');
    setPackageCtc(alumnus.package_ctc || '');
    setLocation(alumnus.location || '');
    setAchievement(alumnus.achievement || '');
    setTestimonial(alumnus.testimonial || '');
    setLinkedinUrl(alumnus.linkedin_url || '');
    setPhotoUrl(alumnus.photo_url || '');
    setDisplayOrder(alumnus.display_order || 1);
    setIsFeatured(Boolean(alumnus.is_featured));
    setIsActive(Boolean(alumnus.is_active));
    setUploadProgress(100);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      const url = await alumniService.uploadAlumniPhoto(file, (percent) => {
        setUploadProgress(percent);
      });
      setPhotoUrl(url);
      addToast('Photo uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Error uploading photo', 'error');
      setPhotoUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      addToast('Full Name is required', 'warning');
      return;
    }
    if (!graduationYear) {
      addToast('Graduation Year is required', 'warning');
      return;
    }
    if (!currentCompany.trim()) {
      addToast('Current Company is required', 'warning');
      return;
    }
    if (!currentPosition.trim()) {
      addToast('Current Position is required', 'warning');
      return;
    }
    if (!photoUrl) {
      addToast('Alumni photo is required', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      full_name: fullName.trim(),
      graduation_year: Number(graduationYear),
      course: course.trim(),
      current_company: currentCompany.trim(),
      current_position: currentPosition.trim(),
      package_ctc: packageCtc.trim(),
      location: location.trim(),
      achievement: achievement.trim(),
      testimonial: testimonial.trim(),
      linkedin_url: linkedinUrl.trim(),
      photo_url: photoUrl,
      display_order: Number(displayOrder),
      is_featured: isFeatured,
      is_active: isActive,
    };

    try {
      if (editingAlumni) {
        await alumniService.updateAlumni(editingAlumni._id || editingAlumni.id, payload);
        addToast('Alumni profile updated successfully!', 'success');
      } else {
        await alumniService.createAlumni(payload);
        addToast('Alumni added successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchAlumni();
    } catch (err) {
      addToast(err.message || 'Error saving alumni record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (alumnus) => {
    setDeletingAlumni(alumnus);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAlumni) return;
    try {
      await alumniService.deleteAlumni(deletingAlumni._id || deletingAlumni.id, deletingAlumni.photo_url);
      addToast('Alumni deleted successfully!', 'info');
      setIsDeleteModalOpen(false);
      setDeletingAlumni(null);
      fetchAlumni();
    } catch (err) {
      addToast(err.message || 'Error deleting alumni entry', 'error');
    }
  };

  const filteredAlumni = alumniList.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.current_company || '').toLowerCase().includes(q) ||
      (a.current_position || '').toLowerCase().includes(q) ||
      (a.course || '').toLowerCase().includes(q) ||
      String(a.graduation_year).includes(q);

    return matchesQuery;
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Alumni Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Showcase successful graduates, placement achievements, top recruiters, and testimonials.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Alumni
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search alumni by name, company, graduation year, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
            <input
              type="checkbox"
              checked={filterFeatured}
              onChange={(e) => setFilterFeatured(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span>Featured Only</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
            <input
              type="checkbox"
              checked={filterActive}
              onChange={(e) => setFilterActive(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span>Active Only</span>
          </label>
        </div>
      </div>

      {/* Alumni Roster Grid & Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-container-high h-48 rounded-2xl" />
          ))}
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-outline-variant/15 shadow-premium space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">school</span>
          <h3 className="font-headings font-bold text-base text-secondary">No Alumni Found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            No alumni records match your filter criteria. Click "Add Alumni" above to add a new record.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-on-surface border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/15 font-headings font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Alumni</th>
                  <th className="py-3.5 px-4">Grad Year &amp; Course</th>
                  <th className="py-3.5 px-4">Company &amp; Position</th>
                  <th className="py-3.5 px-4">Package (CTC)</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredAlumni.map((a) => (
                  <tr key={a._id || a.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={a.photo_url}
                          alt={a.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shadow-sm"
                        />
                        <div>
                          <p className="font-headings font-bold text-secondary text-xs">{a.full_name}</p>
                          <p className="text-[10px] text-on-surface-variant">{a.location || 'India'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-on-surface">{a.graduation_year}</p>
                      <p className="text-[10px] text-on-surface-variant line-clamp-1">{a.course || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-primary">{a.current_company}</p>
                      <p className="text-[10px] text-on-surface-variant">{a.current_position}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-headings font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px]">
                        {a.package_ctc || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {a.is_featured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <span className="material-symbols-outlined text-[12px]">star</span>
                          Featured
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(a);
                          }}
                          className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit Alumni"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(a);
                          }}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Alumni"
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

      {/* Add / Edit Alumni Modal */}
      <Modal
        isOpen={isModalOpen}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAlumni ? 'Edit Alumni Profile' : 'Add New Alumni'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          {/* Photo Dropzone Uploader */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Alumni Photo <span className="text-rose-500">*</span> (JPG, PNG, WEBP, max 5MB)
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
                  {uploading ? `Uploading photo... ${uploadProgress}%` : photoUrl ? 'Photo uploaded successfully' : 'Click frame to select a photo file.'}
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
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Graduation Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="2000"
                max="2030"
                placeholder="2022"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Current Company <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Google / Microsoft / Apple"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Current Position <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Software Development Engineer II"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Course / Batch</label>
              <input
                type="text"
                placeholder="e.g. JEE Advanced Super 30"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Package (CTC)</label>
              <input
                type="text"
                placeholder="e.g. 32 LPA"
                value={packageCtc}
                onChange={(e) => setPackageCtc(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Current Location</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Short Achievement</label>
            <input
              type="text"
              placeholder="e.g. AIR 342 in JEE Advanced | Gold Medalist IIT Bombay"
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">LinkedIn Profile URL</label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Alumni Testimonial</label>
            <textarea
              rows="3"
              placeholder="Share their experience and words of advice for current students..."
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-outline-variant/15">
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
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Featured Alumni</span>
              </label>
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
              {submitting ? 'Saving...' : editingAlumni ? 'Update Alumni' : 'Save Alumni'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Alumni"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-on-surface font-body">
          <p>
            Are you sure you want to delete alumni profile for{' '}
            <strong className="text-secondary">{deletingAlumni?.full_name}</strong>?
          </p>
          <p className="text-[11px] text-on-surface-variant bg-rose-50 p-3 rounded-xl border border-rose-100">
            This action will permanently delete the entry and remove the photo from Supabase Storage.
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
              Delete Alumni
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
