import React, { useState, useEffect, useMemo } from 'react';
import { subjectService, getStoredSubjects } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  CLASS_CATEGORIES,
  CLASS_CODES,
  getCategoryConfig,
  getSubjectCategory,
  normalizeClassCode,
  formatClassLabel,
} from '../../config/classConfig';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const initialSubjectForm = {
  name: '',
  categoryCode: 'S2',
  category: 'Foundation',
  className: 'Class S2',
  description: '',
  teacherName: 'Jitender Sharma',
  batchTime: '5:00 PM – 6:30 PM',
};

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState(() => {
    try {
      return getStoredSubjects() || [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'S1' | 'S2' | 'S3' | 'S4'
  const [searchQuery, setSearchQuery] = useState('');

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
      } else {
        setSubjects(getStoredSubjects() || []);
      }
    } catch (err) {
      addToast(err.message || 'Error fetching subjects', 'error');
      setSubjects(getStoredSubjects() || []);
    } finally {
      setLoading(false);
    }
  };

  // Category statistics counts
  const categoryCounts = useMemo(() => {
    const counts = { All: subjects.length, S1: 0, S2: 0, S3: 0, S4: 0 };
    subjects.forEach((sub) => {
      const cat = getSubjectCategory(sub);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [subjects]);

  // Filtered subjects based on selected category & search query
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const cat = getSubjectCategory(sub);
      const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sub.name?.toLowerCase().includes(q) ||
        sub.teacherName?.toLowerCase().includes(q) ||
        sub.category?.toLowerCase().includes(q) ||
        sub.className?.toLowerCase().includes(q) ||
        sub.description?.toLowerCase().includes(q)
      );
    });
  }, [subjects, selectedCategory, searchQuery]);

  const activeCategoryMeta = useMemo(() => {
    if (selectedCategory === 'All') return null;
    return getCategoryConfig(selectedCategory);
  }, [selectedCategory]);

  const handleOpenAdd = (prefillCat = null) => {
    const targetCat = prefillCat || (selectedCategory !== 'All' ? selectedCategory : 'S2');
    const catConfig = getCategoryConfig(targetCat);
    const defaultTemplate = catConfig.defaultSubjects?.[0] || null;

    setEditingSubject(null);
    setForm({
      name: defaultTemplate?.name || '',
      categoryCode: targetCat,
      category: defaultTemplate?.category || catConfig.availableStreams?.[0] || 'Foundation',
      className: `Class ${targetCat}`,
      description: defaultTemplate?.description || '',
      teacherName: defaultTemplate?.teacherName || 'Jitender Sharma',
      batchTime: defaultTemplate?.batchTime || '5:00 PM – 6:30 PM',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    const cat = getSubjectCategory(subject);
    setEditingSubject(subject);
    setForm({
      ...subject,
      categoryCode: cat,
      category: subject.category || 'Foundation',
      className: subject.className || `Class ${cat}`,
      batchTime: subject.batchTime || '5:00 PM – 6:30 PM',
      teacherName: subject.teacherName || 'Jitender Sharma',
      description: subject.description || '',
    });
    setIsModalOpen(true);
  };

  // When category changes in the modal form
  const handleModalCategoryChange = (newCat) => {
    const catConfig = getCategoryConfig(newCat);
    const defaultTemplate = catConfig.defaultSubjects?.[0] || null;

    setForm((prev) => ({
      ...prev,
      categoryCode: newCat,
      className: `Class ${newCat}`,
      category: catConfig.availableStreams?.[0] || 'Foundation',
      name: defaultTemplate?.name || prev.name,
      description: defaultTemplate?.description || prev.description,
      batchTime: defaultTemplate?.batchTime || prev.batchTime,
      teacherName: defaultTemplate?.teacherName || prev.teacherName,
    }));
  };

  // When picking a quick template in modal
  const handleTemplatePick = (templateName) => {
    if (!templateName) return;
    const catConfig = getCategoryConfig(form.categoryCode);
    const matched = catConfig.defaultSubjects?.find((s) => s.name === templateName);
    if (matched) {
      setForm((prev) => ({
        ...prev,
        name: matched.name,
        category: matched.category || prev.category,
        description: matched.description || prev.description,
        batchTime: matched.batchTime || prev.batchTime,
        teacherName: matched.teacherName || prev.teacherName,
      }));
    } else {
      setForm((prev) => ({ ...prev, name: templateName }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('Please enter a subject name', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      className: form.className || `Class ${form.categoryCode}`,
      category: form.category || 'Foundation',
    };

    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject._id || editingSubject.id, payload);
        addToast('Subject updated successfully', 'success');
      } else {
        await subjectService.createSubject(payload);
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
      await subjectService.deleteSubject(deleteTarget._id || deleteTarget.id);
      addToast('Subject deleted successfully', 'success');
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      addToast(err.message || 'Error deleting subject', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Helper for category badge color styling on cards
  const getCategoryBadgeStyle = (catCode) => {
    switch (catCode) {
      case 'S1':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'S2':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'S3':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'S4':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1 font-medium">
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Subjects &amp; Batches</span>
          </div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary tracking-tight">
            Subjects &amp; Batch Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Configure active subject offerings, categories (S1, S2, S3, S4), faculty assignments, and batch timings.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : null)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
          id="add-subject-btn"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Subject Offering
        </button>
      </div>

      {/* Category Dropdown & Quick-Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-premium border border-outline-variant/15 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Category Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="category-select" className="text-xs font-headings font-bold text-secondary flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px] text-primary">category</span>
              Select Category:
            </label>
            <div className="relative min-w-[260px] sm:min-w-[300px]">
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl px-4 py-2.5 text-xs font-headings font-bold text-secondary appearance-none cursor-pointer pr-10 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Categories ({categoryCounts.All} Subjects)</option>
                {CLASS_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label} ({categoryCounts[cat.code] || 0} Subjects)
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, faculty, or stream..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-rose-600 rounded-full"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Quick Filter Tabs / Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/10">
          <span className="text-[11px] font-semibold text-on-surface-variant mr-1">Quick View:</span>
          
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-headings font-bold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'All'
                ? 'bg-secondary text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>All Categories</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'
            }`}>
              {categoryCounts.All}
            </span>
          </button>

          {CLASS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.code;
            const count = categoryCounts[cat.code] || 0;
            return (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-headings font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                <span>{cat.shortLabel || cat.code}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Overview Banner */}
      {activeCategoryMeta && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary/95 to-secondary p-5 text-white shadow-premium">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-[11px] font-headings font-extrabold uppercase tracking-wider text-amber-300">
                  {activeCategoryMeta.code} Wing
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {activeCategoryMeta.gradeSpan}
                </span>
              </div>
              <h2 className="font-headings font-bold text-lg md:text-xl text-white">
                {activeCategoryMeta.title}
              </h2>
              <p className="text-xs text-white/80 leading-relaxed font-body">
                {activeCategoryMeta.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
              <button
                onClick={() => handleOpenAdd(activeCategoryMeta.code)}
                className="bg-amber-400 hover:bg-amber-300 text-secondary font-headings font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Add {activeCategoryMeta.code} Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Subject Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs font-semibold text-on-surface-variant animate-pulse flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
          <span>Loading active subject offerings...</span>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-premium border border-outline-variant/15 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px] text-primary">
              menu_book
            </span>
          </div>
          <h4 className="font-headings font-bold text-base text-secondary">
            {selectedCategory === 'All'
              ? 'No Subjects Found'
              : `No Subjects Configured for Category ${selectedCategory}`}
          </h4>
          <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-5">
            {searchQuery
              ? `No subjects match your search "${searchQuery}". Try a different search term or category.`
              : `There are currently no active subject offerings under ${
                  selectedCategory === 'All' ? 'this filter' : `Category ${selectedCategory}`
                }.`}
          </p>
          <button
            onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : null)}
            className="bg-primary text-white font-headings font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-sm hover:shadow-glow-primary transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Add First Subject to {selectedCategory !== 'All' ? selectedCategory : 'Catalog'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub) => {
            const catCode = getSubjectCategory(sub);
            const badgeStyle = getCategoryBadgeStyle(catCode);
            const catMeta = getCategoryConfig(catCode);

            return (
              <div
                key={sub._id || sub.id}
                className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div>
                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg font-headings font-bold text-[11px] border ${badgeStyle} flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-[14px]">{catMeta?.icon || 'school'}</span>
                      {sub.className || `Class ${catCode}`}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-headings font-bold text-[11px] border border-primary/15">
                      Category: {sub.category || 'Foundation'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg ml-auto">
                      {sub.totalEnrolled || 15} Enrolled
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-headings font-bold text-lg text-secondary group-hover:text-primary transition-colors mb-1.5">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-3">
                    {sub.description || 'Comprehensive conceptual coaching and board exam preparation.'}
                  </p>
                </div>

                {/* Footer Details */}
                <div className="border-t border-outline-variant/15 pt-3.5 space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-secondary">person</span>
                      Faculty:
                    </span>
                    <strong className="text-secondary font-bold font-headings">{sub.teacherName || 'Jitender Sharma'}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                      Batch Timing:
                    </span>
                    <strong className="text-primary font-mono text-[11px] bg-primary/5 px-2 py-0.5 rounded-md font-semibold">
                      {sub.batchTime || '5:00 PM – 6:30 PM'}
                    </strong>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] uppercase font-headings font-bold tracking-wider text-on-surface-variant/60">
                      {catCode} Track
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Edit Subject"
                        aria-label={`Edit ${sub.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sub)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Subject"
                        aria-label={`Delete ${sub.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject Offering' : 'Add New Subject Offering'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-body">
          {/* Category Selector in Modal */}
          <div className="flex flex-col gap-1.5">
            <label className="font-headings font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">category</span>
              Subject Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLASS_CATEGORIES.map((cat) => {
                const isSelected = form.categoryCode === cat.code;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => handleModalCategoryChange(cat.code)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm'
                        : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-headings font-extrabold text-xs text-secondary">{cat.code}</span>
                      <span className="material-symbols-outlined text-[16px] text-primary">{cat.icon}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-medium mt-1 truncate">
                      {cat.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Subject Templates for Selected Category */}
          {(() => {
            const catConfig = getCategoryConfig(form.categoryCode);
            const templates = catConfig.defaultSubjects || [];
            if (templates.length === 0) return null;
            return (
              <div className="bg-surface-container-low/60 p-3 rounded-xl border border-outline-variant/20 space-y-1.5">
                <span className="text-[11px] font-headings font-bold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">lightbulb</span>
                  Quick Template for Category {form.categoryCode}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleTemplatePick(tpl.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        form.name === tpl.name
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white hover:bg-primary/5 text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Subject Name */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mathematics Foundation / Physics IIT-JEE"
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Category Stream & Class Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Stream / Curriculum Track *
              </label>
              <div className="relative">
                <select
                  value={form.category || 'Foundation'}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs appearance-none pr-8 focus:border-primary focus:outline-none"
                >
                  {getCategoryConfig(form.categoryCode).availableStreams?.map((stream) => (
                    <option key={stream} value={stream}>
                      {stream}
                    </option>
                  )) || (
                    <>
                      <option value="Foundation">Foundation</option>
                      <option value="Advanced">Advanced</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="Olympiad">Olympiad</option>
                      <option value="Board Prep">Board Prep</option>
                    </>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Class / Grade Group *
              </label>
              <div className="relative">
                <select
                  value={form.className || `Class ${form.categoryCode}`}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs appearance-none pr-8 focus:border-primary focus:outline-none"
                >
                  <option value={`Class ${form.categoryCode}`}>Class {form.categoryCode} (All Grades)</option>
                  {getCategoryConfig(form.categoryCode).classes?.map((cls) => (
                    <option key={cls} value={cls.startsWith('Class') ? cls : `Class ${cls}`}>
                      {cls.startsWith('Class') ? cls : `Class ${cls}`}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Batch Time & Faculty Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Batch Time *
              </label>
              <input
                type="text"
                required
                value={form.batchTime}
                onChange={(e) => setForm({ ...form, batchTime: e.target.value })}
                placeholder="e.g. 5:00 PM – 6:30 PM"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono focus:border-primary focus:outline-none"
              />
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
                placeholder="e.g. Jitender Sharma"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Course Description */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Course Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed syllabus focus, concepts covered, problem-solving methods..."
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-body focus:border-primary focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold hover:bg-surface-container-high transition-colors"
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={`Delete Subject ${deleteTarget?.name}?`}
        message={`Are you sure you want to remove this ${getSubjectCategory(deleteTarget)} subject offering from the active academic catalog?`}
      />
    </div>
  );
}
