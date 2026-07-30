import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { feeService, studentService, getFeeStatusInfo, getStoredPayments, getStoredStudents } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function FeeManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState(() => {
    try {
      return getStoredPayments() || [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (searchParams.get('action') === 'record') {
      setIsModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);
  const [students, setStudents] = useState(() => {
    try {
      return getStoredStudents() || [];
    } catch (e) {
      return [];
    }
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fee Collection Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [monthYear, setMonthYear] = useState('July 2026');
  const [submitting, setSubmitting] = useState(false);

  // Edit Fee Modal State
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [editingFeeStudent, setEditingFeeStudent] = useState(null);
  const [newMonthlyFee, setNewMonthlyFee] = useState('');
  const [monthlyDueDay, setMonthlyDueDay] = useState(5);
  const [savingFee, setSavingFee] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchFeeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeeData = async () => {
    setLoading(true);
    try {
      const payRes = await feeService.getFeePayments();
      if (payRes && payRes.payments) {
        setPayments(payRes.payments);
      }

      const statsRes = await feeService.getStats();
      if (statsRes && statsRes.stats) {
        setStats(statsRes.stats);
      }

      const stRes = await studentService.getStudents({ limit: 100 });
      if (stRes && stRes.students) {
        setStudents(stRes.students);
        if (stRes.students.length > 0) {
          setSelectedStudentId(stRes.students[0]._id);
          setAmountPaid(stRes.students[0].monthlyFee || 2500);
        }
      }
    } catch (err) {
      addToast('Error loading fee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feeService.recordPayment({
        studentId: selectedStudentId,
        amountPaid: Number(amountPaid),
        paymentMode,
        monthYear,
      });

      addToast('Fee payment recorded successfully!', 'success');
      setIsModalOpen(false);
      fetchFeeData();
    } catch (err) {
      addToast(err.message || 'Error recording fee payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditFeeModal = (student) => {
    setEditingFeeStudent(student);
    setNewMonthlyFee(student.monthlyFee !== undefined ? student.monthlyFee : 2500);
    setMonthlyDueDay(student.monthlyDueDay || student.feeDueDate || 5);
    setIsEditFeeModalOpen(true);
  };

  const handleSaveFee = async (e) => {
    e.preventDefault();
    if (!editingFeeStudent) return;
    if (!monthlyDueDay || monthlyDueDay < 1 || monthlyDueDay > 31) {
      addToast('Please select a valid Monthly Fee Due Day (1–31)!', 'warning');
      return;
    }
    setSavingFee(true);
    try {
      await studentService.updateStudent(editingFeeStudent._id || editingFeeStudent.id, {
        monthlyFee: Number(newMonthlyFee),
        monthlyDueDay: Number(monthlyDueDay),
        feeDueDate: Number(monthlyDueDay),
      });

      addToast(`Updated fee structure for ${editingFeeStudent.fullName}`, 'success');
      setIsEditFeeModalOpen(false);
      fetchFeeData();
    } catch (err) {
      addToast(err.message || 'Error updating fee structure', 'error');
    } finally {
      setSavingFee(false);
    }
  };

  const totalCollected = stats?.totalFeesCollected || payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Fee Collection &amp; Structure Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Track tuition fee collections, customize monthly student fee amounts, and print receipts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          Record Fee Payment
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Total Revenue Collected
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
            ₹{totalCollected.toLocaleString()}
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Verified UPI &amp; Cash Collections</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Total Receipts Issued
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
            {payments.length} Receipts
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">Active ledger records</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Active Student Roster
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
            {students.length} Students
          </h3>
          <p className="text-[10px] text-secondary font-semibold mt-1">Enrolled student fee profiles</p>
        </div>
      </div>

      {/* Student Fee Structure Directory */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/15 flex items-center justify-between">
          <div>
            <h3 className="font-headings font-bold text-base text-secondary">
              Student Monthly Fee Structure
            </h3>
            <p className="text-xs text-on-surface-variant">
              Manage custom monthly tuition fees for enrolled students.
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">No students registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3 px-4 whitespace-nowrap">Roll No.</th>
                  <th className="py-3 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Class</th>
                  <th className="py-3 px-4 whitespace-nowrap">Monthly Fee</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {students.map((s) => {
                  return (
                    <tr key={s._id || s.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">{s.rollNumber}</td>
                      <td className="py-3 px-4 font-bold text-on-surface whitespace-nowrap">{s.fullName}</td>
                      <td className="py-3 px-4 font-semibold text-secondary whitespace-nowrap">Class {s.className}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-800 whitespace-nowrap">
                        ₹{(s.monthlyFee || 2500).toLocaleString()}/month
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditFeeModal(s)}
                          className="inline-flex items-center gap-1 bg-surface-container hover:bg-surface-container-high text-secondary px-3 py-1.5 rounded-full font-headings font-bold text-xs transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          Edit Fee
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

      {/* Fee Payments Transactions Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="font-headings font-bold text-base text-secondary">
            Recent Fee Transactions &amp; Receipts Ledger
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse">Loading fee ledger...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No fee transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4">Receipt No.</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Month/Year</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      {p.studentName || p.student?.fullName || 'Rahul Gupta'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-secondary">
                      {p.rollNumber || p.student?.rollNumber || 'SAU-10-001'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface-variant">
                      {p.monthYear}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{(p.amountPaid || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container font-bold text-[11px]">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => window.print()}
                        className="text-secondary font-headings font-bold text-xs hover:underline"
                      >
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Fee Payment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record New Fee Collection"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-body">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Select Student *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const st = students.find((s) => s._id === e.target.value);
                  if (st) setAmountPaid(st.monthlyFee || 2500);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.rollNumber} - Class {s.className})
                  </option>
                ))}
              </select>
            </div>

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
                onClick={() => setIsModalOpen(false)}
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

      {/* Edit Student Fee Modal */}
      {isEditFeeModalOpen && (
        <Modal
          isOpen={isEditFeeModalOpen}
          open={isEditFeeModalOpen}
          onClose={() => setIsEditFeeModalOpen(false)}
          title={`Edit Fee Structure for ${editingFeeStudent?.fullName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveFee} className="space-y-4 text-xs font-body">
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 space-y-1">
              <p className="font-bold text-secondary text-xs">{editingFeeStudent?.fullName}</p>
              <p className="text-[11px] text-on-surface-variant">
                Roll No: <span className="font-mono font-bold">{editingFeeStudent?.rollNumber}</span> | Class: <span className="font-bold">{editingFeeStudent?.className}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Monthly Fee Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={newMonthlyFee}
                onChange={(e) => setNewMonthlyFee(e.target.value)}
                placeholder="2500"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-emerald-800"
              />
              <span className="text-[10px] text-on-surface-variant">
                Monthly fee amount billed to the student every month.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Monthly Fee Due Day (1–31) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={monthlyDueDay}
                onChange={(e) => setMonthlyDueDay(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-on-surface-variant">
                Day of the month when tuition fee is due (e.g. 5 for 5th of every month).
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setIsEditFeeModalOpen(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFee}
                className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold shadow-premium hover:shadow-glow-primary active:scale-95 transition-all"
              >
                {savingFee ? 'Saving Fee...' : 'Update Student Fee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
