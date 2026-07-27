import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/api';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAnnouncements();
      if (data && data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Institute Announcements &amp; Notices
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Official circulars, exam schedules, and holiday notices published by faculty.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs animate-pulse">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-premium border border-outline-variant/15">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
            campaign
          </span>
          <h4 className="font-headings font-bold text-base text-on-surface">
            No Active Announcements
          </h4>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((anc) => (
            <div
              key={anc._id}
              className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {anc.category || 'General Notice'}
                </span>
                <span className="text-xs text-on-surface-variant font-semibold">
                  Published: {new Date(anc.publishedDate).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-headings font-bold text-lg text-on-surface mb-2">
                {anc.title}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-body">
                {anc.content}
              </p>
              <div className="text-[11px] text-secondary font-headings font-bold border-t border-outline-variant/15 pt-3">
                Issued By: {anc.authorName || 'Jitender Sharma (Director)'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
