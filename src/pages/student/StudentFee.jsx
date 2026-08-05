import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { feeService } from '../../services/api';
import { openRazorpayCheckout } from '../../services/razorpay';
import RazorpayTestModal from '../../components/RazorpayTestModal';

export default function StudentFee() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTestGuideOpen, setIsTestGuideOpen] = useState(false);
  const [payingMonth, setPayingMonth] = useState('August 2026');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await feeService.getFeePayments({ studentId: user?.id || user?._id || 's1' });
      if (res && res.payments) {
        setPayments(res.payments);
      }
    } catch (err) {
      console.error('Error fetching student fee payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const studentProfile = user?.studentProfile || {};
  const monthlyFee = Number(user?.monthlyFee || studentProfile.monthlyFee || 2500);

  // Check if current month fee is already paid
  const isJulyPaid = payments.some((p) => (p.monthYear || '').includes('July 2026'));
  const isAugPaid = payments.some((p) => (p.monthYear || '').includes('August 2026'));

  const currentDueMonth = !isJulyPaid ? 'July 2026' : !isAugPaid ? 'August 2026' : 'September 2026';
  const isFullyPaid = isJulyPaid && isAugPaid;

  const handleRazorpayPayment = () => {
    setIsPaying(true);

    openRazorpayCheckout({
      amount: monthlyFee,
      description: `Monthly Tuition Fee (${payingMonth}) - Saumyaa Studies`,
      student: {
        _id: user?.id || user?._id,
        fullName: user?.name || user?.fullName || studentProfile.fullName || 'Student',
        email: user?.email || studentProfile.email || 'anuj1100.be24@chitkarauniversity.edu.in',
        phone: user?.phone || studentProfile.phone || '9816001122',
        rollNumber: user?.rollNumber || studentProfile.rollNumber || 'SAU-12-005',
      },
      monthYear: payingMonth,
      onSuccess: async (rzpRes) => {
        try {
          const recRes = await feeService.recordPayment({
            studentId: user?.id || user?._id || 's1',
            amountPaid: monthlyFee,
            paymentMode: 'Razorpay (Online)',
            monthYear: payingMonth,
            razorpay_payment_id: rzpRes.razorpay_payment_id,
            razorpay_order_id: rzpRes.razorpay_order_id,
            remarks: `Razorpay Test Mode Online Payment (ID: ${rzpRes.razorpay_payment_id})`,
          });

          addToast(`Payment Successful! Receipt #${recRes.payment?.receiptNumber || 'Generated'}`, 'success');
          await fetchPayments();
        } catch (err) {
          addToast('Payment recorded locally, but failed to sync server.', 'warning');
          fetchPayments();
        } finally {
          setIsPaying(false);
        }
      },
      onError: (err) => {
        setIsPaying(false);
        addToast(err.message || 'Razorpay payment was cancelled or failed.', 'error');
      },
      onDismiss: () => {
        setIsPaying(false);
      },
    });
  };

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Tuition Fee &amp; Online Payment Gateway
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Pay monthly fees securely via Razorpay Test Mode, view receipts, and payment history.
          </p>
        </div>

        <button
          onClick={() => setIsTestGuideOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-headings font-bold text-xs hover:bg-amber-100 transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">help_outline</span>
          Razorpay Test Credentials Guide
        </button>
      </div>

      {/* Online Razorpay Payment Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-secondary via-secondary/95 to-primary text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mb-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Razorpay Test Mode Active
            </div>
            <h3 className="font-headings font-extrabold text-xl md:text-2xl text-white">
              Instant Online Tuition Fee Payment
            </h3>
            <p className="text-xs text-surface-variant/80">
              Pay monthly tuition fees instantly using UPI (GPay/PhonePe), Credit/Debit Cards, or Netbanking in test mode.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <span className="text-white/70">Select Month:</span>
              <select
                value={payingMonth}
                onChange={(e) => setPayingMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold focus:outline-none focus:bg-white/20 text-xs"
              >
                <option value="July 2026" className="text-secondary">July 2026</option>
                <option value="August 2026" className="text-secondary">August 2026</option>
                <option value="September 2026" className="text-secondary">September 2026</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider block">Amount Due</span>
              <span className="font-headings font-extrabold text-3xl text-white">₹{monthlyFee.toLocaleString()}</span>
            </div>

            <button
              onClick={handleRazorpayPayment}
              disabled={isPaying}
              className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-secondary font-headings font-extrabold text-xs transition-all shadow-lg hover:shadow-amber-400/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
              {isPaying ? 'Opening Razorpay...' : `Pay ₹${monthlyFee} via Razorpay`}
            </button>
          </div>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Monthly Tuition Fee
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
            ₹{monthlyFee.toLocaleString()}
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
            {user?.className || '12th (+2)'} Batch
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Total Paid Receipts
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
            {payments.length}
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Verified Payments</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Current Status
          </p>
          <h3 className={`font-headings font-extrabold text-2xl mt-2 ${isFullyPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isFullyPaid ? 'Fully Paid ✓' : `Due: ${currentDueMonth}`}
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
            {isFullyPaid ? 'Zero Balance Outstanding' : 'Payable Online'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Monthly Fee Due Date
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-primary mt-2">
            5th
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
            Of every month
          </p>
        </div>
      </div>

      {/* Payment Receipts Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
        <h3 className="font-headings font-bold text-base text-secondary mb-4">
          Payment Receipt History
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse">Loading fee receipts...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">No fee receipts found yet.</div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p._id || p.receiptNumber}
                className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary block">
                      {p.receiptNumber}
                    </span>
                    {p.paymentMode?.includes('Razorpay') && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200">
                        ⚡ Razorpay Online
                      </span>
                    )}
                  </div>
                  <h4 className="font-headings font-bold text-sm text-secondary mt-0.5">
                    Tuition Fee for {p.monthYear} &bull; ₹{p.amountPaid}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Paid via {p.paymentMode} on {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Today'}
                  </p>
                  {p.transactionId && (
                    <p className="text-[10px] font-mono text-on-surface-variant/80 mt-1">
                      Txn ID: <span className="font-bold text-secondary">{p.transactionId}</span>
                    </p>
                  )}
                </div>
                <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-headings font-bold text-xs rounded-full self-start sm:self-auto">
                  Verified Paid ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Razorpay Test Credentials Guide Modal */}
      <RazorpayTestModal
        isOpen={isTestGuideOpen}
        onClose={() => setIsTestGuideOpen(false)}
      />
    </div>
  );
}
