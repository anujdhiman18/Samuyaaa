import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { facultyProfileRequestService, credentialRequestService, facultyService } from '../../services/api';

export default function FacultyProfile() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Profile Change Request Form Fields
  const [reqName, setReqName] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqDesignation, setReqDesignation] = useState('');
  const [reqDepartment, setReqDepartment] = useState('');
  const [reqPhotoUrl, setReqPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reqQualification, setReqQualification] = useState('');
  const [reqExperience, setReqExperience] = useState('');
  const [reason, setReason] = useState('');

  // Request History & Cooldown State
  const [requests, setRequests] = useState([]);
  const [cooldownInfo, setCooldownInfo] = useState(null);

  // Credential Request State (for Username/Password updates)
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credRequests, setCredRequests] = useState([]);
  const [requestingCred, setRequestingCred] = useState(false);

  useEffect(() => {
    fetchProfileRequests();
    fetchCredRequests();
  }, [user]);

  const fetchProfileRequests = async () => {
    setLoading(true);
    try {
      const facId = user?._id || user?.id || 'f_jitender';
      const facEmail = user?.email || 'jitender.sharma@saumyaa.edu.in';
      const res = await facultyProfileRequestService.getMyRequests(facId, facEmail);

      if (res && res.success) {
        setRequests(res.requests || []);
        setCooldownInfo(res.cooldownInfo || null);
      }
    } catch (err) {
      console.warn('Error fetching profile change requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredRequests = async () => {
    try {
      const res = await credentialRequestService.getRequests();
      if (res && res.requests) {
        const facId = user?._id || user?.id || 'f_jitender';
        const myReqs = res.requests.filter((r) => r.facultyId === facId || r.facultyName === user?.name);
        setCredRequests(myReqs);
      }
    } catch (e) {
      console.warn('Error fetching credential requests:', e);
    }
  };

  const handlePhotoFileChange = async (e) => {
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
    setPhotoPreview(tempUrl);
    setUploadingPhoto(true);
    setUploadProgress(10);

    try {
      const uploadedUrl = await facultyService.uploadFacultyPhoto(file, (progress) => {
        setUploadProgress(progress);
      });
      setReqPhotoUrl(uploadedUrl);
      addToast('Photo uploaded successfully! Will be submitted with your request.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to upload photo', 'error');
      setPhotoPreview(reqPhotoUrl || user?.photo_url || user?.photo || user?.avatar || '');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleOpenRequestForm = () => {
    // Populate form with current values
    setReqName(user?.name || '');
    setReqPhone(user?.phone || '');
    setReqDesignation(user?.designation || '');
    setReqDepartment(user?.department || '');
    const currentPhoto = user?.photo_url || user?.photo || user?.avatar || '';
    setReqPhotoUrl(currentPhoto);
    setPhotoPreview(currentPhoto);
    setUploadProgress(0);
    setReqQualification(user?.qualification || 'Master’s Degree');
    setReqExperience(user?.experience || '5+ Years Experience');
    setReason('');
    setShowRequestForm(true);
  };

  const handleSubmitProfileRequest = async (e) => {
    e.preventDefault();

    if (!reason || !reason.trim()) {
      addToast('Please enter a reason for the profile change request.', 'warning');
      return;
    }

    // Build requested values map
    const requestedValues = {};
    if (reqName.trim() && reqName.trim() !== (user?.name || '')) requestedValues.name = reqName.trim();
    if (reqPhone.trim() && reqPhone.trim() !== (user?.phone || '')) requestedValues.phone = reqPhone.trim();
    if (reqDesignation.trim() && reqDesignation.trim() !== (user?.designation || '')) requestedValues.designation = reqDesignation.trim();
    if (reqDepartment.trim() && reqDepartment.trim() !== (user?.department || '')) requestedValues.department = reqDepartment.trim();
    if (reqPhotoUrl.trim() && reqPhotoUrl.trim() !== (user?.photo_url || user?.avatar || '')) requestedValues.photo_url = reqPhotoUrl.trim();
    if (reqQualification.trim() && reqQualification.trim() !== (user?.qualification || 'Master’s Degree')) requestedValues.qualification = reqQualification.trim();
    if (reqExperience.trim() && reqExperience.trim() !== (user?.experience || '5+ Years Experience')) requestedValues.experience = reqExperience.trim();

    if (Object.keys(requestedValues).length === 0) {
      addToast('No changes detected. Please modify at least one field to request changes.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const facId = user?._id || user?.id || 'f_jitender';
      const facEmail = user?.email || 'jitender.sharma@saumyaa.edu.in';

      const currentValues = {
        name: user?.name || '',
        phone: user?.phone || '',
        designation: user?.designation || '',
        department: user?.department || '',
        photo_url: user?.photo_url || user?.avatar || '',
        qualification: user?.qualification || 'Master’s Degree',
        experience: user?.experience || '5+ Years Experience',
      };

      const res = await facultyProfileRequestService.submitRequest({
        facultyId: facId,
        facultyName: user?.name || 'Prof. Jitender Sharma',
        facultyEmail: facEmail,
        currentValues,
        requestedValues,
        reason: reason.trim(),
      });

      if (res && res.success) {
        addToast('Profile change request submitted successfully to Admin for approval!', 'success');
        setShowRequestForm(false);
        fetchProfileRequests();
      }
    } catch (err) {
      addToast(err.message || 'Error submitting profile change request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestUsernameChange = async (e) => {
    e.preventDefault();
    if (!newUsername || newUsername === user?.email) {
      addToast('Please enter a new username / email', 'warning');
      return;
    }
    setRequestingCred(true);
    try {
      const res = await credentialRequestService.submitRequest({
        facultyId: user?._id || user?.id || 'f_jitender',
        facultyName: user?.name || 'Prof. Jitender Sharma',
        userType: 'Faculty',
        requestType: 'Username / Email Change',
        oldValue: user?.email,
        newValue: newUsername,
      });

      if (res && res.success) {
        addToast('Username change request submitted to Admin for approval!', 'success');
        setNewUsername('');
        fetchCredRequests();
      }
    } catch (err) {
      addToast('Error submitting credential request', 'error');
    } finally {
      setRequestingCred(false);
    }
  };

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      addToast('Please enter a new password', 'warning');
      return;
    }
    setRequestingCred(true);
    try {
      const res = await credentialRequestService.submitRequest({
        facultyId: user?._id || user?.id || 'f_jitender',
        facultyName: user?.name || 'Prof. Jitender Sharma',
        userType: 'Faculty',
        requestType: 'Password Change',
        oldValue: '••••••••',
        newValue: newPassword,
      });

      if (res && res.success) {
        addToast('Password change request submitted to Admin for approval!', 'success');
        setNewPassword('');
        fetchCredRequests();
      }
    } catch (err) {
      addToast('Error submitting password request', 'error');
    } finally {
      setRequestingCred(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pendingRequestExists = requests.some((r) => r.status === 'Pending');
  const isCooldownActive = cooldownInfo?.isCooldownActive;

  return (
    <div className="space-y-6 font-body">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
            My Faculty Profile
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            View current profile info & submit profile change requests for Admin approval.
          </p>
        </div>

        {/* Request Profile Change Primary Button */}
        <button
          onClick={handleOpenRequestForm}
          className="bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-premium hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer shadow-tactile-btn"
        >
          <span className="material-symbols-outlined text-base">edit_note</span>
          Request Profile Change
        </button>
      </div>

      {/* 30-Day Restriction Alert Banner */}
      {isCooldownActive && cooldownInfo?.cooldownMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-amber-600 text-2xl mt-0.5">timer</span>
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">
              30-Day Request Cooldown Active
            </h4>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              {cooldownInfo.cooldownMessage}
            </p>
          </div>
        </div>
      )}

      {/* Active Pending Request Banner */}
      {pendingRequestExists && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-900 flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-blue-600 text-2xl mt-0.5">hourglass_top</span>
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
              Pending Request Under Review
            </h4>
            <p className="text-xs font-medium text-blue-800 leading-relaxed">
              You currently have a profile change request pending Admin approval. You will be able to submit another request after your pending request is processed and 30 days have elapsed.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column: Profile Card & Request History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Overview (Read-Only as required by prompt) */}
          <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-6">
              <div className="flex items-center gap-4">
                <img
                  src={user?.photo_url || user?.avatar || '/Unknown.jpg'}
                  alt={user?.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-md"
                />
                <div>
                  <h3 className="font-headings font-extrabold text-lg text-secondary">{user?.name || 'Prof. Jitender Sharma'}</h3>
                  <p className="text-xs text-primary font-bold">{user?.designation || 'Senior Faculty Member'}</p>
                  <p className="text-xs text-on-surface-variant">{user?.department || 'Science & Mathematics'}</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Faculty
              </span>
            </div>

            {/* Profile Fields List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">Full Name</span>
                <p className="font-bold text-secondary text-xs">{user?.name || 'Prof. Jitender Sharma'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">Official Email / Username</span>
                <p className="font-mono text-secondary text-xs">{user?.email || 'jitender.sharma@saumyaa.edu.in'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">Phone Number</span>
                <p className="font-mono text-secondary text-xs">{user?.phone || '9816099999'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">Academic Designation</span>
                <p className="font-bold text-secondary text-xs">{user?.designation || 'Senior Mathematics & Physics Faculty'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">Department</span>
                <p className="font-bold text-secondary text-xs">{user?.department || 'Science & Mathematics'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">Highest Qualification</span>
                <p className="font-bold text-secondary text-xs">{user?.qualification || 'Master’s Degree'}</p>
              </div>
            </div>

            {/* Academic Responsibilities Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2">
              <span className="text-xs font-bold text-secondary block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">school</span>
                Assigned Academic Responsibilities (Admin Allocated)
              </span>

              {user?.responsibilities && user.responsibilities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {user.responsibilities.map((r, i) => (
                    <div key={r.id || r._id || i} className="p-2.5 rounded-lg border border-outline-variant/20 bg-white space-y-0.5 shadow-sm">
                      <div className="flex justify-between font-bold text-secondary text-xs">
                        <span>Class {r.className} ({r.section || 'Sec A'})</span>
                        <span className="text-[10px] text-primary">{r.academicSession || '2026-2027'}</span>
                      </div>
                      <p className="text-primary font-semibold">{r.subject}</p>
                      <p className="text-[10px] text-on-surface-variant">{r.course || 'Science'} &bull; {r.batch || 'Batch A'}</p>
                    </div>
                  ))}
                </div>
              ) : (user?.assignedClasses && user.assignedClasses.length > 0) ? (
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {user.assignedClasses.map((cls, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      Class {cls}
                    </span>
                  ))}
                  {(user?.assignedSubjects || []).map((sub, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                      Subject: {sub}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-on-surface-variant italic rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                  No academic responsibilities allocated yet by System Admin.
                </div>
              )}
            </div>
          </div>

          {/* Profile Change Request History List */}
          <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div>
                <h3 className="font-headings font-extrabold text-lg text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  My Profile Change Request History
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Track the status of all your submitted profile modification requests.
                </p>
              </div>

              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {requests.length} Request(s)
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                Loading request history...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant italic bg-surface-container-lowest rounded-xl border border-outline-variant/15">
                No profile change requests submitted yet. Click "Request Profile Change" above to initiate a change request.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req._id || req.id}
                    className={`p-4 rounded-xl border transition-all ${
                      req.status === 'Approved'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : req.status === 'Rejected'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase">Submitted On</span>
                        <p className="text-xs font-bold text-secondary">
                          {formatDate(req.requestDate || req.createdAt)}
                        </p>
                      </div>

                      {/* Request Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1.5 w-fit ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : req.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {req.status === 'Approved' ? 'check_circle' : req.status === 'Rejected' ? 'cancel' : 'schedule'}
                        </span>
                        {req.status === 'Pending' ? 'Pending Admin Approval' : req.status}
                      </span>
                    </div>

                    {/* Reason for Change */}
                    <div className="mt-3 text-xs space-y-1">
                      <span className="font-bold text-secondary block text-[11px]">Reason for Change:</span>
                      <p className="p-2.5 rounded-lg bg-white border border-outline-variant/15 text-secondary italic">
                        "{req.reason}"
                      </p>
                    </div>

                    {/* Requested Changes Table */}
                    <div className="mt-3 space-y-1.5">
                      <span className="font-bold text-secondary text-[11px] block">Requested Modifications:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {req.requestedValues && Object.keys(req.requestedValues).map((key) => {
                          const isPhoto = key === 'photo_url' || key === 'photo' || key === 'avatar';
                          const fieldLabel = isPhoto ? 'Profile Photo' : key.replace(/_/g, ' ');
                          const oldVal = req.currentValues?.[key];
                          const newVal = req.requestedValues[key];

                          return (
                            <div key={key} className={`p-3 rounded-xl bg-white border border-outline-variant/15 space-y-1.5 overflow-hidden ${isPhoto ? 'sm:col-span-2' : ''}`}>
                              <span className="text-[10px] font-bold uppercase text-primary tracking-wider block capitalize">{fieldLabel}</span>
                              
                              {isPhoto ? (
                                <div className="flex items-center gap-3 flex-wrap pt-0.5">
                                  <div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/20">
                                    {oldVal ? (
                                      <img src={oldVal} alt="Current" className="w-8 h-8 rounded-full object-cover border border-outline-variant/30 shrink-0" />
                                    ) : (
                                      <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/40 shrink-0">
                                        <span className="material-symbols-outlined text-base">person</span>
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold text-on-surface-variant/80 line-through">Old Photo</span>
                                  </div>

                                  <span className="material-symbols-outlined text-sm text-primary shrink-0">arrow_forward</span>

                                  <div className="flex items-center gap-2 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                    <img src={newVal} alt="New" className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-sm shrink-0" />
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">New Photo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[11px] flex-wrap break-all">
                                  <span className="line-through text-on-surface-variant/70">{oldVal || '—'}</span>
                                  <span className="material-symbols-outlined text-xs text-primary shrink-0">arrow_forward</span>
                                  <span className="font-bold text-secondary">{newVal}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Comments & Rejection Reason */}
                    {req.status === 'Rejected' && (
                      <div className="mt-3 p-3 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 space-y-1">
                        <span className="font-bold text-xs flex items-center gap-1 text-rose-800">
                          <span className="material-symbols-outlined text-base">info</span>
                          Admin Rejection Reason:
                        </span>
                        <p className="text-xs font-medium leading-relaxed">
                          {req.adminComments || 'No explicit comment provided by Admin.'}
                        </p>
                        {req.reviewedDate && (
                          <p className="text-[10px] text-rose-700 font-mono pt-1">
                            Reviewed on: {formatDate(req.reviewedDate)} by {req.reviewedByName || 'System Admin'}
                          </p>
                        )}
                      </div>
                    )}

                    {req.status === 'Approved' && req.adminComments && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-900 space-y-1">
                        <span className="font-bold text-xs flex items-center gap-1 text-emerald-800">
                          <span className="material-symbols-outlined text-base">verified</span>
                          Admin Comment:
                        </span>
                        <p className="text-xs font-medium leading-relaxed">
                          {req.adminComments}
                        </p>
                        {req.reviewedDate && (
                          <p className="text-[10px] text-emerald-700 font-mono pt-1">
                            Approved on: {formatDate(req.reviewedDate)} by {req.reviewedByName || 'System Admin'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Security & Credentials */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-6 h-fit">
          <div className="border-b border-outline-variant/15 pb-3">
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">lock</span>
              Account Security & Credentials
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Username & Password changes require explicit approval from the System Administrator.
            </p>
          </div>

          {/* Request Username Change */}
          <form onSubmit={handleRequestUsernameChange} className="space-y-3">
            <h4 className="font-bold text-xs text-secondary">Request Username / Email Change</h4>
            <input
              type="email"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new email address..."
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={requestingCred}
              className="w-full py-2 rounded-full border border-primary/30 text-primary font-bold text-xs hover:bg-primary/10 transition-colors cursor-pointer"
            >
              Submit Username Change Request
            </button>
          </form>

          {/* Request Password Change */}
          <form onSubmit={handleRequestPasswordChange} className="space-y-3 pt-4 border-t border-outline-variant/15">
            <h4 className="font-bold text-xs text-secondary">Request Password Change</h4>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password..."
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={requestingCred}
              className="w-full py-2 rounded-full bg-secondary text-white font-bold text-xs hover:bg-secondary/90 transition-colors cursor-pointer"
            >
              Submit Password Change Request
            </button>
          </form>

          {/* Credential Request History */}
          {credRequests.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-outline-variant/15">
              <h4 className="font-bold text-xs text-secondary">Credential Change Requests</h4>
              <div className="space-y-2 text-[11px]">
                {credRequests.map((r) => (
                  <div key={r._id || r.id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-secondary">{r.requestType}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status === 'Pending' ? '🟡 Pending' : r.status}
                      </span>
                    </div>
                    <p className="font-mono text-on-surface-variant text-[10px]">Requested: {r.newValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REQUEST PROFILE CHANGE MODAL */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-outline-variant/15 space-y-6 max-h-[90vh] overflow-y-auto font-body">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div>
                <h3 className="font-headings font-extrabold text-xl text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  Request Faculty Profile Change
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Modifications require Administrator approval and are subject to a 30-day request limit.
                </p>
              </div>

              <button
                onClick={() => setShowRequestForm(false)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Warning if 30-day Cooldown is active or Pending request exists */}
            {(isCooldownActive || pendingRequestExists) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Submission Restricted
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  {pendingRequestExists
                    ? 'You have a pending profile change request under review by Administrator.'
                    : cooldownInfo?.cooldownMessage}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitProfileRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-mono text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Academic Designation</label>
                  <input
                    type="text"
                    required
                    value={reqDesignation}
                    onChange={(e) => setReqDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={reqDepartment}
                    onChange={(e) => setReqDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Qualification</label>
                  <input
                    type="text"
                    value={reqQualification}
                    onChange={(e) => setReqQualification(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Experience</label>
                  <input
                    type="text"
                    value={reqExperience}
                    onChange={(e) => setReqExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Photo Upload / Browse File Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-secondary">
                  Faculty Photo (Upload / Browse)
                </label>

                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/25">
                  <div className="relative w-14 h-14 rounded-full border-2 border-primary/30 overflow-hidden bg-surface-container shrink-0 flex items-center justify-center shadow-sm">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">person</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="bg-surface-container-high hover:bg-outline-variant/30 text-secondary font-headings font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer inline-flex items-center gap-2 border border-outline-variant/30 transition-all shadow-sm active:scale-95">
                      <span className="material-symbols-outlined text-[16px] text-primary">cloud_upload</span>
                      {uploadingPhoto ? 'Uploading Photo...' : 'Browse Image File'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoFileChange}
                        disabled={uploadingPhoto}
                      />
                    </label>

                    <p className="text-[11px] text-on-surface-variant">
                      Upload JPG, PNG, or WEBP (Max 5MB). Photo updates upon Admin approval.
                    </p>

                    {uploadingPhoto && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                          <span>Uploading photo to cloud...</span>
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

              {/* Reason for Change (Required!) */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1 flex items-center gap-1">
                  Reason for Profile Change <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting these profile updates (e.g. Updated official mobile number, qualification advancement, or designation update)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs text-secondary focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-5 py-2.5 rounded-full border border-outline-variant/30 font-bold text-xs text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isCooldownActive || pendingRequestExists}
                  className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50 transition-all cursor-pointer shadow-tactile-btn"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Profile Change Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
