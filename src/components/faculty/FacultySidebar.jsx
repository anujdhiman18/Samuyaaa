import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { PERMISSIONS } from '../../config/rbacConfig';

const allNavItems = [
  { path: '/faculty', label: 'Dashboard', icon: 'dashboard', perm: PERMISSIONS.VIEW_DASHBOARD },
  { path: '/faculty/students', label: 'My Students', icon: 'groups', perm: PERMISSIONS.VIEW_CLASS_STUDENTS },
  { path: '/faculty/attendance', label: 'Mark Attendance', icon: 'fact_check', perm: PERMISSIONS.MARK_ATTENDANCE },
  { path: '/faculty/marks', label: 'Marks & Grades', icon: 'edit_note', perm: PERMISSIONS.UPLOAD_GRADES },
  { path: '/faculty/assignments', label: 'Assignments & Quizzes', icon: 'assignment', perm: PERMISSIONS.CREATE_ASSIGNMENTS },
  
  // Role-Specific Specialized Pages
  { path: '/faculty/lesson-plans', label: 'Lesson Plan Approvals', icon: 'approval', perm: PERMISSIONS.APPROVE_LESSON_PLANS },
  { path: '/faculty/department-analytics', label: 'Dept Analytics', icon: 'analytics', perm: PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS },
  { path: '/faculty/leave-approvals', label: 'HOD Leave Approvals', icon: 'event_available', perm: PERMISSIONS.APPROVE_FACULTY_LEAVE },
  { path: '/faculty/academic-calendar', label: 'Academic Calendar', icon: 'calendar_month', perm: PERMISSIONS.MANAGE_ACADEMIC_CALENDAR },

  // Common Resources
  { path: '/faculty/materials', label: 'Study Materials', icon: 'folder_open', perm: PERMISSIONS.UPLOAD_STUDY_MATERIAL },
  { path: '/faculty/timetable', label: 'My Timetable', icon: 'calendar_today', perm: PERMISSIONS.VIEW_TIMETABLE },
  { path: '/faculty/announcements', label: 'Class Notices', icon: 'campaign', perm: PERMISSIONS.RECEIVE_ANNOUNCEMENTS },
  { path: '/faculty/leave', label: 'Apply Leave', icon: 'event_busy', perm: PERMISSIONS.APPLY_LEAVE },
  { path: '/faculty/profile', label: 'My Profile', icon: 'account_circle', perm: PERMISSIONS.VIEW_PERSONAL_PROFILE },
];

export default function FacultySidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { hasPermission } = useRBAC();
  const { branchLabel, isChildBranch } = useAuth();

  const isLinkActive = (path) => {
    if (path === '/faculty') {
      return location.pathname === '/faculty' || location.pathname === '/faculty/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Automatically filter sidebar items based on user's active RBAC permissions
  const visibleNavItems = allNavItems.filter((item) => {
    if (!item.perm) return true;
    return hasPermission(item.perm);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-20 px-5 flex flex-col justify-center border-b border-outline-variant/15">
            <div className="flex items-center justify-between">
              <Link to="/faculty" className="flex items-center gap-2.5 group">
                <img
                  src="/logo.jpg"
                  alt="Saumyaa Faculty Logo"
                  className="w-9 h-9 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
                />
                <div>
                  <span className="font-headings font-extrabold text-xs text-secondary block leading-tight">
                    Saumyaa Portal
                  </span>
                  <span className="text-[9px] font-bold text-primary tracking-wider uppercase">
                    Faculty Panel
                  </span>
                </div>
              </Link>
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Assigned Branch Badge */}
            <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border self-start shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isChildBranch ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <span className={isChildBranch ? 'text-amber-900 font-bold' : 'text-blue-900 font-bold'}>
                🏢 {branchLabel}
              </span>
            </div>
          </div>

          {/* Dynamic Navigation Links */}
          <nav className="p-4 space-y-1 font-body overflow-y-auto max-h-[calc(100vh-140px)] sidebar-scroll">
            <div className="px-3 pb-2 text-[10px] font-headings font-bold uppercase tracking-widest text-on-surface-variant/70">
              Role Authorized Tools ({visibleNavItems.length})
            </div>
            {visibleNavItems.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full font-headings text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-primary text-white shadow-premium shadow-tactile-btn'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? 'text-white' : 'text-primary'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
