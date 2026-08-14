import React from 'react';

export default function ConfirmModal({ isOpen, open, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false }) {
  const showModal = open !== undefined || isOpen !== undefined ? Boolean(open || isOpen) : true;
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body">
      <div onClick={onClose} className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm" />
      <div className="bg-white w-full max-w-md rounded-2xl shadow-premium border border-outline-variant/15 p-6 relative z-10 text-center animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px]">warning</span>
        </div>
        <h4 className="font-headings font-bold text-lg text-secondary mb-2">
          {title || 'Are you sure?'}
        </h4>
        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
          {message || 'This action cannot be undone. All associated data will be permanently removed.'}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-headings font-bold transition-colors shadow-tactile-btn shadow-premium flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">delete</span>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
