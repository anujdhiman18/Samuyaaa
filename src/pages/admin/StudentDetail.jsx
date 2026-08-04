import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentService, feeService, attendanceService, marksService, getFeeDueDateStatus } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import FeeToggleSwitch from '../../components/admin/FeeToggleSwitch';

const SUBJECTS = [
  'Mathematics Advanced',
  'Physics IIT-JEE Prep',
  'Organic & Physical Chemistry',
  'Biology NEET Prep',
  'Computer Science',
  'Integrated Science',
  'English Literature',
  'Accountancy & Business',
];
const BATCHES = ['2023-2025', '2024-2026', '2025-2026', 'Batch A', 'Batch B'];
const CLASSES = ['9th', '10th', '11th (+1)', '12th (+2)'];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ presentDays: 0, absentDays: 0, attendancePercentage: 100 });
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Attendance Modal State
  const [attModalOpen, setAttModalOpen] = useState(false);
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState('Present');
  const [attSubject, setAttSubject] = useState('Mathematics');
  const [attRemarks, setAttRemarks] = useState('');
  const [savingAtt, setSavingAtt] = useState(false);

  // Collect Fees Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [monthYear, setMonthYear] = useState('August 2026');
  const [submittingFee, setSubmittingFee] = useState(false);

  // Send Notification Modal State
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyChannel, setNotifyChannel] = useState('WhatsApp');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendingNotify, setSendingNotify] = useState(false);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [studentMarks, setStudentMarks] = useState([]);
  
  const addToast = useToast()?.addToast || (() => {});

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const studentRes = await studentService.getStudentById(id);
      if (studentRes && studentRes.student) {
        const s = studentRes.student;
        setStudent(s);

        // Fetch marks entered by Faculty
        try {
          const marksRes = await marksService.getStudentMarks(id);
          if (marksRes && marksRes.marks) {
            setStudentMarks(marksRes.marks);
          }
        } catch (mErr) {}
        setAmountPaid(s.monthlyFee || 2500);
        setEditForm({
          fullName: s.fullName || '',
          admissionNumber: s.admissionNumber || `ADM-2025-${String(s._id || s.id).slice(-3)}`,
          rollNumber: s.rollNumber || '',
          subjects: s.subjects || [],
          batch: s.batch || '2024-2026',
          branch: s.branch || 'Bagru',
          className: s.className || '10th',
          photo: s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          phone: s.phone || '',
          parentPhone: s.parentPhone || '',
          email: s.email || '',
          monthlyFee: s.monthlyFee !== undefined ? s.monthlyFee : 2500,
          attendancePercentage: s.attendancePercentage !== undefined ? s.attendancePercentage : 90,
          status: s.status || 'Active',
          fatherName: s.fatherName || '',
          motherName: s.motherName || '',
          address: s.address || '',
        });
      } else {
        setStudent(null);
      }

      const paymentsRes = await feeService.getFeePayments({ studentId: id });
      if (paymentsRes && paymentsRes.payments) {
        setPayments(paymentsRes.payments);
      }

      const attRes = await attendanceService.getStudentAttendance(id);
      if (attRes && attRes.attendance) {
        setAttendanceList(attRes.attendance);
        if (attRes.stats) setAttendanceStats(attRes.stats);
      }
    } catch (err) {
      addToast('Error loading student profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!student) return;
    setEditForm({
      fullName: student.fullName || '',
      admissionNumber: student.admissionNumber || `ADM-2025-${String(student._id || student.id).slice(-3)}`,
      rollNumber: student.rollNumber || '',
      subjects: student.subjects || [],
      batch: student.batch || '2024-2026',
      branch: student.branch || 'Bagru',
      className: student.className || '10th',
      photo: student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      email: student.email || '',
      monthlyFee: student.monthlyFee !== undefined ? student.monthlyFee : 2500,
      attendancePercentage: student.attendancePercentage !== undefined ? student.attendancePercentage : 90,
      status: student.status || 'Active',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      address: student.address || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await studentService.updateStudent(id, editForm);
      addToast('Student profile updated successfully!', 'success');
      setEditModalOpen(false);
      fetchStudentData();
    } catch (err) {
      addToast(err.message || 'Failed to update student profile', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!student) return;
    const nextStatus = student.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await studentService.updateStudent(id, { ...student, status: nextStatus });
      setStudent({ ...student, status: nextStatus });
      addToast(`Student status changed to ${nextStatus}`, nextStatus === 'Suspended' ? 'warning' : 'success');
    } catch (err) {
      addToast('Error toggling student suspension status', 'error');
    }
  };

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      await studentService.deleteStudent(id);
      addToast(`Student ${student?.fullName || ''} deleted successfully`, 'success');
      setDeleteModalOpen(false);
      navigate('/admin/students');
    } catch (err) {
      addToast(err.message || 'Failed to delete student', 'error');
      setDeleting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmittingFee(true);
    try {
      const res = await feeService.recordPayment({
        studentId: id,
        amountPaid: Number(amountPaid),
        paymentMode,
        monthYear,
      });

      addToast('Fee payment recorded & receipt generated!', 'success');
      setPayModalOpen(false);
      fetchStudentData();
      if (res && res.payment) {
        setSelectedReceipt(res.payment);
      }
    } catch (err) {
      addToast(err.message || 'Error recording fee payment', 'error');
    } finally {
      setSubmittingFee(false);
    }
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    setSendingNotify(true);
    setTimeout(() => {
      setSendingNotify(false);
      setNotifyModalOpen(false);
      setNotifyMessage('');
      addToast(`${notifyChannel} notification sent successfully to ${student?.fullName}!`, 'success');
    }, 600);
  };

  const handlePrintProfile = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">🟢 Active</span>;
      case 'Inactive':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gray-100 text-gray-800 border border-gray-300 shadow-sm">⚪ Inactive</span>;
      case 'Alumni':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-300 shadow-sm">🎓 Alumni</span>;
      case 'Suspended':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm">🔴 Suspended</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">Active</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
        Loading student profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-outline-variant/15 shadow-premium max-w-md mx-auto my-12">
        <span className="material-symbols-outlined text-[48px] text-rose-500 mb-2">
          person_off
        </span>
        <h3 className="font-headings font-bold text-lg text-secondary">Student Not Found</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          This student record has been removed or does not exist.
        </p>
        <Link to="/admin/students" className="mt-4 inline-block px-5 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-colors">
          Back to Students Page
        </Link>
      </div>
    );
  }

  const isPaid = Boolean(student.feesPaid || student.paidTillMonth === 'July 2026');
  const admissionNo = student.admissionNumber || `ADM-2025-${String(student._id || student.id).slice(-3)}`;
  const displaySubjects = Array.isArray(student.subjects) && student.subjects.length > 0
    ? student.subjects.join(', ')
    : (student.subject || student.course || 'Mathematics Advanced');

  return (
    <div className="space-y-6 font-body">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-4 md:p-5 rounded-2xl shadow-lg border border-outline-variant/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all">
        {/* Left: Student Avatar & Info */}
        <div className="flex items-center gap-4">
          <img
            src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={student.fullName}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-md bg-surface-container"
            onError={(e) => {
              e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.fullName);
            }}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headings font-extrabold text-xl md:text-2xl text-secondary">
                {student.fullName}
              </h1>
              {getStatusBadge(student.status || 'Active')}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
              <span className="font-mono font-bold text-primary">Adm No: {admissionNo}</span>
              <span>&bull;</span>
              <span>Roll: <strong className="text-secondary">{student.rollNumber}</strong></span>
              <span>&bull;</span>
              <span>Class: <strong className="text-secondary">Class {student.className || '10th'}</strong></span>
              <span>&bull;</span>
              <span>Batch: <strong className="text-secondary">{student.batch || '2024-2026'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Edit Student */}
          <button
            onClick={handleOpenEditModal}
            className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-secondary text-xs font-headings font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Student
          </button>

          {/* Collect Fees */}
          <button
            onClick={() => setPayModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headings font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Collect Fees
          </button>

          {/* Print Profile */}
          <button
            onClick={handlePrintProfile}
            className="px-3.5 py-2 rounded-xl bg-white border border-outline-variant/30 hover:bg-surface-container text-secondary text-xs font-headings font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Profile
          </button>

          {/* Send Notification */}
          <button
            onClick={() => setNotifyModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-headings font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Send Notification
          </button>

          {/* Suspend Student */}
          <button
            onClick={handleToggleSuspend}
            className={`px-3.5 py-2 rounded-xl text-xs font-headings font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
              student.status === 'Suspended'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {student.status === 'Suspended' ? 'block' : 'warning'}
            </span>
            {student.status === 'Suspended' ? 'Un-suspend' : 'Suspend Student'}
          </button>

          {/* Delete Student */}
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-headings font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete
          </button>
        </div>
      </div>

      {/* Profile Overview Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal & Academic Details */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-6">
          <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2 border-b border-outline-variant/15 pb-3">
            <span className="material-symbols-outlined text-primary">person</span>
            Student Academic & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-on-surface-variant text-[11px] block">Full Name</span>
              <span className="font-bold text-secondary text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Admission Number</span>
              <span className="font-mono font-bold text-primary">{admissionNo}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Roll Number</span>
              <span className="font-mono font-bold text-secondary">{student.rollNumber}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Subject(s)</span>
              <span className="font-bold text-secondary">{displaySubjects}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Batch Allocation</span>
              <span className="font-bold text-secondary">{student.batch || '2024-2026'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Location</span>
              <span className="font-extrabold text-primary">🏢 {student.branch || 'Bagru'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Class</span>
              <span className="font-bold text-secondary">Class {student.className || '10th'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Student Phone</span>
              <span className="font-mono text-secondary">{student.phone}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Parent Phone</span>
              <span className="font-mono text-secondary">{student.parentPhone}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Email Address</span>
              <span className="font-mono text-secondary">{student.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Date of Admission</span>
              <span className="text-secondary">{new Date(student.dateOfAdmission || Date.now()).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Father's Name</span>
              <span className="text-secondary">{student.fatherName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant text-[11px] block">Mother's Name</span>
              <span className="text-secondary">{student.motherName || 'N/A'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/15">
            <span className="text-on-surface-variant text-[11px] block mb-1">Residential Address</span>
            <p className="text-xs text-secondary bg-surface-container-low p-3 rounded-xl border border-outline-variant/15">
              {student.address || 'Address details not provided.'}
            </p>
          </div>
        </div>

        {/* Quick Summary Sidebar Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2 border-b border-outline-variant/15 pb-3">
              <span className="material-symbols-outlined text-primary">equalizer</span>
              Academic Performance & Fee Status
            </h3>

            {/* Attendance percentage display */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant">Attendance Percentage</span>
                <span className="font-headings font-extrabold text-lg text-primary">
                  {student.attendancePercentage !== undefined ? student.attendancePercentage : 90}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(student.attendancePercentage || 90, 100)}%` }}
                />
              </div>
            </div>

            {/* Fee summary display */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant">Monthly Fee</span>
                <span className="font-extrabold text-secondary">₹{student.monthlyFee || 2500}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant">Fee Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isPaid ? '🟢 Fees Paid' : '🔴 Payment Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Payment History Ledger */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
          <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Fee Payment Receipts Ledger
          </h3>
          <button
            onClick={() => setPayModalOpen(true)}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            + Record Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">
            No fee payment receipts recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[10px]">
                  <th className="py-3 px-4">Receipt No.</th>
                  <th className="py-3 px-4">Month/Year</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {payments.map((p) => (
                  <tr key={p._id || p.id} className="hover:bg-surface-container-lowest">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{p.receiptNumber}</td>
                    <td className="py-3 px-4 font-bold text-secondary">{p.monthYear}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700">₹{p.amountPaid}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{p.paymentMode}</td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary font-bold text-[11px]"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Faculty Internal Marks & Gradebook Card */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
          <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Faculty Published Marks & Gradebook
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">
            Synced from Faculty Panel
          </span>
        </div>

        {studentMarks.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">
            No published examination marks or internal assessment records found yet for this student.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[10px]">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assessment / Exam</th>
                  <th className="py-3 px-4 text-center">Theory</th>
                  <th className="py-3 px-4 text-center">Practical</th>
                  <th className="py-3 px-4 text-center">Assignment</th>
                  <th className="py-3 px-4 text-center">Total Marks</th>
                  <th className="py-3 px-4 text-right">Published By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {studentMarks.map((m) => (
                  <tr key={m._id || m.id} className="hover:bg-surface-container-lowest">
                    <td className="py-3 px-4 font-bold text-secondary">{m.subject}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{m.examType || m.title || 'Internal Test'}</td>
                    <td className="py-3 px-4 text-center font-mono">{m.theoryMarks ?? '-'}</td>
                    <td className="py-3 px-4 text-center font-mono">{m.practicalMarks ?? '-'}</td>
                    <td className="py-3 px-4 text-center font-mono">{m.assignmentMarks ?? '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                        {m.marksObtained} / {m.totalMarks || 100} ({m.percentage || 0}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-on-surface-variant">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                        {m.publishedBy || 'Faculty'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Admission Number</label>
              <input
                type="text"
                value={editForm.admissionNumber}
                onChange={(e) => setEditForm({ ...editForm, admissionNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Roll Number</label>
              <input
                type="text"
                required
                value={editForm.rollNumber}
                onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono font-bold focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Photo URL</label>
              <input
                type="url"
                value={editForm.photo}
                onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Enrolled Subject / Stream</label>
              <select
                value={editForm.subject || (Array.isArray(editForm.subjects) ? editForm.subjects[0] : '') || 'Mathematics Advanced'}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value, subjects: [e.target.value] })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                {SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Batch</label>
              <select
                value={editForm.batch || '2024-2026'}
                onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                {BATCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Preferred Location *</label>
              <select
                value={editForm.branch || 'Bagru'}
                onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none bg-white"
              >
                <option value="Bagru">Bagru (Main Location)</option>
                <option value="Daroh">Daroh (Child Location)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Class</label>
              <select
                value={editForm.className || '10th'}
                onChange={(e) => setEditForm({ ...editForm, className: e.target.value, semester: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Alumni">Alumni</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Student Phone</label>
              <input
                type="text"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Parent Phone</label>
              <input
                type="text"
                required
                value={editForm.parentPhone}
                onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Collect Fees Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Collect Fee Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 font-body">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Student</label>
            <input
              type="text"
              disabled
              value={`${student.fullName} (${admissionNo})`}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container text-xs font-bold text-secondary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Amount Paid (₹)</label>
            <input
              type="number"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-extrabold focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Credit / Debit Card</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Month & Year</label>
            <input
              type="text"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary"
              placeholder="e.g. August 2026"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingFee}
              className="bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-emerald-700 disabled:opacity-50"
            >
              {submittingFee ? 'Processing...' : 'Collect & Generate Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Send Notification Modal */}
      <Modal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="Send Notification to Student"
      >
        <form onSubmit={handleSendNotification} className="space-y-4 font-body">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Recipient</label>
            <input
              type="text"
              disabled
              value={`${student.fullName} (${student.phone})`}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container text-xs font-bold text-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Dispatch Channel</label>
            <select
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
            >
              <option value="WhatsApp">WhatsApp Message</option>
              <option value="SMS">SMS Text Message</option>
              <option value="In-App">Portal In-App Notification</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Notification Message</label>
            <textarea
              rows={4}
              required
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder={`Dear ${student.fullName}, ...`}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setNotifyModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingNotify}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {sendingNotify ? 'Dispatching...' : 'Dispatch Message'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteStudent}
        loading={deleting}
        title="Delete Student Profile"
        message={`Are you sure you want to permanently delete ${student.fullName} (${admissionNo})? This action cannot be undone.`}
      />

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Official Fee Payment Receipt"
        >
          <div className="space-y-4 p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-lowest">
            <div className="text-center border-b border-outline-variant/15 pb-3">
              <h3 className="font-headings font-extrabold text-lg text-secondary">Saumyaa Educational Institute</h3>
              <p className="text-[11px] text-on-surface-variant">Fee Receipt &bull; {selectedReceipt.receiptNumber}</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Student:</span>
                <span className="font-bold text-secondary">{selectedReceipt.studentName || student.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Admission No:</span>
                <span className="font-mono font-bold text-primary">{admissionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Month/Year:</span>
                <span className="font-bold text-secondary">{selectedReceipt.monthYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Amount Paid:</span>
                <span className="font-extrabold text-emerald-700">₹{selectedReceipt.amountPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Payment Mode:</span>
                <span className="font-bold text-secondary">{selectedReceipt.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Date:</span>
                <span className="text-secondary">{new Date(selectedReceipt.paymentDate).toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-outline-variant/15 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow-sm"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
