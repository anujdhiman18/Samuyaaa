import React, { useState, useEffect, useMemo } from 'react';
import { facultyPanelService, attendanceService, subjectService, getStoredSubjects, smsNotificationService } from '../../services/api';
import { CLASS_CATEGORIES, STAGE_CLASSES, sortClassList, getStageForClass } from '../../config/classConfig';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CLASSES = ['6th', '7th', '8th', '9th', '10th', '11th (+1)', '12th (+2)'];
const DEFAULT_SUBJECTS = ['Mathematics Advanced', 'Physics IIT-JEE Prep', 'Chemistry Foundation', 'Integrated Science', 'Biology', 'English Literature', 'Social Studies', 'Computer Science'];

const CATEGORY_OPTIONS = [
  { code: 'All', label: 'All Categories (S1-S4)' },
  ...CLASS_CATEGORIES.map((c) => ({ code: c.code, label: `${c.code} — ${c.description}` })),
];

export default function FacultyAttendance() {
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
        const res = await subjectService.getSubjects();
        if (res && res.subjects && res.subjects.length > 0) {
          setAllSubjectsList(res.subjects);
        } else {
          setAllSubjectsList(getStoredSubjects() || []);
        }
      } catch (e) {
        setAllSubjectsList(getStoredSubjects() || []);
      }
    };
    loadSubjects();
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

  const getTodayLocalString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(() => getTodayLocalString());
  const [selectedClass, setSelectedClass] = useState(() => filteredClasses[0] || '10th');

  useEffect(() => {
    if (filteredClasses.length > 0 && (!selectedClass || !filteredClasses.includes(selectedClass))) {
      setSelectedClass(filteredClasses[0]);
    }
  }, [filteredClasses]);

  const userAssignedSubjects = user?.assignedSubjects || [];
  const userSubjects = responsibilities.length > 0
    ? Array.from(new Set(responsibilities.filter((r) => !selectedClass || r.className === selectedClass).map((r) => r.subject)))
    : userAssignedSubjects;

  const classSubjects = allSubjectsList
    .filter((s) => !selectedClass || s.className === selectedClass || s.className === 'All')
    .map((s) => s.name);

  let availableSubjects = [];
  if (isAdmin || userSubjects.length === 0) {
    availableSubjects = Array.from(new Set([...userSubjects, ...classSubjects, ...DEFAULT_SUBJECTS]));
  } else {
    availableSubjects = Array.from(new Set(userSubjects));
    if (availableSubjects.length === 0) {
      availableSubjects = Array.from(new Set([...classSubjects, ...DEFAULT_SUBJECTS]));
    }
  }

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || 'Mathematics Advanced');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (availableSubjects.length > 0 && (!selectedSubject || !availableSubjects.includes(selectedSubject))) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [selectedClass, availableSubjects, user]);

  useEffect(() => {
    fetchAttendanceSheet();
  }, [selectedClass, selectedSubject, date]);

  const fetchAttendanceSheet = async () => {
    setLoading(true);
    try {
      const [studentRes, attendanceRes] = await Promise.all([
        facultyPanelService.getAssignedStudents({ className: selectedClass }),
        attendanceService.getAttendanceRecords({ date, className: selectedClass, subject: selectedSubject }),
      ]);

      const studentList = studentRes?.students || [];
      setStudents(studentList);

      const existingRecords = attendanceRes?.records || [];
      const recordMap = {};
      existingRecords.forEach((r) => {
        const stId = String(r.student?._id || r.student?.id || r.student);
        if (stId) recordMap[stId] = r.status;
      });

      const initialMap = {};
      studentList.forEach((st) => {
        const stId = String(st._id || st.id);
        initialMap[stId] = recordMap[stId] || 'Present';
      });

      setAttendanceMap(initialMap);
    } catch (err) {
      addToast('Error loading attendance register', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[String(st._id || st.id)] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((st) => {
        const stId = String(st._id || st.id);
        return {
          studentId: stId,
          status: attendanceMap[stId] || 'Present',
        };
      });

      const res = await attendanceService.saveBatchAttendance({
        date,
        className: selectedClass,
        subject: selectedSubject,
        records,
      });

      if (res && res.success) {
        addToast(`Attendance saved. SMS notifications queued for Class ${selectedClass}!`, 'success');
        smsNotificationService.triggerAttendanceSMSBatch({
          date,
          subject: selectedSubject,
          records,
          studentsList: students,
          currentUser: user,
        });
      }
    } catch (err) {
      addToast('Error saving attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">how_to_reg</span>
            Class Attendance Register
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Record daily student attendance, track absences, &amp; generate attendance reports.
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="bg-primary text-white font-headings font-bold px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? 'Saving...' : 'Save Register'}
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Academic Stage / Category</label>
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
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Attendance Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Assigned Class</label>
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
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Assigned Subject</label>
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
      </div>

      {/* Quick Mark Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAll('Present')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 transition-colors cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('Absent')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition-colors cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading attendance sheet...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No students found for this class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Class</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map((st) => {
                  const stId = String(st._id || st.id);
                  const currentStatus = attendanceMap[stId]?.status || 'Present';

                  return (
                    <tr key={stId} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">{st.rollNumber}</td>
                      <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">{st.fullName}</td>
                      <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">{st.className}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex rounded-xl bg-surface-container p-1 gap-1">
                          {['Present', 'Absent', 'Late'].map((stt) => (
                            <button
                              key={stt}
                              type="button"
                              onClick={() => handleStatusChange(stId, stt)}
                              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                currentStatus === stt
                                  ? stt === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : stt === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-amber-600 text-white shadow-sm'
                                  : 'text-on-surface-variant hover:text-secondary'
                              }`}
                            >
                              {stt}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Action Bar */}
      {students.length > 0 && (
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs font-headings">
            <span className="font-bold text-secondary">Class {selectedClass}</span> &bull; <span className="text-primary font-bold">{selectedSubject}</span>
            <span className="text-on-surface-variant ml-2">({students.length} Students)</span>
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {saving ? 'Saving Records...' : 'Save & Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}
