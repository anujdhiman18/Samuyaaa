import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ForcePasswordChangeModal() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!user || !user.mustChangePassword || user.role === 'Admin' || user.role === 'SuperAdmin') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current temporary password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('New password must be different from your current temporary password');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changeUserPassword({
        id: user._id || user.id,
        role: user.role,
        currentPassword,
        newPassword,
      });

      if (res && res.success) {
        addToast('Password updated successfully! Please use your new password for future logins.', 'success');
        updateUser({
          ...user,
          mustChangePassword: false,
          initialPassword: null,
        });
      } else {
        setErrorMsg(res?.message || 'Failed to update password');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-primary/20 space-y-6">
        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-3xl">key_visual</span>
          </div>
          <h2 className="font-headings font-extrabold text-xl text-secondary">
            Password Change Required
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Please create a new password to continue.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
          {/* Current Temporary Password */}
          <div>
            <label className="block font-bold text-secondary mb-1">
              Current Temporary Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Permanent Password */}
          <div>
            <label className="block font-bold text-secondary mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block font-bold text-secondary mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
            />
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant space-y-1">
            <span className="font-bold text-secondary block">Password Security Requirements:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Must be at least 6 characters long</li>
              <li>Must be different from your temporary password</li>
              <li>Plaintext passwords are never stored in the system</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-headings font-bold text-xs hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Updating Password...
              </>
            ) : (
              'Save New Password & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
