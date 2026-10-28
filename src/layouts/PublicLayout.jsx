import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileMenu from '../components/MobileMenu';
import WhatsAppFab from '../components/WhatsAppFab';
import Footer from '../components/Footer';
import { announcementService } from '../services/api';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  useEffect(() => {
    fetchLatestAnnouncement();
  }, []);

  const fetchLatestAnnouncement = async () => {
    try {
      const data = await announcementService.getAnnouncements();
      if (data && data.announcements && data.announcements.length > 0) {
        setLatestAnnouncement(data.announcements[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--apple-bg)] text-[var(--apple-text-primary)] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display','Helvetica_Neue',Arial,sans-serif]">
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-grow pt-14 sm:pt-16">
        {/* Apple Style Announcement Ribbon */}
        {latestAnnouncement && (
          <div className="bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7] text-xs py-2.5 px-4 text-center border-b border-[#d2d2d7] dark:border-[#424245] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0071e3] dark:text-[#2997ff]">campaign</span>
            <span>
              <strong className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">NOTICE:</strong> {latestAnnouncement.title} — {latestAnnouncement.content}
            </span>
          </div>
        )}

        <Outlet />
      </main>

      <WhatsAppFab />
      <Footer />
    </div>
  );
}
