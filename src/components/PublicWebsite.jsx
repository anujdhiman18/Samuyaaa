import React, { useState, useEffect } from 'react';

import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import About from './About';
import Course from './Course';
import FacultySection from './FacultySection';
import AlumniSection from './AlumniSection';
import Results from './Results';
import Testimonials from './Testimonials';
import Faq from './Faq';
import CtaHub from './CtaHub';
import Content from './Content';
import WhatsAppFab from './WhatsAppFab';
import Footer from './Footer';
import BookingModal from './BookingModel';
import { announcementService } from '../services/api';

export default function PublicWebsite() {
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
          <div className="bg-primary text-white text-xs py-2.5 px-4 text-center font-headings font-bold flex items-center justify-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>
              <strong>LATEST NOTICE:</strong> {latestAnnouncement.title} - {latestAnnouncement.content}
            </span>
          </div>
        )}

        <About onOpenBooking={openBooking} />
        <Course onOpenBooking={openBooking} />
        <FacultySection />
        <AlumniSection />
        <Results />
        <Testimonials />
        <Faq />
        <CtaHub onOpenBooking={openBooking} />
        <Content />
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
