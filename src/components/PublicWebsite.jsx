import React, { useState, useEffect } from 'react';

import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import About from './About';
import Course from './Course';
import FacultySection from './FacultySection';
import Results from './Results';
import Testimonials from './Testimonials';
import AdmissionProcessSection from './AdmissionProcessSection';
import Faq from './Faq';
import CtaHub from './CtaHub';
import Content from './Content';
import WhatsAppFab from './WhatsAppFab';
import Footer from './Footer';
import { announcementService } from '../services/api';

export default function PublicWebsite() {
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
    <div className="min-h-screen flex flex-col bg-[var(--apple-bg)] text-[var(--apple-text-primary)]">
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-grow pt-14 sm:pt-16">
        {/* Apple Style Announcement Ribbon */}
        {latestAnnouncement && (
          <div className="bg-[#f5f5f7] text-[#1d1d1f] text-xs py-2.5 px-4 text-center border-b border-[#d2d2d7] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0066cc]">campaign</span>
            <span>
              <strong className="font-semibold text-[#1d1d1f]">NOTICE:</strong> {latestAnnouncement.title} — {latestAnnouncement.content}
            </span>
          </div>
        )}

        <About />
        <Course />
        <AdmissionProcessSection />
        <FacultySection />
        <Results />
        <Testimonials />
        <Faq />
        <CtaHub />
        <Content />
      </main>

      <WhatsAppFab />
      <Footer />
    </div>
  );
}
