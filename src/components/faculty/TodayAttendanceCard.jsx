import React, { useState, useEffect } from 'react';
import { facultyAttendanceService, geofenceService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { normalizeBranchId } from '../../config/rbacConfig';

export default function TodayAttendanceCard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [todayRecord, setTodayRecord] = useState(null);
  const [centerConfig, setCenterConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const assignedCenter = normalizeBranchId(user?.branchId || user?.branch || 'MAIN_CENTER') === 'BRANCH'
    ? 'Branch'
    : 'Main Center';

  useEffect(() => {
    loadAttendanceData();
    const handleUpdate = () => loadAttendanceData(false);
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleUpdate);
  }, [user]);

  const loadAttendanceData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const facultyId = user?._id || user?.id || 'f1';
      const [attRes, centersRes] = await Promise.all([
        facultyAttendanceService.getFacultyTodayAttendance(facultyId),
        geofenceService.getCenterConfigs(),
      ]);

      if (attRes && attRes.record) {
        setTodayRecord(attRes.record);
      } else {
        setTodayRecord(null);
      }

      if (centersRes && centersRes.centers && centersRes.centers[assignedCenter]) {
        setCenterConfig(centersRes.centers[assignedCenter]);
      }
    } catch (err) {
      console.warn('Error loading faculty attendance card:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleAutoCheckIn = async (overrideLat = null, overrideLng = null) => {
    setVerifying(true);
    setErrorMessage('');

    const facultyId = user?._id || user?.id || 'f1';
    const facultyName = user?.name || 'Faculty Member';

    const processCoords = async (lat, lng) => {
      try {
        const res = await facultyAttendanceService.verifyAndAutoCheckIn({
          facultyId,
          facultyName,
          latitude: lat,
          longitude: lng,
        });

        if (res && res.success) {
          setTodayRecord(res.record);
          addToast(res.message, 'success');
        } else if (res && res.alreadyMarked) {
          setTodayRecord(res.record);
          addToast('Attendance already recorded for today', 'info');
        } else if (res && res.locationVerification === 'FAILED') {
          setErrorMessage(res.message);
          addToast(res.message, 'error');
        } else {
          setErrorMessage(res.message || 'Attendance Could Not Be Verified');
          addToast(res.message || 'Verification failed', 'error');
        }
      } catch (err) {
        setErrorMessage('Error performing location verification');
        addToast('Error verifying GPS location', 'error');
      } finally {
        setVerifying(false);
      }
    };

    if (overrideLat !== null && overrideLng !== null) {
      await processCoords(overrideLat, overrideLng);
      return;
    }

    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      addToast('Geolocation not supported', 'error');
      setVerifying(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        processCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setVerifying(false);
        const msg = 'Attendance Could Not Be Verified: Please enable location access and try again.';
        setErrorMessage(msg);
        addToast('Location access denied or unavailable', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-premium border border-outline-variant/15 animate-pulse text-xs text-on-surface-variant">
        Verifying today's attendance status...
      </div>
    );
  }

  const reportingTimeStr = centerConfig?.reportingTime || '09:00';

  return (
    <div className="bg-white rounded-3xl p-6 shadow-premium border border-outline-variant/15 font-body space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15">
        <div>
          <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">my_location</span>
            Today's Attendance
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Assigned Center: <strong className="text-secondary font-bold">{assignedCenter}</strong> &bull; Reporting Time: <strong className="text-secondary font-bold">{reportingTimeStr} AM</strong>
          </p>
        </div>

        {todayRecord && (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Verified
          </span>
        )}
      </div>

      {todayRecord ? (
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                {todayRecord.status === 'EARLY' && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    EARLY
                  </span>
                )}
                {todayRecord.status === 'ON_TIME' && (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    ON TIME
                  </span>
                )}
                {todayRecord.status === 'LATE' && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    LATE {todayRecord.lateByMinutes > 0 ? `by ${todayRecord.lateByMinutes} minutes` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface mt-2 font-bold">
                Checked in at <span className="text-secondary font-mono">{todayRecord.checkInTime}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 text-[11px] font-bold text-emerald-800">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                ✓ Attendance Verified
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                ✓ Location Verified ({todayRecord.distanceMeters ?? 0}m away)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-1 text-amber-900 font-medium">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              Location Access Required
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Location access is required to automatically verify your presence at your assigned center ({assignedCenter}) and mark attendance.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleAutoCheckIn()}
              disabled={verifying}
              className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2 shadow-premium hover:shadow-glow-primary active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">near_me</span>
              {verifying ? 'Verifying GPS...' : 'Auto-Verify & Check In (GPS)'}
            </button>

            {/* Simulated Location Trigger for Testing / Demo */}
            {centerConfig && (
              <button
                type="button"
                onClick={() => handleAutoCheckIn(centerConfig.latitude, centerConfig.longitude)}
                disabled={verifying}
                className="bg-surface-container-low text-secondary border border-outline-variant/30 font-headings font-bold px-4 py-2.5 rounded-full text-xs hover:bg-surface-container transition-colors cursor-pointer"
              >
                ⚡ Auto Check-in at {assignedCenter} (GPS Verified)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
