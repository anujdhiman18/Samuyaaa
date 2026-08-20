import React, { useState, useEffect, useMemo } from 'react';
import { facultyPanelService, marksService, subjectService, getStoredSubjects, getStoredStudents, smsNotificationService } from '../../services/api';
import { CLASS_CATEGORIES, STAGE_CLASSES, sortClassList, getStageForClass, isExactClassMatch } from '../../config/classConfig';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

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
    ? Array.from(new Set(responsibilities.filter((r) => !selectedClass || isExactClassMatch(r.className, selectedClass)).map((r) => r.subject)))
    : userAssignedSubjects;

  const availableSubjectObjects = useMemo(() => {
    let matched = allSubjectsList.filter(
      (s) =>
        s.isActive !== false &&
        (!selectedClass || isExactClassMatch(s.className, selectedClass) || s.className === selectedClass || s.className === 'All')
    );

    if (userSubjects.length > 0) {
      const userSubNames = userSubjects.map((s) => s.trim().toLowerCase());
      matched = matched.filter((s) => userSubNames.includes(s.name.trim().toLowerCase()));
    }

    if (matched.length > 0) {
      return matched;
    }

    const studentSubjects = (getStoredStudents() || [])
      .filter((s) => isExactClassMatch(s.className, selectedClass))
      .flatMap((s) => s.subjects || (s.subject ? [s.subject] : []));

    const uniqueStudentSubjects = Array.from(new Set(studentSubjects.filter(Boolean)));
    return uniqueStudentSubjects.map((subName, idx) => ({
      _id: `sub_st_${idx}`,
      name: subName,
      className: selectedClass,
    }));
  }, [allSubjectsList, selectedClass, userSubjects]);

  const availableSubjects = useMemo(() => {
    return availableSubjectObjects.map((s) => s.name);
  }, [availableSubjectObjects]);

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || '');
  const [examType, setExamType] = useState('Internal Assessment 1');
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (availableSubjects.length > 0 && (!selectedSubject || !availableSubjects.includes(selectedSubject))) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [selectedClass, availableSubjects, user]);

  useEffect(() => {
    fetchClassStudents();
  }, [selectedClass, selectedSubject]);

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
          theoryMarks: 42,
          practicalMarks: 18,
          assignmentMarks: 20,
          totalMax: 100,
        };
      });
      setMarksMap(newMap);
    } catch (err) {
      addToast('Error loading marks sheet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    const parsedVal = value === '' ? '' : Math.max(0, Number(value) || 0);
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parsedVal,
      },
    }));
  };

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
        } catch (e) {}
      }

      const marksList = students.map((st) => {
        const stId = String(st._id || st.id);
        const m = marksMap[stId] || { theoryMarks: 40, practicalMarks: 15, assignmentMarks: 15, totalMax: 100 };
        return {
          studentId: stId,
          theoryMarks: Number(m.theoryMarks) || 0,
          practicalMarks: Number(m.practicalMarks) || 0,
          assignmentMarks: Number(m.assignmentMarks) || 0,
          totalMax: Number(m.totalMax) || 100,
        };
      });

      const res = await marksService.saveBatchMarks({
        className: selectedClass,
        subject: selectedSubject,
        examType,
        marksList,
        publishedBy: facultyName,
      });

      if (res && res.success) {
        addToast(`Marks published & SMS notifications queued for ${selectedClass} (${selectedSubject})!`, 'success');
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
      addToast('Error publishing marks', 'error');
    } finally {
      setSaving(false);
    }
  };

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
            Manage internal test scores, practical marks, assignment scores, &amp; publish official grades.
          </p>
        </div>

        <button
          onClick={handleSaveMarks}
          disabled={saving || students.length === 0}
          className="bg-primary text-white font-headings font-bold px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">publish</span>
          {saving ? 'Publishing...' : 'Publish Grades'}
        </button>
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
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
          >
            <option value="Internal Assessment 1">Internal Assessment 1</option>
            <option value="Mid-Term Practical">Mid-Term Practical</option>
            <option value="Assignment Score">Assignment Score</option>
            <option value="Final Term Board Prep">Final Term Board Prep</option>
          </select>
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading gradebook...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Theory (Max 50)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Practical (Max 25)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Assignment (Max 25)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Total / 100</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map((st) => {
                  const stId = String(st._id || st.id);
                  const m = marksMap[stId] || { theoryMarks: 40, practicalMarks: 20, assignmentMarks: 20 };
                  const theory = Number(m.theoryMarks) || 0;
                  const practical = Number(m.practicalMarks) || 0;
                  const assignment = Number(m.assignmentMarks) || 0;
                  const total = theory + practical + assignment;

                  let grade = 'A';
                  if (total >= 90) grade = 'A+';
                  else if (total >= 75) grade = 'A';
                  else if (total >= 60) grade = 'B';
                  else if (total >= 50) grade = 'C';
                  else grade = 'D';

                  return (
                    <tr key={stId} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">{st.rollNumber}</td>
                      <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">{st.fullName}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={m.theoryMarks ?? ''}
                          onChange={(e) => handleMarkChange(stId, 'theoryMarks', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary text-center"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          value={m.practicalMarks ?? ''}
                          onChange={(e) => handleMarkChange(stId, 'practicalMarks', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary text-center"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          value={m.assignmentMarks ?? ''}
                          onChange={(e) => handleMarkChange(stId, 'assignmentMarks', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary text-center"
                        />
                      </td>
                      <td className="py-3 px-4 font-extrabold text-secondary whitespace-nowrap">{total} / 100</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-primary/10 text-primary">
                          {grade}
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
    </div>
  );
}
