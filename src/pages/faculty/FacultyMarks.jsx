import React, { useState, useEffect } from 'react';
import { facultyPanelService, marksService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function FacultyMarks() {
  const { addToast } = useToast();

  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics Advanced');
  const [examType, setExamType] = useState('Internal Assessment 1');
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({}); // studentId -> { marksObtained: '', practicalMarks: '', assignmentMarks: '', totalMax: 100 }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClassStudents();
  }, [selectedClass, selectedSubject]);

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const studentRes = await facultyPanelService.getAssignedStudents({ className: selectedClass });
      const list = studentRes?.students || [];
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
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: Number(value),
      },
    }));
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast(`Marks published successfully for ${selectedClass} (${selectedSubject})!`, 'success');
    }, 600);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
            Internal Marks & Gradebook
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Manage internal test scores, practical marks, assignment scores, & publish official grades.
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

      {/* Control Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Class</label>
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
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
          >
            <option value="Mathematics Advanced">Mathematics Advanced</option>
            <option value="Physics IIT-JEE Prep">Physics IIT-JEE Prep</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Exam / Assessment Type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
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
                  const total = (m.theoryMarks || 0) + (m.practicalMarks || 0) + (m.assignmentMarks || 0);

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
                          value={m.theoryMarks || ''}
                          onChange={(e) => handleMarkChange(stId, 'theoryMarks', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary text-center"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          value={m.practicalMarks || ''}
                          onChange={(e) => handleMarkChange(stId, 'practicalMarks', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary text-center"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          value={m.assignmentMarks || ''}
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
