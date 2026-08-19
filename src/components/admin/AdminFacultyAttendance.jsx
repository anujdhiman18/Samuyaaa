import React, { useState, useEffect } from 'react';
import { facultyAttendanceService, geofenceService, rbacService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function AdminFacultyAttendance() {
  const { addToast } = useToast();

  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [centerFilter, setCenterFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [records, setRecords] = useState([]);
  const [centersConfig, setCentersConfig] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit Center Geofence Config Modal State
  const [editingCenter, setEditingCenter] = useState(null); // 'Main Center' | 'Branch'
  const [centerForm, setCenterForm] = useState({
    latitude: '',
    longitude: '',
    radiusMeters: 100,
    reportingTime: '09:00',
    gracePeriodMinutes: 5,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Manual Correction Modal State
  const [correctingRecord, setCorrectingRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    status: 'ON_TIME',
    checkInTime: '09:00 AM',
    lateByMinutes: 0,
    reason: '',
  });
  const [savingCorrection, setSavingCorrection] = useState(false);

  // Audit Log Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData(false);
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleUpdate);
  }, [date, centerFilter, statusFilter, search]);

  const fetchData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [attRes, centersRes] = await Promise.all([
        facultyAttendanceService.getAllFacultyAttendance({ date, center: centerFilter, status: statusFilter, search }),
        geofenceService.getCenterConfigs(),
      ]);

      if (attRes && attRes.records) {
        setRecords(attRes.records);
      }
      if (centersRes && centersRes.centers) {
        setCentersConfig(centersRes.centers);
      }
    } catch (err) {
      console.warn('Error fetching faculty attendance:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleOpenConfigModal = (centerName) => {
    const config = centersConfig[centerName] || {
      latitude: centerName === 'Main Center' ? 30.7333 : 32.085,
      longitude: centerName === 'Main Center' ? 76.7794 : 76.535,
      radiusMeters: 100,
      reportingTime: '09:00',
      gracePeriodMinutes: 5,
    };

    setEditingCenter(centerName);
    setCenterForm({
      latitude: config.latitude,
      longitude: config.longitude,
      radiusMeters: config.radiusMeters,
      reportingTime: config.reportingTime || '09:00',
      gracePeriodMinutes: config.gracePeriodMinutes || 5,
    });
  };

  const handleSaveCenterConfig = async (e) => {
    e.preventDefault();
    if (!editingCenter) return;
    setSavingConfig(true);
    try {
      const res = await geofenceService.updateCenterConfig(editingCenter, {
        latitude: Number(centerForm.latitude),
        longitude: Number(centerForm.longitude),
        radiusMeters: Number(centerForm.radiusMeters) || 100,
        reportingTime: centerForm.reportingTime,
        gracePeriodMinutes: Number(centerForm.gracePeriodMinutes) || 5,
      });

      if (res && res.success) {
        addToast(`Geofence & working hours updated for ${editingCenter}!`, 'success');
        setEditingCenter(null);
        fetchData(false);
      }
    } catch (err) {
      addToast('Error updating center configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleOpenCorrection = (rec) => {
    setCorrectingRecord(rec);
    setCorrectionForm({
      status: rec.status || 'ON_TIME',
      checkInTime: rec.checkInTime || '09:00 AM',
      lateByMinutes: rec.lateByMinutes || 0,
      reason: '',
    });
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctingRecord) return;
    if (!correctionForm.reason.trim()) {
      addToast('Please specify a mandatory reason for manual correction', 'error');
      return;
    }
    setSavingCorrection(true);
    try {
      const currentUserStr = localStorage.getItem('saumyaa_user');
      let adminName = 'Admin';
      if (currentUserStr) {
        try {
          const u = JSON.parse(currentUserStr);
          adminName = u.name || adminName;
        } catch (err) {}
      }

      const res = await facultyAttendanceService.manualAdminCorrection({
        recordId: correctingRecord._id,
        facultyId: correctingRecord.facultyId,
        date: correctingRecord.date || date,
        center: correctingRecord.center,
        status: correctionForm.status,
        checkInTime: correctionForm.checkInTime,
        lateByMinutes: correctionForm.lateByMinutes,
        reason: correctionForm.reason,
        adminName,
      });

      if (res && res.success) {
        addToast(`Attendance record corrected for ${correctingRecord.facultyName}!`, 'success');
        setCorrectingRecord(null);
        fetchData(false);
      }
    } catch (err) {
      addToast('Error saving manual correction', 'error');
    } finally {
      setSavingCorrection(false);
    }
  };

  const handleOpenAuditModal = async () => {
    setShowAuditModal(true);
    try {
      const res = await rbacService.getActivityLogs();
      if (res && res.logs) {
        const geofenceLogs = res.logs.filter(
          (l) => l.action?.includes('FACULTY_CHECKIN') || l.category === 'Attendance'
        );
        setAuditLogs(geofenceLogs);
      }
    } catch (e) {}
  };

  // KPI Metrics
  const totalCheckedIn = records.length;
  const earlyCount = records.filter((r) => r.status === 'EARLY').length;
  const onTimeCount = records.filter((r) => r.status === 'ON_TIME').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;

  const mainCenterConfig = centersConfig['Main Center'] || {
    name: 'Main Center',
    latitude: 30.7333,
    longitude: 76.7794,
    radiusMeters: 100,
    reportingTime: '09:00',
    gracePeriodMinutes: 5,
  };

  const branchConfig = centersConfig['Branch'] || {
    name: 'Branch',
    latitude: 32.085,
    longitude: 76.535,
    radiusMeters: 100,
    reportingTime: '09:00',
    gracePeriodMinutes: 5,
  };

  return (
    <div className="space-y-6 font-body">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Faculty Present</p>
            <h3 className="font-headings font-extrabold text-2xl text-secondary mt-1">{totalCheckedIn} Checked In</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">GPS verified auto check-ins</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            👥
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Early Arrival</p>
            <h3 className="font-headings font-extrabold text-2xl text-emerald-700 mt-1">{earlyCount} Faculty</h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Arrived before reporting time</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            🌅
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">On Time Arrival</p>
            <h3 className="font-headings font-extrabold text-2xl text-blue-700 mt-1">{onTimeCount} Faculty</h3>
            <p className="text-[10px] text-blue-700 font-semibold mt-0.5">Within grace period</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            ⏰
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Late Arrival</p>
            <h3 className="font-headings font-extrabold text-2xl text-amber-700 mt-1">{lateCount} Faculty</h3>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Exceeded grace period</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            ⚠️
          </div>
        </div>
      </div>

      {/* Center Geofence & Working Hours Settings Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-outline-variant/15">
          <div>
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">center_focus_strong</span>
              Center Geofence &amp; Working Hours Configuration
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Set exact GPS coordinates, geofence radius, reporting time, and grace period for Main Center &amp; Branch.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAuditModal}
            className="px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/30 text-secondary hover:bg-surface-container font-headings font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            Geofence Audit Trail
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Center Config Card */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-headings font-bold text-sm text-secondary flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                Main Center
              </h4>
              <button
                type="button"
                onClick={() => handleOpenConfigModal('Main Center')}
                className="px-3 py-1 rounded-full bg-white border border-outline-variant/30 text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Configure Geofence
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">GPS Location</span>
                <span className="font-mono font-bold text-secondary text-[11px]">
                  {mainCenterConfig.latitude}, {mainCenterConfig.longitude}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">Geofence Radius</span>
                <span className="font-mono font-bold text-emerald-800 text-[11px]">
                  {mainCenterConfig.radiusMeters} Meters
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">Reporting Time</span>
                <span className="font-mono font-bold text-secondary text-[11px]">
                  {mainCenterConfig.reportingTime || '09:00'} AM
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">Grace Period</span>
                <span className="font-mono font-bold text-secondary text-[11px]">
                  {mainCenterConfig.gracePeriodMinutes || 5} Minutes
                </span>
              </div>
            </div>
          </div>

          {/* Branch Config Card */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-headings font-bold text-sm text-secondary flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span>
                Branch
              </h4>
              <button
                type="button"
                onClick={() => handleOpenConfigModal('Branch')}
                className="px-3 py-1 rounded-full bg-white border border-outline-variant/30 text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Configure Geofence
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">GPS Location</span>
                <span className="font-mono font-bold text-secondary text-[11px]">
                  {branchConfig.latitude}, {branchConfig.longitude}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">Geofence Radius</span>
                <span className="font-mono font-bold text-emerald-800 text-[11px]">
                  {branchConfig.radiusMeters} Meters
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">Reporting Time</span>
                <span className="font-mono font-bold text-secondary text-[11px]">
                  {branchConfig.reportingTime || '09:00'} AM
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block font-bold">Grace Period</span>
                <span className="font-mono font-bold text-secondary text-[11px]">
                  {branchConfig.gracePeriodMinutes || 5} Minutes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Faculty Attendance Roster & History Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-outline-variant/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Center Filter</label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
            >
              <option value="All">All Centers</option>
              <option value="Main Center">Main Center</option>
              <option value="Branch">Branch</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
            >
              <option value="All">All Statuses</option>
              <option value="EARLY">🟢 EARLY</option>
              <option value="ON_TIME">🔵 ON TIME</option>
              <option value="LATE">🟡 LATE</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Search Faculty</label>
            <input
              type="text"
              placeholder="Faculty name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
            Loading faculty GPS attendance logs...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No faculty attendance records found for the selected date and filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                  <th className="py-3.5 px-4">Faculty</th>
                  <th className="py-3.5 px-4">Center</th>
                  <th className="py-3.5 px-4">Reporting Time</th>
                  <th className="py-3.5 px-4">Check-in Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Late By</th>
                  <th className="py-3.5 px-4">GPS Distance</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {records.map((r) => (
                  <tr key={r._id || r.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-4 font-bold text-secondary">
                      {r.facultyName}
                      <span className="block text-[10px] font-mono text-on-surface-variant">ID: {r.facultyId}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      {r.center}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono">
                      {r.reportingTime || '09:00'} AM
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {r.checkInTime}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'EARLY' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px]">
                          ● EARLY
                        </span>
                      )}
                      {r.status === 'ON_TIME' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[11px]">
                          ● ON TIME
                        </span>
                      )}
                      {r.status === 'LATE' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                          ● LATE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono">
                      {r.lateByMinutes > 0 ? `${r.lateByMinutes} mins` : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800">
                      {r.distanceMeters ?? 0}m (Verified ✓)
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                        {r.source || 'GEOLOCATION_AUTO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenCorrection(r)}
                        className="px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/30 text-secondary hover:bg-primary/10 hover:text-primary font-headings font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Geofence Config Modal */}
      {editingCenter && (
        <Modal
          isOpen={!!editingCenter}
          onClose={() => setEditingCenter(null)}
          title={`Configure ${editingCenter} Geofence`}
        >
          <form onSubmit={handleSaveCenterConfig} className="space-y-4 font-body text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={centerForm.latitude}
                  onChange={(e) => setCenterForm({ ...centerForm, latitude: e.target.value })}
                  placeholder="e.g. 30.7333"
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={centerForm.longitude}
                  onChange={(e) => setCenterForm({ ...centerForm, longitude: e.target.value })}
                  placeholder="e.g. 76.7794"
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Radius (Meters)</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={5000}
                  value={centerForm.radiusMeters}
                  onChange={(e) => setCenterForm({ ...centerForm, radiusMeters: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Reporting Time</label>
                <input
                  type="time"
                  required
                  value={centerForm.reportingTime}
                  onChange={(e) => setCenterForm({ ...centerForm, reportingTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Grace Period (Mins)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={60}
                  value={centerForm.gracePeriodMinutes}
                  onChange={(e) => setCenterForm({ ...centerForm, gracePeriodMinutes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setEditingCenter(null)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingConfig}
                className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-premium"
              >
                {savingConfig ? 'Saving...' : 'Save Geofence Config'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Manual Correction Modal */}
      {correctingRecord && (
        <Modal
          isOpen={!!correctingRecord}
          onClose={() => setCorrectingRecord(null)}
          title={`Correct Attendance for ${correctingRecord.facultyName}`}
        >
          <form onSubmit={handleSaveCorrection} className="space-y-4 font-body text-xs">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] space-y-1">
              <p>Faculty: <strong className="text-secondary">{correctingRecord.facultyName}</strong></p>
              <p>Date: <strong className="text-secondary">{correctingRecord.date}</strong> &bull; Center: <strong className="text-secondary">{correctingRecord.center}</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Status</label>
                <select
                  value={correctionForm.status}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold"
                >
                  <option value="EARLY">🟢 EARLY</option>
                  <option value="ON_TIME">🔵 ON TIME</option>
                  <option value="LATE">🟡 LATE</option>
                </select>
              </div>

              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Check-in Time</label>
                <input
                  type="text"
                  value={correctionForm.checkInTime}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, checkInTime: e.target.value })}
                  placeholder="e.g. 09:00 AM"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-headings font-bold text-on-surface-variant mb-1">Late By (Mins)</label>
                <input
                  type="number"
                  value={correctionForm.lateByMinutes}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, lateByMinutes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-headings font-bold text-on-surface-variant mb-1">
                Mandatory Correction Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                placeholder="Reason for manual override (e.g. GPS Signal glitch on faculty phone)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-body"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setCorrectingRecord(null)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCorrection}
                className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-premium"
              >
                {savingCorrection ? 'Saving Override...' : 'Apply Correction'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Geofence Audit Log Modal */}
      {showAuditModal && (
        <Modal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          title="Geofence &amp; Attendance Audit Log"
        >
          <div className="space-y-3 font-body text-xs max-h-[400px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-center py-6 text-on-surface-variant">No geofence audit entries recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono font-bold text-primary">{log.action}</span>
                    <span className="text-on-surface-variant">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-secondary">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
