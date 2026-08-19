import React, { useState, useEffect } from 'react';
import { facultyPanelService, subjectService, getStoredSubjects } from '../../services/api';
import { sortClassList } from '../../config/classConfig';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CLASSES = ['S1', 'S2', 'S3', 'S4', '6th', '7th', '8th', '9th', '10th', '11th (+1)', '12th (+2)'];
const DEFAULT_SUBJECTS = ['Mathematics Advanced', 'Physics IIT-JEE Prep', 'Chemistry Foundation', 'Integrated Science', 'Biology', 'English Literature', 'Social Studies', 'Computer Science'];

export default function FacultyAssignments() {
  const { addToast } = useToast();
  const { user } = useAuth();

  const isAdmin = Boolean(
    user && (user.role === 'Admin' || user.role === 'SuperAdmin' || (Array.isArray(user.roles) && user.roles.includes('ADMIN')))
  );

  const [allSubjectsList, setAllSubjectsList] = useState([]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await subjectService.getSubjects();
        if (res && res.subjects && res.subjects.length > 0) {
          setAllSubjectsList(res.subjects);
        } else {
          setAllSubjectsList(getStoredSubjects() || []);
        }
      } catch (e) {
        setAllSubjectsList(getStoredSubjects() || []);
      }
    };
    loadSubjects();
  }, []);

  const responsibilities = user?.responsibilities || [];
  const userAssignedClasses = user?.assignedClasses || [];

  const rawUserClasses = responsibilities.length > 0
    ? Array.from(new Set(responsibilities.map((r) => r.className)))
    : userAssignedClasses;

  let availableClasses = [];
  if (isAdmin || rawUserClasses.length === 0) {
    const dynamicClasses = allSubjectsList.map((s) => s.className).filter(Boolean);
    availableClasses = sortClassList([...rawUserClasses, ...DEFAULT_CLASSES, ...dynamicClasses]);
  } else {
    availableClasses = sortClassList(rawUserClasses);
  }

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newClass, setNewClass] = useState(() => availableClasses[0] || 'S2');

  const userAssignedSubjects = user?.assignedSubjects || [];
  const userSubjects = responsibilities.length > 0
    ? Array.from(new Set(responsibilities.filter((r) => !newClass || r.className === newClass).map((r) => r.subject)))
    : userAssignedSubjects;

  const classSubjects = allSubjectsList
    .filter((s) => !newClass || s.className === newClass || s.className === 'All')
    .map((s) => s.name);

  let availableSubjects = [];
  if (isAdmin || userSubjects.length === 0) {
    availableSubjects = Array.from(new Set([...userSubjects, ...classSubjects, ...DEFAULT_SUBJECTS]));
  } else {
    availableSubjects = Array.from(new Set(userSubjects));
    if (availableSubjects.length === 0) {
      availableSubjects = Array.from(new Set([...classSubjects, ...DEFAULT_SUBJECTS]));
    }
  }

  const [newSubject, setNewSubject] = useState(() => availableSubjects[0] || 'Mathematics Advanced');
  const [newDueDate, setNewDueDate] = useState('2026-08-15');
  const [newMarks, setNewMarks] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (availableClasses.length > 0 && (!newClass || !availableClasses.includes(newClass))) {
      setNewClass(availableClasses[0]);
    }
  }, [availableClasses, user]);

  useEffect(() => {
    if (availableSubjects.length > 0 && (!newSubject || !availableSubjects.includes(newSubject))) {
      setNewSubject(availableSubjects[0]);
    }
  }, [newClass, availableSubjects, user]);

  // Review Submissions Modal
  const [reviewAssignment, setReviewAssignment] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await facultyPanelService.getAssignments();
      if (res && res.assignments) {
        setAssignments(res.assignments);
      }
    } catch (err) {
      console.warn('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await facultyPanelService.createAssignment({
        title: newTitle,
        description: newDesc,
        className: newClass,
        subject: newSubject,
        dueDate: newDueDate,
        totalMarks: Number(newMarks),
      });

      if (res && res.success) {
        addToast('New assignment created & published!', 'success');
        setCreateModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchAssignments();
      }
    } catch (err) {
      addToast('Error creating assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!reviewAssignment || !gradingSubmission) return;
    setSavingGrade(true);
    try {
      await facultyPanelService.gradeSubmission(
        reviewAssignment._id || reviewAssignment.id,
        gradingSubmission._id || gradingSubmission.id,
        gradeScore,
        gradeFeedback
      );

      addToast(`Graded submission for ${gradingSubmission.studentName}!`, 'success');
      setGradingSubmission(null);
      fetchAssignments();
    } catch (err) {
      addToast('Error saving grade', 'error');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
            Assignments & Grading
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Create class assignments, track due dates, review student submissions, & grade work.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Assignment
        </button>
      </div>

      {/* Assignment Cards List */}
      {loading ? (
        <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-white rounded-2xl border border-outline-variant/15">
          No assignments created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => {
            const submittedCount = (a.submissions || []).filter((s) => s.status === 'Submitted').length;
            const gradedCount = (a.submissions || []).filter((s) => s.status === 'Graded').length;

            return (
              <div
                key={a._id || a.id}
                className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                      {a.className} &bull; {a.subject}
                    </span>
                    <span className="text-[11px] font-bold text-rose-700">Due: {a.dueDate}</span>
                  </div>
                  <h3 className="font-headings font-extrabold text-base text-secondary">{a.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{a.description}</p>
                </div>

                <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between">
                  <div className="text-xs font-bold text-secondary">
                    Submissions: <span className="text-emerald-700">{gradedCount} Graded</span> &bull;{' '}
                    <span className="text-amber-700">{submittedCount} Pending</span>
                  </div>
                  <button
                    onClick={() => setReviewAssignment(a)}
                    className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-bold transition-colors"
                  >
                    Review Submissions ({a.submissions?.length || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Class Assignment"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 font-body">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="e.g. Differentiation Chapter Practice Problems"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="Detailed instructions for students..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Class</label>
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Subject</label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Due Date</label>
              <input
                type="date"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Total Marks</label>
              <input
                type="number"
                value={newMarks}
                onChange={(e) => setNewMarks(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Submissions Modal */}
      {reviewAssignment && (
        <Modal
          isOpen={Boolean(reviewAssignment)}
          onClose={() => setReviewAssignment(null)}
          title={`Submissions: ${reviewAssignment.title}`}
        >
          <div className="space-y-4 font-body">
            {!reviewAssignment.submissions || reviewAssignment.submissions.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-6">
                No student submissions received for this assignment yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {reviewAssignment.submissions.map((sub) => (
                  <div
                    key={sub._id || sub.id}
                    className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest flex justify-between items-center gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-secondary">{sub.studentName}</h4>
                      <p className="text-[11px] text-on-surface-variant font-mono">
                        Roll: {sub.rollNumber} &bull; Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                      {sub.status === 'Graded' && (
                        <p className="text-xs font-extrabold text-emerald-700 mt-1">
                          Score: {sub.score} / {reviewAssignment.totalMarks} (Feedback: "{sub.feedback}")
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        View PDF
                      </a>
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeScore(sub.score || '');
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm"
                      >
                        Grade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Grade Single Submission Modal */}
      {gradingSubmission && (
        <Modal
          isOpen={Boolean(gradingSubmission)}
          onClose={() => setGradingSubmission(null)}
          title={`Grade Submission - ${gradingSubmission.studentName}`}
        >
          <form onSubmit={handleGradeSubmission} className="space-y-4 font-body">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Score / Marks</label>
              <input
                type="number"
                required
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
                placeholder="e.g. 45"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Feedback Remarks</label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
                placeholder="Provide constructive feedback..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-5 py-2 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingGrade}
                className="bg-emerald-600 text-white font-bold text-xs px-6 py-2 rounded-full shadow-premium hover:bg-emerald-700"
              >
                {savingGrade ? 'Saving...' : 'Submit Grade'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
