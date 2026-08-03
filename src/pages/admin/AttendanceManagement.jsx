import React, { useState, useEffect } from 'react';
import { studentService, attendanceService, subjectService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CLASSES = [
  'All',
  '9th',
  '10th',
  '11th (+1)',
  '12th (+2)',
  '6th',
  '7th',
  '8th',
];

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Integrated Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'General',
];

export default function AttendanceManagement() {
  const { addToast } = useToast();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // studentId -> { status: 'Present'|'Absent'|'Late', remarks: '' }
  const [existingRecords, setExistingRecords] = useState([]);
  const [allMonthRecords, setAllMonthRecords] = useState([]);
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'logs'

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAttendanceForDateAndSubject();
  }, [date, selectedSubject, selectedClass, students]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const studentRes = await studentService.getStudents();
      if (studentRes && studentRes.students) {
        setStudents(studentRes.students);
      }

      // 2. Fetch Subjects list
      try {
        const subRes = await subjectService.getSubjects();
        if (subRes && subRes.subjects && subRes.subjects.length > 0) {
          const names = Array.from(new Set(subRes.subjects.map((s) => s.name || s.subjectName))).filter(Boolean);
          if (names.length > 0) setSubjectsList(names);
        }
      } catch (subErr) {
        console.warn('Using default subjects list');
      }
    } catch (err) {
      addToast('Error initializing attendance management page', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDateAndSubject = async () => {
    try {
      // Fetch date/subject specific records
      const res = await attendanceService.getAllAttendance({
        date,
        subject: selectedSubject,
      });

      // Also fetch month records for date strip visualization
      const allRes = await attendanceService.getAllAttendance({
        subject: selectedSubject,
      });
      if (allRes && allRes.attendance) {
        setAllMonthRecords(allRes.attendance);
      }

      const records = res?.attendance || [];
      setExistingRecords(records);

      // Build map of existing statuses for each student
      const newMap = {};

      const filtered = getFilteredStudents();
      filtered.forEach((st) => {
        const stId = String(st._id || st.id);
        const existing = records.find(
          (r) => String(r.student === stId ? stId : r.student?._id) === stId
        );

        if (existing) {
          newMap[stId] = {
            status: existing.status || 'Present',
            remarks: existing.remarks || '',
            recordId: existing._id,
          };
        } else {
          newMap[stId] = {
            status: 'Present',
            remarks: '',
          };
        }
      });

      setAttendanceMap(newMap);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    }
  };

  const getFilteredStudents = () => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'All' || s.className === selectedClass;
      const matchSearch =
        !searchQuery ||
        s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  };

  const filteredStudents = getFilteredStudents();

  // Date Navigation Helpers
  const stepDate = (days) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      filteredStudents.forEach((st) => {
        const stId = String(st._id || st.id);
        updated[stId] = {
          ...updated[stId],
          status,
        };
      });
      return updated;
    });
    addToast(`Marked all ${filteredStudents.length} visible students as ${status}`, 'info');
  };

  const handleSaveAttendance = async (autoAdvance = false) => {
    if (filteredStudents.length === 0) {
      addToast('No students available to save attendance for.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const recordsToSave = filteredStudents.map((st) => {
        const stId = String(st._id || st.id);
        const data = attendanceMap[stId] || { status: 'Present', remarks: '' };
        return {
          studentId: stId,
          status: data.status,
          remarks: data.remarks,
        };
      });

      const res = await attendanceService.saveBatchAttendance({
        date,
        subject: selectedSubject,
        className: selectedClass,
        records: recordsToSave,
      });

      if (res && res.success) {
        addToast(`Attendance saved for ${date} (${selectedSubject})!`, 'success');
        await fetchAttendanceForDateAndSubject();

        if (autoAdvance) {
          stepDate(1); // Advance to next day
        }
      } else {
        addToast(res?.message || 'Failed to save attendance', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error saving attendance records', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await attendanceService.deleteAttendanceRecord(recordId);
      addToast('Attendance log entry deleted', 'success');
      fetchAttendanceForDateAndSubject();
    } catch (err) {
      addToast('Error deleting attendance log entry', 'error');
    }
  };

  // Stats calculation
  const totalStudentsCount = filteredStudents.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  filteredStudents.forEach((st) => {
    const stId = String(st._id || st.id);
    const stStatus = attendanceMap[stId]?.status || 'Present';
    if (stStatus === 'Present') presentCount++;
    else if (stStatus === 'Absent') absentCount++;
    else if (stStatus === 'Late') lateCount++;
  });

  const attendancePercentage =
    totalStudentsCount > 0
      ? Math.round(((presentCount + lateCount) / totalStudentsCount) * 100)
      : 0;

  // Format readable current date
  const dateObj = new Date(date + 'T00:00:00');
  const formattedFullDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate days of current month for the date strip
  const yearNum = dateObj.getFullYear();
  const monthNum = dateObj.getMonth();
  const daysInMonthCount = new Date(yearNum, monthNum + 1, 0).getDate();
  const currentMonthPrefix = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}`;

  const isSavedForSelectedDate = existingRecords.length > 0;

  return (
    <div className="space-y-6 font-body pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">fact_check</span>
            Student Attendance Register
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Easily mark attendance for each day, step through dates, track absences, and save daily batch logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-surface-container-low p-1.5 rounded-full border border-outline-variant/15 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-5 py-2 rounded-full font-headings font-bold text-xs transition-all ${
              activeTab === 'register'
                ? 'bg-primary text-white shadow-premium'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Daily Register
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-2 rounded-full font-headings font-bold text-xs transition-all ${
              activeTab === 'logs'
                ? 'bg-primary text-white shadow-premium'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Attendance Logs ({existingRecords.length})
          </button>
        </div>
      </div>

      {/* Date Navigation & Control Panel */}
      <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 space-y-4">
        {/* Quick Date Stepper Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/15">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepDate(-1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-outline-variant/30 text-secondary hover:bg-primary/10 hover:text-primary font-headings font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
              title="Previous Day"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Prev Day
            </button>

            <button
              type="button"
              onClick={setYesterday}
              className="px-3 py-1.5 rounded-lg bg-white border border-outline-variant/30 text-on-surface-variant hover:text-primary font-headings font-bold text-xs transition-colors shadow-sm"
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={setToday}
              className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-headings font-bold text-xs shadow-sm hover:bg-primary-container transition-all"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => stepDate(1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-outline-variant/30 text-secondary hover:bg-primary/10 hover:text-primary font-headings font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
              title="Next Day"
            >
              Next Day
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-headings font-bold text-sm text-secondary block leading-tight">
                {formattedFullDate}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {isSavedForSelectedDate ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Attendance Saved ✓
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                    Unsaved / Draft Sheet
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Direct Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
              Select Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Class Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">groups</span>
              Class / Batch
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'All' ? 'All Classes' : `Class ${cls}`}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
              Subject / Course
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">search</span>
              Search Student
            </label>
            <input
              type="text"
              placeholder="Search by name or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-medium text-secondary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        {/* Interactive Month Day Strip */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant">
              Quick Day Selector ({dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
            </span>
            <span className="text-[10px] text-on-surface-variant">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Saved
              <span className="inline-block w-2 h-2 rounded-full bg-slate-300 ml-2 mr-1"></span>Unsaved
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: daysInMonthCount }, (_, i) => i + 1).map((d) => {
              const dStr = `${currentMonthPrefix}-${String(d).padStart(2, '0')}`;
              const isSelected = dStr === date;
              const hasRecordsForDay = allMonthRecords.some((r) => r.date === dStr);

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(dStr)}
                  className={`flex-shrink-0 w-9 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all relative ${
                    isSelected
                      ? 'bg-primary text-white shadow-md scale-105 border-2 border-primary'
                      : hasRecordsForDay
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low'
                  }`}
                >
                  <span className="text-[10px] font-normal">{d}</span>
                  {hasRecordsForDay && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Total Students
          </p>
          <h3 className="font-headings font-extrabold text-2xl sm:text-3xl text-secondary mt-1">
            {totalStudentsCount}
          </h3>
          <p className="text-[10px] text-on-surface-variant mt-1">In Selected Filter</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Present Count
          </p>
          <h3 className="font-headings font-extrabold text-2xl sm:text-3xl text-emerald-700 mt-1">
            {presentCount}
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Attending Class</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Absent Count
          </p>
          <h3 className="font-headings font-extrabold text-2xl sm:text-3xl text-rose-600 mt-1">
            {absentCount}
          </h3>
          <p className="text-[10px] text-rose-600 font-semibold mt-1">Needs Attention</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Attendance Rate
          </p>
          <h3 className="font-headings font-extrabold text-2xl sm:text-3xl text-primary mt-1">
            {attendancePercentage}%
          </h3>
          <p className="text-[10px] text-primary font-semibold mt-1">Target &ge; 75%</p>
        </div>
      </div>

      {activeTab === 'register' ? (
        /* Attendance Register View */
        <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
          {/* Action Bar */}
          <div className="p-4 border-b border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <span className="font-headings font-bold text-sm text-secondary">
                Students Attendance Sheet
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                {formattedFullDate} &bull; {selectedSubject}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-headings font-bold text-xs border border-emerald-200 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Mark All Present
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-headings font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Mark All Absent
              </button>

              <button
                type="button"
                disabled={saving || filteredStudents.length === 0}
                onClick={() => handleSaveAttendance(false)}
                className="px-4 py-2 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-premium transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>

              <button
                type="button"
                disabled={saving || filteredStudents.length === 0}
                onClick={() => handleSaveAttendance(true)}
                className="px-4 py-2 rounded-full bg-secondary text-white font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant shadow-premium transition-all disabled:opacity-50 flex items-center gap-1.5"
                title="Save today's attendance and step to next day"
              >
                <span>Save &amp; Next Day</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs animate-pulse text-on-surface-variant">
              Loading student roster...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-xs text-on-surface-variant">
              No active students found matching the selected class/search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/15 font-headings uppercase text-[10px] tracking-wider">
                    <th className="p-4">#</th>
                    <th className="p-4">Student Details</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Class</th>
                    <th className="p-4 text-center">Attendance Status</th>
                    <th className="p-4">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {filteredStudents.map((student, idx) => {
                    const stId = String(student._id || student.id);
                    const currentStatus = attendanceMap[stId]?.status || 'Present';
                    const currentRemarks = attendanceMap[stId]?.remarks || '';

                    return (
                      <tr
                        key={stId}
                        className={`hover:bg-surface-container-lowest/80 transition-colors ${
                          currentStatus === 'Absent' ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="p-4 font-mono font-semibold text-on-surface-variant text-[11px]">
                          {idx + 1}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center font-headings font-extrabold text-secondary text-xs uppercase shadow-sm">
                              {student.fullName?.substring(0, 2) || 'ST'}
                            </div>
                            <div>
                              <p className="font-headings font-bold text-secondary text-xs">
                                {student.fullName}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                Phone: {student.phone || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-xs font-bold text-primary">
                          {student.rollNumber || `SAU-${student.className || '10'}-${idx + 1}`}
                        </td>

                        <td className="p-4 font-semibold text-secondary">
                          Class {student.className}
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 gap-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(stId, 'Present')}
                              className={`px-3 py-1.5 rounded-lg font-headings font-bold text-[11px] transition-all flex items-center gap-1 ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-emerald-700 hover:bg-emerald-100/50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {currentStatus === 'Present' ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(stId, 'Absent')}
                              className={`px-3 py-1.5 rounded-lg font-headings font-bold text-[11px] transition-all flex items-center gap-1 ${
                                currentStatus === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-rose-700 hover:bg-rose-100/50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {currentStatus === 'Absent' ? 'cancel' : 'radio_button_unchecked'}
                              </span>
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(stId, 'Late')}
                              className={`px-3 py-1.5 rounded-lg font-headings font-bold text-[11px] transition-all flex items-center gap-1 ${
                                currentStatus === 'Late'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-amber-700 hover:bg-amber-100/50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {currentStatus === 'Late' ? 'schedule' : 'radio_button_unchecked'}
                              </span>
                              Late
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={currentRemarks}
                            onChange={(e) => handleRemarksChange(stId, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs w-full max-w-xs focus:ring-1 focus:ring-primary outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Save Action Bar */}
          <div className="p-4 border-t border-outline-variant/15 bg-surface-container-lowest flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">
              Showing {filteredStudents.length} students for {formattedFullDate}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving || filteredStudents.length === 0}
                onClick={() => handleSaveAttendance(false)}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-premium transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {saving ? 'Saving...' : 'Save Attendance Sheet'}
              </button>

              <button
                type="button"
                disabled={saving || filteredStudents.length === 0}
                onClick={() => handleSaveAttendance(true)}
                className="px-5 py-2.5 rounded-full bg-secondary text-white font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant shadow-premium transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span>Save &amp; Advance to Next Day</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Attendance Logs View */
        <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
            <div>
              <h3 className="font-headings font-bold text-base text-secondary">
                Recorded Attendance Logs for {formattedFullDate} ({selectedSubject})
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Saved records currently stored in database for this date and subject.
              </p>
            </div>
          </div>

          {existingRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              No recorded attendance entries for this date and subject yet. Use the Daily Register tab to mark attendance.
            </div>
          ) : (
            <div className="space-y-3">
              {existingRecords.map((rec) => {
                const studentId = rec.student?._id || rec.student;
                const studentObj = students.find((s) => String(s._id || s.id) === String(studentId));

                return (
                  <div
                    key={rec._id}
                    className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-headings font-extrabold text-xs flex items-center justify-center">
                        {studentObj?.fullName?.substring(0, 2) || 'ST'}
                      </div>
                      <div>
                        <h4 className="font-headings font-bold text-sm text-secondary">
                          {studentObj?.fullName || `Student ID: ${studentId}`}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant">
                          Roll: <span className="font-mono text-primary font-bold">{studentObj?.rollNumber || 'N/A'}</span> &bull; Subject: {rec.subject || selectedSubject} &bull; Date: {rec.date}
                        </p>
                        {rec.remarks && (
                          <p className="text-[10px] text-on-surface-variant/80 italic mt-0.5">
                            Note: "{rec.remarks}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-full font-headings font-bold text-xs uppercase tracking-wider ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>

                      <button
                        onClick={() => handleDeleteRecord(rec._id)}
                        title="Delete record"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
