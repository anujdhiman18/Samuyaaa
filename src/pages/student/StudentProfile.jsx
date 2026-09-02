import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService, credentialRequestService } from '../../services/api';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student Editable Fields (Phone, Photo)
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Credential Request Form State
  const [requestType, setRequestType] = useState('Username / Email Change');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudentById(user?.id || 's1');
      if (res && res.student) {
        setStudent(res.student);
        setPhone(res.student.phone || '');
        setPhotoUrl(res.student.photo || user?.avatar || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await credentialRequestService.getRequests();
      if (res && res.requests) {
        const studentId = user?.id || 's1';
        const filtered = res.requests.filter(
          (r) => String(r.studentId) === String(studentId) || String(r.rollNumber) === String(user?.rollNumber)
        );
        setMyRequests(filtered);
      }
    } catch (e) {
      console.warn('Could not fetch requests:', e);
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
    setPhotoUrl(tempUrl);
    setUploadingPhoto(true);
    setUploadProgress(10);

    try {
      const uploadedUrl = await studentService.uploadStudentPhoto(file, (progress) => {
        setUploadProgress(progress);
      });
      setPhotoUrl(uploadedUrl);
      addToast('Photo uploaded successfully! Click Save to apply.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to upload photo', 'error');
      setPhotoUrl(student?.photo || user?.avatar || '');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStudentUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await studentService.updateStudent(user?.id || 's1', {
        phone,
        photo: photoUrl,
      });

      updateUser({
        ...user,
        phone,
        avatar: photoUrl,
      });

      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newValue.trim()) {
      addToast('Please enter your requested new username/email or password!', 'error');
      return;
    }

    setSubmittingReq(true);
    try {
      const payload = {
        studentId: user?.id || 's1',
        studentName: student?.fullName || user?.name || 'Student',
        rollNumber: student?.rollNumber || user?.rollNumber || 'SAU-10-001',
        requestType,
        currentValue: requestType === 'Username / Email Change' ? (student?.email || user?.email || 'N/A') : '••••••••',
        newValue: newValue.trim(),
        reason: reason.trim() || 'No reason provided',
      };

      const res = await credentialRequestService.submitRequest(payload);
      addToast(res.message || 'Request sent to Admin!', 'success');
      setNewValue('');
      setReason('');
      fetchRequests();
    } catch (err) {
      addToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmittingReq(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs animate-pulse">Loading personal profile...</div>;
  }

  const p = student || {
    fullName: user?.name || 'Rahul Gupta',
    rollNumber: user?.rollNumber || 'SAU-10-001',
    className: user?.className || '10th',
    fatherName: 'Rajesh Gupta',
    motherName: 'Sunita Gupta',
    phone: '9816012345',
    parentPhone: '8894190175',
    email: 'rahul.g@gmail.com',
    address: 'House #42, Main Market, Palampur',
    dateOfAdmission: '2025-04-10',
    subjects: ['Mathematics Advanced', 'Integrated Science'],
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Personal Information &amp; Credentials
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Official academic record issued by Admin and Credential Request Form
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Readonly Profile Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-premium border border-outline-variant/15 space-y-5">
            <div className="flex items-center gap-4 border-b border-outline-variant/15 pb-4">
              <img
                src={p.photo || user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                alt={p.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-md bg-surface-container"
              />
              <div>
                <h2 className="font-headings font-extrabold text-xl text-secondary">{p.fullName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary font-headings border border-primary/20">
                    Roll No: {p.rollNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary font-headings">
                    Class {p.className}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Father's Name
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{p.fatherName}</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Mother's Name
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{p.motherName}</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Parent Phone
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{p.parentPhone}</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Official Username / Email
                </span>
                <span className="font-bold text-secondary font-mono mt-0.5 block">{p.email || 'Not Assigned'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15 sm:col-span-2">
                <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Residential Address
                </span>
                <span className="font-bold text-on-surface mt-0.5 block">{p.address}</span>
              </div>
            </div>
          </div>

          {/* Request History Log */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/15 space-y-4">
            <h3 className="font-headings font-extrabold text-sm text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              My Credential Change Requests
            </h3>

            {myRequests.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">No requests submitted yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {myRequests.map((req, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-secondary">{req.requestType}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                        New Value: <span className="font-bold text-on-surface">{req.newValue}</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{req.reason}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                        : req.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Edit & Credential Request Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Photo & Phone Edit */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/15 space-y-4">
            <h3 className="font-headings font-bold text-sm text-secondary">
              Update Contact &amp; Photo
            </h3>
            <form onSubmit={handleStudentUpdate} className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">Student Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-headings font-bold text-on-surface-variant">Profile Photo (Browse File)</label>
                
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
                  <div className="relative w-12 h-12 rounded-full border border-outline-variant/30 overflow-hidden bg-surface-container shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">person</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="bg-surface-container-high hover:bg-outline-variant/30 text-secondary font-headings font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5 border border-outline-variant/30 transition-all shadow-sm active:scale-95">
                      <span className="material-symbols-outlined text-[15px] text-primary">cloud_upload</span>
                      {uploadingPhoto ? 'Uploading...' : 'Browse Image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoFileChange}
                        disabled={uploadingPhoto}
                      />
                    </label>

                    {uploadingPhoto && (
                      <div className="space-y-0.5 pt-1">
                        <div className="flex justify-between text-[9px] text-on-surface-variant font-bold">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
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

              <button
                type="submit"
                disabled={updating || uploadingPhoto}
                className="w-full py-2.5 bg-secondary hover:bg-secondary-container text-white font-headings font-bold text-xs rounded-full shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {updating ? 'Saving...' : 'Save Phone & Photo'}
              </button>
            </form>
          </div>

          {/* Admin Credential Change Request Form */}
          <div className="bg-white rounded-3xl p-6 shadow-premium border border-outline-variant/15 space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/15 pb-3">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
              <div>
                <h3 className="font-headings font-extrabold text-sm text-secondary">Request Credential Change</h3>
                <p className="text-[11px] text-on-surface-variant">Submit username/password change request to Admin</p>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs font-body">
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">Request Type *</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold bg-white"
                >
                  <option value="Username / Email Change">Username / Email Change</option>
                  <option value="Password Change">Password Change</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  {requestType === 'Username / Email Change' ? 'New Requested Username / Email *' : 'New Requested Password *'}
                </label>
                <input
                  type={requestType === 'Password Change' ? 'password' : 'text'}
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={requestType === 'Username / Email Change' ? 'e.g. rahul.new@gmail.com' : 'Enter new password'}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">Reason for Request</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Updating to primary email address"
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReq}
                className="w-full py-2.5 bg-primary hover:bg-primary-container text-white font-headings font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                {submittingReq ? 'Submitting Request...' : 'Submit Request to Admin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
