import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminProfileService } from '../../services/api';

const DEFAULT_AVATARS = [
  '/Unknown.jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
];

export default function AdminProfile() {
  const { user, admin, updateUser } = useAuth();
  const { addToast } = useToast();
  const currentAdmin = user || admin;

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentAdmin?.name || 'Jitender Sharma',
    email: currentAdmin?.email || currentAdmin?.username || 'admin@saumyaa.com',
    username: currentAdmin?.username || currentAdmin?.email || 'admin@saumyaa.com',
    phone: currentAdmin?.phone || '+91 9816543210',
    role: currentAdmin?.role || 'SuperAdmin',
    department: currentAdmin?.department || 'Academic Management & Operations',
    bio: currentAdmin?.bio || 'Director & Senior Administrator overseeing Saumyaa Studies academic excellence, faculty management, and student affairs.',
    avatar: currentAdmin?.avatar || DEFAULT_AVATARS[0],
  });

  const [additionalPermissions, setAdditionalPermissions] = useState(() => {
    if (Array.isArray(currentAdmin?.additionalPermissions) && currentAdmin.additionalPermissions.length > 0) {
      return currentAdmin.additionalPermissions;
    }
    return ['MARK_ATTENDANCE', 'UPLOAD_GRADES', 'VIEW_STUDENT_ACADEMICS', 'MANAGE_CLASSES'];
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await adminProfileService.getProfile();
      if (res && res.profile) {
        setProfileForm((prev) => ({
          ...prev,
          ...res.profile,
          name: res.profile.name || prev.name,
          email: res.profile.email || res.profile.username || prev.email,
          username: res.profile.username || res.profile.email || prev.username,
          avatar: res.profile.avatar || prev.avatar,
        }));
      }
    } catch (e) {
      console.warn('Could not load remote admin profile:', e);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    setUploadProgress(15);

    try {
      const uploadedUrl = await adminProfileService.uploadAvatar(file, (progress) => {
        setUploadProgress(progress);
      });

      setProfileForm((prev) => ({ ...prev, avatar: uploadedUrl }));
      updateUser({ avatar: uploadedUrl });
      addToast('Admin photo uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Photo upload failed. You can paste an image URL instead.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEmailUsernameChange = (val) => {
    const cleanVal = val.trim();
    setProfileForm((prev) => ({
      ...prev,
      email: val,
      username: cleanVal,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileForm.name.trim()) {
      addToast('Admin Name cannot be empty', 'error');
      return;
    }

    if (!profileForm.email.trim()) {
      addToast('Official Email / Username cannot be empty', 'error');
      return;
    }

    setSavingProfile(true);

    const updatedData = {
      ...profileForm,
      additionalPermissions,
      role: currentAdmin?.role || 'SuperAdmin', // Role strictly remains ADMIN
      email: profileForm.email.trim().toLowerCase(),
      username: profileForm.email.trim().toLowerCase(),
    };

    try {
      const res = await adminProfileService.updateProfile(updatedData);
      updateUser(updatedData);
      addToast(res.message || 'Admin profile & login username updated in database!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile in database', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      addToast('Please enter your current password', 'error');
      return;
    }

    if (!passwordForm.newPassword) {
      addToast('Please enter your new password', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New password and confirm password do not match!', 'error');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await adminProfileService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      addToast(res.message || 'Password changed successfully in database!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.message || 'Password update failed', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-on-surface max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant/15 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <img
              src={profileForm.avatar}
              alt={profileForm.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 shadow-md bg-surface-container"
            />
            <label className="absolute inset-0 bg-secondary/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headings font-extrabold text-2xl text-secondary">{profileForm.name}</h1>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-headings font-bold bg-primary/10 text-primary border border-primary/20">
                {profileForm.role}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-1">Username: {profileForm.email}</p>
            <p className="text-xs text-primary font-medium mt-0.5">{profileForm.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-800 text-xs font-semibold">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>Database Sync Active & Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Admin Profile Information (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/15 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
                <h2 className="font-headings font-extrabold text-base text-secondary">Admin Profile Details</h2>
              </div>
              <span className="text-[11px] text-on-surface-variant">Update identity & login credentials</span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              {/* Avatar Selector & Upload */}
              <div className="space-y-2">
                <label className="font-headings font-bold text-secondary block">Admin Profile Picture</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    {DEFAULT_AVATARS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Avatar preset"
                        onClick={() => {
                          setProfileForm((prev) => ({ ...prev, avatar: url }));
                          updateUser({ avatar: url });
                        }}
                        className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition-all ${
                          profileForm.avatar === url ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-secondary rounded-full font-headings font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      Upload Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {uploadingPhoto && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-on-surface-variant">
                      <span>Uploading to Firebase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Photo URL Input */}
              <div className="space-y-1">
                <label className="font-headings font-bold text-secondary block">Photo Image URL (Optional Direct Link)</label>
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(e) => {
                    setProfileForm((prev) => ({ ...prev, avatar: e.target.value }));
                    updateUser({ avatar: e.target.value });
                  }}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-headings font-bold text-secondary block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs font-semibold"
                  />
                </div>

                {/* Username / Official Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-headings font-bold text-secondary block">Official Email / Username *</label>
                    <span className="text-[10px] text-primary font-bold">Admin Login ID</span>
                  </div>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => handleEmailUsernameChange(e.target.value)}
                    placeholder="admin@saumyaa.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-on-surface-variant/80">Updating this changes your official login username/email.</p>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-headings font-bold text-secondary block">Contact Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                {/* Role / Designation */}
                <div className="space-y-1">
                  <label className="font-headings font-bold text-secondary block">Admin Designation / Role</label>
                  <select
                    value={profileForm.role}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs font-semibold bg-white"
                  >
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="Admin">Academic Admin</option>
                    <option value="Director">Managing Director</option>
                    <option value="Academic Operations">Academic Operations</option>
                  </select>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="font-headings font-bold text-secondary block">Department & Division</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Academic Operations & Administration"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              {/* Additional Responsibilities Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <label className="font-headings font-extrabold text-xs text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                    Additional Academic Responsibilities
                  </label>
                  <span className="text-[10px] text-on-surface-variant">Role strictly remains <strong>ADMIN</strong></span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80">
                  Assign optional academic tasks to this Admin account. Enabled features automatically appear under Academic Operations in the sidebar.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    { code: 'MARK_ATTENDANCE', label: 'Mark Attendance', desc: 'Access Attendance Register & daily student logs' },
                    { code: 'UPLOAD_GRADES', label: 'Upload Grades', desc: 'Manage exam scores & publish official gradebook' },
                    { code: 'VIEW_STUDENT_ACADEMICS', label: 'View Student Academics', desc: 'Access student academic records & analytics' },
                    { code: 'MANAGE_CLASSES', label: 'Manage Classes', desc: 'Manage classes, subjects, & batch allocations' },
                  ].map((perm) => {
                    const isChecked = additionalPermissions.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-primary/40 ring-1 ring-primary/20 shadow-sm'
                            : 'bg-white/60 border-outline-variant/20 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setAdditionalPermissions((prev) =>
                              prev.includes(perm.code)
                                ? prev.filter((p) => p !== perm.code)
                                : [...prev, perm.code]
                            );
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer mt-0.5"
                        />
                        <div>
                          <span className="font-headings font-bold text-xs text-secondary block">{perm.label}</span>
                          <span className="text-[10px] text-on-surface-variant leading-tight block">{perm.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="font-headings font-bold text-secondary block">Administrative Bio & Notes</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Describe your administrative responsibilities..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-headings font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {savingProfile ? 'Saving Changes to Database...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Password & Security (1 col) */}
        <div className="space-y-6">
          {/* Password Update Card */}
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/15 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-outline-variant/15 pb-4">
              <span className="material-symbols-outlined text-rose-600 text-[22px]">lock_reset</span>
              <div>
                <h2 className="font-headings font-extrabold text-base text-secondary">Change Password</h2>
                <p className="text-[11px] text-on-surface-variant">Update security credentials</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="font-headings font-bold text-secondary block">Current Password *</label>
                <div className="relative flex items-center">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs font-mono"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCurrentPass((prev) => !prev);
                    }}
                    className="absolute right-2.5 z-20 p-1.5 rounded-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Toggle current password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px] block pointer-events-none">
                      {showCurrentPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="font-headings font-bold text-secondary block">New Password *</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs font-mono"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNewPass((prev) => !prev);
                    }}
                    className="absolute right-2.5 z-20 p-1.5 rounded-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Toggle new password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px] block pointer-events-none">
                      {showNewPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="font-headings font-bold text-secondary block">Confirm New Password *</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary text-xs font-mono"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirmPass((prev) => !prev);
                    }}
                    className="absolute right-2.5 z-20 p-1.5 rounded-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
                    aria-label="Toggle confirm password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px] block pointer-events-none">
                      {showConfirmPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 bg-secondary hover:bg-secondary-container text-white font-headings font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  {savingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* System Info & Security Card */}
          <div className="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/20 space-y-3 text-xs">
            <h3 className="font-headings font-bold text-secondary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
              Admin Session & Privileges
            </h3>
            <div className="space-y-1.5 text-on-surface-variant text-[11px]">
              <p className="flex justify-between">
                <span>Admin Login Username:</span>
                <strong className="text-secondary font-mono">{profileForm.email}</strong>
              </p>
              <p className="flex justify-between">
                <span>Access Level:</span>
                <strong className="text-secondary">{profileForm.role}</strong>
              </p>
              <p className="flex justify-between">
                <span>Authentication Mode:</span>
                <strong className="text-emerald-700 font-mono">JWT + Firebase</strong>
              </p>
              <p className="flex justify-between">
                <span>Database Sync:</span>
                <strong className="text-primary font-semibold">Firestore & MongoDB</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
