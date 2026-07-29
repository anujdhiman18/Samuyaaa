import React from 'react';

export default function Modal({ isOpen, open, onClose, title, children, maxWidth = 'max-w-xl' }) {
  const showModal = isOpen !== undefined ? isOpen : open;
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div
        className={`bg-white w-full ${maxWidth} rounded-2xl shadow-premium border border-outline-variant/15 relative z-10 overflow-hidden transform transition-all animate-fadeIn max-h-[90vh] flex flex-col`}
      >
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low">
          <h3 className="font-headings font-bold text-base text-secondary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">{children}</div>
      </div>
    </div>
  );
}
