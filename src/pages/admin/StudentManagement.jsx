import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  studentService,
  studentApplicationService,
  subscribeFirestoreCollection,
  initialMockStudents,
  getStoredStudents,
  initialMockStudentApplications,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { CLASS_CATEGORIES, formatClassLabel } from '../../config/classConfig';

const CLASSES = ['All', ...CLASS_CATEGORIES.map((c) => c.code)];
const BRANCHES = ['All', 'Bagru', 'Daroh'];

const initialStudentForm = {
  fullName: '',
  admissionNumber: '',
  fatherName: '',
  motherName: '',
  phone: '',
  parentPhone: '',
  email: '',
  password: 'Student123',
  address: '',
  className: 'S2',
  subjects: ['Mathematics Advanced'],
  batch: '2024-2026',
  branch: 'Bagru',
  rollNumber: '',
  photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  monthlyFee: 2500,
  monthlyDueDay: 5,
  status: 'Active',
};

export default function StudentManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'directory';
  const [activeTab, setActiveTab] = useState(initialTab); // 'directory' | 'applications'

  // Student Directory State
  const [students, setStudents] = useState(() => {
    try {
      return getStoredStudents() || initialMockStudents;
    } catch (e) {
      return initialMockStudents;
    }
  });
  const [loading, setLoading] = useState(false);

  // Student Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appFilterStatus, setAppFilterStatus] = useState('All');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingApp, setUpdatingApp] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Add Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialStudentForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete modal state
  const [deleteTargetApp, setDeleteTargetApp] = useState(null);
  const [deletingApp, setDeletingApp] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribeStudents = subscribeFirestoreCollection('students', initialMockStudents, (list) => {
      if (list) {
        setStudents(list);
        setLoading(false);
      }
    });

    const unsubscribeApps = subscribeFirestoreCollection(
      'student_applications',
      initialMockStudentApplications,
      (list) => {
        if (list) {
          setApplications(list);
          setLoadingApps(false);
        }
      }
    );

    fetchStudents();
    fetchApplications();

    return () => {
      unsubscribeStudents();
      unsubscribeApps();
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenAdd();
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents({ limit: 200 });
      if (data && data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await studentApplicationService.getApplications();
      if (res && res.applications) {
        setApplications(res.applications);
      }
    } catch (err) {
      console.error('Error fetching student applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    setUpdatingApp(true);
    try {
      const res = await studentApplicationService.updateApplicationStatus(appId, newStatus, adminNotes);
      if (res.success) {
        addToast(`Application status updated to "${newStatus}"`, 'success');
        if (selectedApp) {
          setSelectedApp((prev) => (prev ? { ...prev, status: newStatus, notes: adminNotes } : null));
        }
        fetchApplications();
      } else {
        addToast('Failed to update status', 'error');
      }
    } catch (err) {
      addToast('Error updating application status', 'error');
    } finally {
      setUpdatingApp(false);
    }
  };

  const handleApproveAndEnroll = async (app) => {
    if (!app) return;
    setUpdatingApp(true);
    try {
      await studentApplicationService.approveAndConvertToStudent(app);
      addToast(`Approved & enrolled ${app.fullName} to Student Directory!`, 'success');
      setSelectedApp(null);
      fetchStudents();
      fetchApplications();
      setActiveTab('directory');
    } catch (err) {
      addToast('Error enrolling student: ' + err.message, 'error');
    } finally {
      setUpdatingApp(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!deleteTargetApp) return;
    setDeletingApp(true);
    try {
      await studentApplicationService.deleteApplication(deleteTargetApp._id || deleteTargetApp.id);
      addToast('Application deleted successfully', 'info');
      setDeleteTargetApp(null);
      if (selectedApp && (selectedApp._id === deleteTargetApp._id || selectedApp.id === deleteTargetApp.id)) {
        setSelectedApp(null);
      }
      fetchApplications();
    } catch (err) {
      addToast('Failed to delete application', 'error');
    } finally {
      setDeletingApp(false);
    }
  };

  const generateAutoRollNumber = (className, currentStudents) => {
    const classCode = className ? className.replace(/\D/g, '') || '10' : '10';
    const prefix = `SAU-${classCode.padStart(2, '0')}-`;
    let maxSeq = 0;
    currentStudents.forEach((s) => {
      if (s.rollNumber && s.rollNumber.startsWith(prefix)) {
        const match = s.rollNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
    });
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}${nextSeq}`;
  };

  const generateAutoAdmissionNumber = (currentStudents) => {
    const year = new Date().getFullYear();
    const count = currentStudents.length + 1;
    return `ADM-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    const autoRoll = generateAutoRollNumber('10th', students);
    const autoAdmission = generateAutoAdmissionNumber(students);
    setForm({
      ...initialStudentForm,
      rollNumber: autoRoll,
      admissionNumber: autoAdmission,
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      addToast('Please fill in required student fields.', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      await studentService.createStudent(form);
      addToast(`Added new student "${form.fullName}" successfully!`, 'success');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Error saving student', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    return list.filter((s) => {
      if (!s) return false;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q));

      const matchClass = selectedClass === 'All' || s.className === selectedClass;
      const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;

      return matchSearch && matchClass && matchBranch;
    });
  }, [students, search, selectedClass, selectedBranch]);

  // Filtered Applications List
  const filteredApplications = useMemo(() => {
    const list = Array.isArray(applications) ? applications : [];
    return list.filter((a) => {
      if (!a) return false;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (a.fullName && a.fullName.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
        (a.parentName && a.parentName.toLowerCase().includes(q));

      const matchStatus = appFilterStatus === 'All' || a.status === appFilterStatus;

      return matchSearch && matchStatus;
    });
  }, [applications, search, appFilterStatus]);

  const pendingAppsCount = useMemo(() => {
    return (applications || []).filter((a) => a.status === 'Pending').length;
  }, [applications]);

  return (
    <div className="space-y-6 font-body">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Student Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Manage enrolled students directory, online admissions, and candidate applications.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-surface-container p-1 rounded-full border border-outline-variant/20 flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('directory');
              setSearchParams({ tab: 'directory' });
            }}
            className={`px-4 py-2 rounded-full text-xs font-headings font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>Student Directory ({students.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('applications');
              setSearchParams({ tab: 'applications' });
            }}
            className={`px-4 py-2 rounded-full text-xs font-headings font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>Student Applications</span>
            {pendingAppsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                {pendingAppsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: ENROLLED STUDENT DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/60">
                search
              </span>
              <input
                type="text"
                placeholder="Search by student name, Roll No, or Admission ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-body focus:outline-none focus:border-secondary transition-all bg-surface-container-lowest"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-secondary focus:outline-none"
              >
                <option value="All">All Categories</option>
                {CLASS_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-secondary focus:outline-none"
              >
                <option value="All">All Branches</option>
                {BRANCHES.filter((b) => b !== 'All').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-surface-container rounded-xl p-1 border border-outline-variant/20">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                  title="Grid View"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                  title="List View"
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                </button>
              </div>

              <button
                onClick={handleOpenAdd}
                className="bg-primary text-white font-headings font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Add Student
              </button>
            </div>
          </div>

          {/* Students Content */}
          {loading ? (
            <div className="bg-white p-12 rounded-2xl text-center shadow-premium">
              <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin inline-block mb-3"></span>
              <p className="text-xs font-bold text-secondary">Loading Students Directory...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center shadow-premium border border-outline-variant/15">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
                sentiment_dissatisfied
              </span>
              <p className="text-sm font-bold text-secondary">No Students Found</p>
              <p className="text-xs text-on-surface-variant mt-1">Try adjusting your search query or filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student._id || student.id}
                  onClick={() => navigate(`/admin/students/${student._id || student.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-premium border border-outline-variant/15 hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                      alt={student.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-outline-variant/30 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headings font-bold text-sm text-secondary truncate group-hover:text-primary transition-colors">
                        {student.fullName}
                      </h3>
                      <p className="text-[11px] font-mono text-on-surface-variant truncate">
                        {student.rollNumber || student.admissionNumber || 'ID Pending'}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {formatClassLabel(student.className)} &bull; {student.branch || 'Bagru'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs text-on-surface-variant">
                    <div>
                      <span className="block text-[10px] font-medium text-on-surface-variant/70">Parent:</span>
                      <span className="font-bold text-secondary text-[11px] truncate max-w-[120px] block">
                        {student.fatherName || student.motherName || 'N/A'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-1 transition-transform">
                      chevron_right
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/60 border-b border-outline-variant/15 text-[11px] font-headings font-bold uppercase text-on-surface-variant">
                      <th className="p-4">Student</th>
                      <th className="p-4">Roll / Admission ID</th>
                      <th className="p-4">Class</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Parent Name</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs">
                    {filteredStudents.map((s) => (
                      <tr key={s._id || s.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                            alt={s.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-bold text-secondary">{s.fullName}</span>
                        </td>
                        <td className="p-4 font-mono text-primary font-bold">{s.rollNumber || s.admissionNumber}</td>
                        <td className="p-4">{formatClassLabel(s.className)}</td>
                        <td className="p-4">{s.branch || 'Bagru'}</td>
                        <td className="p-4 text-on-surface-variant">{s.fatherName || s.motherName || 'N/A'}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/students/${s._id || s.id}`)}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: STUDENT APPLICATIONS MANAGEMENT */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Applications Toolbar */}
          <div className="bg-white p-4 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/60">
                search
              </span>
              <input
                type="text"
                placeholder="Search candidate name, email, or App ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-body focus:outline-none focus:border-secondary transition-all bg-surface-container-lowest"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs font-bold text-on-surface-variant">Status Filter:</span>
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full border border-outline-variant/20">
                {['All', 'Pending', 'Under Review', 'Approved', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAppFilterStatus(st)}
                    className={`px-3 py-1 rounded-full text-xs font-headings font-bold transition-all cursor-pointer ${
                      appFilterStatus === st
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-secondary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applications Table */}
          {loadingApps ? (
            <div className="bg-white p-12 rounded-2xl text-center shadow-premium">
              <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin inline-block mb-3"></span>
              <p className="text-xs font-bold text-secondary">Loading Student Applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center shadow-premium border border-outline-variant/15">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
                inbox
              </span>
              <p className="text-sm font-bold text-secondary">No Applications Found</p>
              <p className="text-xs text-on-surface-variant mt-1">No candidate student applications match the selected criteria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/60 border-b border-outline-variant/15 text-[11px] font-headings font-bold uppercase text-on-surface-variant">
                      <th className="p-4">App ID</th>
                      <th className="p-4">Candidate Name</th>
                      <th className="p-4">Class Applying For</th>
                      <th className="p-4">Parent & Contact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Applied Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs">
                    {filteredApplications.map((app) => (
                      <tr key={app._id || app.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">{app.applicationId || app.id}</td>
                        <td className="p-4">
                          <span className="font-bold text-secondary block">{app.fullName}</span>
                          <span className="text-[11px] text-on-surface-variant">{app.email}</span>
                        </td>
                        <td className="p-4 font-bold text-secondary">{formatClassLabel(app.targetClass)}</td>
                        <td className="p-4">
                          <span className="block font-bold text-secondary">{app.parentName}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">{app.parentContact}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block ${
                              app.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : app.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                : app.status === 'Under Review'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setAdminNotes(app.notes || '');
                              }}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all cursor-pointer"
                            >
                              Review Details
                            </button>
                            <button
                              onClick={() => setDeleteTargetApp(app)}
                              className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Application"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add New Student */}
      {isModalOpen && (
        <Modal title="Add New Student to Directory" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSaveStudent} className="space-y-4 text-xs font-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-secondary mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Class / Grade *</label>
                <select
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary focus:outline-none focus:border-secondary font-bold"
                >
                  {CLASS_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Roll Number</label>
                <input
                  type="text"
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Admission Number</label>
                <input
                  type="text"
                  value={form.admissionNumber}
                  onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Father's Name</label>
                <input
                  type="text"
                  value={form.fatherName}
                  onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  placeholder="Parent / Guardian Name"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Student Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Parent Phone</label>
                <input
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-6 py-2 rounded-full bg-primary text-white font-bold hover:bg-primary-container shadow-md"
              >
                {formSubmitting ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Review Student Application Details */}
      {selectedApp && (
        <Modal title={`Student Application: ${selectedApp.applicationId || selectedApp.id}`} onClose={() => setSelectedApp(null)}>
          <div className="space-y-4 text-xs font-body">
            <div className="bg-surface-container/60 p-4 rounded-2xl border border-outline-variant/15 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headings font-bold text-base text-secondary">{selectedApp.fullName}</h3>
                  <p className="text-on-surface-variant">{selectedApp.email} &bull; {selectedApp.contactNumber}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    selectedApp.status === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : selectedApp.status === 'Rejected'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      : selectedApp.status === 'Under Review'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}
                >
                  {selectedApp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/15">
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Class Applying For:</span>
                  <span className="font-bold text-secondary">{formatClassLabel(selectedApp.targetClass)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Previous School:</span>
                  <span className="font-bold text-secondary">{selectedApp.previousSchool || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Parent / Guardian:</span>
                  <span className="font-bold text-secondary">{selectedApp.parentName} ({selectedApp.parentContact})</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Subjects of Interest:</span>
                  <span className="font-bold text-secondary">
                    {Array.isArray(selectedApp.subjects) ? selectedApp.subjects.join(', ') : selectedApp.subjects || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedApp.message && (
                <div className="pt-2 border-t border-outline-variant/15">
                  <span className="text-on-surface-variant block text-[11px] mb-0.5">Reason / Message:</span>
                  <p className="bg-white p-2.5 rounded-xl border border-outline-variant/20 leading-relaxed text-secondary">
                    "{selectedApp.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block font-bold text-secondary mb-1">Admin Internal Remarks / Notes</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for candidate counselling or admission status..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-secondary focus:outline-none focus:border-secondary"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-on-surface-variant mr-1">Set Status:</span>
                <button
                  disabled={updatingApp}
                  onClick={() => handleUpdateAppStatus(selectedApp._id || selectedApp.id, 'Under Review')}
                  className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Under Review
                </button>
                <button
                  disabled={updatingApp}
                  onClick={() => handleUpdateAppStatus(selectedApp._id || selectedApp.id, 'Rejected')}
                  className="px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-700 hover:bg-rose-500 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Reject
                </button>
              </div>

              <button
                disabled={updatingApp}
                onClick={() => handleApproveAndEnroll(selectedApp)}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white font-headings font-bold text-xs hover:bg-emerald-700 shadow-md transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                Approve & Enroll as Student
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTargetApp && (
        <ConfirmModal
          title="Delete Application"
          message={`Are you sure you want to delete the student application for "${deleteTargetApp.fullName}" (${deleteTargetApp.applicationId})? This action cannot be undone.`}
          confirmText={deletingApp ? 'Deleting...' : 'Delete Application'}
          onConfirm={handleDeleteApplication}
          onCancel={() => setDeleteTargetApp(null)}
        />
      )}
    </div>
  );
}
