import React from 'react';

export default function FacultyDepartmentAnalytics() {
  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-headings font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
            👑 Head of Department (HOD) Capability
          </span>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
            Departmental Performance Analytics &amp; Workload
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Department-wide student performance metrics, faculty workload distribution, and pass rate analytics.
          </p>
        </div>

        <button className="bg-primary text-white font-headings font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-md hover:bg-primary-container">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export Dept Report (PDF)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">Total Dept Students</span>
          <div className="font-headings font-extrabold text-2xl text-secondary">420 Students</div>
          <span className="text-[11px] text-emerald-600 font-bold">↑ 96.4% Active Attendance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">Average Test Score</span>
          <div className="font-headings font-extrabold text-2xl text-primary">84.5%</div>
          <span className="text-[11px] text-emerald-600 font-bold">↑ +3.2% vs last term</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">Active Department Faculty</span>
          <div className="font-headings font-extrabold text-2xl text-secondary">8 Members</div>
          <span className="text-[11px] text-purple-700 font-bold">12 Active Batches</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-outline-variant/15 space-y-2">
          <span className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">Pass Percentage</span>
          <div className="font-headings font-extrabold text-2xl text-emerald-700">98.2%</div>
          <span className="text-[11px] text-emerald-600 font-bold">Top Performing Dept</span>
        </div>
      </div>

      {/* Workload Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 p-6 space-y-4">
        <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">badge</span>
          Faculty Workload &amp; Class Allocation Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase text-on-surface-variant bg-surface-container-low">
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Assigned Classes</th>
                <th className="py-3 px-4">Weekly Hours</th>
                <th className="py-3 px-4 text-right">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 font-medium text-secondary">
              <tr>
                <td className="py-3 px-4 font-bold">Prof. Jitender Sharma</td>
                <td className="py-3 px-4">Senior Faculty</td>
                <td className="py-3 px-4 font-mono">10th, 11th (+1), 12th (+2)</td>
                <td className="py-3 px-4 font-mono font-bold">18 Hrs/Wk</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Optimal</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">Sunita Sharma</td>
                <td className="py-3 px-4">Subject Teacher</td>
                <td className="py-3 px-4 font-mono">9th, 10th Section A &amp; B</td>
                <td className="py-3 px-4 font-mono font-bold">22 Hrs/Wk</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">High Workload</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold">Rahul Verma</td>
                <td className="py-3 px-4">Assistant Teacher</td>
                <td className="py-3 px-4 font-mono">11th (+1) Chemistry Lab</td>
                <td className="py-3 px-4 font-mono font-bold">14 Hrs/Wk</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">Available</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
