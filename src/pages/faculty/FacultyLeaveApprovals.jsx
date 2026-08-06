import React, { useState, useEffect } from 'react';
import { facultyService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function FacultyLeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await facultyService.getAllFacultyLeaves();
      if (res && res.leaves) {
        setLeaves(res.leaves);
      }
    } catch (err) {
      console.error('Error fetching faculty leaves for HOD approval:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leaveId, status) => {
    try {
      await facultyService.updateFacultyLeaveStatus(leaveId, status, remarks);
      addToast(`Faculty leave request set to "${status}"!`, 'success');
      setSelectedLeave(null);
      setRemarks('');
      fetchLeaves();
    } catch (err) {
      addToast(err.message || 'Failed to update leave status', 'error');
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-headings font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
            👑 Head of Department (HOD) Approval Power
          </span>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">event_available</span>
            Faculty Leave Applications Approval
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Approve or decline leave applications for department teachers and arrange temporary substitute cover.
          </p>
        </div>

        <button onClick={fetchLeaves} className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container">
          Refresh Applications
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs animate-pulse text-on-surface-variant">Loading department leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">No faculty leave requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase text-on-surface-variant bg-surface-container-low">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">HOD Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 font-medium text-secondary">
                {leaves.map((l) => (
                  <tr key={l._id || l.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-bold">{l.facultyName || 'Faculty Member'}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{l.department || 'Science & Math'}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{l.leaveType || 'Casual Leave'}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {l.startDate} to {l.endDate} ({l.numberOfDays || 1} Days)
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-on-surface-variant">{l.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLeave(l)}
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold text-[11px] cursor-pointer shadow-sm"
                      >
                        Review Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full space-y-4 font-body text-xs">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-3">
              <h3 className="font-headings font-extrabold text-lg text-secondary">
                HOD Decision: {selectedLeave.facultyName}
              </h3>
              <button onClick={() => setSelectedLeave(null)} className="text-on-surface-variant hover:text-secondary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/15 space-y-1">
              <p><strong>Department:</strong> {selectedLeave.department}</p>
              <p><strong>Leave Dates:</strong> {selectedLeave.startDate} to {selectedLeave.endDate}</p>
              <p><strong>Reason:</strong> "{selectedLeave.reason}"</p>
            </div>

            <div>
              <label className="font-headings font-bold text-xs text-secondary block mb-1">
                HOD Remarks / Cover Allocation Notes
              </label>
              <textarea
                rows={3}
                placeholder="Enter approval remarks or details of substitute teacher cover..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus(selectedLeave._id || selectedLeave.id, 'Rejected')}
                className="px-4 py-2 rounded-full bg-rose-100 text-rose-900 font-headings font-bold text-xs hover:bg-rose-200"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedLeave._id || selectedLeave.id, 'Approved')}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white font-headings font-bold text-xs hover:bg-emerald-700 shadow-md"
              >
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
