import React, { useState, useEffect } from 'react';
import { facultyService, facultyApplicationService, credentialRequestService, getStoredFaculty } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const initialForm = {
  name: '',
  email: '',
  password: 'faculty123',
  phone: '9816099999',
  designation: 'Senior Faculty Member',
  department: 'Science & Mathematics',
  subject: 'Mathematics Advanced',
  qualification: 'Master’s Degree',
  experience: '5+ Years',
  branch: 'Bagru',
  assignedClasses: ['10th', '11th (+1)'],
  assignedSubjects: ['Mathematics Advanced'],
  photo_url: '',
  display_order: 1,
  is_active: true,
};

export default function FacultyManagement() {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'applications' | 'requests'

  // Credential Requests State
  const [credentialRequests, setCredentialRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Faculty Directory State
  const [facultyList, setFacultyList] = useState(() => {
    try {
      return getStoredFaculty() || [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appFilterStatus, setAppFilterStatus] = useState('All');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingApp, setUpdatingApp] = useState(false);

  // Faculty Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // File upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Academic Responsibilities Management Modal State
  const [respMember, setRespMember] = useState(null);
  const [respTab, setRespTab] = useState('assigned'); // 'assigned' | 'add' | 'audit'
  const [course, setCourse] = useState('Science (PCM)');
  const [batch, setBatch] = useState('Batch A (Morning)');
  const [className, setClassName] = useState('10th');
  const [semester, setSemester] = useState('Term 1');
  const [section, setSection] = useState('Section A');
  const [subject, setSubject] = useState('Mathematics Advanced');
  const [academicSession, setAcademicSession] = useState('2026-2027');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBulkClasses, setSelectedBulkClasses] = useState(['10th', '11th (+1)']);
  const [selectedBulkSections, setSelectedBulkSections] = useState(['Section A']);
  const [assigningResp, setAssigningResp] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchFaculty();
    fetchApplications();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await facultyService.getFaculty();
      if (res && res.faculty) {
        setFacultyList(res.faculty);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch faculty list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await facultyApplicationService.getApplications();
      if (res && res.applications) {
        setApplications(res.applications);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch applications', 'error');
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await credentialRequestService.getRequests();
      if (res && res.requests) {
        setCredentialRequests(res.requests);
      }
    } catch (err) {
      console.warn('Error fetching credential requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleProcessCredentialRequest = async (requestId, action) => {
    try {
      const res = await credentialRequestService.processRequest(requestId, action, `Admin ${action.toLowerCase()} credential update.`);
      if (res && res.success) {
        addToast(`Credential change request ${action.toLowerCase()}!`, 'success');
        fetchRequests();
        fetchFaculty();
      }
    } catch (err) {
      addToast('Error processing request', 'error');
    }
  };

  const handleOpenResponsibilities = (member) => {
    setRespMember(member);
    setRespTab('assigned');
    setIsBulkMode(false);
  };

  const handleAssignResponsibilitiesSubmit = async (e) => {
    e.preventDefault();
    if (!respMember) return;

    setAssigningResp(true);
    try {
      let itemsToAssign = [];
      if (isBulkMode) {
        // Generate Cartesian product of selectedBulkClasses x selectedBulkSections
        selectedBulkClasses.forEach((cls) => {
          selectedBulkSections.forEach((sec) => {
            itemsToAssign.push({
              course,
              batch,
              className: cls,
              semester,
              section: sec,
              subject,
              academicSession,
            });
          });
        });
      } else {
        itemsToAssign.push({
          course,
          batch,
          className,
          semester,
          section,
          subject,
          academicSession,
        });
      }

      const id = respMember._id || respMember.id;
      const res = await facultyService.assignResponsibilities(id, itemsToAssign, 'System Admin');

      if (res && res.success) {
        addToast(res.message, res.addedCount > 0 ? 'success' : 'info');
        setRespMember(res.faculty || respMember);
        setRespTab('assigned');
        fetchFaculty();
      } else {
        addToast(res.message || 'Error assigning responsibilities', 'error');
      }
    } catch (err) {
      addToast('Error assigning responsibilities', 'error');
    } finally {
      setAssigningResp(false);
    }
  };

  const handleRevokeResponsibility = async (respId) => {
    if (!respMember) return;
    try {
      const id = respMember._id || respMember.id;
      const res = await facultyService.removeResponsibility(id, respId, 'System Admin');
      if (res && res.success) {
        addToast('Academic responsibility revoked successfully!', 'success');
        setRespMember(res.faculty || respMember);
        fetchFaculty();
      }
    } catch (err) {
      addToast('Error revoking responsibility', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm({ ...initialForm, display_order: facultyList.length + 1 });
    setPreviewUrl('');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name || '',
      email: member.email || '',
      password: member.password || 'faculty123',
      phone: member.phone || '9816099999',
      designation: member.designation || 'Senior Faculty Member',
      department: member.department || 'Science & Mathematics',
      subject: member.subject || 'Mathematics Advanced',
      qualification: member.qualification || 'Master’s Degree',
      experience: member.experience || '5+ Years',
      assignedClasses: member.assignedClasses || ['10th', '11th (+1)'],
      assignedSubjects: member.assignedSubjects || [member.subject || 'Mathematics Advanced'],
      photo_url: member.photo_url || '',
      display_order: member.display_order !== undefined ? member.display_order : 1,
      is_active: member.is_active !== undefined ? Boolean(member.is_active) : true,
    });
    setPreviewUrl(member.photo_url || '');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Validation Error: Only JPG, PNG, and WEBP files are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Validation Error: Photo size must be 5MB or less.', 'error');
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    setUploading(true);
    setUploadProgress(10);

    try {
      const uploadedUrl = await facultyService.uploadFacultyPhoto(file, (progress) => {
        setUploadProgress(progress);
      });
      setForm((prev) => ({ ...prev, photo_url: uploadedUrl }));
      addToast('Faculty photo uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload Failed: Failed to upload image', 'error');
      setPreviewUrl(form.photo_url || '');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      addToast('Validation Error: Faculty Name is required.', 'error');
      return;
    }

    if (!form.photo_url) {
      addToast('Validation Error: Faculty Photo is required.', 'error');
      return;
    }

    setSaving(true);

    try {
      if (editingMember) {
        const id = editingMember.id || editingMember._id;
        await facultyService.updateFaculty(id, form);
        addToast('Faculty Updated successfully!', 'success');
      } else {
        await facultyService.createFaculty(form);
        addToast('Faculty Added successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err) {
      addToast(err.message || 'Error saving faculty member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const id = deleteTarget.id || deleteTarget._id;
      await facultyService.deleteFaculty(id, deleteTarget.photo_url);
      addToast('Faculty Deleted successfully!', 'success');
      setDeleteTarget(null);
      fetchFaculty();
    } catch (err) {
      addToast(err.message || 'Failed to delete faculty member', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Application Handlers
  const handleOpenAppDetails = (app) => {
    setSelectedApp(app);
    setAdminNotes(app.notes || '');
  };

  const handleUpdateAppStatus = async (status, targetApp = selectedApp) => {
    if (!targetApp) return;
    setUpdatingApp(true);
    try {
      const res = await facultyApplicationService.updateApplicationStatus(
        targetApp._id || targetApp.id,
        status,
        adminNotes
      );
      addToast(
        res.message || `Application status set to "${status}" & candidate (${targetApp.email}) notified via email!`,
        'success'
      );
      if (selectedApp && (selectedApp._id === targetApp._id || selectedApp.id === targetApp.id)) {
        setSelectedApp(null);
      }
      fetchApplications();
    } catch (err) {
      addToast('Failed to update status', 'error');
    } finally {
      setUpdatingApp(false);
    }
  };

  const handleApproveAndOnboard = async () => {
    if (!selectedApp) return;
    setUpdatingApp(true);
    try {
      await facultyApplicationService.approveAndConvertToFaculty(selectedApp);
      addToast(`Applicant ${selectedApp.fullName} approved & onboarded to Active Faculty Directory!`, 'success');
      setSelectedApp(null);
      fetchApplications();
      fetchFaculty();
    } catch (err) {
      addToast(err.message || 'Failed to onboard faculty member', 'error');
    } finally {
      setUpdatingApp(false);
    }
  };

  const handleDeleteApp = async (appId) => {
    try {
      await facultyApplicationService.deleteApplication(appId);
      addToast('Application record deleted', 'info');
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      addToast('Failed to delete application', 'error');
    }
  };

  const filteredApplications = applications.filter((a) => {
    if (appFilterStatus === 'All') return true;
    return a.status === appFilterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'Shortlisted':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl text-secondary">Faculty Portal Management</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage active academic faculty directory and review candidate recruitment joining applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary-container text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center justify-center gap-2 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all shadow-tactile-btn cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            + Add Faculty Member
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-outline-variant/20 gap-4">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-xs font-headings font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'directory'
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          Active Faculty Directory ({facultyList.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-xs font-headings font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'applications'
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
          Faculty Applications ({applications.length})
          {applications.filter((a) => a.status === 'Pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {applications.filter((a) => a.status === 'Pending').length} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-headings font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'requests'
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          Credential Requests ({credentialRequests.filter((r) => r.status === 'Pending').length})
          {credentialRequests.filter((r) => r.status === 'Pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {credentialRequests.filter((r) => r.status === 'Pending').length} pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE FACULTY DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-premium overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="space-y-2">
                      <div className="w-40 h-4 bg-slate-200 rounded" />
                      <div className="w-24 h-3 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : facultyList.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
                badge
              </span>
              <h3 className="font-headings font-bold text-base text-secondary">No Faculty Members Found</h3>
              <p className="text-xs text-on-surface-variant mt-1 mb-4">
                Get started by adding your first academic faculty profile.
              </p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-tactile-btn cursor-pointer"
              >
                + Add Faculty
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low/80 text-on-surface-variant font-headings font-bold border-b border-outline-variant/15">
                    <th className="py-3.5 px-4">Instructor Details</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Qualification</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {facultyList.map((member) => (
                    <tr key={member.id || member._id} className="hover:bg-surface-container-lowest/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.photo_url}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shrink-0"
                          />
                          <div>
                            <p className="font-headings font-bold text-secondary text-sm">{member.name}</p>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              {member.designation}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-primary-fixed/50 text-primary font-semibold text-[11px]">
                          {member.subject}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                        {member.qualification}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                        {member.experience}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-headings font-bold uppercase tracking-wider ${
                            member.is_active
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                          }`}
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenResponsibilities(member)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                            title="Assign & Manage Academic Responsibilities"
                          >
                            <span className="material-symbols-outlined text-[14px]">assignment_add</span>
                            Responsibilities ({member.responsibilities?.length || 0})
                          </button>
                          <a
                            href="/faculty"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Open Faculty Portal"
                          >
                            <span className="material-symbols-outlined text-[14px]">co_present</span>
                            Portal
                          </a>
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                            title="Edit Faculty & Credentials"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Faculty"
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
          )}
        </div>
      )}

      {/* TAB 2: FACULTY APPLICATIONS MANAGEMENT */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Applications Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['All', 'Pending', 'Under Review', 'Shortlisted', 'Approved', 'Rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppFilterStatus(st)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-headings font-bold transition-all cursor-pointer ${
                    appFilterStatus === st
                      ? 'bg-secondary text-white shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs font-headings text-on-surface-variant font-medium">
              Showing {filteredApplications.length} of {applications.length} applications
            </span>
          </div>

          {/* Applications List Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-premium overflow-hidden">
            {loadingApps ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">Loading application records...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
                  folder_off
                </span>
                <h3 className="font-headings font-bold text-base text-secondary">No Applications Found</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  There are currently no candidate applications under this filter status.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/80 text-on-surface-variant font-headings font-bold border-b border-outline-variant/15">
                      <th className="py-3.5 px-4">Ref ID</th>
                      <th className="py-3.5 px-4">Applicant</th>
                      <th className="py-3.5 px-4">Position Applied</th>
                      <th className="py-3.5 px-4">Experience</th>
                      <th className="py-3.5 px-4">Applied Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredApplications.map((app) => (
                      <tr key={app.id || app._id} className="hover:bg-surface-container-lowest/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          {app.applicationId || app.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-headings font-bold text-secondary text-sm">{app.fullName}</p>
                            <p className="text-[11px] text-on-surface-variant">{app.email} &bull; {app.contactNumber}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface">
                          {app.positionApplied}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface-variant">
                          {app.totalExperience}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                          {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={app.status}
                            disabled={updatingApp}
                            onChange={(e) => handleUpdateAppStatus(e.target.value, app)}
                            className={`text-[10px] font-headings font-bold py-1 px-2.5 rounded-full border focus:outline-none cursor-pointer ${getStatusBadge(app.status)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Approved">Approved / Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAppDetails(app)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full font-headings font-bold text-xs transition-all flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Review App
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CREDENTIAL CHANGE REQUESTS (ADMIN PERMISSION) */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-premium overflow-hidden">
          {loadingRequests ? (
            <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
              Loading credential requests...
            </div>
          ) : credentialRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-on-surface-variant">
              No pending credential change requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low text-[11px]">
                    <th className="py-3.5 px-4">Requester Name</th>
                    <th className="py-3.5 px-4">User Type</th>
                    <th className="py-3.5 px-4">Request Type</th>
                    <th className="py-3.5 px-4">Current Username / Password</th>
                    <th className="py-3.5 px-4">Requested New Value</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Admin Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-body">
                  {credentialRequests.map((req) => (
                    <tr key={req._id || req.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4 font-bold text-secondary">
                        {req.facultyName || req.studentName || 'Faculty Member'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                          {req.userType || 'Faculty'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-secondary">{req.requestType}</td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant">{req.oldValue || '••••••••'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">{req.newValue}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {req.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleProcessCredentialRequest(req._id || req.id, 'Approved')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessCredentialRequest(req._id || req.id, 'Rejected')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-bold text-on-surface-variant">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* APPLICATION DETAILS & REVIEW MODAL */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Faculty Application: ${selectedApp.applicationId || selectedApp.id}`}
        >
          <div className="space-y-6 font-body text-xs text-on-surface">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-low p-4 rounded-2xl gap-3">
              <div>
                <h3 className="font-headings font-extrabold text-lg text-secondary">{selectedApp.fullName}</h3>
                <p className="text-xs text-on-surface-variant">{selectedApp.email} &bull; {selectedApp.contactNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-headings font-bold border ${getStatusBadge(selectedApp.status)}`}>
                Status: {selectedApp.status}
              </span>
            </div>

            {/* Grid breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
                <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">Personal Details</h4>
                <p><strong>DOB & Gender:</strong> {selectedApp.dob} ({selectedApp.gender})</p>
                <p><strong>Current Address:</strong> {selectedApp.currentAddress}</p>
                <p><strong>Permanent Address:</strong> {selectedApp.permanentAddress}</p>
              </div>

              <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
                <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">Educational Qualifications</h4>
                <p><strong>Highest Degree:</strong> {selectedApp.highestDegree}</p>
                <p><strong>Institution:</strong> {selectedApp.universityName} ({selectedApp.graduationYear})</p>
                <p><strong>Specialization:</strong> {selectedApp.specialization}</p>
                <p><strong>Certifications:</strong> {selectedApp.certifications || 'None'}</p>
              </div>

              <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
                <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">Experience & Teaching</h4>
                <p><strong>Teaching Exp:</strong> {selectedApp.totalExperience}</p>
                <p><strong>Prior Institutes:</strong> {selectedApp.previousInstitutions}</p>
                <p><strong>Subjects Taught:</strong> {selectedApp.subjectsTaught}</p>
                <p><strong>Employment Status:</strong> {selectedApp.currentStatus}</p>
              </div>

              <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
                <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">Position & Shift</h4>
                <p><strong>Role Applied:</strong> {selectedApp.positionApplied}</p>
                <p><strong>Expertise:</strong> {Array.isArray(selectedApp.subjectsExpertise) ? selectedApp.subjectsExpertise.join(', ') : selectedApp.subjectsExpertise}</p>
                <p><strong>Preferred Shift:</strong> {selectedApp.preferredTimeSlot}</p>
                <p><strong>Expected Joining:</strong> {selectedApp.expectedJoiningDate}</p>
              </div>
            </div>

            {/* Statement & Skills */}
            <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
              <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">Statement of Purpose</h4>
              <p className="italic text-on-surface-variant leading-relaxed font-light">"{selectedApp.whyJoinReason}"</p>
              {selectedApp.skillsAchievements && (
                <div className="pt-2">
                  <strong>Special Skills & Achievements:</strong> {selectedApp.skillsAchievements}
                </div>
              )}
            </div>

            {/* References */}
            {selectedApp.references && selectedApp.references.length > 0 && (
              <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
                <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">References</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedApp.references.map((r, i) => (
                    <div key={i} className="p-2 bg-surface-container rounded-lg">
                      <p className="font-bold text-secondary">{r.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{r.contact} &bull; {r.relationship}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2">
              <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px]">Attachments</h4>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 bg-surface-container rounded-lg font-semibold flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  {selectedApp.resumeFileName || 'Resume.pdf'}
                </span>
                <span className="px-3 py-1.5 bg-surface-container rounded-lg font-semibold flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px]">badge</span>
                  {selectedApp.idProofFileName || 'ID_Proof.pdf'}
                </span>
                <span className="px-3 py-1.5 bg-surface-container rounded-lg font-semibold flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                  {selectedApp.certificatesFileName || 'Certificates.pdf'}
                </span>
              </div>
            </div>

            {/* Candidate Notification Log */}
            {selectedApp.notificationHistory && selectedApp.notificationHistory.length > 0 && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <h4 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">mark_email_read</span>
                  Candidate Notification History ({selectedApp.notificationHistory.length})
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {selectedApp.notificationHistory.map((log, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-outline-variant/15 flex items-start justify-between gap-2 text-[11px]">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(log.status)}`}>
                          {log.status}
                        </span>
                        <p className="mt-1 font-medium text-on-surface">Sent to: <span className="font-mono text-primary">{log.sentTo || selectedApp.email}</span></p>
                        {log.notes && <p className="text-on-surface-variant italic">"{log.notes}"</p>}
                      </div>
                      <span className="text-[10px] text-on-surface-variant shrink-0">
                        {new Date(log.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Review Notes */}
            <div className="space-y-1">
              <label className="font-headings font-bold text-secondary block">Admin Internal Notes</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add interviewer notes, demo feedback, background check results..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteApp(selectedApp._id || selectedApp.id)}
                className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete Application
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={updatingApp}
                  onClick={() => handleUpdateAppStatus('Under Review')}
                  className="px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold text-xs"
                >
                  Mark Under Review
                </button>
                <button
                  disabled={updatingApp}
                  onClick={() => handleUpdateAppStatus('Shortlisted')}
                  className="px-3.5 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 font-bold text-xs"
                >
                  Shortlist
                </button>
                <button
                  disabled={updatingApp}
                  onClick={() => handleUpdateAppStatus('Rejected')}
                  className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 font-bold text-xs"
                >
                  Reject
                </button>
                <button
                  disabled={updatingApp}
                  onClick={handleApproveAndOnboard}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Approve & Onboard to Faculty
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT FACULTY MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Faculty Member' : 'Add New Faculty Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
          {/* Photo preview & upload */}
          <div className="space-y-2">
            <label className="font-headings font-bold text-on-surface-variant block">
              Faculty Photo *
            </label>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full border-2 border-outline-variant/30 overflow-hidden bg-surface-container shrink-0 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">person</span>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <label className="bg-surface-container-high hover:bg-outline-variant/30 text-secondary font-headings font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer inline-flex items-center gap-2 border border-outline-variant/30 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  {uploading ? 'Uploading...' : 'Choose Image File'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                      <span>Uploading photo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Managed Credentials & Scoping Section */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <h4 className="font-headings font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">lock_reset</span>
              Admin Account Credentials & Class Allocations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-secondary block mb-1">Faculty Login Email (Username) *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jitender.sharma@saumyaa.edu.in"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-secondary block mb-1">Faculty Password *</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="faculty123"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-secondary block mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Science & Mathematics"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-secondary block mb-1">Branch *</label>
                <select
                  value={form.branch || 'Bagru'}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary bg-white"
                >
                  <option value="Bagru">Bagru (Main Branch)</option>
                  <option value="Daroh">Daroh (Child Branch)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-secondary block mb-1">Assigned Classes (Comma Separated)</label>
                <input
                  type="text"
                  value={Array.isArray(form.assignedClasses) ? form.assignedClasses.join(', ') : form.assignedClasses}
                  onChange={(e) => setForm({ ...form, assignedClasses: e.target.value.split(',').map((s) => s.trim()) })}
                  placeholder="10th, 11th (+1), 12th (+2)"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Faculty Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. Jitender Sharma"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Subject Specialization
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Physics & Mechanics"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Designation / Title
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="e.g. Senior Physics HOD"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Academic Qualification
              </label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="e.g. Ph.D. Physics (IIT Delhi)"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Teaching Experience
              </label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. 15+ Years Teaching"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-headings font-bold text-on-surface-variant block">
                Display Order Position
              </label>
              <input
                type="number"
                min="1"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary bg-surface-container-lowest font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-outline-variant/15">
            <span className="font-headings font-bold text-on-surface-variant">
              Profile Active Status
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative" />
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant font-headings font-bold hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary-container text-white font-headings font-bold shadow-tactile-btn transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingMember ? 'Update Faculty' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Faculty Member"
        message={`Are you sure you want to remove ${deleteTarget?.name}? This action will permanently remove their profile record.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Faculty'}
        isDanger={true}
      />

      {/* ASSIGN ACADEMIC RESPONSIBILITIES MODAL */}
      {respMember && (
        <Modal
          isOpen={Boolean(respMember)}
          onClose={() => setRespMember(null)}
          title={`Assign Academic Responsibilities — ${respMember.name}`}
        >
          <div className="space-y-5 font-body text-xs">
            {/* Faculty Header Pill */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <img
                src={respMember.photo_url}
                alt={respMember.name}
                className="w-11 h-11 rounded-full object-cover border border-outline-variant/30 shrink-0"
              />
              <div>
                <h4 className="font-headings font-extrabold text-sm text-secondary">{respMember.name}</h4>
                <p className="text-[11px] text-on-surface-variant">
                  {respMember.designation} &bull; <span className="font-mono text-primary">{respMember.email}</span>
                </p>
              </div>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-outline-variant/15 gap-4">
              <button
                type="button"
                onClick={() => setRespTab('assigned')}
                className={`pb-2.5 text-xs font-headings font-bold relative transition-colors ${
                  respTab === 'assigned'
                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                Active Responsibilities ({respMember.responsibilities?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setRespTab('add')}
                className={`pb-2.5 text-xs font-headings font-bold relative transition-colors ${
                  respTab === 'add'
                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                + Assign New Responsibility
              </button>

              <button
                type="button"
                onClick={() => setRespTab('audit')}
                className={`pb-2.5 text-xs font-headings font-bold relative transition-colors ${
                  respTab === 'audit'
                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                Audit Log ({respMember.auditLog?.length || 0})
              </button>
            </div>

            {/* TAB 1: ACTIVE RESPONSIBILITIES TABLE */}
            {respTab === 'assigned' && (
              <div className="space-y-3">
                {!respMember.responsibilities || respMember.responsibilities.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/15">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-1">assignment_late</span>
                    <p className="font-bold text-secondary text-xs">No Responsibilities Assigned Yet</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Click <strong>"+ Assign New Responsibility"</strong> above to assign courses, classes, sections, and subjects.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-outline-variant/15">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-headings font-bold uppercase tracking-wider border-b border-outline-variant/15">
                          <th className="py-2.5 px-3">Class & Section</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Course / Batch</th>
                          <th className="py-2.5 px-3">Term / Session</th>
                          <th className="py-2.5 px-3 text-right">Revoke Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-body">
                        {respMember.responsibilities.map((resp) => (
                          <tr key={resp.id || resp._id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="py-2.5 px-3 font-bold text-secondary whitespace-nowrap">
                              {resp.className} &bull; {resp.section}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-primary whitespace-nowrap">
                              {resp.subject}
                            </td>
                            <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                              {resp.course} ({resp.batch})
                            </td>
                            <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                              {resp.semester} &bull; {resp.academicSession}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRevokeResponsibility(resp.id || resp._id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Revoke Access
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRespTab('add')}
                    className="px-4 py-2 rounded-full bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-container"
                  >
                    + Add More Responsibilities
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ASSIGN NEW RESPONSIBILITY FORM */}
            {respTab === 'add' && (
              <form onSubmit={handleAssignResponsibilitiesSubmit} className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/15">
                  <span className="font-bold text-secondary text-xs">Assignment Mode:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        !isBulkMode ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      Single Assignment
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        isBulkMode ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      ⚡ Bulk Multi-Class Mode
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-secondary mb-1">Course Program</label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                    >
                      <option value="Science (PCM)">Science (PCM - Physics, Chemistry, Math)</option>
                      <option value="Science (PCB)">Science (PCB - Physics, Chemistry, Biology)</option>
                      <option value="Commerce">Commerce & Accountancy</option>
                      <option value="Arts & Humanities">Arts & Humanities</option>
                      <option value="Foundation & Olympiad">Foundation & Olympiad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-secondary mb-1">Batch / Shift</label>
                    <select
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                    >
                      <option value="Batch A (Morning)">Batch A (Morning Shift)</option>
                      <option value="Batch B (Evening)">Batch B (Evening Shift)</option>
                      <option value="JEE Main/Adv Focus">JEE Main/Adv Focus Batch</option>
                      <option value="NEET Target Batch">NEET Target Batch</option>
                    </select>
                  </div>
                </div>

                {isBulkMode ? (
                  <div className="space-y-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                    <label className="block font-bold text-primary text-xs">
                      Select Multiple Classes & Sections to Bulk Assign:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-bold text-secondary text-[11px] block mb-1">Classes:</span>
                        {['9th', '10th', '11th (+1)', '12th (+2)'].map((c) => (
                          <label key={c} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={selectedBulkClasses.includes(c)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBulkClasses([...selectedBulkClasses, c]);
                                else setSelectedBulkClasses(selectedBulkClasses.filter((x) => x !== c));
                              }}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span>Class {c}</span>
                          </label>
                        ))}
                      </div>

                      <div>
                        <span className="font-bold text-secondary text-[11px] block mb-1">Sections:</span>
                        {['Section A', 'Section B', 'Section C'].map((sec) => (
                          <label key={sec} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={selectedBulkSections.includes(sec)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBulkSections([...selectedBulkSections, sec]);
                                else setSelectedBulkSections(selectedBulkSections.filter((x) => x !== sec));
                              }}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span>{sec}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-secondary mb-1">Class</label>
                      <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                      >
                        <option value="9th">Class 9th</option>
                        <option value="10th">Class 10th</option>
                        <option value="11th (+1)">Class 11th (+1)</option>
                        <option value="12th (+2)">Class 12th (+2)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-secondary mb-1">Section</label>
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                      >
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-secondary mb-1">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                    >
                      <option value="Mathematics Advanced">Mathematics Advanced</option>
                      <option value="Physics IIT-JEE Prep">Physics IIT-JEE Prep</option>
                      <option value="Organic Chemistry">Organic Chemistry</option>
                      <option value="Biology NEET Prep">Biology NEET Prep</option>
                      <option value="English Literature">English Literature</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-secondary mb-1">Semester / Term</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-secondary mb-1">Academic Session</label>
                    <select
                      value={academicSession}
                      onChange={(e) => setAcademicSession(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 font-bold text-secondary focus:outline-none focus:border-primary"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRespTab('assigned')}
                    className="px-4 py-2 rounded-full border border-outline-variant/30 text-secondary font-bold text-xs hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningResp}
                    className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-premium disabled:opacity-50 cursor-pointer"
                  >
                    {assigningResp ? 'Assigning...' : 'Save & Assign Responsibilities'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: AUDIT LOG HISTORY */}
            {respTab === 'audit' && (
              <div className="space-y-3">
                {!respMember.auditLog || respMember.auditLog.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/15 text-on-surface-variant text-xs">
                    No assignment audit history recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {respMember.auditLog.map((log) => (
                      <div key={log.id || log._id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-full font-extrabold ${
                              log.actionType === 'REMOVED'
                                ? 'bg-rose-100 text-rose-800'
                                : log.actionType === 'BULK_ASSIGNED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {log.actionType}
                          </span>
                          <span className="text-on-surface-variant font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-secondary">{log.details}</p>
                        <p className="text-[10px] text-on-surface-variant">Performed by: {log.performedBy}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
