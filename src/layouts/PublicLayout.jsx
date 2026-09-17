import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileMenu from '../components/MobileMenu';
import WhatsAppFab from '../components/WhatsAppFab';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModel';
import { announcementService } from '../services/api';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [prefilledProgram, setPrefilledProgram] = useState('');
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

  function openBooking(program = '') {
    setPrefilledProgram(program);
    setBookingOpen(true);
  }

  function closeBooking() {
    setBookingOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <Navbar
        onOpenBooking={openBooking}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenBooking={() => openBooking()}
      />

      <main className="flex-grow pt-20">
        {/* Dynamic Admin Announcement Bar */}
        {latestAnnouncement && (
          <div className="bg-primary text-white text-xs py-2.5 px-4 text-center font-headings font-bold flex items-center justify-center gap-2 shadow-premium border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px] text-tertiary">campaign</span>
            <span>
              <strong className="text-surface font-extrabold">LATEST NOTICE:</strong> {latestAnnouncement.title} - {latestAnnouncement.content}
            </span>
          </div>
        )}

        <Outlet context={{ openBooking }} />
      </main>

      <WhatsAppFab />
      <Footer />

      <BookingModal
        open={bookingOpen}
        prefilledProgram={prefilledProgram}
        onClose={closeBooking}
      />
    </div>
  );
}
