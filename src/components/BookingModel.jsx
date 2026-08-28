import React, { useEffect, useState } from 'react';
import { subjectService } from '../services/api.js';

export default function BookingModal({ open, prefilledProgram, onClose }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveSubjects, setLiveSubjects] = useState([]);

  // Form selections (Cascading: Subject -> Category -> Class)
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Student contact details
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [branch, setBranch] = useState('Main Center (Bagru)');

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchLiveSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getSubjects();
      if (data && data.subjects) {
        setLiveSubjects(data.subjects);
      }
    } catch (err) {
      console.error('Error fetching subjects for booking modal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLiveSubjects();
      setSubmitted(false);
      setSubmitting(false);

      const t = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(t);
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  // Handle prefilled subject from course card click
  useEffect(() => {
    if (open && liveSubjects.length > 0) {
      const distinctSubjects = Array.from(
        new Set(liveSubjects.map((s) => s.name?.trim()).filter(Boolean))
      );
      if (prefilledProgram && distinctSubjects.includes(prefilledProgram)) {
        handleSubjectChange(prefilledProgram, liveSubjects);
      }
    }
  }, [open, liveSubjects, prefilledProgram]);

  // Real-time broadcast sync with Admin Panel
  useEffect(() => {
    if (!open) return;
    const handleUpdate = () => fetchLiveSubjects();
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [open]);

  // 1. Available Subjects from admin data
  const availableSubjects = Array.from(
    new Set(liveSubjects.map((s) => s.name?.trim()).filter(Boolean))
  ).sort();

  // 2. Available Categories for selected Subject (with standard fallback)
  const standardCategories = ['Foundation', 'Advanced', 'JEE', 'NEET', 'Olympiad'];
  const categoriesFromData = selectedSubject
    ? liveSubjects
        .filter(
          (s) =>
            s.name?.trim() === selectedSubject ||
            selectedSubject.includes(s.name?.trim() || '') ||
            (s.name?.trim() || '').includes(selectedSubject)
        )
        .map((s) => s.category?.trim())
        .filter(Boolean)
    : [];

  const availableCategories = Array.from(
    new Set([...categoriesFromData, ...standardCategories])
  ).sort();

  // 3. Available Classes for selected Subject + Category (Clean, user-friendly & non-duplicated)
  const normalizeDisplayClass = (clsStr) => {
    if (!clsStr) return '';
    const str = String(clsStr).trim();
    if (str === 'S1' || str === 'Class S1') return 'Class S1 (Nursery - 5th)';
    if (str === 'S2' || str === 'Class S2') return 'Class S2 (6th - 10th)';
    if (str === 'S3' || str === 'Class S3') return 'Class S3 (11th - 12th)';
    if (str === 'S4' || str === 'Class S4') return 'Class S4 (Higher Ed)';
    if (str.startsWith('Class ')) return str;
    return `Class ${str}`;
  };

  const standardClasses = [
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th (+1)',
    '12th (+2)',
    'Class S1 (Nursery - 5th)',
    'Class S2 (6th - 10th)',
    'Class S3 (11th - 12th)',
    'Class S4 (Higher Ed)',
  ];

  const adminClasses = liveSubjects
    .filter(
      (s) =>
        !selectedSubject ||
        s.name?.trim() === selectedSubject ||
        selectedSubject.includes(s.name?.trim() || '') ||
        (s.name?.trim() || '').includes(selectedSubject)
    )
    .filter(
      (s) =>
        !selectedCategory ||
        !s.category ||
        s.category.trim().toLowerCase() === selectedCategory.toLowerCase()
    )
    .map((s) => normalizeDisplayClass(s.className?.trim()))
    .filter(Boolean);

  const availableClasses = Array.from(new Set([...standardClasses, ...adminClasses])).sort((a, b) => {
    const order = [
      '6th Grade',
      '7th Grade',
      '8th Grade',
      '9th Grade',
      '10th Grade',
      '11th (+1)',
      '12th (+2)',
      'Class S1 (Nursery - 5th)',
      'Class S2 (6th - 10th)',
      'Class S3 (11th - 12th)',
      'Class S4 (Higher Ed)',
    ];
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // 4. Automatically assigned batch timings from admin dataset (Read-Only with multi-tier fallback)
  const getAssignedBatchTimes = () => {
    if (!selectedSubject || !selectedClass) return [];

    const isClassMatchHelper = (sClsRaw, selClsRaw) => {
      const sCls = (sClsRaw || '').toLowerCase();
      const selCls = (selClsRaw || '').toLowerCase();
      return (
        sCls === selCls ||
        selCls.includes(sCls) ||
        sCls.includes(selCls) ||
        (sCls.includes('s1') && selCls.includes('s1')) ||
        (sCls.includes('s2') && (selCls.includes('s2') || selCls.includes('6th') || selCls.includes('7th') || selCls.includes('8th') || selCls.includes('9th') || selCls.includes('10th'))) ||
        (sCls.includes('s3') && (selCls.includes('s3') || selCls.includes('11th') || selCls.includes('12th'))) ||
        (sCls.includes('s4') && selCls.includes('s4')) ||
        (sCls.includes('6th') && selCls.includes('6th')) ||
        (sCls.includes('7th') && selCls.includes('7th')) ||
        (sCls.includes('8th') && selCls.includes('8th')) ||
        (sCls.includes('9th') && selCls.includes('9th')) ||
        (sCls.includes('10th') && selCls.includes('10th')) ||
        (sCls.includes('11th') && selCls.includes('11th')) ||
        (sCls.includes('12th') && selCls.includes('12th'))
      );
    };

    // Exact match: Subject + Category + Class
    const exactMatches = liveSubjects.filter((s) => {
      const sName = s.name?.trim() || '';
      const subMatch =
        sName === selectedSubject ||
        selectedSubject.includes(sName) ||
        sName.includes(selectedSubject);

      const catMatch =
        !selectedCategory ||
        (s.category?.trim() || '').toLowerCase() === selectedCategory.toLowerCase();

      const clsMatch = isClassMatchHelper(s.className?.trim(), selectedClass);

      return subMatch && catMatch && clsMatch;
    });

    if (exactMatches.length > 0) {
      return Array.from(new Set(exactMatches.map((s) => s.batchTime?.trim()).filter(Boolean)));
    }

    // Fallback 1: Subject + Class (ignore category mismatch)
    const fallbackClassMatches = liveSubjects.filter((s) => {
      const sName = s.name?.trim() || '';
      const subMatch =
        sName === selectedSubject ||
        selectedSubject.includes(sName) ||
        sName.includes(selectedSubject);

      const clsMatch = isClassMatchHelper(s.className?.trim(), selectedClass);

      return subMatch && clsMatch;
    });

    if (fallbackClassMatches.length > 0) {
      return Array.from(new Set(fallbackClassMatches.map((s) => s.batchTime?.trim()).filter(Boolean)));
    }

    // Fallback 2: Subject default batch timing
    const subjectMatches = liveSubjects.filter((s) => {
      const sName = s.name?.trim() || '';
      return (
        sName === selectedSubject ||
        selectedSubject.includes(sName) ||
        sName.includes(selectedSubject)
      );
    });

    if (subjectMatches.length > 0) {
      return Array.from(new Set(subjectMatches.map((s) => s.batchTime?.trim()).filter(Boolean)));
    }

    return [];
  };

  const assignedBatchTimes = getAssignedBatchTimes();
  const autoBatchTimeText = assignedBatchTimes.length > 0 ? assignedBatchTimes.join(' | ') : '';

  // Reset lower-level selections when Subject changes
  const handleSubjectChange = (val, subjectsList = liveSubjects) => {
    setSelectedSubject(val);
    setSelectedCategory('');
    setSelectedClass('');

    const categoriesForSub = Array.from(
      new Set(
        subjectsList
          .filter((s) => s.name?.trim() === val || val.includes(s.name?.trim() || ''))
          .map((s) => s.category?.trim() || 'Foundation')
          .filter(Boolean)
      )
    );
    if (categoriesForSub.length === 1) {
      setSelectedCategory(categoriesForSub[0]);
    }
  };

  // Reset lower-level selections when Category changes
  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setSelectedClass('');
  };

  // Reset when Class changes
  const handleClassChange = (val) => {
    setSelectedClass(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubject || !selectedCategory || !selectedClass) {
      alert('Please select Subject, Category, and Class before booking.');
      return;
    }
    if (!studentName.trim() || !parentPhone.trim()) {
      alert('Please fill out Student Name and Parent Phone Number.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('studentName', studentName);
      formData.append('parentPhone', parentPhone);
      formData.append('parentEmail', parentEmail || 'Not Provided');
      formData.append('branch', branch);
      formData.append('subject', selectedSubject);
      formData.append('category', selectedCategory);
      formData.append('class', selectedClass);
      formData.append('batchTime', autoBatchTimeText || 'To Be Assigned');
      formData.append('_subject', `Live Demo Booking: ${selectedSubject} - ${selectedCategory} (${selectedClass}) [${autoBatchTimeText || 'Pending'}]`);

      fetch('https://formsubmit.co/ajax/f785f212ac6d3b7066a696d35d1be84f', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      }).catch((err) => console.warn('Form submission notification error:', err));
    } catch (err) {}

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 400);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Card */}
      <div
        className={`bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/15 relative transform transition-all duration-300 ease-out z-10 ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </span>
            <div>
              <h3 className="font-headings font-extrabold text-lg text-secondary">
                Book a Free Live Demo Class
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Select your class to view automatically assigned batch timing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-on-surface-variant animate-pulse flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">sync</span>
            <span>Loading active course and batch data...</span>
          </div>
        ) : submitted ? (
          /* Confirmation Screen */
          <div className="p-8 text-center">
            <span className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">event_available</span>
            </span>
            <h4 className="font-headings font-bold text-xl text-on-surface mb-2">Demo Booked Successfully!</h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed mb-6">
              A live demo slot has been scheduled for <strong className="text-secondary font-bold">{studentName}</strong>. Our academic coordinator will contact you with access instructions.
            </p>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-left space-y-2 text-xs font-medium text-on-surface mb-6 max-w-sm mx-auto">
              <p className="flex justify-between border-b border-outline-variant/15 pb-2">
                <span className="text-on-surface-variant">Subject:</span>
                <strong className="text-secondary">{selectedSubject}</strong>
              </p>
              <p className="flex justify-between border-b border-outline-variant/15 pb-2">
                <span className="text-on-surface-variant">Category:</span>
                <strong>{selectedCategory}</strong>
              </p>
              <p className="flex justify-between border-b border-outline-variant/15 pb-2">
                <span className="text-on-surface-variant">Selected Class:</span>
                <strong className="text-primary">{selectedClass}</strong>
              </p>
              <p className="flex justify-between border-b border-outline-variant/15 pb-2">
                <span className="text-on-surface-variant">Scheduled Batch Time:</span>
                <strong className="font-mono text-emerald-700">{autoBatchTimeText}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-on-surface-variant">Center:</span>
                <span>{branch}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-white font-headings font-bold py-3 rounded-full text-xs transition-all shadow-tactile-btn"
            >
              Done &amp; Close Form
            </button>
          </div>
        ) : (
          /* Cascading Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Step 1 — Select Subject */}
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-xs text-on-surface flex items-center gap-1">
                <span className="text-primary font-extrabold">1.</span> Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs font-semibold text-on-surface transition-all cursor-pointer"
              >
                <option value="" disabled>
                  [ Select Subject ▼ ]
                </option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2 — Select Category */}
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-xs text-on-surface flex items-center gap-1">
                <span className="text-primary font-extrabold">2.</span> Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!selectedSubject}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  !selectedSubject
                    ? 'bg-surface-container/50 border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed'
                    : 'bg-surface-container-lowest border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary/20 text-on-surface cursor-pointer'
                }`}
              >
                <option value="" disabled>
                  [ Select Category ▼ ]
                </option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3 — Select Class */}
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-xs text-on-surface flex items-center gap-1">
                <span className="text-primary font-extrabold">3.</span> Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={!selectedCategory}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  !selectedCategory
                    ? 'bg-surface-container/50 border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed'
                    : 'bg-surface-container-lowest border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary/20 text-on-surface cursor-pointer'
                }`}
              >
                <option value="" disabled>
                  [ Select Class ▼ ]
                </option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4 — Automatically Display Assigned Batch Time (Information Only) */}
            {selectedClass && (
              <div className="pt-1">
                {assignedBatchTimes.length > 0 ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1.5 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant font-semibold">Selected Class:</span>
                      <strong className="text-secondary">{selectedClass}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-primary/10 pt-1.5">
                      <span className="text-on-surface-variant font-semibold">Assigned Batch Time:</span>
                      <strong className="font-mono text-primary text-sm bg-white px-2.5 py-0.5 rounded-md border border-primary/15">
                        {autoBatchTimeText}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">info</span>
                    <span>No batch timing is currently available for this class.</span>
                  </div>
                )}
              </div>
            )}

            {/* Student Contact Information */}
            <div className="pt-2 border-t border-outline-variant/15 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Student full name"
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs font-body"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Parent's Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs font-body"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Parent's Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs font-body"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Preferred Center
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white font-body"
                  >
                    <option value="Main Center (Bagru)">Main Center (Bagru)</option>
                    <option value="Branch (Daroh)">Branch (Daroh)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting || !selectedSubject || !selectedCategory || !selectedClass}
                className="w-full bg-primary hover:bg-primary-container disabled:bg-surface-container-highest text-white font-headings font-bold py-3 rounded-full text-xs transition-colors shadow-tactile-btn shadow-premium flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Processing Demo Booking...</span>
                ) : (
                  <>
                    <span>Book Live Demo</span>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
