import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(user?.id || 's1');
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div className="space-y-6 font-body">
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          In-App Notifications
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Real-time alerts for exam marks, attendance records, fee due reminders, and announcements.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs animate-pulse">Loading notifications feed...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-premium border border-outline-variant/15">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
            notifications_off
          </span>
          <h4 className="font-headings font-bold text-base text-on-surface">
            No Notifications
          </h4>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-outline-variant/15'
                  : 'bg-primary-fixed/40 border-primary/30 shadow-premium'
              }`}
            >
              <div className="flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {n.type === 'Marks'
                      ? 'grade'
                      : n.type === 'Attendance'
                      ? 'calendar_month'
                      : n.type === 'Fee'
                      ? 'payments'
                      : 'campaign'}
                  </span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headings font-bold text-sm text-on-surface">{n.title}</h4>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-body">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="text-xs text-secondary font-headings font-bold hover:underline shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
