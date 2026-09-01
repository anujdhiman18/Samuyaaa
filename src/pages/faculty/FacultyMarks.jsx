import React, { useState, useEffect, useMemo } from 'react';
import { facultyPanelService, marksService, subjectService, getStoredSubjects, getStoredStudents, smsNotificationService } from '../../services/api';
import { CLASS_CATEGORIES, STAGE_CLASSES, sortClassList, getStageForClass, isExactClassMatch, isClassOrStageMatch } from '../../config/classConfig';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { calculateGradeBreakdown, getGradeMeta, calculateGrade, ASSESSMENT_TYPES_CONFIG } from '../../utils/gradeUtils';
import ConfirmModal from '../../components/admin/ConfirmModal';

const DEFAULT_CLASSES = ['6th', '7th', '8th', '9th', '10th', '11th (+1)', '12th (+2)'];

const CATEGORY_OPTIONS = [
  { code: 'All', label: 'All Categories (S1-S4)' },
  ...CLASS_CATEGORIES.map((c) => ({ code: c.code, label: `${c.code} — ${c.description}` })),
];

export default function FacultyMarks() {
  const { addToast } = useToast();
  const { user } = useAuth();

  const isAdmin = Boolean(
    user && (user.role === 'Admin' || user.role === 'SuperAdmin' || (Array.isArray(user.roles) && user.roles.includes('ADMIN')))
  );

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [allSubjectsList, setAllSubjectsList] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await subjectService.getSubjects({ includeInactive: false });
        if (res && res.subjects) {
          setAllSubjectsList(res.subjects);
        } else {
          setAllSubjectsList((getStoredSubjects() || []).filter((s) => s.isActive !== false));
        }
      } catch (e) {
        setAllSubjectsList((getStoredSubjects() || []).filter((s) => s.isActive !== false));
      }
    };
    loadSubjects();

    window.addEventListener('saumyaa_data_updated', loadSubjects);
    return () => window.removeEventListener('saumyaa_data_updated', loadSubjects);
  }, []);

  const responsibilities = user?.responsibilities || [];
  const userAssignedClasses = user?.assignedClasses || [];

  const rawUserClasses = responsibilities.length > 0
    ? Array.from(new Set(responsibilities.map((r) => r.className)))
    : userAssignedClasses;

  const allAvailableClasses = useMemo(() => {
    if (isAdmin || rawUserClasses.length === 0) {
      const dynamicClasses = allSubjectsList.map((s) => s.className).filter(Boolean);
      return sortClassList([...rawUserClasses, ...DEFAULT_CLASSES, ...dynamicClasses]);
    }
    return sortClassList(rawUserClasses);
  }, [isAdmin, rawUserClasses, allSubjectsList]);

  // Compute filtered classes based on selectedCategory
  const filteredClasses = useMemo(() => {
    if (selectedCategory === 'All') {
      const base = allAvailableClasses.filter((c) => !['S1', 'S2', 'S3', 'S4'].includes(c));
      return sortClassList(base.length > 0 ? base : DEFAULT_CLASSES);
    }

    const stageList = STAGE_CLASSES[selectedCategory] || [];
    const matched = allAvailableClasses.filter((c) => getStageForClass(c) === selectedCategory);
    const combined = Array.from(new Set([...stageList, ...matched]));
    return sortClassList(combined);
  }, [selectedCategory, allAvailableClasses]);

  const [selectedClass, setSelectedClass] = useState(() => filteredClasses[0] || '10th');

  useEffect(() => {
    if (filteredClasses.length > 0 && (!selectedClass || !filteredClasses.includes(selectedClass))) {
      setSelectedClass(filteredClasses[0]);
    }
  }, [filteredClasses]);

  const userAssignedSubjects = user?.assignedSubjects || [];
  const userSubjects = responsibilities.length > 0
    ? Array.from(new Set(responsibilities.filter((r) => !selectedClass || isClassOrStageMatch(r.className, selectedClass)).map((r) => r.subject)))
    : userAssignedSubjects;

  const availableSubjectObjects = useMemo(() => {
    let matched = allSubjectsList.filter(
      (s) =>
        s.isActive !== false &&
        (!selectedClass ||
          isExactClassMatch(s.className, selectedClass) ||
          isClassOrStageMatch(s.className, selectedClass) ||
          s.className === selectedClass ||
          s.className === 'All')
    );

    if (!isAdmin && userSubjects.length > 0) {
      const userSubNames = userSubjects.map((s) => s.trim().toLowerCase());
      const filteredByFaculty = matched.filter((s) => userSubNames.includes(s.name.trim().toLowerCase()));
      if (filteredByFaculty.length > 0) {
        matched = filteredByFaculty;
      }
    }

    if (matched.length > 0) {
      return matched;
    }

    const studentSubjects = (getStoredStudents() || [])
      .filter((s) => isClassOrStageMatch(s.className, selectedClass))
      .flatMap((s) => s.subjects || (s.subject ? [s.subject] : []));

    const uniqueStudentSubjects = Array.from(new Set(studentSubjects.filter(Boolean)));
    if (uniqueStudentSubjects.length > 0) {
      return uniqueStudentSubjects.map((subName, idx) => ({
        _id: `sub_st_${idx}`,
        name: subName,
        className: selectedClass,
      }));
    }

    return allSubjectsList.filter((s) => s.isActive !== false);
  }, [allSubjectsList, selectedClass, userSubjects, isAdmin]);

  const availableSubjects = useMemo(() => {
    return Array.from(new Set(availableSubjectObjects.map((s) => s.name).filter(Boolean)));
  }, [availableSubjectObjects]);

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || '');
  const [examType, setExamType] = useState('Internal Assessment 1');
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Key to identify published state in storage
  const batchKey = `${selectedClass}_${selectedSubject}_Combined`;

  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubject || !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    } else {
      setSelectedSubject('');
    }
  }, [selectedClass, availableSubjects]);

  useEffect(() => {
    fetchClassStudents();
    checkPublishedState();
  }, [selectedClass, selectedSubject, examType]);

  const checkPublishedState = () => {
    try {
      const pubData = localStorage.getItem('saumyaa_published_batches');
      if (pubData) {
        const pubSet = JSON.parse(pubData);
        setIsPublished(Boolean(pubSet[batchKey]));
      } else {
        setIsPublished(false);
      }
    } catch (e) {
      setIsPublished(false);
    }
  };

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const studentRes = await facultyPanelService.getAssignedStudents({
        className: selectedClass,
        subject: selectedSubject,
      });
      let list = studentRes?.students || [];

      if (selectedSubject && selectedSubject !== 'All') {
        const targetSub = selectedSubject.trim().toLowerCase();
        list = list.filter((st) => {
          if (Array.isArray(st.subjects) && st.subjects.length > 0) {
            return st.subjects.some(
              (sub) => String(sub).trim().toLowerCase() === targetSub
            );
          }
          if (st.subject) {
            return String(st.subject).trim().toLowerCase() === targetSub;
          }
          return true;
        });
      }

      setStudents(list);

      const newMap = {};
      list.forEach((st) => {
        const stId = String(st._id || st.id);
        newMap[stId] = {
          internalMarks: 22,    // max 25
          midTermMarks: 40,     // max 50
          assignmentMarks: 16,  // max 20
          finalExamMarks: 82,   // max 100
          totalMax: 195,
        };
      });
      setMarksMap(newMap);
    } catch (err) {
      addToast('Error loading marks sheet', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Field change handler with independent validation
  const handleMarkChange = (studentId, field, value, maxVal) => {
    if (isPublished && examType === 'Combined / Overall Gradebook') {
      addToast('Final gradebook is published & locked. Click "Unlock & Edit" to modify.', 'info');
      return;
    }

    const parsedVal = value === '' ? '' : Math.max(0, Math.min(maxVal, Number(value) || 0));

    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parsedVal,
      },
    }));
  };

  // Save per-assessment type marks or combined gradebook
  const handleSaveMarks = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const currentUserStr = localStorage.getItem('saumyaa_user');
      let facultyName = 'Faculty Member';
      if (currentUserStr) {
        try {
          const u = JSON.parse(currentUserStr);
          facultyName = u.name || facultyName;
        } catch (e) { }
      }

      const marksList = students.map((st) => {
        const stId = String(st._id || st.id);
        const m = marksMap[stId] || { internalMarks: 20, midTermMarks: 40, assignmentMarks: 16, finalExamMarks: 80, totalMax: 195 };
        return {
          studentId: stId,
          internalMarks: Number(m.internalMarks) || 0,
          midTermMarks: Number(m.midTermMarks) || 0,
          assignmentMarks: Number(m.assignmentMarks) || 0,
          finalExamMarks: Number(m.finalExamMarks) || 0,
          totalMax: 195,
        };
      });

      const res = await marksService.saveBatchMarks({
        className: selectedClass,
        subject: selectedSubject,
        examType,
        marksList,
        publishedBy: facultyName,
        isPublished: examType === 'Combined / Overall Gradebook' ? true : false,
      });

      if (res && res.success) {
        if (examType === 'Combined / Overall Gradebook') {
          setIsPublished(true);
          try {
            const pubData = localStorage.getItem('saumyaa_published_batches');
            const pubSet = pubData ? JSON.parse(pubData) : {};
            pubSet[batchKey] = true;
            localStorage.setItem('saumyaa_published_batches', JSON.stringify(pubSet));
          } catch (e) { }

          addToast(`Official Gradebook published & locked for Class ${selectedClass} (${selectedSubject})!`, 'success');
        } else {
          addToast(`Marks for ${examType} saved successfully for Class ${selectedClass} (${selectedSubject})!`, 'success');
        }

        smsNotificationService.triggerGradeSMSBatch({
          subject: selectedSubject,
          examType,
          marksList,
          studentsList: students,
          currentUser: user,
          isUpdate: Boolean(res.isUpdated),
        });
      }
    } catch (err) {
      addToast('Error saving marks record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenConfirmModal = () => {
    if (students.length === 0) return;
    if (examType === 'Combined / Overall Gradebook') {
      setConfirmModalOpen(true);
    } else {
      handleSaveMarks();
    }
  };

  const handleConfirmPublish = async () => {
    setConfirmModalOpen(false);
    await handleSaveMarks();
  };

  const handleToggleUnlock = () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    try {
      const pubData = localStorage.getItem('saumyaa_published_batches');
      const pubSet = pubData ? JSON.parse(pubData) : {};
      pubSet[batchKey] = nextState;
      localStorage.setItem('saumyaa_published_batches', JSON.stringify(pubSet));
    } catch (e) { }

    if (nextState) {
      addToast('Gradebook locked.', 'info');
    } else {
      addToast('Gradebook unlocked for editing.', 'info');
    }
  };

  const isCombinedView = examType === 'Combined / Overall Gradebook';
  const currentAssessmentConfig = ASSESSMENT_TYPES_CONFIG[examType];

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
            Internal Marks &amp; Gradebook
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            {isCombinedView
              ? 'Combined Gradebook View — Raw Total (/195), 100-Mark Conversion, & Official Grade Publishing'
              : `Independent Assessment Entry — ${examType} (Max ${currentAssessmentConfig?.max || 100} marks)`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isCombinedView && isPublished && (
            <button
              onClick={handleToggleUnlock}
              className="px-4 py-2 rounded-full text-xs font-bold font-headings border border-outline-variant/30 text-secondary hover:bg-surface-container-low transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              Unlock &amp; Edit
            </button>
          )}

          <button
            onClick={handleOpenConfirmModal}
            disabled={saving || students.length === 0}
            className={`font-headings font-bold px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium transition-all cursor-pointer ${
              isCombinedView && isPublished
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-primary text-white hover:shadow-glow-primary active:scale-95 disabled:opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCombinedView && isPublished ? 'lock' : 'save'}
            </span>
            {saving
              ? 'Saving...'
              : isCombinedView
              ? isPublished
                ? 'Grades Published (Locked)'
                : 'Publish Official Gradebook'
              : `Save ${examType} Marks`}
          </button>
        </div>
      </div>

      {/* Control Filters: Category -> Class -> Subject -> Exam Type */}
      <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Academic Category / Stage</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.code} value={cat.code}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Class / Grade</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
          >
            {filteredClasses.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
          >
            {availableSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Exam / Assessment Type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary bg-primary/5 border-primary/30"
          >
            <option value="Internal Assessment 1">Internal Assessment 1 (Max 25)</option>
            <option value="Mid-Term Practical">Mid-Term Practical (Max 50)</option>
            <option value="Assignment Score">Assignment Score (Max 20)</option>
            <option value="Final Term Board Prep">Final Term Board Prep (Max 100)</option>
            <option value="Combined / Overall Gradebook">Combined / Overall Gradebook (Summary View)</option>
          </select>
        </div>
      </div>

      {/* Mode Banner */}
      {!isCombinedView ? (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">assignment</span>
            <div>
              <p className="text-xs font-bold text-secondary font-headings">
                Single Assessment Mode: {examType}
              </p>
              <p className="text-[11px] text-on-surface-variant font-body">
                {currentAssessmentConfig?.description || 'Independent assessment score entry.'} Maximum Marks: <strong>{currentAssessmentConfig?.max}</strong>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-primary text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            Max {currentAssessmentConfig?.max} Marks
          </span>
        </div>
      ) : isPublished ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-xl">lock</span>
            <div>
              <p className="text-xs font-bold text-emerald-900 font-headings">Official Gradebook Published &amp; Locked</p>
              <p className="text-[11px] text-emerald-700 font-body">
                Combined marks for Class {selectedClass} ({selectedSubject}) are published to student/parent portals.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            Published
          </span>
        </div>
      ) : null}

      {/* Gradebook Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading gradebook...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No students found for {selectedClass} ({selectedSubject}).
          </div>
        ) : !isCombinedView ? (
          /* Single Assessment Type View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    {examType} (Max {currentAssessmentConfig?.max})
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Max Marks</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Percentage (%)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Status / Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map((st) => {
                  const stId = String(st._id || st.id);
                  const m = marksMap[stId] || { internalMarks: 20, midTermMarks: 40, assignmentMarks: 16, finalExamMarks: 80 };
                  const fieldName = currentAssessmentConfig?.field || 'internalMarks';
                  const maxLimit = currentAssessmentConfig?.max || 100;
                  const obtainedVal = m[fieldName] ?? '';
                  const numVal = Number(obtainedVal) || 0;
                  const pct = Math.min(100, Math.round(((numVal / maxLimit) * 100) * 10) / 10);
                  const itemGrade = calculateGrade(pct);
                  const meta = getGradeMeta(itemGrade);

                  return (
                    <tr key={stId} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">{st.rollNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-secondary whitespace-nowrap">{st.fullName}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={maxLimit}
                          value={obtainedVal}
                          onChange={(e) => handleMarkChange(stId, fieldName, e.target.value, maxLimit)}
                          className="w-24 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-center focus:outline-none focus:border-primary text-secondary bg-white shadow-inner"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-on-surface-variant whitespace-nowrap">
                        {maxLimit}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-primary whitespace-nowrap">
                        {pct}%
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-extrabold text-xs border ${meta.bgClass}`}>
                          {itemGrade} ({pct >= 35 ? 'Pass' : 'Fail'})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Combined Side-by-Side Overall Gradebook View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Internal (25)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Mid-Term (50)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Assignment (20)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Final Exam (100)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Raw Total (/195)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Converted (/100)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map((st) => {
                  const stId = String(st._id || st.id);
                  const m = marksMap[stId] || { internalMarks: 20, midTermMarks: 40, assignmentMarks: 16, finalExamMarks: 80 };
                  const breakdown = calculateGradeBreakdown(m);
                  const meta = getGradeMeta(breakdown.grade);

                  return (
                    <tr key={stId} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">{st.rollNumber}</td>
                      <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">{st.fullName}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-on-surface">
                        {breakdown.internal} / 25
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-on-surface">
                        {breakdown.midTerm} / 50
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-on-surface">
                        {breakdown.assignment} / 20
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-on-surface">
                        {breakdown.finalExam} / 100
                      </td>
                      <td className="py-3 px-4 font-extrabold text-secondary text-center whitespace-nowrap font-mono">
                        {breakdown.rawTotal} / {breakdown.totalMax}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-extrabold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-mono">
                          {breakdown.converted100} / 100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-extrabold text-xs border ${meta.bgClass}`}>
                          {breakdown.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal before Publishing Official Gradebook */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmPublish}
        title="Publish Official Gradebook"
        message={`Are you sure you want to publish the official gradebook for Class ${selectedClass} (${selectedSubject})? This action will publish the final 100-mark converted grades and dispatch official grade notifications.`}
        confirmText="Confirm &amp; Publish"
        loading={saving}
      />
    </div>
  );
}
