import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, announcementService } from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    attendancePercentage: 92,
    overallGrade: 'A+',
    pendingFee: 0,
    enrolledCount: 2,
  });
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDashboardData();

    const handleDataUpdate = () => fetchStudentDashboardData();
    window.addEventListener('saumyaa_data_updated', handleDataUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleDataUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStudentDashboardData = async () => {
    setLoading(true);
    try {
      const studentId = user?._id || user?.id || user?.rollNumber || user?.email || 's1';
      const attRes = await attendanceService.getStudentAttendance(studentId);
      const annRes = await announcementService.getAnnouncements();

      if (attRes && attRes.stats) {
        setStats((prev) => ({
          ...prev,
          attendancePercentage:
            attRes.stats.attendancePercentage !== undefined ? attRes.stats.attendancePercentage : 100,
        }));
      }

      if (annRes && annRes.announcements && annRes.announcements.length > 0) {
        setLatestAnnouncement(annRes.announcements[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-secondary to-on-secondary-fixed-variant rounded-3xl p-6 md:p-8 text-white shadow-premium relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3.5 py-1 rounded-full bg-white/20 text-xs font-headings font-bold uppercase tracking-wider mb-2 inline-block">
            Student Learning Hub
          </span>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl mt-1">
            Welcome back, {user?.name || 'Rahul Gupta'}! 👋
          </h1>
          <p className="font-body text-xs md:text-sm text-teal-100 mt-2 max-w-xl">
            You are enrolled in <strong className="text-white">Class {user?.className || '10th'}</strong> (Roll: {user?.rollNumber || 'SAU-10-001'}). Check your test scores, attendance, and latest institute announcements below.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Current Class */}
        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Current Class
            </p>
            <h3 className="font-headings font-extrabold text-2xl text-secondary mt-1">
              Class {user?.className || '10th'}
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Roll: {user?.rollNumber || 'SAU-10-001'}
            </p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </span>
        </div>

        {/* Card 2: Attendance % */}
        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Attendance %
            </p>
            <h3 className="font-headings font-extrabold text-2xl text-emerald-700 mt-1">
              {stats.attendancePercentage}%
            </h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Excellent Record</p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          </span>
        </div>

        {/* Card 3: Overall Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Overall Grade
            </p>
            <h3 className="font-headings font-extrabold text-2xl text-primary mt-1">
              {stats.overallGrade}
            </h3>
            <p className="text-[10px] text-primary font-semibold mt-1">Top 5% Rank</p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">analytics</span>
          </span>
        </div>

        {/* Card 4: Pending Fees */}
        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Pending Fees
            </p>
            <h3 className="font-headings font-extrabold text-2xl text-emerald-700 mt-1">
              ₹0
            </h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Fee Cleared ✓</p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </span>
        </div>

        {/* Card 5: Subjects Enrolled */}
        <div className="bg-white rounded-2xl p-5 shadow-premium border border-outline-variant/15 flex items-center justify-between">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Subjects
            </p>
            <h3 className="font-headings font-extrabold text-2xl text-secondary mt-1">
              2 Active
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1">Maths, Science</p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">menu_book</span>
          </span>
        </div>
      </div>

      {/* Grid: Latest Announcement & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latest Announcement Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headings font-bold text-base text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
              Latest Institute Announcement
            </h3>
            <Link to="/student/announcements" className="text-xs text-primary font-headings font-bold hover:underline">
              View All
            </Link>
          </div>

          {latestAnnouncement ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <div className="flex justify-between items-start mb-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                  {latestAnnouncement.category}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Published: {new Date(latestAnnouncement.publishedDate).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-headings font-bold text-sm text-on-surface mb-1">
                {latestAnnouncement.title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {latestAnnouncement.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant py-4">No recent announcements.</p>
          )}
        </div>

        {/* Quick Portal Navigation */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col justify-between">
          <div>
            <h3 className="font-headings font-bold text-base text-secondary mb-3">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                to="/student/marks"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">grade</span>
                  <span>View Test Marks</span>
                </div>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
              <Link
                to="/student/attendance"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px]">calendar_month</span>
                  <span>Attendance Calendar</span>
                </div>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
              <Link
                to="/student/fees"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
                  <span>Tuition Fee Receipts</span>
                </div>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
