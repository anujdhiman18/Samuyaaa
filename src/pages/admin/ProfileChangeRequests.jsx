import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { facultyProfileRequestService } from '../../services/api';

export default function ProfileChangeRequests() {
  const { addToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [searchTerm, setSearchTerm] = useState('');

  // Action Modals State
  const [selectedReq, setSelectedReq] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminComments, setAdminComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();

    // Real-time Firestore subscription
    const unsubscribe = facultyProfileRequestService.subscribeRequests((updatedReqs) => {
      if (Array.isArray(updatedReqs)) {
        setRequests(updatedReqs);
        setLoading(false);
      }
    });

    const handleDataUpdate = () => {
      fetchRequests();
    };

    window.addEventListener('saumyaa_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('saumyaa_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await facultyProfileRequestService.getAllRequests('All');
      if (res && res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.warn('Error fetching profile change requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveModal = (req) => {
    setSelectedReq(req);
    setAdminComments('Approved by System Admin');
    setShowApproveModal(true);
  };

  const handleOpenRejectModal = (req) => {
    setSelectedReq(req);
    setAdminComments('');
    setShowRejectModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    try {
      const reqId = selectedReq._id || selectedReq.id;
      const res = await facultyProfileRequestService.approveRequest(reqId, adminComments);
      if (res && res.success) {
        addToast('Profile change request approved! Requested faculty fields updated successfully.', 'success');
        setShowApproveModal(false);
        fetchRequests();
      }
    } catch (err) {
      addToast(err.message || 'Error approving request', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedReq) return;
    if (!adminComments || !adminComments.trim()) {
      addToast('Please enter a rejection reason / comment.', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const reqId = selectedReq._id || selectedReq.id;
      const res = await facultyProfileRequestService.rejectRequest(reqId, adminComments);
      if (res && res.success) {
        addToast('Profile change request rejected.', 'info');
        setShowRejectModal(false);
        fetchRequests();
      }
    } catch (err) {
      addToast(err.message || 'Error rejecting request', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filter requests by active tab & search term
  const filteredRequests = requests.filter((r) => {
    const matchesTab = activeTab === 'All' || String(r.status).toLowerCase() === activeTab.toLowerCase();
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      (r.facultyName && r.facultyName.toLowerCase().includes(term)) ||
      (r.facultyEmail && r.facultyEmail.toLowerCase().includes(term)) ||
      (r.facultyId && String(r.facultyId).toLowerCase().includes(term)) ||
      (r.reason && r.reason.toLowerCase().includes(term));
    return matchesTab && matchesSearch;
  });

  const pendingCount = requests.filter((r) => String(r.status).toLowerCase() === 'pending').length;
  const approvedCount = requests.filter((r) => String(r.status).toLowerCase() === 'approved').length;
  const rejectedCount = requests.filter((r) => String(r.status).toLowerCase() === 'rejected').length;

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">edit_attributes</span>
            Faculty Profile Change Requests
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Review, compare, approve, or reject faculty profile modification requests with 30-day cooldown enforcement.
          </p>
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by faculty name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-outline-variant/30 text-xs font-body focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={fetchRequests}
            title="Refresh Requests"
            className="p-2 rounded-full border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant/15 pb-2">
        {[
          { id: 'Pending', label: 'Pending Requests', count: pendingCount, icon: 'hourglass_top', color: 'amber' },
          { id: 'Approved', label: 'Approved History', count: approvedCount, icon: 'check_circle', color: 'emerald' },
          { id: 'Rejected', label: 'Rejected History', count: rejectedCount, icon: 'cancel', color: 'rose' },
          { id: 'All', label: 'All Requests', count: requests.length, icon: 'list_alt', color: 'blue' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-premium border border-outline-variant/15 text-center text-xs text-on-surface-variant">
          Loading faculty profile change requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-premium border border-outline-variant/15 text-center text-xs text-on-surface-variant italic space-y-2">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block">check_box</span>
          <p className="font-bold text-secondary text-sm">No profile change requests found</p>
          <p className="text-xs">There are no {activeTab !== 'All' ? activeTab.toLowerCase() : ''} requests matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((req) => (
            <div
              key={req._id || req.id}
              className={`bg-white p-6 rounded-2xl shadow-premium border transition-all ${
                req.status === 'Approved'
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : req.status === 'Rejected'
                  ? 'border-rose-200 hover:border-rose-300'
                  : 'border-amber-200/80 hover:border-amber-400'
              }`}
            >
              {/* Card Header: Faculty Info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center font-headings text-base shrink-0 border border-primary/20">
                    {req.facultyName ? req.facultyName.charAt(0) : 'F'}
                  </div>
                  <div>
                    <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
                      {req.facultyName || 'Faculty Member'}
                      <span className="text-[10px] font-mono font-normal text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/30">
                        ID: {String(req.facultyId || req._id || req.id || 'N/A')}
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      {req.facultyEmail || 'No email registered'}
                      <span className="mx-1">&bull;</span>
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Submitted: <strong>{formatDate(req.submittedAt || req.requestDate || req.createdAt)}</strong>
                    </p>
                  </div>
                </div>

                {/* Status Badge & Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1.5 ${
                      req.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : req.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {req.status === 'Approved' ? 'check_circle' : req.status === 'Rejected' ? 'cancel' : 'schedule'}
                    </span>
                    {req.status === 'Approved'
                      ? '🟢 Approved'
                      : req.status === 'Rejected'
                      ? '🔴 Rejected'
                      : '🟡 Pending Approval'}
                  </span>

                  {/* Actions for Pending Requests */}
                  {req.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenApproveModal(req)}
                        className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(req)}
                        className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval / Lock Date Information Banner */}
              {req.status === 'Approved' && (req.approvedAt || req.reviewedDate) && (
                <div className="p-3 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-base">verified</span>
                    <span>
                      Approved Date: <strong>{formatDate(req.approvedAt || req.reviewedDate)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1 rounded-full text-emerald-800 font-bold text-[11px]">
                    <span className="material-symbols-outlined text-xs">lock_clock</span>
                    <span>Next Eligible Date: <strong>{formatDate(req.nextEligibleDate || new Date(new Date(req.approvedAt || req.reviewedDate).getTime() + 30 * 24 * 60 * 60 * 1000))}</strong></span>
                  </div>
                </div>
              )}

              {/* Reason for Profile Change */}
              <div className="py-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">chat</span>
                  Reason for Change:
                </span>
                <p className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-xs text-secondary italic">
                  "{req.reason}"
                </p>
              </div>

              {/* SIDE-BY-SIDE FIELD COMPARISON TABLE (Old Values vs New Values) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">compare_arrows</span>
                  Compare Current Values vs Requested Changes:
                </span>

                <div className="overflow-x-auto rounded-xl border border-outline-variant/15">
                  <table className="w-full text-left text-xs font-body">
                    <thead className="bg-surface-container-low text-secondary font-headings text-[11px] font-bold border-b border-outline-variant/15">
                      <tr>
                        <th className="p-3">Profile Field</th>
                        <th className="p-3">Current Value (Old)</th>
                        <th className="p-3">Requested Value (New)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {req.requestedValues && Object.keys(req.requestedValues).map((key) => {
                        const isPhoto = key === 'photo_url' || key === 'photo' || key === 'avatar';
                        const fieldLabel = isPhoto ? 'Profile Photo' : key.replace(/_/g, ' ');
                        const oldVal = req.currentValues?.[key];
                        const newVal = req.requestedValues[key];

                        return (
                          <tr key={key} className="hover:bg-surface-container-lowest/60">
                            <td className="p-3 font-bold text-secondary capitalize whitespace-nowrap">
                              {fieldLabel}
                            </td>
                            <td className="p-3 text-on-surface-variant bg-rose-50/20 text-[11px]">
                              {isPhoto ? (
                                <div className="flex items-center gap-2">
                                  {oldVal ? (
                                    <img src={oldVal} alt="Old Photo" className="w-8 h-8 rounded-full object-cover border border-outline-variant/30 shrink-0" />
                                  ) : (
                                    <span className="text-on-surface-variant/50">—</span>
                                  )}
                                  <span className="line-through text-on-surface-variant/70 font-mono text-[10px]">Previous</span>
                                </div>
                              ) : (
                                <span className="line-through font-mono break-all">{oldVal || '—'}</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-emerald-800 bg-emerald-50/30 text-[11px]">
                              {isPhoto ? (
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-xs text-emerald-600 shrink-0">arrow_forward</span>
                                  <img src={newVal} alt="New Photo" className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-sm shrink-0" />
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">New Photo</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 font-mono break-all">
                                  <span className="material-symbols-outlined text-xs text-emerald-600 shrink-0">arrow_forward</span>
                                  <span>{newVal}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reviewed Details Footer */}
              {req.status !== 'Pending' && (
                <div className="mt-4 pt-3 border-t border-outline-variant/15 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-on-surface-variant gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-secondary">Reviewed By:</span>
                    <span>{req.reviewedByName || 'System Admin'}</span>
                    <span>&bull;</span>
                    <span>{formatDate(req.reviewedDate || req.approvedAt || req.rejectedAt)}</span>
                  </div>

                  {req.adminComments && (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-secondary">Admin Comment:</span>
                      <span className="italic">"{req.adminComments}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {showApproveModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/15 space-y-4 font-body">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <h3 className="font-headings font-extrabold text-lg text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                Approve Profile Change Request
              </h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to approve profile changes for <strong className="text-secondary">{selectedReq.facultyName}</strong>? This will update only the requested fields in the faculty record.
            </p>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Admin Comment / Approval Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="e.g. Approved profile changes after verification..."
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs text-secondary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/15 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 font-bold text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/15 space-y-4 font-body">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <h3 className="font-headings font-extrabold text-lg text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600">cancel</span>
                Reject Profile Change Request
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Rejecting profile change request for <strong className="text-secondary">{selectedReq.facultyName}</strong>. The faculty profile will remain unchanged.
            </p>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1 flex items-center gap-1">
                Rejection Reason / Admin Comment <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Explain the reason for rejecting this profile change request (e.g. Invalid photo URL format or missing official documentation)..."
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs text-secondary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/15 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 font-bold text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
