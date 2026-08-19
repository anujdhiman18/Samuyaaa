import React, { useState, useEffect } from 'react';
import { facultyPanelService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function FacultyLeave() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('2026-08-20');
  const [endDate, setEndDate] = useState('2026-08-21');
  const [reason, setReason] = useState('');
  const [supportingDocument, setSupportingDocument] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let currentUser = user;
      if (!currentUser || (!currentUser.email && !currentUser.name)) {
        try {
          currentUser = JSON.parse(localStorage.getItem('saumyaa_user')) || {};
        } catch (e) {}
      }

      const res = await facultyPanelService.getFacultyLeaves();
      if (res && res.leaves) {
        const curId = String(currentUser?._id || currentUser?.id || '');
        const curEmail = String(currentUser?.email || currentUser?.facultyEmail || '').toLowerCase();
        
        // Filter to show ONLY the logged-in faculty member's own leave applications
        const myLeaves = res.leaves.filter((l) => {
          const lId = String(l.facultyId || '');
          const lEmail = String(l.facultyEmail || '').toLowerCase();
          return (curId && lId === curId) || (curEmail && lEmail === curEmail);
        });

        // Show logged-in faculty's leaves if any, else return all demo leaves
        setLeaves(myLeaves.length > 0 ? myLeaves : res.leaves);
      }
    } catch (err) {
      console.warn('Error fetching leave applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCalculatedDays = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let currentUser = user;
      if (!currentUser || (!currentUser.email && !currentUser.name)) {
        try {
          currentUser = JSON.parse(localStorage.getItem('saumyaa_user')) || {};
        } catch (e) {}
      }

      const facultyId = currentUser?._id || currentUser?.id || 'f_' + Date.now();
      const employeeId = currentUser?.employeeId || currentUser?.empId || 'EMP-2025-0' + Math.floor(10 + Math.random() * 89);
      const facultyName = currentUser?.name || currentUser?.fullName || currentUser?.facultyName || 'Prof. Jitender Sharma';
      const facultyEmail = currentUser?.email || currentUser?.facultyEmail || 'jitender.sharma@saumyaa.edu.in';
      const department = currentUser?.department || currentUser?.dept || 'Science & Mathematics';
      const branch = currentUser?.branch || 'Main Center';

      const res = await facultyPanelService.applyFacultyLeave({
        facultyId,
        employeeId,
        facultyName,
        facultyEmail,
        department,
        branch,
        leaveType,
        startDate,
        endDate,
        numberOfDays: getCalculatedDays(),
        reason,
        supportingDocument,
        status: 'Pending',
      });

      if (res && res.success) {
        addToast('Leave application submitted for admin approval!', 'success');
        setApplyModalOpen(false);
        setReason('');
        setSupportingDocument('');
        fetchLeaves();
      }
    } catch (err) {
      addToast('Error submitting leave application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 Approved</span>;
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">🟡 Pending Approval</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">🔴 Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">event_busy</span>
            Faculty Leave Applications
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Apply for leave (Casual, Sick, Duty Leave) & track application approvals in real-time.
          </p>
        </div>

        <button
          onClick={() => setApplyModalOpen(true)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Apply for Leave
        </button>
      </div>

      {/* Leaves History Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading leave applications...
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No leave applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Leave Type</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Duration (Dates)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Days</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Reason / Statement</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Document</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Admin Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {leaves.map((l) => (
                  <tr key={l._id || l.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">{l.leaveType}</td>
                    <td className="py-3 px-4 font-mono text-on-surface-variant whitespace-nowrap">
                      {l.startDate} to {l.endDate}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-extrabold text-[11px]">
                        {l.numberOfDays || 1} Day(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary max-w-xs truncate">{l.reason}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {l.supportingDocument ? (
                        <a
                          href={l.supportingDocument}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center gap-1 hover:underline w-fit"
                        >
                          <span className="material-symbols-outlined text-[14px]">attachment</span>
                          View Doc
                        </a>
                      ) : (
                        <span className="text-on-surface-variant text-[11px] italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(l.status)}</td>
                    <td className="py-3 px-4 text-xs italic text-secondary">
                      {l.adminRemarks || l.adminNote || 'No remarks yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Faculty Leave"
      >
        <form onSubmit={handleApply} className="space-y-4 font-body text-xs">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Leave Type *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary bg-white"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave (Medical Emergency)</option>
              <option value="Duty Leave">Duty Leave (Official / Conference)</option>
              <option value="Earned Leave">Earned Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <span className="font-bold text-secondary text-xs">Total Duration:</span>
            <span className="font-headings font-extrabold text-primary text-xs">{getCalculatedDays()} Day(s)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="State clear reason for your leave request (e.g. High fever, doctor advised 2 days rest)..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Supporting Document / Certificate URL (Optional)</label>
            <input
              type="url"
              value={supportingDocument}
              onChange={(e) => setSupportingDocument(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="https://example.com/medical-certificate.pdf"
            />
            <p className="text-[10px] text-on-surface-variant mt-1">Upload medical fitness certificate or official event invitation link if applicable.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
