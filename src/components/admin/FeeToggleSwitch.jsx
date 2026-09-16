import React from 'react';

export default function FeeToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  paymentDate,
  size = 'md',
  showLabel = true,
}) {
  const isSmall = size === 'sm';

  const formattedDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled && onChange) onChange(!checked);
        }}
        className={`relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer flex-shrink-0 ${
          isSmall ? 'w-12 h-6.5 p-0.5' : 'w-14 h-7.5 p-1'
        } ${
          checked
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
            : 'bg-rose-500 hover:bg-rose-600 shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={checked ? `Paid on ${formattedDate || 'current date'}` : 'Unpaid for current month'}
      >
        <span
          className={`transform rounded-full bg-white transition-transform duration-300 flex items-center justify-center text-[10px] shadow-sm ${
            isSmall ? 'w-5 h-5' : 'w-5.5 h-5.5'
          } ${
            checked
              ? isSmall
                ? 'translate-x-5.5 text-emerald-700'
                : 'translate-x-6.5 text-emerald-700'
              : 'translate-x-0 text-rose-600'
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">{checked ? 'check' : 'close'}</span>
        </span>
      </button>

      {showLabel && (
        <div className="flex flex-col text-left whitespace-nowrap">
          <span
            className={`font-medium text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap ${
              checked
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${checked ? 'bg-emerald-600' : 'bg-rose-500'}`}></span>
            {checked ? 'Paid' : 'Unpaid'}
          </span>
          {checked && formattedDate && (
            <span className="text-[9px] text-on-surface-variant/70 mt-0.5 font-medium whitespace-nowrap">
              {formattedDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
