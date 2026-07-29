import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats();
      if (data && data.stats) {
        setStats(data.stats);
        setRecentStudents(data.recentRegistrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container-high rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-container-high rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-surface-container-high rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Admin Overview &amp; Analytics
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Real-time enrollment, fee tracking, and subject management dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/students"
            className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Student
          </Link>
          <Link
            to="/admin/fees"
            className="bg-secondary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-secondary active:scale-95 shadow-tactile-btn transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Record Fee
          </Link>
        </div>
      </div>

      {/* Dashboard Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Total Enrolled
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
              {stats?.totalStudents || 0}
            </h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              {stats?.activeStudents || 0} Active Batch Students
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">groups</span>
          </div>
        </div>

        {/* Card 2: Total Subjects */}
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Active Subjects
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-primary mt-2">
              {stats?.totalSubjects || 0}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              Mathematics, Physics, Chemistry
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">menu_book</span>
          </div>
        </div>

        {/* Card 3: Pending Fee Payments */}
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Pending Fees
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-rose-600 mt-2">
              ₹{(stats?.pendingFeePayments || 0).toLocaleString()}
            </h3>
            <Link
              to="/admin/reminders"
              className="text-[10px] text-rose-600 font-semibold mt-1 hover:underline inline-flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
              Send Reminders
            </Link>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">pending_actions</span>
          </div>
        </div>

        {/* Card 4: Total Fees Collected */}
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
          <div>
            <p className="font-headings text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Fees Collected
            </p>
            <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
              ₹{(stats?.totalFeesCollected || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              ₹{(stats?.thisMonthCollected || 0).toLocaleString()} collected this month
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
          </div>
        </div>
      </div>

      {/* Visual Chart & Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Revenue & Enrollment Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headings font-bold text-base text-secondary">
                Monthly Fee Collection &amp; Target Trend
              </h3>
              <p className="text-xs text-on-surface-variant">
                Tuition fee collection vs target monthly target
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full">
              July 2026
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface">Current Month Revenue</span>
                <span className="text-emerald-700 font-bold">
                  ₹{(stats?.thisMonthCollected ?? 0).toLocaleString()} / ₹
                  {(stats?.monthlyTarget ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="h-4 bg-surface-container-low rounded-full overflow-hidden p-0.5 border border-outline-variant/15">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      (stats?.monthlyTarget ?? 0) > 0
                        ? Math.min(100, Math.round(((stats?.thisMonthCollected ?? 0) / stats.monthlyTarget) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 pt-6 items-end h-40">
              {[
                { month: 'Feb', amount: 0, height: '15%' },
                { month: 'Mar', amount: 0, height: '15%' },
                { month: 'Apr', amount: 0, height: '15%' },
                { month: 'May', amount: 0, height: '15%' },
                { month: 'Jun', amount: 0, height: '15%' },
                {
                  month: 'Jul',
                  amount: stats?.thisMonthCollected ?? 0,
                  height: `${Math.max(15, Math.min(100, (stats?.monthlyTarget ? Math.round(((stats?.thisMonthCollected ?? 0) / stats.monthlyTarget) * 100) : 15)))}%`,
                  active: true,
                },
              ].map((m) => (
                <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    ₹{m.amount.toLocaleString()}
                  </span>
                  <div
                    className={`w-full rounded-t-xl transition-all ${
                      m.active ? 'bg-primary shadow-md' : 'bg-secondary/20 hover:bg-secondary/40'
                    }`}
                    style={{ height: m.height }}
                  />
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Fee Reminders Box */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headings font-bold text-base text-secondary">
                Fee Collection Status
              </h3>
              <span className="material-symbols-outlined text-rose-500">warning</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Track student tuition fees, overdue payments, and send automatic SMS or WhatsApp reminders.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Paid Fees</p>
                    <p className="text-[10px] text-on-surface-variant">{stats?.paidStudentsCount || 0} Student{(stats?.paidStudentsCount === 1 ? '' : 's')} cleared</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700">{stats?.paidPercentage || 0}%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                    !
                  </span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Overdue / Pending</p>
                    <p className="text-[10px] text-on-surface-variant">{stats?.pendingStudentsCount || 0} Student{(stats?.pendingStudentsCount === 1 ? '' : 's')} due</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600">{stats?.pendingPercentage || 0}%</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/reminders"
            className="mt-6 w-full bg-primary hover:bg-primary-container text-white font-headings font-bold py-3 rounded-full text-xs text-center transition-all shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Manage Reminders &amp; Notices
          </Link>
        </div>
      </div>

      {/* Recent Student Registrations Data Table */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-headings font-bold text-base text-secondary">
              Recent Student Admissions
            </h3>
            <p className="text-xs text-on-surface-variant">
              Latest enrolled students across Grade 8 - 12
            </p>
          </div>
          <Link
            to="/admin/students"
            className="text-xs font-headings font-bold text-primary hover:underline flex items-center gap-1"
          >
            View All Students
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Parent Contact</th>
                <th className="py-3 px-4">Monthly Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
              {recentStudents.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-on-surface">
                    {student.fullName}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-secondary">
                    {student.rollNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-surface-container font-bold text-[11px]">
                      {student.className}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant">
                    {student.parentPhone}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-on-surface">
                    ₹{(student.monthlyFee || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        student.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/admin/students/${student._id}`}
                      className="text-primary font-headings font-bold text-xs hover:underline"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
