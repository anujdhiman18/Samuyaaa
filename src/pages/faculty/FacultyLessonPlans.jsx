import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const mockLessonPlans = [
  {
    id: 'lp_1',
    teacherName: 'Prof. Anuj Dhiman',
    className: '10th',
    subject: 'Mathematics Advanced',
    topic: 'Quadratic Equations & Polynomial Graphs',
    submissionDate: '2026-08-04',
    status: 'Pending Review',
    duration: '4 Lectures (180 Mins)',
    materialsUrl: 'Quadratic_Lesson_Plan_v2.pdf',
    notes: 'Includes interactive GeoGebra graph demonstrations and quiz test.',
  },
  {
    id: 'lp_2',
    teacherName: 'Sunita Sharma',
    className: '11th (+1)',
    subject: 'Physics Advanced',
    topic: 'Newton’s Laws of Motion & Friction',
    submissionDate: '2026-08-02',
    status: 'Approved',
    duration: '5 Lectures (225 Mins)',
    materialsUrl: 'Physics_Unit3_Plan.pdf',
    notes: 'Approved by Senior Faculty. Lab experiment included on Day 3.',
  },
  {
    id: 'lp_3',
    teacherName: 'Rahul Verma',
    className: '12th (+2)',
    subject: 'Organic Chemistry',
    topic: 'Reaction Mechanisms & Alcohols',
    submissionDate: '2026-08-01',
    status: 'Revision Requested',
    duration: '6 Lectures',
    materialsUrl: 'Chemistry_Ch4.pdf',
    notes: 'Please add numerical practice problem set for JEE entrance standard.',
  },
];

export default function FacultyLessonPlans() {
  const [plans, setPlans] = useState(mockLessonPlans);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [remarks, setRemarks] = useState('');
  const { addToast } = useToast();

  const handleUpdateStatus = (id, newStatus) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, notes: remarks || p.notes } : p))
    );
    addToast(`Lesson plan status updated to "${newStatus}"!`, 'success');
    setSelectedPlan(null);
    setRemarks('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">🟢 Approved</span>;
      case 'Revision Requested':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">🟡 Revision Needed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">⏳ Pending Review</span>;
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-headings font-bold text-[10px] uppercase tracking-wider border border-purple-200">
            ⭐ Senior Faculty / HOD Capability
          </span>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">approval</span>
            Lesson Plan Approvals &amp; Review
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Review, guide, and approve daily curriculum lesson plans submitted by department faculty members.
          </p>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 space-y-4 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{plan.subject}</span>
                <h3 className="font-headings font-bold text-base text-secondary mt-1">{plan.topic}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Submitted by: <strong>{plan.teacherName}</strong> ({plan.className})</p>
              </div>
              {getStatusBadge(plan.status)}
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-xs text-on-surface-variant space-y-1">
              <div><strong className="text-secondary">Duration:</strong> {plan.duration}</div>
              <div><strong className="text-secondary">Submission Date:</strong> {plan.submissionDate}</div>
              {plan.notes && <div className="text-[11px] italic text-secondary border-t border-outline-variant/15 pt-1.5 mt-1.5">"{plan.notes}"</div>}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-primary underline font-bold cursor-pointer">
                📄 {plan.materialsUrl}
              </span>

              <button
                onClick={() => setSelectedPlan(plan)}
                className="px-3.5 py-1.5 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-sm transition-all"
              >
                Review &amp; Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full space-y-4 font-body">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-3">
              <h3 className="font-headings font-extrabold text-lg text-secondary">
                Review Lesson Plan: {selectedPlan.topic}
              </h3>
              <button onClick={() => setSelectedPlan(null)} className="text-on-surface-variant hover:text-secondary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Faculty Member:</strong> {selectedPlan.teacherName}</p>
              <p><strong>Subject &amp; Class:</strong> {selectedPlan.subject} ({selectedPlan.className})</p>
              <p><strong>Duration:</strong> {selectedPlan.duration}</p>
            </div>

            <div>
              <label className="font-headings font-bold text-xs text-secondary block mb-1">
                Supervisor Remarks &amp; Feedback Notes
              </label>
              <textarea
                rows={3}
                placeholder="Enter feedback or instructions for the teacher..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus(selectedPlan.id, 'Revision Requested')}
                className="px-4 py-2 rounded-full bg-amber-100 text-amber-900 font-headings font-bold text-xs hover:bg-amber-200"
              >
                Request Revision
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedPlan.id, 'Approved')}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white font-headings font-bold text-xs hover:bg-emerald-700 shadow-md"
              >
                Approve Lesson Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
