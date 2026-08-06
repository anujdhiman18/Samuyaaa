import React, { useState, useEffect, useMemo } from 'react';
import { rbacService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'login'
  const [auditLogs, setAuditLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { addToast } = useToast();

  useEffect(() => {
    fetchLogs();
    const handleUpdate = () => fetchLogs(false);
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleUpdate);
  }, []);

  const fetchLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const logRes = await rbacService.getActivityLogs();
      if (logRes && logRes.logs) {
        setAuditLogs(logRes.logs);
      }

      const historyRes = await rbacService.getLoginHistory();
      if (historyRes && historyRes.history) {
        setLoginHistory(historyRes.history);
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (activeTab === 'audit') {
      return auditLogs.filter((l) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          (l.userName && l.userName.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q));

        const matchStatus = statusFilter === 'All' || l.status === statusFilter;
        return matchSearch && matchStatus;
      });
    } else {
      return loginHistory.filter((h) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          (h.userName && h.userName.toLowerCase().includes(q)) ||
          (h.userEmail && h.userEmail.toLowerCase().includes(q)) ||
          (h.ipAddress && h.ipAddress.includes(q));

        const matchStatus = statusFilter === 'All' || h.status === statusFilter;
        return matchSearch && matchStatus;
      });
    }
  }, [activeTab, auditLogs, loginHistory, search, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
      case 'Success':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">🟢 Success</span>;
      case 'DENIED':
      case 'Blocked':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">⛔ Access Denied</span>;
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">🟡 Warning</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-bold text-[10px]">Information</span>;
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">history_toggle_off</span>
            RBAC Activity &amp; Login Audit Logs
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Real-time security logs, permission denial traces, user action audits, and authentication history.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg font-headings font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            📋 System Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2 rounded-lg font-headings font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            🔑 Login History
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder={activeTab === 'audit' ? 'Search user, action or details...' : 'Search email or IP address...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-secondary"
          >
            <option value="All">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="DENIED">Denied Access Only</option>
            <option value="WARNING">Warnings</option>
          </select>

          <button
            onClick={() => fetchLogs(true)}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-headings font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Table Display */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs animate-pulse text-on-surface-variant">Loading security logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">No logs found matching criteria.</div>
        ) : activeTab === 'audit' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {filteredLogs.map((log) => (
                  <tr key={log._id || log.timestamp} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">
                      {log.userName} ({log.userRole || 'User'})
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[10px] font-bold">
                        {log.category || 'RBAC'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant max-w-xs truncate">
                      {log.details || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 font-mono">IP Address</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {filteredLogs.map((h) => (
                  <tr key={h._id || h.createdAt} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {new Date(h.createdAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-secondary whitespace-nowrap">{h.userName}</td>
                    <td className="py-3 px-4 font-mono text-primary whitespace-nowrap">{h.userEmail}</td>
                    <td className="py-3 px-4 font-semibold text-secondary whitespace-nowrap">{h.userRole}</td>
                    <td className="py-3 px-4 font-mono text-on-surface-variant whitespace-nowrap">{h.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{getStatusBadge(h.status || 'Success')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
