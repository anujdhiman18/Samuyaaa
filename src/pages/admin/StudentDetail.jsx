import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentService, feeService, getFeeDueDateStatus } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import FeeToggleSwitch from '../../components/admin/FeeToggleSwitch';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Fee Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [monthYear, setMonthYear] = useState('July 2026');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Delete Confirm Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const studentRes = await studentService.getStudentById(id);
      if (studentRes && studentRes.student) {
        setStudent(studentRes.student);
        setAmountPaid(studentRes.student.monthlyFee || 2500);
      } else {
        setStudent(null);
      }

      const paymentsRes = await feeService.getFeePayments({ studentId: id });
      if (paymentsRes && paymentsRes.payments) {
        setPayments(paymentsRes.payments);
      }
    } catch (err) {
      addToast('Error loading student profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeeStatus = async (newStatus) => {
    try {
      await studentService.toggleFeeStatus(id, newStatus);
      setStudent((prev) =>
        prev
          ? {
              ...prev,
              feesPaid: newStatus,
              paymentDate: newStatus ? new Date().toISOString() : null,
              paidTillMonth: newStatus ? 'July 2026' : '',
            }
          : null
      );
      fetchStudentData();
      addToast(`Student fee status updated to ${newStatus ? 'PAID' : 'UNPAID'}`, newStatus ? 'success' : 'info');
    } catch (err) {
      addToast(err.message || 'Error updating fee status', 'error');
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
    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs animate-pulse">
        Loading student academic profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-outline-variant/15 shadow-premium max-w-md mx-auto my-12">
        <span className="material-symbols-outlined text-[48px] text-rose-500 mb-2">
          person_off
        </span>
        <h3 className="font-headings font-bold text-lg text-secondary">Student Not Found or Deleted</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          This student record has been removed or does not exist.
        </p>
        <Link to="/admin/students" className="mt-4 inline-block px-5 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-colors">
          Back to Student Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
              {student.fullName}
            </h1>
            <span className="px-3 py-1 rounded-full bg-surface-container font-mono font-bold text-xs text-secondary">
              {student.rollNumber}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Enrolled in <strong className="text-on-surface">Class {student.className}</strong> &bull; Admission Date: {new Date(student.dateOfAdmission).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPayModalOpen(true)}
            className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Record Fee Payment
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-full border border-outline-variant/30 bg-white text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Card
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2.5 rounded-full border border-rose-200 bg-rose-50 text-xs font-headings font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete Student
          </button>
        </div>
      </div>

      {/* Main Student Card Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={student.fullName}
            className="w-20 h-20 rounded-2xl object-cover border-4 border-secondary shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headings font-bold text-xl text-secondary">{student.fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                {student.status}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Class: <strong>{student.className}</strong> &bull; Roll: <strong className="font-mono">{student.rollNumber}</strong>
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Father: <strong>{student.fatherName}</strong> &bull; Parent Contact: <strong className="text-primary">{student.parentPhone}</strong>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 text-left md:text-right min-w-[260px] flex flex-col justify-between gap-3">
          <div>
            <span className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Monthly Fee Structure
            </span>
            <span className="font-headings font-extrabold text-2xl text-secondary mt-0.5 block">
              ₹{(student.monthlyFee || 2500).toLocaleString()} / month
            </span>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-on-surface-variant">Next Due Date:</span>
              <span className="font-mono font-bold text-secondary">
                {student.nextFeeDueDate
                  ? new Date(student.nextFeeDueDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Not Set'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-on-surface-variant">Computed Status:</span>
              {(() => {
                const isPaid = Boolean(student.feesPaid || student.paidTillMonth === 'July 2026');
                const dueInfo = getFeeDueDateStatus(student.nextFeeDueDate, isPaid);
                return (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${dueInfo.bgClass}`}>
                    {dueInfo.label}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
              Current Month Status:
            </span>
            <FeeToggleSwitch
              checked={Boolean(student.feesPaid || student.paidTillMonth === 'July 2026')}
              onChange={handleToggleFeeStatus}
              paymentDate={student.paymentDate}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Grid: Personal Details & Fee History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Information Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
            <h3 className="font-headings font-bold text-base text-secondary mb-4">
              Personal &amp; Contact Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Mother's Name
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{student.motherName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Student Mobile Number
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{student.phone}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Parent Emergency Contact
                </span>
                <span className="font-bold text-primary mt-0.5 block">{student.parentPhone}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Email Address
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{student.email || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Residential Address
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{student.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fee Payments History */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headings font-bold text-base text-secondary">
                Fee Collection History
              </h3>
              <button
                onClick={() => setPayModalOpen(true)}
                className="text-xs font-headings font-bold text-primary hover:underline"
              >
                + Record Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-6">
                No fee payment receipts recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-primary block">
                        {payment.receiptNumber}
                      </span>
                      <h4 className="font-headings font-bold text-sm text-secondary mt-0.5">
                        ₹{payment.amountPaid} &bull; {payment.monthYear}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Paid via {payment.paymentMode} on {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedReceipt(payment)}
                      className="px-3.5 py-1.5 rounded-full bg-secondary text-white font-headings font-bold text-xs hover:bg-on-secondary-fixed-variant transition-colors"
                    >
                      View Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Fee Payment Modal */}
      {payModalOpen && (
        <Modal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          title={`Record Fee Payment for ${student.fullName}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-body">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                For Month &amp; Year *
              </label>
              <input
                type="text"
                required
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                placeholder="July 2026"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash Deposit</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-tactile-btn shadow-premium"
              >
                {submitting ? 'Generating...' : 'Save & Print Receipt'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Official Fee Receipt"
        >
          <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/15 space-y-4 text-xs font-body">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
              <div>
                <h4 className="font-headings font-extrabold text-base text-secondary">
                  SAUMYAA STUDIES
                </h4>
                <p className="text-[10px] text-on-surface-variant">
                  Premium Coaching Institute &bull; Jitender Sharma
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-primary block">{selectedReceipt.receiptNumber}</span>
                <span className="text-[10px] text-on-surface-variant">
                  Date: {new Date(selectedReceipt.paymentDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Student Name
                </span>
                <span className="font-bold text-on-surface">{student.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Roll / Class
                </span>
                <span className="font-bold text-on-surface">
                  {student.rollNumber} &bull; {student.className}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-outline-variant/15 py-3 flex justify-between items-center">
              <span className="font-bold text-secondary">Tuition Fee ({selectedReceipt.monthYear})</span>
              <span className="font-headings font-extrabold text-lg text-emerald-700">
                ₹{selectedReceipt.amountPaid}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-on-surface-variant pt-2">
              <span>Payment Mode: {selectedReceipt.paymentMode}</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                VERIFIED PAID ✓
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-primary text-white font-headings font-bold px-4 py-2 rounded-full text-xs shadow-tactile-btn"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteStudent}
        loading={deleting}
        title={`Delete Student ${student?.fullName}?`}
        message={`Are you sure you want to permanently remove roll number ${student?.rollNumber}? This action cannot be undone.`}
      />
    </div>
  );
}
