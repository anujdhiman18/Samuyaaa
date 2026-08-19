import React, { useState, useEffect } from 'react';
import { facultyPanelService } from '../../services/api';
import Modal from '../../components/admin/Modal';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CLASSES = ['10th', '11th (+1)', '12th (+2)', 'S2', 'S3', '6th', '7th', '8th', '9th', 'S1', 'S4'];

export default function FacultyStudents() {
  const { user } = useAuth();
  const isAdmin = Boolean(
    user && (user.role === 'Admin' || user.role === 'SuperAdmin' || (Array.isArray(user.roles) && user.roles.includes('ADMIN')))
  );

  const responsibilities = user?.responsibilities || [];
  const userAssignedClasses = user?.assignedClasses || [];

  const rawUserClasses = responsibilities.length > 0
    ? Array.from(new Set(responsibilities.map((r) => r.className)))
    : userAssignedClasses;

  const availableClasses = (isAdmin || rawUserClasses.length === 0)
    ? Array.from(new Set([...rawUserClasses, ...DEFAULT_CLASSES]))
    : Array.from(new Set(rawUserClasses));

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await facultyPanelService.getAssignedStudents({
        className: selectedClass,
        search,
      });
      if (res && res.students) {
        setStudents(res.students);
      }
    } catch (err) {
      console.warn('Error fetching assigned students:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
              My Assigned Students
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
              Read-Only Access
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Enrolled students across your assigned classes ({availableClasses.join(', ')}). View academic performance & attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant">Class Filter:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
          >
            <option value="All">All Assigned Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student name, roll number, or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary font-body"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading student records...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No assigned students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Photo</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Admission No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Class</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact Phone</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Attendance %</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Academic Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map((s) => (
                  <tr key={s._id || s.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <img
                        src={s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                        alt={s.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-outline-variant/20 shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.fullName);
                        }}
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">
                      {s.fullName}
                    </td>
                    <td className="py-3 px-4 font-mono text-on-surface-variant whitespace-nowrap text-[11px]">
                      {s.admissionNumber || `ADM-2025-${String(s._id || s.id).slice(-3)}`}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap text-[11px]">
                      {s.rollNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">
                      {s.className}
                    </td>
                    <td className="py-3 px-4 font-mono text-on-surface-variant whitespace-nowrap">
                      {s.phone}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-secondary">{s.attendancePercentage !== undefined ? s.attendancePercentage : 90}%</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {s.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Read-Only Modal */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          title="Student Academic Profile (Read-Only)"
        >
          <div className="space-y-4 font-body">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <img
                src={selectedStudent.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                alt={selectedStudent.fullName}
                className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/30"
              />
              <div>
                <h3 className="font-headings font-extrabold text-base text-secondary">{selectedStudent.fullName}</h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  Admission: {selectedStudent.admissionNumber || 'ADM-2025-001'} &bull; Roll: {selectedStudent.rollNumber}
                </p>
                <p className="text-xs font-bold text-primary">Class: {selectedStudent.className}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
              <div>
                <span className="text-on-surface-variant text-[10px] block">Attendance Percentage</span>
                <span className="font-extrabold text-secondary">{selectedStudent.attendancePercentage || 90}%</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Course</span>
                <span className="font-bold text-secondary">{selectedStudent.course || 'Science'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Father's Name</span>
                <span className="text-secondary">{selectedStudent.fatherName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Parent Contact</span>
                <span className="font-mono text-secondary">{selectedStudent.parentPhone}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium">
              ℹ️ Faculty RBAC Notice: Admission updates and student record deletions are restricted to Admin level permissions.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-full bg-secondary text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
