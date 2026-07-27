import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feeService } from '../../services/api';

export default function StudentFee() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await feeService.getFeePayments({ studentId: user?.id || 's1' });
      if (res && res.payments) {
        setPayments(res.payments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthlyFee = 2500;
  const isPaidForCurrentMonth = true;
  const pendingAmount = isPaidForCurrentMonth ? 0 : monthlyFee;

  return (
    <div className="space-y-6 font-body">
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Tuition Fee &amp; Payment Status
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Monthly fee structure, paid receipts, and payment history timeline.
        </p>
      </div>

      {/* Pending Fee Notification Banner */}
      {!isPaidForCurrentMonth && (
        <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px]">warning</span>
            <div>
              <h4 className="font-headings font-bold text-sm">Tuition Fee Due Notice</h4>
              <p className="text-xs text-rose-100">
                Monthly fee of ₹{monthlyFee} for July 2026 is due on 5th July. Kindly deposit at institute desk.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-white text-rose-600 font-headings font-bold text-xs">
            FEE DUE
          </span>
        </div>
      )}

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Monthly Tuition Fee
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
            ₹{monthlyFee.toLocaleString()}
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">Grade 10 Batch</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Total Paid (July 2026)
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
            ₹{monthlyFee.toLocaleString()}
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Paid on 5th July ✓</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Pending Balance
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
            ₹{pendingAmount}
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Zero Balance Outstanding</p>
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
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p._id}
                className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-primary block">
                    {p.receiptNumber}
                  </span>
                  <h4 className="font-headings font-bold text-sm text-secondary mt-0.5">
                    Tuition Fee for {p.monthYear} &bull; ₹{p.amountPaid}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Paid via {p.paymentMode} on {new Date(p.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-headings font-bold text-xs rounded-full">
                  Verified Paid ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
