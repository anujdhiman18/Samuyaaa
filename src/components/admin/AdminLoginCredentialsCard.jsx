import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminLoginCredentialsCard({ user, userType = 'student', onResetPassword }) {
  const [showInitial, setShowInitial] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resetResultModalOpen, setResetResultModalOpen] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { addToast } = useToast();

  if (!user) return null;

  const username = user.email || user.username || user.rollNumber || 'N/A';
  const initialPassword = user.initialPassword;
  const isTempPassword = Boolean(user.mustChangePassword);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'success');
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      if (onResetPassword) {
        const res = await onResetPassword(user._id || user.id);
        if (res && res.temporaryPassword) {
          setNewTempPassword(res.temporaryPassword);
          setConfirmModalOpen(false);
          setResetResultModalOpen(true);
          addToast('Temporary password reset successfully!', 'success');
        } else {
          addToast(res?.message || 'Failed to reset password', 'error');
        }
      }
    } catch (err) {
      addToast(err.message || 'Error resetting password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/20 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </div>
          <div>
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
              Admin Login Credentials
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              System access control &amp; password management (Authorized Admin Only)
            </p>
          </div>
        </div>

        <div>
          {isTempPassword ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
              Temporary Password Active
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Permanent Password Set
            </span>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Username Card */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 space-y-2">
          <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
            Username (Email Address)
          </span>
          <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-outline-variant/20">
            <span className="font-mono font-bold text-secondary text-xs truncate">{username}</span>
            <button
              type="button"
              onClick={() => handleCopy(username, 'Username')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-secondary text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0"
              title="Copy Username"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              Copy
            </button>
          </div>
          <p className="text-[10px] text-on-surface-variant italic">
            Email entered during registration automatically serves as the login username.
          </p>
        </div>

        {/* Password Status & Controls Card */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 space-y-2">
          <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
            Password Hash Status
          </span>
          <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-outline-variant/20">
            <span className="font-mono text-secondary text-xs tracking-widest font-extrabold">
              ••••••••••••••••
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SHA-256 Hashed
            </span>
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Passwords are securely hashed. Plaintext passwords are never stored in the database.
          </p>
        </div>
      </div>

      {/* Initial Password Section & Action Controls */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="font-bold text-secondary text-xs block">Initial Temporary Password</span>
            {initialPassword ? (
              <p className="text-[11px] text-slate-600">
                Initial setup password stored for onboarding setup.
              </p>
            ) : (
              <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Initial password is no longer available.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {initialPassword && (
              <button
                type="button"
                onClick={() => setShowInitial(!showInitial)}
                className="px-3 py-1.5 rounded-xl bg-white border border-outline-variant/30 text-secondary text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showInitial ? 'visibility_off' : 'visibility'}
                </span>
                {showInitial ? 'Hide Initial Password' : 'Show Initial Password'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">lock_reset</span>
              Reset Password
            </button>
          </div>
        </div>

        {/* Revealed Initial Password Panel */}
        {initialPassword && showInitial && (
          <div className="p-3 bg-white rounded-xl border border-blue-200 flex items-center justify-between gap-3 animate-fadeIn">
            <div>
              <span className="text-[10px] text-blue-900 font-bold block">INITIAL TEMPORARY PASSWORD:</span>
              <span className="font-mono font-extrabold text-sm text-primary tracking-wider">{initialPassword}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(initialPassword, 'Initial Password')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              Copy Password
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-premium border border-outline-variant/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>
            <div>
              <h3 className="font-headings font-extrabold text-lg text-secondary">
                Reset Login Password?
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                This will generate a new secure temporary password for <strong className="text-secondary">{user.fullName || user.name}</strong> (<span className="font-mono text-primary">{username}</span>).
              </p>
              <ul className="text-[11px] text-on-surface-variant mt-3 space-y-1 list-disc pl-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/15">
                <li>Password will be securely hashed before saving to database.</li>
                <li>The user will be required to create a new password on next login.</li>
                <li>You will be shown the new temporary password ONCE to copy.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-secondary bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Resetting...
                  </>
                ) : (
                  'Generate New Temporary Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Result Modal (Displayed Once to Admin) */}
      {resetResultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-premium border border-emerald-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div>
              <h3 className="font-headings font-extrabold text-lg text-secondary">
                New Temporary Password Generated
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Please copy and provide this temporary password to <strong className="text-secondary">{user.fullName || user.name}</strong>:
              </p>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-300/80 text-center space-y-2">
              <span className="text-[10px] font-bold text-emerald-900 tracking-wider block">NEW TEMPORARY PASSWORD</span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono font-extrabold text-2xl text-emerald-950 tracking-wider">{newTempPassword}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(newTempPassword, 'Temporary Password')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">warning</span>
              <span>
                <strong>Important:</strong> After closing this dialog, this plaintext password will not be retrievable again. The user must change their password on next login.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setResetResultModalOpen(false);
                  setNewTempPassword('');
                }}
                className="px-5 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
