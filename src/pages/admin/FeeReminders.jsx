import React, { useState, useEffect, useMemo } from 'react';
import { studentService, getStoredStudents, subscribeFirestoreCollection, reminderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

class FeeRemindersErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fee Reminders Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-12 text-center bg-white rounded-2xl shadow-premium border border-outline-variant/15 font-body">
          <span className="material-symbols-outlined text-[48px] text-amber-500 mb-2">
            notifications_active
          </span>
          <h3 className="font-headings font-bold text-lg text-secondary">
            Fee Reminder System
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">
            Dashboard reloaded cleanly. Click below to refresh system logs.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-primary text-white font-headings font-bold text-xs rounded-full shadow-premium"
          >
            Refresh System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CLASSES = ['All', 'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function normalizeStudent(student) {
  const totalFeeAmount = Number(student.totalFeeAmount || student.monthlyFee || 2500);

  let amountPaid = 0;
  if (student.amountPaid !== undefined && student.amountPaid !== null) {
    amountPaid = Number(student.amountPaid);
  } else if (student.feesPaid || student.paidTillMonth === 'July 2026') {
    amountPaid = totalFeeAmount;
  } else if (student.partiallyPaidAmount) {
    amountPaid = Number(student.partiallyPaidAmount);
  } else {
    amountPaid = 0;
  }

  const dueAmount = Math.max(0, totalFeeAmount - amountPaid);

  let status = 'Unpaid';
  if (dueAmount === 0 || amountPaid >= totalFeeAmount) {
    status = 'Paid';
  } else if (amountPaid > 0 && dueAmount > 0) {
    status = 'Partially Paid';
  } else {
    status = 'Unpaid';
  }

  const dueDate = student.dueDate || student.nextFeeDueDate || '2026-08-05';
  const phone = student.phone || student.parentPhone || '9816012345';

  return {
    ...student,
    id: student._id || student.id,
    fullName: student.fullName || 'Student',
    rollNumber: student.rollNumber || 'SAU-10-000',
    className: student.className || '10th',
    phone,
    totalFeeAmount,
    amountPaid,
    dueAmount,
    dueDate,
    status,
  };
}

function FeeRemindersContent() {
  const [rawStudents, setRawStudents] = useState(() => {
    try {
      return getStoredStudents() || [];
    } catch (e) {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'all', 'unpaid', 'partially_paid', 'paid'
  const [selectedClass, setSelectedClass] = useState('All');
  const [sortBy, setSortBy] = useState('due_desc'); // 'due_desc', 'due_date_asc', 'name_asc'

  // Automated Twilio Sending & Log States
  const [sendingWhatsappId, setSendingWhatsappId] = useState(null);
  const [sendingSmsId, setSendingSmsId] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [reminderLogs, setReminderLogs] = useState(() => reminderService.getLogs());

  // Add / Edit Record Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    className: '10th',
    phone: '',
    totalFeeAmount: 2500,
    amountPaid: 0,
    dueDate: '2026-08-05',
  });
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const handleLogsUpdate = () => {
      setReminderLogs(reminderService.getLogs());
    };
    window.addEventListener('saumyaa_data_updated', handleLogsUpdate);

    const unsubscribe = subscribeFirestoreCollection('students', [], (list) => {
      if (list && list.length > 0) {
        setRawStudents(list);
      }
    });

    fetchStudents();
    return () => {
      unsubscribe();
      window.removeEventListener('saumyaa_data_updated', handleLogsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudents();
      if (res && res.students) {
        setRawStudents(res.students);
      }
    } catch (err) {
      addToast('Error fetching student fee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const normalizedStudents = useMemo(() => {
    return rawStudents.map(normalizeStudent);
  }, [rawStudents]);

  // Helper to format last reminded log timestamp for student row
  const getLastRemindedInfo = (studentId) => {
    const studentLogs = reminderLogs.filter((l) => String(l.studentId) === String(studentId));
    if (!studentLogs || studentLogs.length === 0) return null;
    studentLogs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    const latest = studentLogs[0];
    const dateObj = new Date(latest.sentAt);
    const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `${dateStr}, ${timeStr} (${latest.channel})`;
  };

  // Summary Header Calculations
  const stats = useMemo(() => {
    const totalStudents = normalizedStudents.length;
    const unpaidList = normalizedStudents.filter((s) => s.dueAmount > 0);
    const unpaidCount = unpaidList.length;
    const paidCount = normalizedStudents.filter((s) => s.status === 'Paid').length;
    const partiallyPaidCount = normalizedStudents.filter((s) => s.status === 'Partially Paid').length;
    const totalPendingAmount = normalizedStudents.reduce((sum, s) => sum + s.dueAmount, 0);

    return {
      totalStudents,
      unpaidCount,
      paidCount,
      partiallyPaidCount,
      totalPendingAmount,
    };
  }, [normalizedStudents]);

  // Search, Filter & Sort Logic
  const filteredStudents = useMemo(() => {
    let list = [...normalizedStudents];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }

    // Class filter
    if (selectedClass !== 'All') {
      list = list.filter((s) => s.className === selectedClass);
    }

    // Status filter
    if (statusFilter === 'pending') {
      list = list.filter((s) => s.dueAmount > 0);
    } else if (statusFilter === 'unpaid') {
      list = list.filter((s) => s.status === 'Unpaid');
    } else if (statusFilter === 'partially_paid') {
      list = list.filter((s) => s.status === 'Partially Paid');
    } else if (statusFilter === 'paid') {
      list = list.filter((s) => s.status === 'Paid');
    }

    // Sorting logic
    list.sort((a, b) => {
      if (sortBy === 'due_desc') {
        return b.dueAmount - a.dueAmount;
      }
      if (sortBy === 'due_date_asc') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.fullName.localeCompare(b.fullName);
      }
      return 0;
    });

    return list;
  }, [normalizedStudents, search, selectedClass, statusFilter, sortBy]);

  // 1-Click Automated WhatsApp API Sender
  const handleSendWhatsAppAPI = async (student) => {
    const cleanPhone = String(student.phone).replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      addToast(`❌ Cannot send WhatsApp: Phone number "${student.phone}" for ${student.fullName} must have at least 10 digits!`, 'error');
      return;
    }

    setSendingWhatsappId(student.id);
    try {
      const payload = {
        studentName: student.fullName,
        phone: student.phone,
        dueAmount: student.dueAmount,
        rollNumber: student.rollNumber,
        className: student.className,
      };
      const res = await reminderService.sendWhatsApp(student.id, payload);
      addToast(res.message || `Automated WhatsApp reminder sent to ${student.fullName}!`, 'success');
      setReminderLogs(reminderService.getLogs());
    } catch (err) {
      addToast(`Failed to send WhatsApp to ${student.fullName}: ${err.message}`, 'error');
    } finally {
      setSendingWhatsappId(null);
    }
  };

  // 1-Click Automated SMS API Sender
  const handleSendSMSAPI = async (student) => {
    const cleanPhone = String(student.phone).replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      addToast(`❌ Cannot send SMS: Phone number "${student.phone}" for ${student.fullName} must have at least 10 digits!`, 'error');
      return;
    }

    setSendingSmsId(student.id);
    try {
      const payload = {
        studentName: student.fullName,
        phone: student.phone,
        dueAmount: student.dueAmount,
        rollNumber: student.rollNumber,
        className: student.className,
      };
      const res = await reminderService.sendSMS(student.id, payload);
      addToast(res.message || `Automated SMS reminder sent to ${student.fullName}!`, 'success');
      setReminderLogs(reminderService.getLogs());
    } catch (err) {
      addToast(`Failed to send SMS to ${student.fullName}: ${err.message}`, 'error');
    } finally {
      setSendingSmsId(null);
    }
  };

  // Bulk Remind All Unpaid Students Action with Rate Limiting Delay
  const handleBulkRemindUnpaid = async () => {
    const unpaidList = normalizedStudents.filter((s) => s.dueAmount > 0);
    if (unpaidList.length === 0) {
      addToast('No unpaid students found to send reminders!', 'info');
      return;
    }

    setBulkSending(true);
    setBulkProgress({ current: 0, total: unpaidList.length });
    let successCount = 0;
    let failCount = 0;
    const failures = [];

    for (let i = 0; i < unpaidList.length; i++) {
      const student = unpaidList[i];
      setBulkProgress({ current: i + 1, total: unpaidList.length });

      const cleanPhone = String(student.phone).replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        failCount++;
        failures.push(`${student.fullName} (Invalid Phone)`);
        continue;
      }

      try {
        await reminderService.sendWhatsApp(student.id, {
          studentName: student.fullName,
          phone: student.phone,
          dueAmount: student.dueAmount,
          rollNumber: student.rollNumber,
          className: student.className,
        });
        successCount++;
      } catch (err) {
        failCount++;
        failures.push(`${student.fullName} (${err.message})`);
      }

      // 600ms rate-limiting delay between requests to comply with API rate limits
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setBulkSending(false);
    setReminderLogs(reminderService.getLogs());

    if (failCount === 0) {
      addToast(`🚀 Bulk WhatsApp reminders complete! Sent: ${successCount}, Failed: 0`, 'success', 6000);
    } else {
      addToast(
        `Bulk Reminders Summary — Sent: ${successCount}, Failed: ${failCount} [${failures.join(', ')}]`,
        'warning',
        8000
      );
    }
  };

  // Mark as Paid Instant Action
  const handleMarkAsPaid = async (student) => {
    try {
      const updatedData = {
        totalFeeAmount: student.totalFeeAmount,
        amountPaid: student.totalFeeAmount,
        feesPaid: true,
        paidTillMonth: 'July 2026',
        paymentDate: new Date().toISOString().split('T')[0],
      };
      await studentService.updateStudent(student.id, updatedData);
      addToast(`Marked ${student.fullName} as PAID (₹${student.totalFeeAmount.toLocaleString()})`, 'success');
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      fullName: '',
      rollNumber: '',
      className: '10th',
      phone: '',
      totalFeeAmount: 2500,
      amountPaid: 0,
      dueDate: '2026-08-05',
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      className: student.className,
      phone: student.phone,
      totalFeeAmount: student.totalFeeAmount,
      amountPaid: student.amountPaid,
      dueDate: student.dueDate,
    });
    setEditModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const totalFee = Number(formData.totalFeeAmount);
      const paid = Number(formData.amountPaid);
      const isFull = paid >= totalFee;

      const payload = {
        fullName: formData.fullName,
        rollNumber: formData.rollNumber,
        className: formData.className,
        phone: formData.phone,
        parentPhone: formData.phone,
        totalFeeAmount: totalFee,
        monthlyFee: totalFee,
        amountPaid: paid,
        feesPaid: isFull,
        paidTillMonth: isFull ? 'July 2026' : '',
        dueDate: formData.dueDate,
        nextFeeDueDate: formData.dueDate,
      };

      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, payload);
        addToast(`Updated student fee record for ${formData.fullName}`, 'success');
      } else {
        await studentService.createStudent(payload);
        addToast(`Added new student record for ${formData.fullName}`, 'success');
      }
      setEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error saving student record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      await studentService.deleteStudent(deletingStudent.id);
      addToast(`Deleted record for ${deletingStudent.fullName}`, 'success');
      setDeleteModalOpen(false);
      setDeletingStudent(null);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error deleting student', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
              Automated Fees Reminder Dashboard
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              Twilio Ready
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Dispatch 1-click automated WhatsApp &amp; SMS fee reminders directly from the server.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Bulk Send Button */}
          <button
            onClick={handleBulkRemindUnpaid}
            disabled={bulkSending || stats.unpaidCount === 0}
            className="bg-[#25D366] hover:bg-[#1ebf59] text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all disabled:opacity-50"
          >
            {bulkSending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Sending ({bulkProgress.current}/{bulkProgress.total})...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                Remind All Unpaid ({stats.unpaidCount})
              </>
            )}
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Student Record
          </button>
        </div>
      </div>

      {/* Summary Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total Enrolled Students
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
              {stats.totalStudents}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Active student roster
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-xs font-bold uppercase tracking-wider text-rose-600">
              Total Unpaid / Partial Dues
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-rose-600 mt-2">
              {stats.unpaidCount} <span className="text-xs font-semibold text-on-surface-variant">Students</span>
            </h3>
            <p className="text-[11px] text-rose-700 font-semibold mt-1">
              {stats.partiallyPaidCount} partially paid &bull; {stats.unpaidCount - stats.partiallyPaidCount} unpaid
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-xs font-bold uppercase tracking-wider text-amber-700">
              Total Dues Pending Collection
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-amber-700 mt-2">
              ₹{stats.totalPendingAmount.toLocaleString()}
            </h3>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              Outstanding tuition fee balance
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary font-body"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="pending">⚠️ Pending Dues Only ({stats.unpaidCount})</option>
              <option value="all">All Students ({stats.totalStudents})</option>
              <option value="unpaid">🔴 Unpaid Only ({stats.unpaidCount - stats.partiallyPaidCount})</option>
              <option value="partially_paid">🟡 Partially Paid Only ({stats.partiallyPaidCount})</option>
              <option value="paid">🟢 Paid Only ({stats.paidCount})</option>
            </select>
          </div>

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

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="due_desc">Highest Dues First ⬇</option>
              <option value="due_date_asc">Earliest Due Date 📅</option>
              <option value="name_asc">Student Name A-Z 🔤</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Listing */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse font-body text-on-surface-variant">
            Loading student fee records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
              notifications_off
            </span>
            <p className="font-bold text-secondary text-sm">No Students Found</p>
            <p>No student fee records match your selected search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1020px]">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Class</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Phone</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Total Fee</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Amount Paid</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Due Amount</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Due Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Automated 1-Click Reminders</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
                {filteredStudents.map((student) => {
                  const isPaid = student.status === 'Paid';
                  const isPartial = student.status === 'Partially Paid';
                  const lastRemindedStr = getLastRemindedInfo(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        isPaid
                          ? 'bg-white'
                          : isPartial
                          ? 'bg-amber-50/30'
                          : 'bg-rose-50/20'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-secondary whitespace-nowrap">
                        {student.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-on-surface whitespace-nowrap">
                        <div>
                          <span>{student.fullName}</span>
                          {lastRemindedStr && (
                            <span className="block text-[10px] font-normal text-on-surface-variant/80 mt-0.5">
                              Last reminded: {lastRemindedStr}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-surface-container font-bold text-[11px] whitespace-nowrap">
                          Class {student.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-secondary whitespace-nowrap">
                        {student.phone}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-secondary whitespace-nowrap">
                        ₹{student.totalFeeAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                        ₹{student.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                        <span
                          className={`font-mono text-sm ${
                            student.dueAmount > 0 ? 'text-rose-700 font-extrabold' : 'text-emerald-700'
                          }`}
                        >
                          ₹{student.dueAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface-variant whitespace-nowrap">
                        {student.dueDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 shadow-xs">
                            🟢 Paid
                          </span>
                        )}
                        {isPartial && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1 shadow-xs">
                            🟡 Partially Paid
                          </span>
                        )}
                        {!isPaid && !isPartial && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1 shadow-xs">
                            🔴 Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {student.dueAmount > 0 ? (
                          <div className="inline-flex items-center gap-2">
                            {/* Automated WhatsApp Button (Primary Green Accent) */}
                            <button
                              onClick={() => handleSendWhatsAppAPI(student)}
                              disabled={sendingWhatsappId === student.id || bulkSending}
                              className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebf59] text-white font-headings font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                              title="Send Automated WhatsApp Payment Reminder via Server"
                            >
                              {sendingWhatsappId === student.id ? (
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">chat</span>
                              )}
                              Send WhatsApp
                            </button>

                            {/* Automated SMS Button (Secondary Outline Style) */}
                            <button
                              onClick={() => handleSendSMSAPI(student)}
                              disabled={sendingSmsId === student.id || bulkSending}
                              className="px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-white hover:bg-surface-container text-secondary font-headings font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                              title="Send Automated SMS Payment Reminder via Server"
                            >
                              {sendingSmsId === student.id ? (
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">sms</span>
                              )}
                              Send SMS
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold italic">
                            No Dues Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {student.dueAmount > 0 && (
                          <button
                            onClick={() => handleMarkAsPaid(student)}
                            className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold text-[10px] transition-colors shadow-xs"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                          title="Edit Student Fee Record"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeletingStudent(student);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
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

      {/* Add / Edit Student Record Modal */}
      <Modal
        open={editModalOpen}
        title={editingStudent ? 'Edit Student Fee Record' : 'Add New Student Record'}
        onClose={() => setEditModalOpen(false)}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 font-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rahul Gupta"
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Roll Number / Student ID
              </label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Class / Course *
              </label>
              <select
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary"
              >
                {CLASSES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Registered Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9816012345"
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Total Fee Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.totalFeeAmount}
                onChange={(e) => setFormData({ ...formData, totalFeeAmount: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                max={formData.totalFeeAmount}
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-emerald-700 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Auto-Calculated Status Preview Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between text-xs font-bold">
            <span className="text-on-surface-variant">Computed Status &amp; Due:</span>
            <div className="flex items-center gap-3">
              <span className="text-rose-700 font-mono">
                Due: ₹{Math.max(0, Number(formData.totalFeeAmount) - Number(formData.amountPaid)).toLocaleString()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  Number(formData.amountPaid) >= Number(formData.totalFeeAmount)
                    ? 'bg-emerald-100 text-emerald-800'
                    : Number(formData.amountPaid) > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {Number(formData.amountPaid) >= Number(formData.totalFeeAmount)
                  ? 'Paid'
                  : Number(formData.amountPaid) > 0
                  ? 'Partially Paid'
                  : 'Unpaid'}
              </span>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container shadow-premium transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingStudent ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Student Fee Record"
        message={`Are you sure you want to delete the record for ${deletingStudent?.fullName}? This action cannot be undone.`}
        confirmText="Delete Record"
        confirmVariant="danger"
        loading={deleting}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingStudent(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default function FeeReminders() {
  return (
    <FeeRemindersErrorBoundary>
      <FeeRemindersContent />
    </FeeRemindersErrorBoundary>
  );
}
