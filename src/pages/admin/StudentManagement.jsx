import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentService, subscribeFirestoreCollection, initialMockStudents, getStoredStudents } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

const CLASSES = ['All', '9th', '10th', '11th (+1)', '12th (+2)'];
const BRANCHES = ['All', 'Bagru', 'Daroh'];

const initialStudentForm = {
  fullName: '',
  admissionNumber: '',
  fatherName: '',
  motherName: '',
  phone: '',
  parentPhone: '',
  email: '',
  password: 'Student123',
  address: '',
  className: '10th',
  subjects: ['Mathematics Advanced'],
  batch: '2024-2026',
  branch: 'Bagru',
  rollNumber: '',
  photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  monthlyFee: 2500,
  monthlyDueDay: 5,
  status: 'Active',
};

export default function StudentManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [students, setStudents] = useState(() => {
    try {
      return getStoredStudents() || initialMockStudents;
    } catch (e) {
      return initialMockStudents;
    }
  });
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Add Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialStudentForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeFirestoreCollection('students', initialMockStudents, (list) => {
      if (list) {
        setStudents(list);
        setLoading(false);
      }
    });

    fetchStudents();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenAdd();
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents({ limit: 200 });
      if (data && data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAutoRollNumber = (className, currentStudents) => {
    const classCode = className ? className.replace(/\D/g, '') || '10' : '10';
    const prefix = `SAU-${classCode.padStart(2, '0')}-`;
    let maxSeq = 0;
    currentStudents.forEach((s) => {
      if (s.rollNumber && s.rollNumber.startsWith(prefix)) {
        const match = s.rollNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
    });
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}${nextSeq}`;
  };

  const generateAutoAdmissionNumber = (currentStudents) => {
    const year = new Date().getFullYear();
    const count = currentStudents.length + 1;
    return `ADM-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    const autoRoll = generateAutoRollNumber('10th', students);
    const autoAdmission = generateAutoAdmissionNumber(students);
    setForm({
      ...initialStudentForm,
      rollNumber: autoRoll,
      admissionNumber: autoAdmission,
      monthlyDueDay: 5,
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      addToast('Please enter full student name!', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await studentService.createStudent(form);
      addToast(`Added new student "${form.fullName}" successfully!`, 'success');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error saving student', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Clean minimal search & filter logic
  const filteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    return list.filter((s) => {
      if (!s) return false;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q));

      const matchClass = selectedClass === 'All' || s.className === selectedClass;
      const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;

      return matchSearch && matchClass && matchBranch;
    });
  }, [students, search, selectedClass, selectedBranch]);

  return (
    <div className="space-y-6 font-body">
      {/* Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Student Directory
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'} Enrolled &bull; Click any student to view or edit full profile.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add New Student
        </button>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/60">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or Student ID / Roll No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-body focus:outline-none focus:border-secondary transition-all bg-surface-container-lowest"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Filters & Grid/List View Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-secondary focus:outline-none"
          >
            <option value="All">All Classes</option>
            {CLASSES.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-secondary focus:outline-none"
          >
            <option value="All">All Branches</option>
            {BRANCHES.filter((b) => b !== 'All').map((b) => (
              <option key={b} value={b}>
                {b} Branch
              </option>
            ))}
          </select>

          <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="List View"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student List Display (Minimal - Photo, Name, Student ID ONLY) */}
      {loading ? (
        <div className="p-12 text-center text-xs animate-pulse text-on-surface-variant bg-white rounded-2xl shadow-premium border border-outline-variant/15">
          Loading student directory...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-outline-variant/15 shadow-premium">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
            group_off
          </span>
          <p className="font-headings font-bold text-secondary text-sm">No Students Found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Try adjusting your search criteria or add a new student.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* MINIMAL GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredStudents.map((s) => {
            const studentId = s.rollNumber || s.admissionNumber || `SAU-${s._id}`;
            return (
              <div
                key={s._id || s.id}
                onClick={() => navigate(`/admin/students/${s._id || s.id}`)}
                className="bg-white rounded-2xl p-5 border border-outline-variant/15 shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center text-center group relative overflow-hidden"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container border-2 border-primary/10 group-hover:border-primary transition-colors shadow-sm mb-3">
                  <img
                    src={s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                    alt={s.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName || 'Student')}&background=0D8ABC&color=fff`;
                    }}
                  />
                </div>

                <h3 className="font-headings font-extrabold text-sm text-secondary group-hover:text-primary transition-colors line-clamp-1">
                  {s.fullName}
                </h3>
                <span className="font-mono text-xs font-bold text-primary mt-1 bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                  {studentId}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* MINIMAL LIST / TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-6">Photo</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6 text-right">Student ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {filteredStudents.map((s) => {
                  const studentId = s.rollNumber || s.admissionNumber || `SAU-${s._id}`;
                  return (
                    <tr
                      key={s._id || s.id}
                      onClick={() => navigate(`/admin/students/${s._id || s.id}`)}
                      className="hover:bg-surface-container-low/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-6">
                        <img
                          src={s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                          alt={s.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-outline-variant/20 shadow-sm"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName || 'Student')}&background=0D8ABC&color=fff`;
                          }}
                        />
                      </td>
                      <td className="py-3 px-6 font-headings font-extrabold text-sm text-secondary group-hover:text-primary transition-colors">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 inline-block">
                          {studentId}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Student Profile"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveStudent} className="space-y-4 text-xs font-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Roll Number / Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono font-bold focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Class *
                </label>
                <select
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                >
                  {CLASSES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Branch *
                </label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                >
                  <option value="Bagru">Bagru Branch</option>
                  <option value="Daroh">Daroh Branch</option>
                </select>
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Student Email *
                </label>
                <input
                  type="email"
                  placeholder="student@saumyaa.edu.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="9816000000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  placeholder="Rajesh Sharma"
                  value={form.fatherName}
                  onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Parent Phone
                </label>
                <input
                  type="text"
                  placeholder="9816000000"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-6 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? 'Saving...' : 'Save & Register Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
