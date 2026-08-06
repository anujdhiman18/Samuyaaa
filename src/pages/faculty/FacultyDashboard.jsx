import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { PERMISSIONS } from '../../config/rbacConfig';
import { facultyPanelService } from '../../services/api';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user, updateUser } = useAuth();
  const { userRoles, SYSTEM_ROLES, hasPermission } = useRBAC();
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
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="z-10 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Faculty Workspace &bull; {user?.department || 'Science & Mathematics'}
            </span>

            {/* Role Badges */}
            {userRoles.map((rCode) => {
              const matchedRole = SYSTEM_ROLES.find((r) => r.code === rCode);
              return (
                <span
                  key={rCode}
                  className="px-3 py-0.5 rounded-full bg-white text-secondary text-[11px] font-headings font-bold shadow-sm"
                >
                  {matchedRole?.badge || rCode.replace(/_/g, ' ')}
                </span>
              );
            })}
          </div>

          <h1 className="font-headings font-extrabold text-2xl md:text-3xl">
            Welcome back, {user?.name || 'Faculty Member'}!
          </h1>
          <p className="text-xs text-surface-container">
            Assigned Classes: <strong className="text-white">{assignedClassesStr}</strong> &bull; Assigned Subjects: <strong className="text-white">{assignedSubjectsStr}</strong>
          </p>
        </div>

        <div className="flex gap-2 z-10">
          {hasPermission(PERMISSIONS.MARK_ATTENDANCE) && (
            <Link
              to="/faculty/attendance"
              className="px-4 py-2.5 rounded-full bg-white text-secondary font-headings font-bold text-xs hover:bg-surface-container transition-colors shadow-md"
            >
              Mark Today's Attendance
            </Link>
          )}
        </div>
      </div>

      {/* Role-Based Quick Actions & Capabilities */}
      <div className="space-y-3">
        <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          Active Role-Authorized Portals &amp; Tools
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasPermission(PERMISSIONS.CREATE_ASSIGNMENTS) && (
            <Link
              to="/faculty/assignments"
              className="p-5 bg-white rounded-2xl shadow-premium border border-outline-variant/15 hover:shadow-xl transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                🎓
              </div>
              <h4 className="font-headings font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                Assignments &amp; Quizzes
              </h4>
              <p className="text-xs text-on-surface-variant">Subject Teacher role capability to create &amp; grade assignments.</p>
            </Link>
          )}

          {hasPermission(PERMISSIONS.APPROVE_LESSON_PLANS) && (
            <Link
              to="/faculty/lesson-plans"
              className="p-5 bg-white rounded-2xl shadow-premium border border-outline-variant/15 hover:shadow-xl transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                ⭐
              </div>
              <h4 className="font-headings font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                Lesson Plan Approvals
              </h4>
              <p className="text-xs text-on-surface-variant">Senior Faculty &amp; HOD review and approval interface.</p>
            </Link>
          )}

          {hasPermission(PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS) && (
            <Link
              to="/faculty/department-analytics"
              className="p-5 bg-white rounded-2xl shadow-premium border border-outline-variant/15 hover:shadow-xl transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                👑
              </div>
              <h4 className="font-headings font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                Department Analytics
              </h4>
              <p className="text-xs text-on-surface-variant">HOD metrics, pass rates, and teacher workload monitoring.</p>
            </Link>
          )}

          {hasPermission(PERMISSIONS.MANAGE_ACADEMIC_CALENDAR) && (
            <Link
              to="/faculty/academic-calendar"
              className="p-5 bg-white rounded-2xl shadow-premium border border-outline-variant/15 hover:shadow-xl transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h4 className="font-headings font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                Academic Calendar
              </h4>
              <p className="text-xs text-on-surface-variant">Academic Coordinator term dates &amp; exam timetables.</p>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Today's Classes</span>
          <div className="font-headings font-extrabold text-3xl text-secondary">{stats.todayClassesCount}</div>
          <span className="text-xs text-emerald-600 font-bold">Scheduled for Today</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Total Enrolled Students</span>
          <div className="font-headings font-extrabold text-3xl text-primary">{stats.totalAssignedStudents}</div>
          <span className="text-xs text-on-surface-variant">Across {derivedClasses.length || 1} Classes</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Pending Attendance</span>
          <div className="font-headings font-extrabold text-3xl text-amber-600">{stats.pendingAttendanceCount}</div>
          <span className="text-xs text-amber-600 font-bold">Action Required</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Active Announcements</span>
          <div className="font-headings font-extrabold text-3xl text-secondary">{stats.activeAnnouncementsCount}</div>
          <span className="text-xs text-emerald-600 font-bold font-mono">Live on Portal</span>
        </div>
      </div>
    </div>
  );
}
