import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studentService, subscribeFirestoreCollection, initialMockStudents, getFeeStatusInfo, getStoredStudents } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import FeeToggleSwitch from '../../components/admin/FeeToggleSwitch';

const CLASSES = [
  'Nursery',
  'LKG',
  'UKG',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th (+1)',
  '12th (+2)',
];

const initialStudentForm = {
  fullName: '',
  fatherName: '',
  motherName: '',
  phone: '',
  parentPhone: '',
  email: '',
  address: '',
  className: 'Nursery',
  rollNumber: '',
  subjects: ['Mathematics Advanced'],
  monthlyFee: 2500,
  monthlyDueDay: 5,
  status: 'Active',
};

export default function StudentManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialFeeFilter = searchParams.get('feeStatus') || 'All';

  const [students, setStudents] = useState(() => {
    try {
      return getStoredStudents() || [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  const [selectedClass, setSelectedClass] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState(initialFeeFilter);
  const [sortByDueDate, setSortByDueDate] = useState('asc');

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
    const filterFromUrl = searchParams.get('feeStatus');
    if (filterFromUrl) {
      setFeeStatusFilter(filterFromUrl);
    }
    if (searchParams.get('action') === 'add') {
      handleOpenAdd();
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents({ limit: 100 });
      if (data && data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      addToast('Error fetching student directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFeeToggle = async (studentId, feesPaid) => {
    try {
      await studentService.toggleFeeStatus(studentId, feesPaid);
      addToast(`Fee status updated to ${feesPaid ? 'PAID' : 'UNPAID'}`, 'success');
      fetchStudents();
    } catch (err) {
      addToast('Error updating fee status', 'error');
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

  const handleOpenAdd = () => {
    setEditingStudent(null);
    const autoRoll = generateAutoRollNumber('10th', students);
    setForm({
      ...initialStudentForm,
      rollNumber: autoRoll,
      monthlyDueDay: 5,
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
    setForm({
      ...student,
      monthlyFee: student.monthlyFee !== undefined ? student.monthlyFee : 2500,
      monthlyDueDay: student.monthlyDueDay || student.feeDueDate || 5,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.monthlyDueDay || form.monthlyDueDay < 1 || form.monthlyDueDay > 31) {
      addToast('Please select a valid Monthly Fee Due Day (1–31)!', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent._id || editingStudent.id, form);
        addToast('Student record updated successfully', 'success');
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
      await studentService.deleteStudent(deleteTarget._id || deleteTarget.id);
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
    const headers = ['Roll Number', 'Full Name', 'Class', 'Phone', 'Parent Phone', 'Email', 'Monthly Fee', 'Monthly Due Day', 'Status'];
    const rows = students.map((s) => [
      s.rollNumber,
      `"${s.fullName}"`,
      s.className,
      s.phone,
      s.parentPhone,
      s.email || '',
      s.monthlyFee,
      s.monthlyDueDay || s.feeDueDate || 5,
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

  // Filtering & Sorting Logic
  let filteredStudents = students.filter((s) => {
    if (selectedClass !== 'All' && s.className !== selectedClass) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchName = s.fullName && s.fullName.toLowerCase().includes(term);
      const matchRoll = s.rollNumber && s.rollNumber.toLowerCase().includes(term);
      const matchPhone = s.phone && s.phone.includes(term);
      if (!matchName && !matchRoll && !matchPhone) return false;
    }
    if (feeStatusFilter !== 'All') {
      const isPaid = Boolean(s.feesPaid || s.paidTillMonth === 'July 2026');
      if (feeStatusFilter === 'paid' && !isPaid) return false;
      if (feeStatusFilter === 'unpaid' && isPaid) return false;
    }
    return true;
  });

  filteredStudents.sort((a, b) => {
    const isPaidA = Boolean(a.feesPaid || a.paidTillMonth === 'July 2026');
    const isPaidB = Boolean(b.feesPaid || b.paidTillMonth === 'July 2026');
    const dateA = getFeeStatusInfo(a.monthlyDueDay || a.feeDueDate || 5, isPaidA, a.paymentDate, a.nextFeeDueDate).nextDueDate.getTime();
    const dateB = getFeeStatusInfo(b.monthlyDueDay || b.feeDueDate || 5, isPaidB, b.paymentDate, b.nextFeeDueDate).nextDueDate.getTime();
    return sortByDueDate === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Student Management Directory
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Enrolled students across Nursery to 12th grade (+2).
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-full border border-outline-variant/30 bg-white text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Directory
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student name, roll number, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary font-body"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Classes' : `Class ${c}`}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant">Fee Status:</span>
            <select
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="All">All Students</option>
              <option value="paid">🟢 Fees Paid</option>
              <option value="unpaid">🔴 Fees Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse">Loading student roster...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No students found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Class</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Monthly Fee</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Fee Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
                {filteredStudents.map((student) => {
                  const isPaid = Boolean(student.feesPaid || student.paidTillMonth === 'July 2026');

                  return (
                    <tr
                      key={student._id || student.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-secondary whitespace-nowrap">
                        {student.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-on-surface whitespace-nowrap">
                        <Link
                          to={`/admin/students/${student._id || student.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {student.fullName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-surface-container font-bold text-[11px] whitespace-nowrap">
                          Class {student.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">
                        ₹{(student.monthlyFee || 2500).toLocaleString()}/mo
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <FeeToggleSwitch
                          checked={isPaid}
                          onChange={(newStatus) => handleFeeToggle(student._id || student.id, newStatus)}
                          paymentDate={student.paymentDate}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/admin/students/${student._id || student.id}`}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          open={isModalOpen}
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
                <div className="flex justify-between items-center">
                  <label className="font-headings font-bold text-on-surface-variant">
                    Roll Number *
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  placeholder="SAU-10-001"
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono font-bold"
                />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Monthly Fee Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.monthlyFee !== undefined ? form.monthlyFee : 2500}
                  onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
                  placeholder="2500"
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-emerald-800"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Monthly Fee Due Day (1–31) *
                </label>
                <select
                  required
                  value={form.monthlyDueDay || form.feeDueDate || 5}
                  onChange={(e) => setForm({ ...form, monthlyDueDay: Number(e.target.value), feeDueDate: Number(e.target.value) })}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    let suffix = 'th';
                    if (day === 1 || day === 21 || day === 31) suffix = 'st';
                    else if (day === 2 || day === 22) suffix = 'nd';
                    else if (day === 3 || day === 23) suffix = 'rd';
                    return (
                      <option key={day} value={day}>
                        {day}{suffix} of every month
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-on-surface-variant/70">
                  Select recurring day of month when tuition fee is due.
                </span>
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
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Student Record"
          message={`Are you sure you want to permanently delete student profile for ${deleteTarget?.fullName}?`}
          loading={deleting}
        />
      )}
    </div>
  );
}
