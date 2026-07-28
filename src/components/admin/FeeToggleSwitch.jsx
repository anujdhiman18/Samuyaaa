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
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled && onChange) onChange(!checked);
        }}
        className={`relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
          isSmall ? 'w-12 h-6.5 p-0.5' : 'w-14 h-7.5 p-1'
        } ${
          checked
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
            : 'bg-rose-500 hover:bg-rose-600 shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={checked ? `Paid on ${formattedDate || 'current date'}` : 'Unpaid for current month'}
      >
        <span
          className={`transform rounded-full bg-white transition-transform duration-300 flex items-center justify-center font-extrabold text-[10px] shadow-md ${
            isSmall ? 'w-5 h-5' : 'w-5.5 h-5.5'
          } ${
            checked
              ? isSmall
                ? 'translate-x-5.5 text-emerald-700'
                : 'translate-x-6.5 text-emerald-700'
              : 'translate-x-0 text-rose-600'
          }`}
        >
          {checked ? '✓' : '×'}
        </span>
      </button>

      {showLabel && (
        <div className="flex flex-col text-left">
          <span
            className={`font-headings font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
              checked
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/40'
                : 'bg-rose-100 text-rose-800 border border-rose-300/40'
            }`}
          >
            {checked ? 'PAID ✓' : 'UNPAID !'}
          </span>
          {checked && formattedDate && (
            <span className="text-[9px] text-on-surface-variant/70 mt-0.5 font-medium">
              {formattedDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
