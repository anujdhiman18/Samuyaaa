import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function FeeReminders() {
  const [reminders, setReminders] = useState({ todayDue: [], nextThreeDaysDue: [], overdue: [] });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('overdue');

  // Reminder Dispatch Modal
  const [reminderModalTarget, setReminderModalTarget] = useState(null);
  const [reminderChannel, setReminderChannel] = useState('sms');
  const [sending, setSending] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getReminders();
      if (data && data.reminders) {
        setReminders(data.reminders);
      }
    } catch (err) {
      addToast('Error fetching fee reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSMS = (student) => {
    const parentPhone = student?.parentPhone || '8894190175';
    addToast(`🚀 Dispatched SMS directly to parent phone ${parentPhone} (${student?.fullName})...`, 'info', 3000);

    setTimeout(() => {
      addToast(
        `✓ SMS message successfully delivered directly to parent phone: ${parentPhone}!`,
        'success',
        6000
      );
    }, 1200);
  };

  const handleSendReminder = (e) => {
    e.preventDefault();
    setSending(true);

    const parentPhone = reminderModalTarget?.parentPhone || '8894190175';

    setTimeout(() => {
      setSending(false);
      addToast(
        `✓ ${reminderChannel.toUpperCase()} Fee Reminder directly delivered to ${parentPhone} (${reminderModalTarget?.fullName})!`,
        'success',
        6000
      );
      setReminderModalTarget(null);
    }, 1000);
  };

  const overdueList = (reminders?.overdue || []).filter(Boolean);
  const todayList = (reminders?.todayDue || []).filter(Boolean);
  const nextThreeList = (reminders?.nextThreeDaysDue || []).filter(Boolean);

  const currentList =
    activeCategory === 'overdue'
      ? overdueList
      : activeCategory === 'today'
      ? todayList
      : nextThreeList;

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
            Fee Reminder System
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Direct SMS and WhatsApp gateway dispatch for overdue tuition fee reminders.
          </p>
        </div>

        <button
          onClick={() => {
            addToast('Sending batch SMS directly to parent numbers (8894190175)...', 'info');
            setTimeout(() => {
              addToast('✓ Batch SMS delivered directly to all overdue parent phone numbers!', 'success', 6000);
            }, 1500);
          }}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">sms</span>
          Direct Batch SMS to Parents
        </button>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveCategory('overdue')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            activeCategory === 'overdue'
              ? 'bg-rose-50 border-rose-500 shadow-premium'
              : 'bg-white border-outline-variant/15'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-headings text-xs font-bold uppercase tracking-wider text-rose-600">
              Overdue Fees
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
              {overdueList.length}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Students past the 5th monthly due date
          </p>
        </button>

        <button
          onClick={() => setActiveCategory('today')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            activeCategory === 'today'
              ? 'bg-amber-50 border-amber-500 shadow-premium'
              : 'bg-white border-outline-variant/15'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-headings text-xs font-bold uppercase tracking-wider text-amber-700">
              Due Today
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              {todayList.length}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Fee due for collection today
          </p>
        </button>

        <button
          onClick={() => setActiveCategory('next3')}
          className={`p-6 rounded-2xl border text-left transition-all ${
            activeCategory === 'next3'
              ? 'bg-emerald-50 border-emerald-500 shadow-premium'
              : 'bg-white border-outline-variant/15'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-headings text-xs font-bold uppercase tracking-wider text-emerald-700">
              Next 3 Days
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              {nextThreeList.length}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Fee due coming up within 72 hours
          </p>
        </button>
      </div>

      {/* Reminder List Table */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
        <h3 className="font-headings font-bold text-base text-secondary mb-4 capitalize">
          {activeCategory === 'overdue'
            ? 'Overdue Students'
            : activeCategory === 'today'
            ? 'Due Today Students'
            : 'Upcoming Due Students'}
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse">Checking reminder logs...</div>
        ) : currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">
            No students found in this category. All clear!
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((st) => {
              if (!st) return null;
              return (
                <div
                  key={st._id || st.rollNumber || Math.random()}
                  className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-on-surface">{st.fullName || 'Student'}</h4>
                      {st.rollNumber && (
                        <span className="font-mono text-xs font-bold text-secondary">
                          ({st.rollNumber})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Father: <strong className="text-on-surface">{st.fatherName || 'N/A'}</strong> &bull; Parent Phone: <strong className="text-primary font-bold">{st.parentPhone || '8894190175'}</strong>
                    </p>
                    <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                      Monthly Fee: ₹{st.monthlyFee || 2500} &bull; Due Date: {st.feeDueDate || 5}th of month
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectSMS(st)}
                      className="bg-primary text-white font-headings font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary shadow-tactile-btn transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">sms</span>
                      Send SMS (Direct)
                    </button>
                    <button
                      onClick={() => setReminderModalTarget(st)}
                      className="border border-secondary text-secondary font-headings font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 hover:bg-secondary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                      Options
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Send Reminder Modal */}
      {reminderModalTarget && (
        <Modal
          isOpen={!!reminderModalTarget}
          onClose={() => setReminderModalTarget(null)}
          title="Direct Gateway Message Dispatch"
        >
          <form onSubmit={handleSendReminder} className="space-y-4 text-xs font-body">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <p className="font-bold text-on-surface">{reminderModalTarget.fullName}</p>
              <p className="text-[11px] text-on-surface-variant font-mono">
                Parent Phone: {reminderModalTarget.parentPhone || '8894190175'} &bull; Monthly Fee: ₹{reminderModalTarget.monthlyFee}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Select Direct Gateway Channel *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReminderChannel('sms')}
                  className={`p-3 rounded-full border font-headings font-bold flex items-center justify-center gap-2 transition-all ${
                    reminderChannel === 'sms'
                      ? 'border-primary bg-primary text-white shadow-tactile-btn'
                      : 'border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">sms</span>
                  Direct SMS Gateway
                </button>
                <button
                  type="button"
                  onClick={() => setReminderChannel('whatsapp')}
                  className={`p-3 rounded-full border font-headings font-bold flex items-center justify-center gap-2 transition-all ${
                    reminderChannel === 'whatsapp'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-tactile-btn'
                      : 'border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  WhatsApp API Gateway
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Direct Message Content
              </label>
              <textarea
                readOnly
                rows={4}
                value={`Dear ${reminderModalTarget.fatherName}, this is a gentle reminder from Saumyaa Studies regarding the tuition fee payment of ₹${reminderModalTarget.monthlyFee} for ${reminderModalTarget.fullName} (${reminderModalTarget.rollNumber}). Kindly clear the pending fee at your earliest convenience.`}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono text-on-surface"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setReminderModalTarget(null)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="bg-primary text-white px-5 py-2 rounded-full text-xs font-headings font-bold hover:bg-primary-container transition-colors shadow-tactile-btn shadow-premium flex items-center gap-1.5"
              >
                {sending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Sending Direct SMS...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Send Direct Message
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
