import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  subjectService,
  getStoredSubjects,
  getStoredStudents,
  getStoredFaculty,
  calculateDynamicSubjectEnrollment,
  getEnrolledStudentsForSubject,
  subscribeFirestoreCollection,
} from '../../services/api';
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
  categoryCode: 'S3',
  category: 'JEE',
  className: 'Class S3',
  description: '',
  teacherName: 'Jitender Sharma',
  batchTime: '5:00 PM – 6:30 PM',
  maxCapacity: 20,
};

const BATCH_TIME_PRESETS = [
  '8:00 AM – 9:30 AM',
  '10:00 AM – 11:30 AM',
  '2:00 PM – 3:30 PM',
  '3:30 PM – 5:00 PM',
  '4:00 PM – 5:30 PM',
  '5:00 PM – 6:30 PM',
  '5:30 PM – 7:00 PM',
  '6:00 PM – 7:30 PM',
  '6:30 PM – 8:00 PM',
  '7:00 PM – 8:30 PM',
];

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState(() => {
    try {
      return getStoredSubjects() || [];
    } catch (e) {
      return [];
    }
  });
  const [students, setStudents] = useState(() => {
    try {
      return getStoredStudents() || [];
    } catch (e) {
      return [];
    }
  });
  const [facultyList, setFacultyList] = useState(() => {
    try {
      return getStoredFaculty() || [];
    } catch (e) {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [customFacultyInput, setCustomFacultyInput] = useState(false);

  // Multi-Filter State
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'S1' | 'S2' | 'S3' | 'S4'
  const [selectedStream, setSelectedStream] = useState('All');
  const [selectedFaculty, setSelectedFaculty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(initialSubjectForm);
  const [submitting, setSubmitting] = useState(false);

  // Roster Modal State
  const [rosterSubject, setRosterSubject] = useState(null);

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Clear All Modal
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchData();

    // Live Real-Time Subscriptions for Subjects, Students & Faculty
    let unsubSubjects = null;
    let unsubStudents = null;
    let unsubFaculty = null;

    try {
      unsubSubjects = subscribeFirestoreCollection('subjects', [], (list) => {
        if (Array.isArray(list)) setSubjects(list);
      });
      unsubStudents = subscribeFirestoreCollection('students', [], (list) => {
        if (Array.isArray(list)) setStudents(list);
      });
      unsubFaculty = subscribeFirestoreCollection('faculty', [], (list) => {
        if (Array.isArray(list)) setFacultyList(list);
      });
    } catch (e) {}

    const handleUpdate = () => fetchData(false);
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      if (typeof unsubSubjects === 'function') unsubSubjects();
      if (typeof unsubStudents === 'function') unsubStudents();
      if (typeof unsubFaculty === 'function') unsubFaculty();
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await subjectService.getSubjects();
      if (data && data.subjects) {
        setSubjects(data.subjects);
      } else {
        setSubjects(getStoredSubjects() || []);
      }
      setStudents(getStoredStudents() || []);
      setFacultyList(getStoredFaculty() || []);
    } catch (err) {
      setSubjects(getStoredSubjects() || []);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Clear All Subjects action to completely wipe existing mock data
  const handleClearAllSubjects = async () => {
    setClearing(true);
    try {
      await subjectService.clearAllSubjects();
      setSubjects([]);
      setClearAllOpen(false);
      addToast('All subjects cleared! You can now add your own real subject catalog.', 'success');
    } catch (err) {
      addToast('Error clearing subjects: ' + err.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  // Available unique streams across currently active subjects
  const availableStreamsList = useMemo(() => {
    const streams = new Set();
    subjects.forEach((s) => {
      if (s.category) streams.add(s.category.trim());
    });
    return Array.from(streams).sort();
  }, [subjects]);

  // Available faculty list combining registered faculty & instructors
  const availableFacultyNames = useMemo(() => {
    const names = new Set();
    facultyList.forEach((f) => {
      if (f.name) names.add(f.name.trim());
    });
    subjects.forEach((s) => {
      if (s.teacherName) names.add(s.teacherName.trim());
    });
    if (names.size === 0) {
      names.add('Jitender Sharma');
      names.add('Dr. Ramesh Verma');
      names.add('Mrs. Sunita Sharma');
    }
    return Array.from(names).sort();
  }, [facultyList, subjects]);

  // Category statistics counts (calculated dynamically from real user subjects)
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

  // Overall Dynamic Catalog Metrics
  const metrics = useMemo(() => {
    let totalEnrollments = 0;
    const uniqueTeachers = new Set();

    subjects.forEach((sub) => {
      const enrolled = calculateDynamicSubjectEnrollment(sub, students);
      totalEnrollments += enrolled;
      if (sub.teacherName) uniqueTeachers.add(sub.teacherName.trim());
    });

    return {
      totalSubjects: subjects.length,
      totalEnrollments,
      totalFaculty: uniqueTeachers.size,
      avgBatchSize: subjects.length ? Math.round(totalEnrollments / subjects.length) : 0,
    };
  }, [subjects, students]);

  // Filtered subjects based on selected filters & search query
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const cat = getSubjectCategory(sub);
      const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
      if (!matchesCat) return false;

      const matchesStream = selectedStream === 'All' || sub.category === selectedStream;
      if (!matchesStream) return false;

      const matchesFaculty =
        selectedFaculty === 'All' ||
        (sub.teacherName && sub.teacherName.toLowerCase().includes(selectedFaculty.toLowerCase()));
      if (!matchesFaculty) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sub.name?.toLowerCase().includes(q) ||
        sub.teacherName?.toLowerCase().includes(q) ||
        sub.category?.toLowerCase().includes(q) ||
        sub.className?.toLowerCase().includes(q) ||
        sub.description?.toLowerCase().includes(q) ||
        sub.batchTime?.toLowerCase().includes(q)
      );
    });
  }, [subjects, selectedCategory, selectedStream, selectedFaculty, searchQuery]);

  const activeCategoryMeta = useMemo(() => {
    if (selectedCategory === 'All') return null;
    return getCategoryConfig(selectedCategory);
  }, [selectedCategory]);

  const handleOpenAdd = (prefillCat = null) => {
    const targetCat = prefillCat || (selectedCategory !== 'All' ? selectedCategory : 'S3');
    const catConfig = getCategoryConfig(targetCat);
    const defaultStream = catConfig.availableStreams?.[0] || 'Foundation';

    setEditingSubject(null);
    setCustomFacultyInput(false);
    setForm({
      name: '',
      categoryCode: targetCat,
      category: defaultStream,
      className: `Class ${targetCat}`,
      description: '',
      teacherName: availableFacultyNames[0] || 'Jitender Sharma',
      batchTime: '5:00 PM – 6:30 PM',
      maxCapacity: 20,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    const cat = getSubjectCategory(subject);
    setEditingSubject(subject);
    setCustomFacultyInput(false);
    setForm({
      ...subject,
      categoryCode: cat,
      category: subject.category || 'Foundation',
      className: subject.className || `Class ${cat}`,
      batchTime: subject.batchTime || '5:00 PM – 6:30 PM',
      teacherName: subject.teacherName || 'Jitender Sharma',
      description: subject.description || '',
      maxCapacity: Number(subject.maxCapacity) || 20,
    });
    setIsModalOpen(true);
  };

  // When category changes in the modal form
  const handleModalCategoryChange = (newCat) => {
    const catConfig = getCategoryConfig(newCat);
    setForm((prev) => ({
      ...prev,
      categoryCode: newCat,
      className: `Class ${newCat}`,
      category: catConfig.availableStreams?.[0] || 'Foundation',
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('Please enter a subject title', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      className: form.className || `Class ${form.categoryCode}`,
      category: form.category || 'Foundation',
      maxCapacity: Number(form.maxCapacity) || 20,
    };

    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject._id || editingSubject.id, payload);
        addToast('Subject updated successfully', 'success');
      } else {
        await subjectService.createSubject(payload);
        addToast('New subject added to academic catalog', 'success');
      }
      setIsModalOpen(false);
      fetchData(false);
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
      addToast(`"${deleteTarget.name}" removed from catalog`, 'success');
      setDeleteTarget(null);
      fetchData(false);
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

  // Helper for stream badge color
  const getStreamBadgeStyle = (stream = '') => {
    const s = stream.toLowerCase();
    if (s.includes('jee')) return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    if (s.includes('neet')) return 'bg-rose-500/10 text-rose-700 border-rose-500/30';
    if (s.includes('olympiad')) return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30';
    if (s.includes('advanced')) return 'bg-primary/10 text-primary border-primary/20';
    if (s.includes('skill') || s.includes('tech')) return 'bg-teal-500/10 text-teal-700 border-teal-500/30';
    return 'bg-secondary/10 text-secondary border-secondary/20';
  };

  return (
    <div className="space-y-6 font-body">
      {/* Top Header & Overview Bar */}
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
            Dynamic real-time subject catalog, class wings (S1, S2, S3, S4), batch capacity, live student rosters, and faculty assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {subjects.length > 0 && (
            <button
              onClick={() => setClearAllOpen(true)}
              className="bg-surface-container-low hover:bg-rose-50 text-rose-700 font-headings font-bold px-4 py-2.5 rounded-full text-xs flex items-center gap-1.5 border border-rose-200 shadow-sm transition-all"
              title="Remove all subjects and start fresh"
            >
              <span className="material-symbols-outlined text-[17px] text-rose-600">delete_sweep</span>
              <span>Clear All Subjects</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : null)}
            className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
            id="add-subject-btn"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Subject Offering</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-outline-variant/15 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">menu_book</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Active Subjects</div>
            <div className="font-headings font-extrabold text-xl text-secondary">{metrics.totalSubjects}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-outline-variant/15 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">groups</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Enrolled</div>
            <div className="font-headings font-extrabold text-xl text-emerald-800">{metrics.totalEnrollments} Students</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-outline-variant/15 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">badge</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Faculty Assigned</div>
            <div className="font-headings font-extrabold text-xl text-secondary">{metrics.totalFaculty} Instructors</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-outline-variant/15 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">bar_chart</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Avg. Batch Size</div>
            <div className="font-headings font-extrabold text-xl text-secondary">{metrics.avgBatchSize} / Batch</div>
          </div>
        </div>
      </div>

      {/* Category Dropdown & Quick-Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-premium border border-outline-variant/15 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Main Category Dropdown Selector */}
          <div>
            <label htmlFor="category-select" className="text-[11px] font-headings font-bold text-secondary mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">category</span>
              Category Wing:
            </label>
            <div className="relative">
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedStream('All');
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 hover:border-primary focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-headings font-bold text-secondary appearance-none cursor-pointer pr-9 shadow-sm transition-all focus:outline-none"
              >
                <option value="All">All Categories ({categoryCounts.All})</option>
                {CLASS_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.code} — {cat.shortLabel || cat.label} ({categoryCounts[cat.code] || 0})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Stream Filter */}
          <div>
            <label className="text-[11px] font-headings font-bold text-secondary mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">track_changes</span>
              Stream / Track:
            </label>
            <div className="relative">
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 hover:border-primary focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-semibold text-secondary appearance-none cursor-pointer pr-9 shadow-sm transition-all focus:outline-none"
              >
                <option value="All">All Streams</option>
                {availableStreamsList.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="text-[11px] font-headings font-bold text-secondary mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">person</span>
              Faculty:
            </label>
            <div className="relative">
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 hover:border-primary focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-semibold text-secondary appearance-none cursor-pointer pr-9 shadow-sm transition-all focus:outline-none"
              >
                <option value="All">All Faculty</option>
                {availableFacultyNames.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div>
            <label className="text-[11px] font-headings font-bold text-secondary mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">search</span>
              Search Catalog:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, timing, faculty..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-body focus:border-primary focus:outline-none transition-all"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[17px]">
                search
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-on-surface-variant hover:text-rose-600 rounded-full"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Quick Filter Tabs / Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/10">
          <span className="text-[11px] font-semibold text-on-surface-variant mr-1">Quick View:</span>

          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStream('All');
            }}
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
                onClick={() => {
                  setSelectedCategory(cat.code);
                  setSelectedStream('All');
                }}
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
                className="bg-amber-400 hover:bg-amber-300 text-secondary font-headings font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
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
          <span>Loading dynamic subject catalog &amp; student rosters...</span>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-premium border border-outline-variant/15 flex flex-col items-center justify-center space-y-4">
          <div className="w-18 h-18 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[38px]">menu_book</span>
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="font-headings font-extrabold text-xl text-secondary">
              {subjects.length === 0
                ? 'Academic Catalog is Ready for Your Subjects'
                : selectedCategory === 'All'
                ? 'No Matching Subjects Found'
                : `No Subjects in Category ${selectedCategory}`}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {subjects.length === 0
                ? 'There are currently no static or hardcoded subjects. Add your institute’s real subject offerings, faculty, batch timings, and capacities using the button below.'
                : 'Try adjusting your search query, stream, or category filters to view other configured subjects.'}
            </p>
          </div>

          <button
            onClick={() => handleOpenAdd(selectedCategory !== 'All' ? selectedCategory : null)}
            className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-6 py-3 rounded-full text-xs flex items-center gap-2 shadow-tactile-btn shadow-premium hover:shadow-glow-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add First Subject Offering</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub) => {
            const catCode = getSubjectCategory(sub);
            const badgeStyle = getCategoryBadgeStyle(catCode);
            const streamStyle = getStreamBadgeStyle(sub.category);
            const catMeta = getCategoryConfig(catCode);

            const dynamicEnrolledCount = calculateDynamicSubjectEnrollment(sub, students);
            const maxCap = Number(sub.maxCapacity) || 20;
            const fillPct = Math.min(100, Math.round((dynamicEnrolledCount / maxCap) * 100));

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

                    <span className={`px-2.5 py-1 rounded-lg font-headings font-bold text-[11px] border ${streamStyle}`}>
                      {sub.category || 'Foundation'}
                    </span>

                    {/* Dynamic Enrollment Pill with Roster Click */}
                    <button
                      type="button"
                      onClick={() => setRosterSubject(sub)}
                      className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg ml-auto flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="Click to view real enrolled students in this subject"
                    >
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">group</span>
                      <span>{dynamicEnrolledCount} Enrolled</span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-headings font-bold text-lg text-secondary group-hover:text-primary transition-colors mb-1.5 leading-snug">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-3">
                    {sub.description || 'Custom subject curriculum, concept drills, and exam preparation.'}
                  </p>

                  {/* Batch Capacity Bar */}
                  <div className="bg-surface-container-low/60 rounded-xl p-2.5 border border-outline-variant/15 mb-3 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant">
                      <span>Batch Capacity</span>
                      <span className="text-secondary font-mono">{dynamicEnrolledCount} / {maxCap} ({fillPct}%)</span>
                    </div>
                    <div className="w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          fillPct >= 90 ? 'bg-amber-500' : fillPct >= 60 ? 'bg-primary' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Details */}
                <div className="border-t border-outline-variant/15 pt-3.5 space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-secondary">person</span>
                      Faculty:
                    </span>
                    <strong className="text-secondary font-bold font-headings truncate max-w-[180px]">
                      {sub.teacherName || 'Jitender Sharma'}
                    </strong>
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

                  {/* Actions & Roster Link */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setRosterSubject(sub)}
                      className="text-[11px] font-headings font-bold text-secondary hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">badge</span>
                      <span>Student Roster</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title="Edit Subject Offering"
                        aria-label={`Edit ${sub.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sub)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Subject"
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

      {/* MODAL 1: Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject Offering' : 'Add New Subject Offering'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-body max-h-[80vh] overflow-y-auto pr-1">
          {/* Category Selector in Modal */}
          <div className="flex flex-col gap-1.5">
            <label className="font-headings font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">category</span>
              Category Stage *
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
              placeholder="e.g. Physics IIT-JEE / Advanced Chemistry / English Grammar"
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

          {/* Dynamic Faculty Selection */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="font-headings font-bold text-on-surface-variant">
                Assigned Faculty *
              </label>
              <button
                type="button"
                onClick={() => setCustomFacultyInput(!customFacultyInput)}
                className="text-[10px] text-primary font-bold hover:underline"
              >
                {customFacultyInput ? 'Select from list' : '+ Enter custom name'}
              </button>
            </div>

            {customFacultyInput ? (
              <input
                type="text"
                required
                value={form.teacherName}
                onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                placeholder="Enter Instructor / Faculty Name"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="relative">
                <select
                  value={form.teacherName}
                  onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs appearance-none pr-8 focus:border-primary focus:outline-none"
                >
                  {availableFacultyNames.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            )}
          </div>

          {/* Batch Timing with Quick Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="font-headings font-bold text-on-surface-variant">
              Batch Timing *
            </label>
            <input
              type="text"
              required
              value={form.batchTime}
              onChange={(e) => setForm({ ...form, batchTime: e.target.value })}
              placeholder="e.g. 5:00 PM – 6:30 PM"
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono focus:border-primary focus:outline-none"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-on-surface-variant/70 font-semibold self-center mr-1">Presets:</span>
              {BATCH_TIME_PRESETS.slice(3, 8).map((timePreset) => (
                <button
                  key={timePreset}
                  type="button"
                  onClick={() => setForm({ ...form, batchTime: timePreset })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    form.batchTime === timePreset
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-outline-variant/20'
                  }`}
                >
                  {timePreset}
                </button>
              ))}
            </div>
          </div>

          {/* Max Capacity */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Batch Maximum Capacity (Students)
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={form.maxCapacity}
              onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) || 20 })}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:border-primary focus:outline-none"
            />
          </div>

          {/* Course Description */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Course Description &amp; Syllabus Focus
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
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-container text-white px-5 py-2 rounded-full text-xs font-headings font-bold transition-colors shadow-tactile-btn shadow-premium cursor-pointer"
            >
              {editingSubject ? 'Update Subject' : 'Save Subject Offering'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Dynamic Enrolled Student Roster Modal */}
      {rosterSubject && (
        <Modal
          isOpen={!!rosterSubject}
          onClose={() => setRosterSubject(null)}
          title={`Enrolled Students: ${rosterSubject.name}`}
        >
          <div className="space-y-4 text-xs font-body max-h-[75vh] overflow-y-auto pr-1">
            {/* Subject Overview Card */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 space-y-2">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                      {rosterSubject.className || 'Class S3'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 font-bold text-[10px]">
                      {rosterSubject.category || 'JEE'} Track
                    </span>
                  </div>
                  <h4 className="font-headings font-bold text-base text-secondary">{rosterSubject.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-primary font-bold bg-white px-2.5 py-1 rounded-md border border-primary/20 block">
                    {rosterSubject.batchTime || '5:00 PM – 6:30 PM'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    Instructor: <strong>{rosterSubject.teacherName || 'Jitender Sharma'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* List of Enrolled Students */}
            {(() => {
              const enrolledStudents = getEnrolledStudentsForSubject(rosterSubject, students);

              if (enrolledStudents.length === 0) {
                return (
                  <div className="p-8 text-center bg-white rounded-2xl border border-outline-variant/15 space-y-2">
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">person_off</span>
                    <p className="text-xs font-semibold text-on-surface-variant">No active student enrollment found in this specific subject.</p>
                    <p className="text-[11px] text-on-surface-variant/70">Students can be assigned to this subject track from Student Directory.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1 text-[11px] font-bold text-on-surface-variant">
                    <span>Active Enrolled Roster ({enrolledStudents.length} Students)</span>
                    <span>Max Capacity: {rosterSubject.maxCapacity || 20}</span>
                  </div>

                  <div className="divide-y divide-outline-variant/15 border border-outline-variant/15 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {enrolledStudents.map((st) => (
                      <div key={st._id || st.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors">
                        <div className="flex items-center gap-3">
                          {st.photo ? (
                            <img src={st.photo} alt={st.fullName} className="w-10 h-10 rounded-xl object-cover border border-outline-variant/20 shadow-xs shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-headings font-extrabold shrink-0">
                              {st.fullName ? st.fullName.charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div>
                            <div className="font-headings font-bold text-xs text-secondary flex items-center gap-1.5">
                              <span>{st.fullName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-container font-semibold text-on-surface-variant">
                                {st.rollNumber || 'Roll N/A'}
                              </span>
                            </div>
                            <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                              <span>Class {st.className || '10th'}</span>
                              <span>&bull;</span>
                              <span>{st.phone || st.parentPhone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.feesPaid || st.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {st.status || 'Active'}
                          </span>
                          <Link
                            to={`/admin/students/${st._id || st.id}`}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="View Full Profile"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setRosterSubject(null)}
                className="px-5 py-2 rounded-full bg-secondary text-white font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant transition-colors cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={`Delete Subject ${deleteTarget?.name}?`}
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}" from your active subject catalog?`}
      />

      {/* MODAL 4: Clear All Subjects Confirmation Modal */}
      <ConfirmModal
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={handleClearAllSubjects}
        loading={clearing}
        title="Clear All Subjects?"
        message="Are you sure you want to remove all existing subjects from the catalog and start fresh? You can add all your real subjects dynamically one by one."
      />
    </div>
  );
}
