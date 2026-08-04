import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studentService, credentialRequestService, subscribeFirestoreCollection, initialMockStudents, getFeeStatusInfo, getStoredStudents } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import FeeToggleSwitch from '../../components/admin/FeeToggleSwitch';

const SUBJECTS = [
  'All',
  'Mathematics Advanced',
  'Physics IIT-JEE Prep',
  'Organic & Physical Chemistry',
  'Biology NEET Prep',
  'Computer Science',
  'Integrated Science',
  'English Literature',
  'Accountancy & Business',
];
const BATCHES = ['All', '2023-2025', '2024-2026', '2025-2026', 'Batch A', 'Batch B'];
const CLASSES = ['All', '9th', '10th', '11th (+1)', '12th (+2)'];
const STATUSES = ['All', 'Active', 'Inactive', 'Alumni', 'Suspended'];
const BRANCHES = ['All', 'Bagru', 'Daroh'];

const initialStudentForm = {
  fullName: '',
  admissionNumber: '',
  fatherName: '',
  motherName: '',
  phone: '',
  parentPhone: '',
  email: '',
  password: 'student123',
  address: '',
  className: '10th',
  subjects: ['Mathematics Advanced'],
  subject: 'Mathematics Advanced',
  batch: '2024-2026',
  branch: 'Bagru',
  rollNumber: '',
  photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  monthlyFee: 2500,
  monthlyDueDay: 5,
  attendancePercentage: 90,
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

  // Credential Requests
  const [credentialRequests, setCredentialRequests] = useState([]);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState(initialFeeFilter);

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState('fullName'); // fullName, admissionNumber, rollNumber, attendancePercentage, status
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(initialStudentForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirm Modal
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
    fetchRequests();
    return () => unsubscribe();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await credentialRequestService.getRequests();
      if (res && res.requests) {
        setCredentialRequests(res.requests);
      }
    } catch (e) {
      console.warn('Error fetching credential requests:', e);
    }
  };

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

  const generateAutoAdmissionNumber = (currentStudents) => {
    const year = new Date().getFullYear();
    const count = currentStudents.length + 1;
    return `ADM-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
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

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    const subList = Array.isArray(student.subjects) && student.subjects.length > 0
      ? student.subjects
      : [student.subject || student.course || 'Mathematics Advanced'];

    setForm({
      ...student,
      subjects: subList,
      subject: subList[0] || 'Mathematics Advanced',
      batch: student.batch || '2024-2026',
      className: student.className || '10th',
      admissionNumber: student.admissionNumber || `ADM-2025-${String(student._id || student.id).slice(-3)}`,
      photo: student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      attendancePercentage: student.attendancePercentage !== undefined ? student.attendancePercentage : 90,
      monthlyFee: student.monthlyFee !== undefined ? student.monthlyFee : 2500,
      monthlyDueDay: student.monthlyDueDay || student.feeDueDate || 5,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

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

  const handleProcessRequest = async (requestId, action) => {
    try {
      const res = await credentialRequestService.processRequest(requestId, action);
      addToast(res.message || `Request ${action} successfully!`, 'success');
      fetchRequests();
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error processing request', 'error');
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

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      // Search
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchName = s.fullName && s.fullName.toLowerCase().includes(term);
        const matchRoll = s.rollNumber && s.rollNumber.toLowerCase().includes(term);
        const matchAdmission = s.admissionNumber && s.admissionNumber.toLowerCase().includes(term);
        const matchPhone = s.phone && s.phone.includes(term);
        const matchEmail = s.email && s.email.toLowerCase().includes(term);
        if (!matchName && !matchRoll && !matchAdmission && !matchPhone && !matchEmail) return false;
      }

      // Subject Filter
      if (selectedSubject !== 'All') {
        const studentSubs = Array.isArray(s.subjects) ? s.subjects : [s.subject || s.course];
        if (!studentSubs.includes(selectedSubject)) return false;
      }

      // Batch Filter
      if (selectedBatch !== 'All' && s.batch !== selectedBatch) return false;

      // Class Filter
      if (selectedClass !== 'All' && s.className !== selectedClass) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'All' && s.status !== selectedStatus) return false;

      // Branch Filter
      if (selectedBranch !== 'All' && (s.branch || 'Bagru') !== selectedBranch) return false;

      // Fee Status Filter
      if (feeStatusFilter !== 'All') {
        const isPaid = Boolean(s.feesPaid || s.paidTillMonth === 'July 2026');
        if (feeStatusFilter === 'paid' && !isPaid) return false;
        if (feeStatusFilter === 'unpaid' && isPaid) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'feeStatus') {
        valA = Boolean(a.feesPaid || a.paidTillMonth === 'July 2026') ? 1 : 0;
        valB = Boolean(b.feesPaid || b.paidTillMonth === 'July 2026') ? 1 : 0;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, search, selectedSubject, selectedBatch, selectedClass, selectedStatus, feeStatusFilter, sortBy, sortOrder]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSubject, selectedBatch, selectedClass, selectedStatus, feeStatusFilter, itemsPerPage]);

  // Paginated Students
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Bulk Selection Handlers
  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedStudents.map((s) => String(s._id || s.id));
      setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedStudents.map((s) => String(s._id || s.id)));
      setSelectedStudentIds(selectedStudentIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectStudent = (studentId) => {
    const strId = String(studentId);
    setSelectedStudentIds((prev) =>
      prev.includes(strId) ? prev.filter((id) => id !== strId) : [...prev, strId]
    );
  };

  const handleBulkAction = async (action, newStatus = null) => {
    if (selectedStudentIds.length === 0) return;

    try {
      await studentService.bulkActionStudents({ action, studentIds: selectedStudentIds, newStatus });
      addToast(`Bulk ${action} action executed on ${selectedStudentIds.length} students!`, 'success');
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error executing bulk action', 'error');
    }
  };

  const exportToCSV = (targetList = filteredStudents) => {
    if (targetList.length === 0) {
      addToast('No student records to export', 'warning');
      return;
    }
    const headers = [
      'Photo URL',
      'Full Name',
      'Admission Number',
      'Roll Number',
      'Subject(s)',
      'Batch',
      'Class',
      'Contact Number',
      'Parent Phone',
      'Email',
      'Fee Status',
      'Attendance %',
      'Current Status',
    ];
    const rows = targetList.map((s) => [
      `"${s.photo || ''}"`,
      `"${s.fullName}"`,
      `"${s.admissionNumber || s.rollNumber}"`,
      `"${s.rollNumber}"`,
      `"${Array.isArray(s.subjects) ? s.subjects.join('; ') : (s.subject || s.course || 'Mathematics Advanced')}"`,
      `"${s.batch || '2024-2026'}"`,
      `"${s.className || '10th'}"`,
      `"${s.phone}"`,
      `"${s.parentPhone}"`,
      `"${s.email || ''}"`,
      Boolean(s.feesPaid || s.paidTillMonth === 'July 2026') ? 'Paid' : 'Unpaid',
      `${s.attendancePercentage !== undefined ? s.attendancePercentage : 90}%`,
      `"${s.status || 'Active'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Saumyaa_Students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${targetList.length} student records to CSV`, 'info');
  };

  const isAllPageSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((s) => selectedStudentIds.includes(String(s._id || s.id)));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">🟢 Active</span>;
      case 'Inactive':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">⚪ Inactive</span>;
      case 'Alumni':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">🎓 Alumni</span>;
      case 'Suspended':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">🔴 Suspended</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span>;
    }
  };

  const getAttendancePill = (percentage) => {
    const pct = percentage !== undefined ? percentage : 90;
    let colorClass = 'bg-emerald-500';
    if (pct < 75) colorClass = 'bg-rose-500';
    else if (pct < 85) colorClass = 'bg-amber-500';

    return (
      <div className="flex items-center gap-2">
        <div className="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <span className="text-xs font-bold text-secondary">{pct}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Students Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Complete student directory, filtering, batch allocation, & profile management.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="px-4 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-headings font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            Credential Requests
            {credentialRequests.filter((r) => r.status === 'Pending').length > 0 && (
              <span className="w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                {credentialRequests.filter((r) => r.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => exportToCSV()}
            className="px-4 py-2.5 rounded-full border border-outline-variant/30 bg-white text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
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

      {/* Multi-Filter & Search Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
        {/* Search row */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by student name, phone, email, roll number, or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary font-body"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="fullName">Full Name</option>
              <option value="admissionNumber">Admission Number</option>
              <option value="rollNumber">Roll Number</option>
              <option value="attendancePercentage">Attendance %</option>
              <option value="feeStatus">Fee Status</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 rounded-xl border border-outline-variant/30 hover:bg-surface-container text-secondary text-xs font-bold transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-outline-variant/15">
          {/* Location Filter */}
          <div>
            <label className="block text-[10px] font-headings font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
              Location
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="All">All Locations</option>
              <option value="Bagru">Bagru (Main)</option>
              <option value="Daroh">Daroh (Child)</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-headings font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
              ))}
            </select>
          </div>

          {/* Batch */}
          <div>
            <label className="block text-[10px] font-headings font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
              Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              {BATCHES.map((b) => (
                <option key={b} value={b}>{b === 'All' ? 'All Batches' : b}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] font-headings font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-headings font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
              Current Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
              ))}
            </select>
          </div>

          {/* Fee Status */}
          <div>
            <label className="block text-[10px] font-headings font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
              Fee Status
            </label>
            <select
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="All">All Fee Status</option>
              <option value="paid">🟢 Fees Paid</option>
              <option value="unpaid">🔴 Fees Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-secondary text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-white text-xs font-extrabold px-3 py-1 rounded-full">
              {selectedStudentIds.length} Selected
            </span>
            <span className="text-xs text-surface-container">Select bulk actions to apply:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction('status', 'Suspended')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => handleBulkAction('status', 'Active')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Bulk Activate
            </button>
            <button
              onClick={() => handleBulkAction('status', 'Alumni')}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
            >
              Mark Alumni
            </button>
            <button
              onClick={() => {
                const selectedList = students.filter((s) => selectedStudentIds.includes(String(s._id || s.id)));
                exportToCSV(selectedList);
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container text-secondary text-xs font-bold transition-colors"
            >
              Export Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded-xl bg-red-900 hover:bg-red-950 text-white text-xs font-bold transition-colors"
            >
              Bulk Delete
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 rounded-xl border border-white/30 text-xs font-bold hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Directory Table Container */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline-variant">person_search</span>
            <p className="font-headings font-bold">No students found matching filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleSelectAllOnPage}
                        className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Photo</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Full Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Admission No.</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Subject(s)</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Batch</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Class</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Branch</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Contact No.</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Email</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Fee Status</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Attendance %</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Current Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-xs">
                  {paginatedStudents.map((s) => {
                    const studentId = String(s._id || s.id);
                    const isSelected = selectedStudentIds.includes(studentId);
                    const isPaid = Boolean(s.feesPaid || s.paidTillMonth === 'July 2026');

                    return (
                      <tr
                        key={studentId}
                        className={`hover:bg-surface-container-lowest transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectStudent(studentId)}
                            className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
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
                          <Link
                            to={`/admin/students/${studentId}`}
                            className="hover:text-primary hover:underline"
                          >
                            {s.fullName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                          {s.admissionNumber || `ADM-2025-${studentId.slice(-3)}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-primary whitespace-nowrap">
                          {s.rollNumber}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap font-medium">
                          {Array.isArray(s.subjects) && s.subjects.length > 0
                            ? s.subjects.join(', ')
                            : (s.subject || s.course || 'Mathematics Advanced')}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap font-medium">
                          {s.batch || '2024-2026'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-secondary font-bold text-[11px]">
                            Class {s.className || '10th'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            (s.branch || 'Bagru') === 'Daroh'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            🏢 {s.branch || 'Bagru'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap font-mono">
                          {s.phone}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap font-mono text-[11px]">
                          {s.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <FeeToggleSwitch
                            feesPaid={isPaid}
                            onToggle={(newStatus) => handleFeeToggle(studentId, newStatus)}
                          />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getAttendancePill(s.attendancePercentage)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(s.status || 'Active')}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/admin/students/${studentId}`}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-primary transition-colors"
                              title="View Student Profile"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </Link>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors"
                              title="Edit Record"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Delete Record"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] font-bold">Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold text-secondary bg-white focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-secondary disabled:opacity-40 hover:bg-surface-container transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'hover:bg-surface-container text-secondary'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-secondary disabled:opacity-40 hover:bg-surface-container transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Record' : 'Add New Student'}
      >
        <form onSubmit={handleSave} className="space-y-4 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Admission Number</label>
              <input
                type="text"
                value={form.admissionNumber}
                onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
                placeholder="e.g. ADM-2026-001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Photo URL</label>
              <input
                type="url"
                value={form.photo}
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Enrolled Subject / Stream</label>
              <select
                value={form.subject || (Array.isArray(form.subjects) ? form.subjects[0] : '') || 'Mathematics Advanced'}
                onChange={(e) => setForm({ ...form, subject: e.target.value, subjects: [e.target.value] })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold"
              >
                {SUBJECTS.filter((sub) => sub !== 'All').map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Batch</label>
              <select
                value={form.batch || '2024-2026'}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold"
              >
                {BATCHES.filter((b) => b !== 'All').map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Preferred Location *</label>
              <select
                value={form.branch || 'Bagru'}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold bg-white"
              >
                <option value="Bagru">Bagru (Main Location)</option>
                <option value="Daroh">Daroh (Child Location)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Class</label>
              <select
                value={form.className || '10th'}
                onChange={(e) => setForm({ ...form, className: e.target.value, semester: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold"
              >
                {CLASSES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Current Status</label>
              <select
                value={form.status || 'Active'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Alumni">Alumni</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                placeholder="10-digit number"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Parent Phone *</label>
              <input
                type="text"
                required
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                placeholder="10-digit parent number"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                placeholder="student@domain.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Attendance %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.attendancePercentage !== undefined ? form.attendancePercentage : 90}
                onChange={(e) => setForm({ ...form, attendancePercentage: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Monthly Tuition Fee (₹)</label>
              <input
                type="number"
                value={form.monthlyFee}
                onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Father's Name</label>
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Residential Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Student Record"
        message={`Are you sure you want to permanently remove ${deleteTarget?.fullName} (${deleteTarget?.rollNumber}) from the student directory?`}
      />

      {/* Credential Requests Modal */}
      <Modal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        title="Student Credential Requests"
      >
        <div className="space-y-4">
          {credentialRequests.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">
              No credential requests found.
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {credentialRequests.map((req) => (
                <div
                  key={req._id || req.id}
                  className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-secondary">{req.studentName}</h4>
                      <p className="text-[11px] text-on-surface-variant font-mono">
                        Roll: {req.rollNumber} | Request: {req.requestType || 'Reset Password'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="flex gap-2 pt-2 justify-end">
                      <button
                        onClick={() => handleProcessRequest(req._id || req.id, 'Reject')}
                        className="px-3 py-1 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleProcessRequest(req._id || req.id, 'Approve')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 shadow-sm"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
