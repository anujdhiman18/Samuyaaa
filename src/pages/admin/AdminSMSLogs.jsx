import React, { useState, useEffect } from 'react';
import { smsNotificationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function maskPhoneNumber(phone) {
  if (!phone) return 'N/A';
  const str = String(phone).trim();
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const last4 = digitsOnly.slice(-4);
    const prefix = digitsOnly.length > 10 ? `+${digitsOnly.slice(0, digitsOnly.length - 10)} ` : '+91 ';
    const start2 = digitsOnly.slice(-10, -8);
    return `${prefix}${start2}*** **${last4}`;
  }
  return str;
}

export default function AdminSMSLogs() {
  const { addToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [unmaskedLogIds, setUnmaskedLogIds] = useState(new Set());

  useEffect(() => {
    fetchLogs();
    const handleUpdate = () => fetchLogs(false);
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleUpdate);
  }, [search, typeFilter, statusFilter]);

  const fetchLogs = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await smsNotificationService.getLogs({
        search,
        type: typeFilter,
        status: statusFilter,
        limit: 200,
      });

      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.warn('Error fetching SMS logs:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleRetry = async (logId) => {
    setRetryingId(logId);
    try {
      const res = await smsNotificationService.retryLog(logId);
      if (res && res.success) {
        addToast(res.message || 'SMS retry dispatched successfully!', 'success');
        fetchLogs(false);
      } else {
        addToast(res.message || 'SMS retry failed', 'error');
      }
    } catch (err) {
      addToast('Error performing SMS retry', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const toggleMask = (id) => {
    setUnmaskedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Metrics
  const totalLogs = logs.length;
  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">sms</span>
            SMS Notification History &amp; Logs
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Real-time audit log of automated SMS dispatches for attendance, grades, and student account updates.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(true)}
          className="px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/30 text-secondary hover:bg-surface-container font-headings font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh Logs
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Dispatches</p>
            <h3 className="font-headings font-extrabold text-2xl text-secondary mt-1">{totalLogs}</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Automated SMS notifications</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            📲
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Successfully Sent</p>
            <h3 className="font-headings font-extrabold text-2xl text-emerald-700 mt-1">{sentCount}</h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Verified by SMS gateway</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            ✅
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Failed Dispatches</p>
            <h3 className="font-headings font-extrabold text-2xl text-rose-700 mt-1">{failedCount}</h3>
            <p className="text-[10px] text-rose-700 font-semibold mt-0.5">Requires retry or fix</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            ⚠️
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Pending Delivery</p>
            <h3 className="font-headings font-extrabold text-2xl text-amber-700 mt-1">{pendingCount}</h3>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Queued in dispatch buffer</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            ⏳
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-5 border-b border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Search Student / Phone / Message</label>
            <input
              type="text"
              placeholder="Search by student name, phone, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Notification Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
            >
              <option value="All">All Event Types</option>
              <option value="Attendance">Attendance Marked / Updated</option>
              <option value="GradePublished">Grade Published</option>
              <option value="GradeUpdated">Grade Updated</option>
              <option value="AccountUpdate">Account Info Update</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Delivery Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
            >
              <option value="All">All Delivery Statuses</option>
              <option value="sent">🟢 Sent Successfully</option>
              <option value="failed">🔴 Failed / Undelivered</option>
              <option value="pending">🟡 Pending / Queued</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-xs animate-pulse text-on-surface-variant">
            Loading SMS notification audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">sms_failed</span>
            <p>No SMS notification log records found matching your selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">SMS Content</th>
                  <th className="py-3.5 px-4">Triggered By</th>
                  <th className="py-3.5 px-4">Sent At / Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {logs.map((log) => {
                  const logId = String(log._id || log.id);
                  const isUnmasked = unmaskedLogIds.has(logId);
                  const displayPhone = isUnmasked ? log.phoneNumber : maskPhoneNumber(log.phoneNumber);

                  return (
                    <tr key={logId} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3.5 px-4 font-bold text-secondary">
                        {log.studentName}
                        {log.studentId && (
                          <span className="block text-[10px] font-mono text-on-surface-variant">ID: {log.studentId}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-secondary">
                        <div className="flex items-center gap-1.5">
                          <span>{displayPhone}</span>
                          <button
                            type="button"
                            onClick={() => toggleMask(logId)}
                            title={isUnmasked ? 'Mask Phone' : 'Show Full Phone'}
                            className="text-on-surface-variant hover:text-primary transition-colors text-[14px]"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isUnmasked ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.notificationType === 'Attendance' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[10px]">
                            ● Attendance
                          </span>
                        )}
                        {log.notificationType === 'GradePublished' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                            ● Grade Published
                          </span>
                        )}
                        {log.notificationType === 'GradeUpdated' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                            ● Grade Updated
                          </span>
                        )}
                        {log.notificationType === 'AccountUpdate' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-extrabold text-[10px]">
                            ● Profile Update
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-secondary line-clamp-2 text-[11px] leading-snug">{log.message}</p>
                        {log.errorMessage && (
                          <p className="text-[10px] text-rose-600 font-mono mt-1">Error: {log.errorMessage}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-on-surface-variant">
                        {log.triggeredBy || 'System'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant">
                        {new Date(log.sentAt || log.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        {log.status === 'sent' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                            ✓ SENT
                          </span>
                        )}
                        {log.status === 'failed' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-extrabold text-[10px]">
                            ✕ FAILED
                          </span>
                        )}
                        {log.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                            ⏳ PENDING
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {log.status === 'failed' ? (
                          <button
                            type="button"
                            onClick={() => handleRetry(logId)}
                            disabled={retryingId === logId}
                            className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-headings font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            {retryingId === logId ? 'Retrying...' : 'Retry SMS'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-outline">Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
