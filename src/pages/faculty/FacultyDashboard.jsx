import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { facultyPanelService } from '../../services/api';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user, updateUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await facultyPanelService.getDashboardData();
      if (res && res.success) {
        setData(res);
        if (res.user && updateUser) {
          updateUser(res.user);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
        Loading faculty dashboard analytics...
      </div>
    );
  }

  const stats = data?.stats || {
    todayClassesCount: 3,
    totalAssignedStudents: 45,
    pendingAttendanceCount: 1,
    pendingGradingCount: 3,
    activeAnnouncementsCount: 4,
  };

  const activeUser = data?.user || user;
  const responsibilities = activeUser?.responsibilities || [];
  const derivedClasses = responsibilities.length > 0 
    ? Array.from(new Set(responsibilities.map((r) => r.className)))
    : (activeUser?.assignedClasses && activeUser.assignedClasses.length > 0 ? activeUser.assignedClasses : []);

  const derivedSubjects = responsibilities.length > 0 
    ? Array.from(new Set(responsibilities.map((r) => r.subject)))
    : (activeUser?.assignedSubjects && activeUser.assignedSubjects.length > 0 ? activeUser.assignedSubjects : []);

  const assignedClassesStr = derivedClasses.length > 0 ? derivedClasses.join(', ') : 'None assigned yet by Admin';
  const assignedSubjectsStr = derivedSubjects.length > 0 ? derivedSubjects.join(', ') : 'None assigned yet by Admin';

  return (
    <div className="space-y-6 font-body">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            Faculty Workspace &bull; {user?.department || 'Academic Faculty'}
          </span>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl mt-2">
            Welcome back, {user?.name || 'Faculty Member'}!
          </h1>
          <p className="text-xs text-surface-container mt-1">
            Assigned Classes: <strong className="text-white">{assignedClassesStr}</strong> &bull; Assigned Subjects: <strong className="text-white">{assignedSubjectsStr}</strong>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/faculty/attendance"
            className="px-4 py-2.5 rounded-full bg-white text-secondary font-headings font-bold text-xs hover:bg-surface-container transition-colors shadow-md"
          >
            Mark Today's Attendance
          </Link>
          <Link
            to="/faculty/assignments"
            className="px-4 py-2.5 rounded-full bg-white/20 text-white font-headings font-bold text-xs hover:bg-white/30 transition-colors border border-white/30"
          >
            Create Assignment
          </Link>
        </div>
      </div>

      {/* Summary Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Classes */}
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">class</span>
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant block">Today's Classes</span>
          <span className="font-headings font-extrabold text-2xl text-secondary block">{data?.todayTimetable?.length || 0}</span>
        </div>

        {/* Assigned Students */}
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant block">Assigned Students</span>
          <span className="font-headings font-extrabold text-2xl text-secondary block">{stats.totalAssignedStudents || 0}</span>
        </div>

        {/* Pending Attendance */}
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined">fact_check</span>
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant block">Pending Attendance</span>
          <span className="font-headings font-extrabold text-2xl text-amber-700 block">{stats.pendingAttendanceCount || 0}</span>
        </div>

        {/* Pending Grading */}
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <span className="material-symbols-outlined">assignment_turned_in</span>
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant block">Pending Grading</span>
          <span className="font-headings font-extrabold text-2xl text-rose-700 block">{stats.pendingGradingCount || 0}</span>
        </div>

        {/* Active Notices */}
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined">campaign</span>
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant block">Class Announcements</span>
          <span className="font-headings font-extrabold text-2xl text-emerald-700 block">{stats.activeAnnouncementsCount || 0}</span>
        </div>
      </div>

      {/* Active Academic Responsibilities Widget */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-3">
        <div className="flex justify-between items-center border-b border-outline-variant/15 pb-3">
          <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assignment_ind</span>
            Assigned Academic Responsibilities ({responsibilities.length})
          </h3>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${responsibilities.length > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
            {responsibilities.length > 0 ? 'Assigned by Admin' : 'Awaiting Admin Allocation'}
          </span>
        </div>

        {responsibilities.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-surface-container-low border border-dashed border-outline-variant/30 space-y-1">
            <p className="font-bold text-xs text-secondary">No Academic Responsibilities Assigned Yet</p>
            <p className="text-[11px] text-on-surface-variant">Please contact your System Administrator to allocate courses, classes, sections, and subjects to your profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {responsibilities.map((resp, idx) => (
              <div key={resp.id || resp._id || idx} className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1 hover:border-primary/40 transition-all">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-secondary">Class {resp.className} &bull; {resp.section || 'Sec A'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{resp.academicSession || '2026-2027'}</span>
                </div>
                <p className="text-xs font-semibold text-primary">{resp.subject}</p>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/10">
                  <span>{resp.course || 'Science'}</span>
                  <span>{resp.batch || 'Batch A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/15 pb-3">
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Today's Class Schedule
            </h3>
            <Link to="/faculty/timetable" className="text-xs font-bold text-primary hover:underline">
              Full Timetable &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.todayTimetable || data.todayTimetable.length === 0) ? (
              <div className="p-8 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">event_busy</span>
                <p className="font-bold text-xs text-secondary mt-1">No Class Lectures Scheduled For Today</p>
                <p className="text-[11px] text-on-surface-variant">Once academic responsibilities are assigned by Admin, your schedule will appear here.</p>
              </div>
            ) : (
              data.todayTimetable.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-primary/30 transition-colors"
                >
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-extrabold text-[11px]">
                      {slot.time}
                    </span>
                    <h4 className="font-bold text-sm text-secondary mt-1">{slot.subject}</h4>
                    <p className="text-xs text-on-surface-variant">{slot.className} &bull; Location: {slot.room}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/faculty/attendance"
                      className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-colors"
                    >
                      Mark Attendance
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Class Announcements Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/15 pb-3">
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">campaign</span>
              Class Notices
            </h3>
            <Link to="/faculty/announcements" className="text-xs font-bold text-primary hover:underline">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {(data?.announcements || []).map((anc) => (
              <div key={anc._id || anc.id} className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-1">
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-secondary text-xs">{anc.title}</h5>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">{anc.targetClass}</span>
                </div>
                <p className="text-on-surface-variant text-[11px] line-clamp-2">{anc.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
