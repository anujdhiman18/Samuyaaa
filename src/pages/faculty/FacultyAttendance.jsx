import React, { useState, useEffect } from 'react';
import { facultyPanelService, attendanceService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function FacultyAttendance() {
  const { addToast } = useToast();

  const getTodayLocalString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(() => getTodayLocalString());
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics Advanced');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, [date, selectedClass, selectedSubject]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const studentRes = await facultyPanelService.getAssignedStudents({ className: selectedClass });
      const studentList = studentRes?.students || [];
      setStudents(studentList);

      const attRes = await attendanceService.getAllAttendance({
        date,
        subject: selectedSubject,
      });

      const records = attRes?.attendance || [];
      const newMap = {};
      studentList.forEach((st) => {
        const stId = String(st._id || st.id);
        const existing = records.find((r) => String(r.student?._id || r.student?.id || r.student) === stId);
        newMap[stId] = {
          status: existing ? existing.status || 'Present' : 'Present',
          remarks: existing ? existing.remarks || '' : '',
        };
      });
      setAttendanceMap(newMap);
    } catch (err) {
      addToast('Error loading attendance register', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleMarkAll = (status) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        const stId = String(st._id || st.id);
        updated[stId] = { ...updated[stId], status };
      });
      return updated;
    });
    addToast(`Marked all ${students.length} students as ${status}`, 'info');
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const recordsToSave = students.map((st) => {
        const stId = String(st._id || st.id);
        const data = attendanceMap[stId] || { status: 'Present', remarks: '' };
        return { studentId: stId, status: data.status, remarks: data.remarks };
      });

      const res = await attendanceService.saveBatchAttendance({
        date,
        subject: selectedSubject,
        className: selectedClass,
        records: recordsToSave,
      });

      if (res && res.success) {
        addToast(`Attendance saved for ${date} (${selectedSubject})!`, 'success');
        fetchClassData();
      }
    } catch (err) {
      addToast('Error saving attendance records', 'error');
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
            <span className="material-symbols-outlined text-primary text-3xl">fact_check</span>
            Assigned Class Attendance Register
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Mark daily attendance for your assigned classes and subjects.
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="bg-primary text-white font-headings font-bold px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? 'Saving...' : 'Save Attendance Register'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Assigned Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
          >
            <option value="10th">Class 10th</option>
            <option value="11th (+1)">Class 11th (+1)</option>
            <option value="12th (+2)">Class 12th (+2)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Assigned Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
          >
            <option value="Mathematics Advanced">Mathematics Advanced</option>
            <option value="Physics IIT-JEE Prep">Physics IIT-JEE Prep</option>
          </select>
        </div>
      </div>

      {/* Quick Mark Toolbar */}
      <div className="flex gap-2">
        <button
          onClick={() => handleMarkAll('Present')}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 transition-colors"
        >
          Mark All Present
        </button>
        <button
          onClick={() => handleMarkAll('Absent')}
          className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition-colors"
        >
          Mark All Absent
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
    </div>
  );
}
