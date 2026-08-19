import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import { CLASS_CATEGORIES, formatClassLabel } from '../../config/classConfig';

export default function StudentLeaveManagement() {
  const [studentLeaves, setStudentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All');
  const [leaveClassFilter, setLeaveClassFilter] = useState('All');
  const [leaveBranchFilter, setLeaveBranchFilter] = useState('All');

  // Review Modal State
  const [selectedLeaveApp, setSelectedLeaveApp] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [updatingLeave, setUpdatingLeave] = useState(false);

  const { addToast } = useToast();

  const fetchStudentLeaves = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await studentService.getAllStudentLeaves();
      if (res && res.leaves && Array.isArray(res.leaves)) {
        setStudentLeaves(res.leaves);
      } else {
        setStudentLeaves([]);
      }
    } catch (err) {
      console.warn('Error fetching student leaves:', err);
      setStudentLeaves([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentLeaves(true);
    const interval = setInterval(() => {
      fetchStudentLeaves(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateLeaveStatus = async (status) => {
    if (!selectedLeaveApp) return;
    const targetId = selectedLeaveApp._id || selectedLeaveApp.id;
    if (!targetId) return;

    setUpdatingLeave(true);
    try {
      const res = await studentService.updateStudentLeaveStatus(
        targetId,
        status,
        adminRemarks
      );
      if (res && res.success) {
        if (typeof addToast === 'function') {
          addToast(`Student leave application ${status} successfully!`, 'success');
        }
        setSelectedLeaveApp(null);
        setAdminRemarks('');
        fetchStudentLeaves(false);
      }
    } catch (err) {
      console.error('Error updating student leave status:', err);
      if (typeof addToast === 'function') {
        addToast('Failed to update leave status', 'error');
      }
    } finally {
      setUpdatingLeave(false);
    }
  };

  const filteredStudentLeaves = useMemo(() => {
    const list = Array.isArray(studentLeaves) ? studentLeaves : [];
    return list.filter((l) => {
      if (!l) return false;
      const searchLower = (leaveSearch || '').toLowerCase();
      const matchSearch =
        !leaveSearch ||
        (l.studentName && String(l.studentName).toLowerCase().includes(searchLower)) ||
        (l.admissionNo && String(l.admissionNo).toLowerCase().includes(searchLower)) ||
        (l.className && String(l.className).toLowerCase().includes(searchLower)) ||
        (l.reason && String(l.reason).toLowerCase().includes(searchLower));

      const matchStatus = leaveStatusFilter === 'All' || l.status === leaveStatusFilter;
      const matchType = leaveTypeFilter === 'All' || l.leaveType === leaveTypeFilter;
      const matchClass = leaveClassFilter === 'All' || l.className === leaveClassFilter;
      const matchBranch = leaveBranchFilter === 'All' || l.branch === leaveBranchFilter;

      return matchSearch && matchStatus && matchType && matchClass && matchBranch;
    });
  }, [studentLeaves, leaveSearch, leaveStatusFilter, leaveTypeFilter, leaveClassFilter, leaveBranchFilter]);

  const pendingCount = (Array.isArray(studentLeaves) ? studentLeaves : []).filter((l) => l && l.status === 'Pending').length;

  return (
    <div className="space-y-6 font-body">
      {/* Header Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 px-2">
        <Link
          to="/admin/students"
          className="px-5 py-3 font-headings font-bold text-xs border-b-2 border-transparent text-on-surface-variant hover:text-secondary transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          Student Directory
        </Link>

        <Link
          to="/admin/student-leaves"
          className="px-5 py-3 font-headings font-bold text-xs border-b-2 border-primary text-primary bg-primary/5 rounded-t-xl transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">event_busy</span>
          Student Leaves ({studentLeaves.length})
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px]">
              {pendingCount} Pending
            </span>
          )}
        </Link>
      </div>

      {/* Header Title Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">event_busy</span>
            Student Leave Applications
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Review, filter, approve, or reject leave applications submitted by students.
          </p>
        </div>
      </div>

      {/* Multi-Filter & Search Toolbar */}
      <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search student name, ID, class, or leave reason..."
              value={leaveSearch}
              onChange={(e) => setLeaveSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs focus:outline-none focus:border-primary font-body"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div>
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Approved">🟢 Approved</option>
                <option value="Rejected">🔴 Rejected</option>
              </select>
            </div>

            {/* Leave Type Filter */}
            <div>
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none cursor-pointer"
              >
                <option value="All">All Leave Types</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal Leave">Personal Leave</option>
                <option value="Family Emergency">Family Emergency</option>
                <option value="Medical">Medical</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={leaveClassFilter}
                onChange={(e) => setLeaveClassFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CLASS_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={leaveBranchFilter}
                onChange={(e) => setLeaveBranchFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary focus:outline-none cursor-pointer"
              >
                <option value="All">All Centers</option>
                <option value="Main Center (Bagru)">Main Center (Bagru)</option>
                <option value="Branch (Daroh)">Branch (Daroh)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Data Card */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading student leave applications...
          </div>
        ) : filteredStudentLeaves.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No student leave applications found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Details</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Class &amp; Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Leave Type</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Duration &amp; Days</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Reason / Statement</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Document</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredStudentLeaves.map((l) => (
                  <tr key={l._id || l.id || Math.random()} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-secondary text-xs">{l.studentName || 'Student Name'}</div>
                      <div className="font-mono text-[11px] text-primary">{l.admissionNo || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-secondary block">{formatClassLabel(l.className)}</span>
                      <span className="text-[11px] font-semibold text-on-surface-variant">🏢 {l.branch || 'Main Center'}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-800 whitespace-nowrap">{l.leaveType || 'Sick Leave'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-on-surface-variant">{l.startDate || ''} to {l.endDate || ''}</div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-extrabold text-[10px]">
                        {l.numberOfDays || 1} Day(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary max-w-xs truncate">{l.reason || 'No reason provided'}</td>
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
                    <td className="py-3 px-4 whitespace-nowrap">
                      {l.status === 'Approved' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 Approved</span>
                      )}
                      {l.status === 'Pending' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🟡 Pending</span>
                      )}
                      {l.status === 'Rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">🔴 Rejected</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedLeaveApp(l);
                          setAdminRemarks(l.adminRemarks || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary text-[#ffffff] font-bold text-xs shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                      >
                        Review &amp; Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Leave Review Modal */}
      <Modal
        isOpen={Boolean(selectedLeaveApp)}
        onClose={() => setSelectedLeaveApp(null)}
        title="Review Student Leave Application"
      >
        {selectedLeaveApp && (
          <div className="space-y-4 font-body text-xs">
            {/* Applicant Meta Card */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low">
              <div>
                <span className="text-[11px] text-on-surface-variant block">Student Name</span>
                <span className="font-bold text-secondary text-sm">{selectedLeaveApp.studentName || 'Student Name'}</span>
                <span className="block font-mono text-[11px] text-primary mt-0.5">{selectedLeaveApp.admissionNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block">Class &amp; Location</span>
                <span className="font-bold text-secondary">{formatClassLabel(selectedLeaveApp.className)}</span>
                <span className="block text-[11px] font-semibold text-secondary">🏢 {selectedLeaveApp.branch || 'Main Center'}</span>
              </div>
            </div>

            {/* Leave Details */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-outline-variant/15 bg-white">
              <div>
                <span className="text-[11px] text-on-surface-variant block">Leave Type</span>
                <span className="font-extrabold text-purple-800">{selectedLeaveApp.leaveType || 'Sick Leave'}</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block">Duration</span>
                <span className="font-mono font-bold text-secondary">{selectedLeaveApp.startDate || ''} to {selectedLeaveApp.endDate || ''}</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block">Total Days</span>
                <span className="font-extrabold text-primary">{selectedLeaveApp.numberOfDays || 1} Day(s)</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <span className="text-[11px] font-bold text-secondary block mb-1">Reason for Leave</span>
              <p className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-secondary leading-relaxed">
                {selectedLeaveApp.reason || 'No reason provided'}
              </p>
            </div>

            {/* Supporting Document */}
            {selectedLeaveApp.supportingDocument && (
              <div>
                <span className="text-[11px] font-bold text-secondary block mb-1">Medical / Supporting Document</span>
                <a
                  href={selectedLeaveApp.supportingDocument}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-bold flex items-center justify-between hover:underline"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">file_present</span>
                    View Medical Certificate / Supporting Document
                  </span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              </div>
            )}

            {/* Admin Remarks Input */}
            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1">
                Admin Remarks / Response (Visible to Student)
              </label>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter remarks for the student (e.g. Approved by Class Teacher. Please complete missed assignments)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-body"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-outline-variant/15 flex justify-end gap-3">
              <button
                type="button"
                disabled={updatingLeave}
                onClick={() => handleUpdateLeaveStatus('Rejected')}
                className="px-5 py-2.5 rounded-full border border-rose-300 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {updatingLeave ? 'Processing...' : 'Reject Application'}
              </button>
              <button
                type="button"
                disabled={updatingLeave}
                onClick={() => handleUpdateLeaveStatus('Approved')}
                className="px-6 py-2.5 rounded-full bg-emerald-600 text-[#ffffff] font-bold text-xs hover:bg-emerald-700 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {updatingLeave ? 'Processing...' : 'Approve Leave'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
