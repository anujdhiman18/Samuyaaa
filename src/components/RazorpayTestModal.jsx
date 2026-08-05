import React from 'react';

export default function RazorpayTestModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/20 relative font-body overflow-hidden">
        {/* Header background accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-amber-500 to-emerald-500" />
        
        <div className="flex items-center justify-between mb-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </span>
            <div>
              <h3 className="font-headings font-extrabold text-lg text-secondary">
                Razorpay Test Mode Guide
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Simulated Test Payment Credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4 text-xs text-on-surface-variant">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0 mt-0.5">info</span>
            <p className="text-[11px]">
              Razorpay is currently running in <strong>Test Mode</strong>. No real money will be deducted. Use any of the test credentials below in the Razorpay popup.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider">
              1. Test Card Payment
            </h4>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface-variant/70">Card Number:</span>
                <span className="font-bold text-secondary select-all">4111 1111 1111 1111</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/70">Expiry Date:</span>
                <span className="font-bold text-secondary">12 / 30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/70">CVV:</span>
                <span className="font-bold text-secondary">123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/70">OTP (if prompted):</span>
                <span className="font-bold text-emerald-700">123456</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider">
              2. Test UPI Payment
            </h4>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 font-mono text-[11px] flex justify-between items-center">
              <span className="text-on-surface-variant/70">UPI ID / VPA:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                success@razorpay
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider">
              3. Test Netbanking
            </h4>
            <p className="text-[11px]">
              Select <strong>SBI</strong> or <strong>HDFC</strong> in the Netbanking tab and click <strong>Success</strong>.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant/15 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-secondary text-white font-headings font-bold text-xs hover:bg-secondary/90 transition-all shadow-md"
          >
            Got it, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
