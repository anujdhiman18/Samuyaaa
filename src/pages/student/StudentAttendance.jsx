import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/api';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ presentDays: 0, absentDays: 0, lateDays: 0, totalDays: 0, attendancePercentage: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();

    const handleDataUpdate = () => fetchAttendance();
    window.addEventListener('saumyaa_data_updated', handleDataUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleDataUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const studentId = user?._id || user?.id || user?.rollNumber || user?.email || 's1';
      const data = await attendanceService.getStudentAttendance(studentId);
      if (data && data.attendance) {
        setAttendance(data.attendance);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = stats.presentDays ?? attendance.filter((a) => a.status === 'Present').length;
  const absentCount = stats.absentDays ?? attendance.filter((a) => a.status === 'Absent').length;
  const lateCount = stats.lateDays ?? attendance.filter((a) => a.status === 'Late').length;
  const totalDays = stats.totalDays ?? attendance.length;
  const percentage = stats.attendancePercentage !== undefined
    ? stats.attendancePercentage
    : totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  if (loading) {
    return (
      <div className="p-8 text-center text-xs animate-pulse font-body text-on-surface-variant">
        Loading attendance records...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Attendance Record &amp; Monthly Log
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Daily attendance tracking, monthly calendar breakdown, and subject attendance logs.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Present Days
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
            {presentCount} Days
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Active Class Attendance</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Absent Days
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-rose-600 mt-2">
            {absentCount} Days
          </h3>
          <p className="text-[10px] text-rose-600 font-semibold mt-1">Authorized leave / Absent</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Late Arrival
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-amber-600 mt-2">
            {lateCount} Days
          </h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Marked Late</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Attendance Rate
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
            {percentage}%
          </h3>
          <p className="text-[10px] text-secondary font-semibold mt-1">
            Target threshold: &gt; 75%
          </p>
        </div>
      </div>

      {/* Progress Chart Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
        <h3 className="font-headings font-bold text-base text-secondary mb-3">
          Monthly Attendance Progress ({percentage}%)
        </h3>
        <div className="h-4 bg-surface-container-low rounded-full overflow-hidden p-0.5 border border-outline-variant/15">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Monthly Calendar View */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headings font-bold text-base text-secondary">
            July 2026 Monthly Attendance Calendar View
          </h3>
          <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-headings font-bold text-xs rounded-full">
            July 2026
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="font-headings font-bold text-on-surface-variant py-2 border-b border-outline-variant/15">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const dateStr = `2026-07-${String(day).padStart(2, '0')}`;
            const dayRecord = attendance.find((a) => a.date === dateStr);
            const isSunday = day % 7 === 0;

            let statusText = isSunday ? 'OFF' : 'PRESENT';
            let statusStyle = isSunday
              ? 'bg-surface-container border-transparent text-on-surface-variant/40'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800';

            if (dayRecord) {
              if (dayRecord.status === 'Absent') {
                statusText = 'ABSENT';
                statusStyle = 'bg-rose-50 border-rose-300 text-rose-600';
              } else if (dayRecord.status === 'Late') {
                statusText = 'LATE';
                statusStyle = 'bg-amber-50 border-amber-300 text-amber-700';
              } else {
                statusText = 'PRESENT';
                statusStyle = 'bg-emerald-50 border-emerald-200 text-emerald-800';
              }
            }

            return (
              <div
                key={day}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between font-bold h-16 ${statusStyle}`}
              >
                <span>{day}</span>
                <span className="text-[9px] font-extrabold uppercase">
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 space-y-4">
        <h3 className="font-headings font-bold text-base text-secondary">
          Detailed Subject Attendance Logs
        </h3>

        {attendance.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">
            No logged attendance entries recorded for your profile yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/15 font-headings uppercase text-[10px] tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">Subject / Course</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {attendance.map((rec) => (
                  <tr key={rec._id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-3 font-bold text-secondary">{rec.date}</td>
                    <td className="p-3 font-semibold text-primary">{rec.subject || 'General'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-headings font-bold text-[10px] uppercase ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-on-surface-variant italic">
                      {rec.remarks || '—'}
                    </td>
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
