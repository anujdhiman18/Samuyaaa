import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studentService, subjectService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const CLASSES = ['All', '8th', '9th', '10th', '11th', '12th', 'Olympiad'];

const initialStudentForm = {
  fullName: '',
  fatherName: '',
  motherName: '',
  phone: '',
  parentPhone: '',
  email: '',
  address: '',
  className: '10th',
  rollNumber: '',
  subjects: ['Mathematics Advanced'],
  monthlyFee: 2500,
  feeDueDate: 5,
  status: 'Active',
};

export default function StudentManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [students, setStudents] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState(initialSearch);
  const [selectedClass, setSelectedClass] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(initialStudentForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedClass, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents({
        search,
        className: selectedClass,
        page,
        limit: 10,
      });
      if (data && data.students) {
        setStudents(data.students);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      if (data && data.subjects) {
        setAvailableSubjects(data.subjects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateAutoRollNumber = (targetClass = '10th', existingStudents = []) => {
    const classCode = targetClass ? targetClass.replace(/\D/g, '') || '10' : '10';
    const prefix = `SAU-${classCode.padStart(2, '0')}-`;
    let maxSeq = 0;
    existingStudents.forEach((s) => {
      if (s.rollNumber) {
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

  const handleOpenAdd = () => {
    setEditingStudent(null);
    const autoRoll = generateAutoRollNumber('10th', students);
    setForm({
      ...initialStudentForm,
      rollNumber: autoRoll,
    });
    setIsModalOpen(true);
  };

  const handleClassChange = (newClass) => {
    if (!editingStudent) {
      const autoRoll = generateAutoRollNumber(newClass, students);
      setForm({ ...form, className: newClass, rollNumber: autoRoll });
    } else {
      setForm({ ...form, className: newClass });
    }
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setForm({ ...student });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent._id, form);
        addToast('Student details updated successfully', 'success');
      } else {
        await studentService.createStudent(form);
        addToast('New student registered successfully', 'success');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error saving student record', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentService.deleteStudent(deleteTarget._id);
      addToast('Student record deleted successfully', 'success');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error deleting student', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll Number', 'Full Name', 'Class', 'Phone', 'Parent Phone', 'Email', 'Monthly Fee', 'Status'];
    const rows = students.map((s) => [
      s.rollNumber,
      `"${s.fullName}"`,
      s.className,
      s.phone,
      s.parentPhone,
      s.email || '',
      s.monthlyFee,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Saumyaa_Students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Student directory exported to CSV', 'info');
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header & Main Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Student Directory Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Comprehensive student directory, batch assignments, and academic tracking.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-full border border-outline-variant/30 bg-white text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-full border border-outline-variant/30 bg-white text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Roster
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-primary text-white font-headings font-bold px-5 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant/60">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchParams({ search: e.target.value });
            }}
            placeholder="Search by name, roll number, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-medium text-on-surface focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => {
                setSelectedClass(cls);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-headings font-bold transition-all ${
                selectedClass === cls
                  ? 'bg-secondary text-white shadow-tactile-btn'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cls === 'All' ? 'All Classes' : `Class ${cls}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Data */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse">Loading student records...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
              group_off
            </span>
            <h4 className="font-headings font-bold text-base text-on-surface">
              No Students Found
            </h4>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
              No student records matched your search query or class filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4">Roll No.</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Father Name</th>
                  <th className="py-3.5 px-4">Parent Phone</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-secondary">
                      {student.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      <Link
                        to={`/admin/students/${student._id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {student.fullName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container font-bold text-[11px]">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {student.fatherName}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {student.parentPhone}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      ₹{(student.monthlyFee || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          student.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/students/${student._id}`}
                        className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 inline-block"
                        title="View Full Profile"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                        title="Edit Record"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(student)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Delete Record"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Record' : 'Register New Student'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Rahul Gupta"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-headings font-bold text-on-surface-variant flex items-center gap-1.5">
                  Roll Number *
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Auto-Assigned
                  </span>
                </label>
                {!editingStudent && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, rollNumber: generateAutoRollNumber(form.className, students) })}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5"
                    title="Recalculate next sequential roll number"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    Auto-Generate
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                placeholder="SAU-10-001"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-on-surface-variant/70">
                Sequential ID automatically assigned based on Class. You can customize if needed.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Father's Name *
              </label>
              <input
                type="text"
                required
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                placeholder="Rajesh Gupta"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Mother's Name *
              </label>
              <input
                type="text"
                required
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                placeholder="Sunita Gupta"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Student Phone *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Parent Phone *
              </label>
              <input
                type="tel"
                required
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                placeholder="Parent 10-digit number"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="rahul@domain.com"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Class / Grade *
              </label>
              <select
                required
                value={form.className}
                onChange={(e) => handleClassChange(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              >
                {CLASSES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-tactile-btn shadow-premium"
            >
              {editingStudent ? 'Update Record' : 'Save Student'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={`Delete Student ${deleteTarget?.fullName}?`}
        message={`Are you sure you want to remove roll number ${deleteTarget?.rollNumber}?`}
      />
    </div>
  );
}
