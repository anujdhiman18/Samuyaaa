import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  demoBookingService,
  facultyService,
  subjectService,
  subscribeFirestoreCollection,
  initialMockDemoBookings,
  getStoredDemoBookings,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

const STATUS_TABS = ['All', 'Pending', 'Scheduled', 'Completed', 'Enrolled', 'Cancelled'];
const BRANCH_OPTIONS = ['All', 'Main Center (Bagru)', 'Branch (Daroh)'];

const initialNewBookingForm = {
  studentName: '',
  parentPhone: '',
  parentEmail: '',
  branch: 'Main Center (Bagru)',
  subject: 'Mathematics Foundation',
  category: 'Foundation',
  class: '10th Grade',
  batchTime: '4:30 PM - 6:00 PM',
  scheduledDate: '',
  scheduledTime: '',
  facultyMentor: 'Jitender Sharma',
  meetingMode: 'Offline Classroom',
  adminNotes: '',
};

export default function DemoBookingManagement({ isEmbedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatusFilter = searchParams.get('status') || 'All';

  const [bookings, setBookings] = useState(() => {
    try {
      return getStoredDemoBookings() || initialMockDemoBookings;
    } catch (e) {
      return initialMockDemoBookings;
    }
  });
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const { addToast } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [branchFilter, setBranchFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookingData, setNewBookingData] = useState(initialNewBookingForm);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    facultyMentor: 'Jitender Sharma',
    meetingMode: 'Offline Classroom',
    adminNotes: '',
    status: 'Scheduled',
  });

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertData, setConvertData] = useState({
    fullName: '',
    phone: '',
    email: '',
    className: '',
    subjects: [],
    branch: '',
    monthlyFee: 2500,
  });

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchFacultyAndSubjects();

    const unsubscribe = subscribeFirestoreCollection('demo_bookings', initialMockDemoBookings, (list) => {
      if (list && list.length > 0) {
        list.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
        setBookings(list);
      }
    });

    const handleUpdate = () => fetchBookings();
    window.addEventListener('saumyaa_data_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await demoBookingService.getBookings();
      if (res && res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.warn('Error fetching demo bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyAndSubjects = async () => {
    try {
      const facRes = await facultyService.getFaculty();
      if (facRes && facRes.faculty) setFacultyList(facRes.faculty);
      const subRes = await subjectService.getSubjects();
      if (subRes && subRes.subjects) setSubjectList(subRes.subjects);
    } catch (err) {}
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'Pending').length;
    const scheduled = bookings.filter((b) => b.status === 'Scheduled').length;
    const completed = bookings.filter((b) => b.status === 'Completed').length;
    const enrolled = bookings.filter((b) => b.status === 'Enrolled').length;
    return { total, pending, scheduled, completed, enrolled };
  }, [bookings]);

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'All' || (b.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
      const matchBranch = branchFilter === 'All' || b.branch === branchFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (b.studentName && b.studentName.toLowerCase().includes(term)) ||
        (b.parentPhone && b.parentPhone.includes(term)) ||
        (b.parentEmail && b.parentEmail.toLowerCase().includes(term)) ||
        (b.subject && b.subject.toLowerCase().includes(term)) ||
        (b.bookingId && b.bookingId.toLowerCase().includes(term)) ||
        (b.class && b.class.toLowerCase().includes(term));

      return matchStatus && matchBranch && matchSearch;
    });
  }, [bookings, statusFilter, branchFilter, searchTerm]);

  // Handle Status Filter Change
  const handleTabChange = (tab) => {
    setStatusFilter(tab);
    setSearchParams(tab === 'All' ? {} : { status: tab });
  };

  // Handle Schedule Modal Open
  const handleOpenSchedule = (booking) => {
    setSelectedBooking(booking);
    setScheduleForm({
      scheduledDate: booking.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: booking.scheduledTime || '04:30 PM',
      facultyMentor: booking.facultyMentor || 'Jitender Sharma',
      meetingMode: booking.meetingMode || 'Offline Classroom',
      adminNotes: booking.adminNotes || '',
      status: booking.status === 'Pending' ? 'Scheduled' : booking.status,
    });
    setScheduleModalOpen(true);
  };

  // Save Schedule
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await demoBookingService.updateBookingStatus(
        selectedBooking._id || selectedBooking.id,
        scheduleForm.status,
        scheduleForm.adminNotes,
        scheduleForm
      );
      addToast(`Demo for ${selectedBooking.studentName} scheduled successfully!`, 'success');
      setScheduleModalOpen(false);
      fetchBookings();
    } catch (err) {
      addToast(err.message || 'Error updating schedule', 'error');
    }
  };

  // Handle Quick Status Change
  const handleQuickStatusChange = async (booking, newStatus) => {
    try {
      await demoBookingService.updateBookingStatus(booking._id || booking.id, newStatus);
      addToast(`Booking status updated to ${newStatus}`, 'success');
      fetchBookings();
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  // Handle Convert to Regular Student
  const handleOpenConvert = (booking) => {
    setSelectedBooking(booking);
    setConvertData({
      fullName: booking.studentName,
      phone: booking.parentPhone,
      email: booking.parentEmail && booking.parentEmail !== 'Not Provided' ? booking.parentEmail : `${booking.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.saumyaa.edu.in`,
      className: booking.class || '10th Grade',
      subjects: [booking.subject || 'General Academics'],
      branch: booking.branch || 'Main Center (Bagru)',
      monthlyFee: 2500,
    });
    setConvertModalOpen(true);
  };

  const handleSaveConvert = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await demoBookingService.convertToStudent(selectedBooking, convertData);
      addToast(`🎉 ${convertData.fullName} successfully enrolled into Student Directory!`, 'success');
      setConvertModalOpen(false);
      fetchBookings();
    } catch (err) {
      addToast(err.message || 'Error converting student', 'error');
    }
  };

  // Handle Manual Add Booking
  const handleSaveNewBooking = async (e) => {
    e.preventDefault();
    if (!newBookingData.studentName || !newBookingData.parentPhone) {
      addToast('Student Name and Parent Phone are required.', 'warning');
      return;
    }
    try {
      await demoBookingService.submitDemoBooking(newBookingData);
      addToast('Manual demo booking registered successfully!', 'success');
      setShowAddModal(false);
      setNewBookingData(initialNewBookingForm);
      fetchBookings();
    } catch (err) {
      addToast('Error registering demo booking', 'error');
    }
  };

  // Handle Delete
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      await demoBookingService.deleteBooking(bookingToDelete._id || bookingToDelete.id);
      addToast('Demo booking deleted successfully', 'success');
      setConfirmDeleteModal(false);
      setBookingToDelete(null);
      fetchBookings();
    } catch (err) {
      addToast('Failed to delete booking', 'error');
    }
  };

  // Quick WhatsApp helper
  const getWhatsAppLink = (booking) => {
    const cleanPhone = (booking.parentPhone || '').replace(/[^0-9]/g, '');
    const num = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello! Regarding the live demo class at Saumyaa Studies for ${booking.studentName} (${booking.subject} - ${booking.class}). We would like to confirm your schedule.`
    );
    return `https://wa.me/${num}?text=${msg}`;
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-headings font-extrabold bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Review
        </span>
      );
    }
    if (s === 'scheduled') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-headings font-extrabold bg-blue-500/10 text-blue-700 border border-blue-500/20 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
          Scheduled
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-headings font-extrabold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">check_circle</span>
          Completed
        </span>
      );
    }
    if (s === 'enrolled') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-headings font-extrabold bg-purple-500/10 text-purple-700 border border-purple-500/20 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
          Enrolled Student
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-headings font-extrabold bg-gray-500/10 text-gray-700 border border-gray-500/20">
        {status || 'Cancelled'}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-body animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-headings font-bold text-[11px] uppercase tracking-wider">
              Live Inquiries Desk
            </span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Sync Active
            </span>
          </div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary mt-1 tracking-tight">
            Demo Class Bookings &amp; Inquiries
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Review, schedule, follow up, and convert incoming live demo class applications into enrolled students.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchBookings()}
            className="p-2.5 rounded-full border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Refresh Bookings"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
          <button
            onClick={() => {
              setNewBookingData(initialNewBookingForm);
              setShowAddModal(true);
            }}
            className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Manual Demo</span>
          </button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Bookings</p>
            <p className="font-headings font-extrabold text-2xl text-secondary mt-0.5">{metrics.total}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Review</p>
            <p className="font-headings font-extrabold text-2xl text-amber-600 mt-0.5">{metrics.pending}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Scheduled Demos</p>
            <p className="font-headings font-extrabold text-2xl text-blue-600 mt-0.5">{metrics.scheduled}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">event_upcoming</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed</p>
            <p className="font-headings font-extrabold text-2xl text-emerald-600 mt-0.5">{metrics.completed}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Converted Enrolled</p>
            <p className="font-headings font-extrabold text-2xl text-purple-600 mt-0.5">{metrics.enrolled}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-outline-variant/15">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab;
            const count =
              tab === 'All'
                ? bookings.length
                : bookings.filter((b) => (b.status || 'Pending').toLowerCase() === tab.toLowerCase()).length;

            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-headings font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-secondary'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student, phone, subject, ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant/30 text-xs bg-surface-container-lowest focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/30 text-xs bg-white text-on-surface font-semibold focus:border-primary cursor-pointer w-full sm:w-auto"
            >
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Centers' : b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bookings Data Table & Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant animate-pulse bg-white rounded-2xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-[32px] text-primary animate-spin mb-2 block mx-auto">
            sync
          </span>
          <span>Loading demo class bookings database...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-outline-variant/20 space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">event_busy</span>
          </div>
          <h3 className="font-headings font-bold text-base text-secondary">No Demo Bookings Found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All'
              ? 'No demo class bookings matched your active search or filters.'
              : 'There are currently no demo class inquiries. New online submissions from the website will appear here in real-time.'}
          </p>
          {(searchTerm || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                handleTabChange('All');
                setBranchFilter('All');
              }}
              className="px-4 py-2 rounded-full bg-primary/10 text-primary font-headings font-bold text-xs hover:bg-primary/20 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <div
              key={b._id || b.id || b.bookingId}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              {/* Left Column: Student Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant/20">
                    {b.bookingId || 'DEMO'}
                  </span>
                  <h3 className="font-headings font-extrabold text-base text-secondary group-hover:text-primary transition-colors">
                    {b.studentName}
                  </h3>
                  {getStatusBadge(b.status)}
                </div>

                {/* Course & Class Details */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">menu_book</span>
                    {b.subject}
                  </span>
                  <span className="text-on-surface-variant/40">&bull;</span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
                    {b.class}
                  </span>
                  <span className="text-on-surface-variant/40">&bull;</span>
                  <span className="text-on-surface-variant text-[11px] font-medium">
                    Batch: <strong className="font-mono text-secondary">{b.batchTime || 'Pending'}</strong>
                  </span>
                  <span className="text-on-surface-variant/40">&bull;</span>
                  <span className="text-on-surface-variant text-[11px] flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px] text-[#42A5F5]">location_on</span>
                    {b.branch}
                  </span>
                </div>

                {/* Contact & Date row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant pt-1">
                  <a
                    href={`tel:${b.parentPhone}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">call</span>
                    <span>{b.parentPhone}</span>
                  </a>
                  {b.parentEmail && b.parentEmail !== 'Not Provided' && (
                    <a
                      href={`mailto:${b.parentEmail}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary">mail</span>
                      <span>{b.parentEmail}</span>
                    </a>
                  )}
                  <span className="text-[11px] text-on-surface-variant/60 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    Booked:{' '}
                    {b.submittedAt
                      ? new Date(b.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'}
                  </span>
                </div>

                {/* Scheduled Info Banner if Scheduled */}
                {b.scheduledDate && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-blue-700">event</span>
                      <span>
                        Demo Scheduled for:{' '}
                        <strong>
                          {new Date(b.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>{' '}
                        at <strong>{b.scheduledTime || '4:30 PM'}</strong> ({b.meetingMode || 'Offline Classroom'})
                      </span>
                    </div>
                    <div className="text-blue-800 text-[11px]">
                      Mentor: <strong>{b.facultyMentor || 'Jitender Sharma'}</strong>
                    </div>
                  </div>
                )}

                {/* Admin Follow-up Notes */}
                {b.adminNotes && (
                  <p className="text-[11px] text-secondary/80 bg-surface-container/40 p-2 rounded-lg border border-outline-variant/15 italic">
                    <strong className="not-italic text-secondary font-bold">Admin Note:</strong> "{b.adminNotes}"
                  </p>
                )}
              </div>

              {/* Right Column: Quick Action Buttons */}
              <div className="flex flex-wrap lg:flex-col items-end justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/15">
                {/* Primary Action Button */}
                <div className="flex items-center gap-1.5 w-full lg:w-auto">
                  <button
                    onClick={() => handleOpenSchedule(b)}
                    className="flex-1 lg:flex-none px-3.5 py-1.5 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                    <span>{b.scheduledDate ? 'Edit Schedule' : 'Schedule Demo'}</span>
                  </button>

                  {b.status !== 'Enrolled' && (
                    <button
                      onClick={() => handleOpenConvert(b)}
                      className="flex-1 lg:flex-none px-3.5 py-1.5 rounded-full bg-purple-600 text-white font-headings font-bold text-xs hover:bg-purple-700 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      title="Enroll into Regular Students"
                    >
                      <span className="material-symbols-outlined text-[15px]">person_add</span>
                      <span>Enroll Student</span>
                    </button>
                  )}
                </div>

                {/* Secondary Quick Contact Tools */}
                <div className="flex items-center gap-1">
                  <a
                    href={getWhatsAppLink(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors"
                    title="Send WhatsApp Message"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                  </a>
                  <a
                    href={`tel:${b.parentPhone}`}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-700 hover:bg-blue-500 hover:text-white transition-colors"
                    title="Call Parent"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                  </a>

                  {b.status === 'Scheduled' && (
                    <button
                      onClick={() => handleQuickStatusChange(b, 'Completed')}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors"
                      title="Mark as Completed"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setBookingToDelete(b);
                      setConfirmDeleteModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-700 hover:bg-rose-500 hover:text-white transition-colors"
                    title="Delete Booking"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Schedule Demo Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={`Schedule Demo Class - ${selectedBooking?.studentName || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveSchedule} className="p-5 space-y-4 font-body">
          <div className="p-3 bg-surface-container rounded-xl text-xs space-y-1">
            <p className="text-secondary font-bold">
              Subject: <span className="text-primary">{selectedBooking?.subject}</span> ({selectedBooking?.class})
            </p>
            <p className="text-on-surface-variant">
              Preferred Center: <strong>{selectedBooking?.branch}</strong> &bull; Parent Phone: <strong>{selectedBooking?.parentPhone}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Scheduled Date *</label>
              <input
                type="date"
                required
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Scheduled Time *</label>
              <input
                type="text"
                required
                value={scheduleForm.scheduledTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                placeholder="e.g. 04:30 PM - 06:00 PM"
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Assign Faculty Mentor</label>
              <select
                value={scheduleForm.facultyMentor}
                onChange={(e) => setScheduleForm({ ...scheduleForm, facultyMentor: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary cursor-pointer"
              >
                <option value="Jitender Sharma">Jitender Sharma (Director &amp; Master Physics Mentor)</option>
                {facultyList.map((f) => (
                  <option key={f.id || f._id} value={f.name}>
                    {f.name} ({f.subject || f.designation || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Meeting / Class Mode</label>
              <select
                value={scheduleForm.meetingMode}
                onChange={(e) => setScheduleForm({ ...scheduleForm, meetingMode: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary cursor-pointer"
              >
                <option value="Offline Classroom">Offline Classroom (Center)</option>
                <option value="Live Interactive Online">Live Interactive Online (Google Meet)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-secondary">Booking Status</label>
            <select
              value={scheduleForm.status}
              onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary cursor-pointer"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending Review</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-secondary">Admin &amp; Follow-up Notes</label>
            <textarea
              rows={3}
              value={scheduleForm.adminNotes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, adminNotes: e.target.value })}
              placeholder="e.g. Spoke with parent on phone. Student requested extra guidance in Algebra and Mechanics."
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container shadow-md"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Convert to Regular Student Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={`Enroll Student - ${convertData.fullName}`}
        size="md"
      >
        <form onSubmit={handleSaveConvert} className="p-5 space-y-4 font-body">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-purple-700">how_to_reg</span>
              One-Click Student Onboarding
            </p>
            <p className="text-[11px] text-purple-800">
              This will create a verified record in the <strong>Student Management Directory</strong> with login credentials and mark this demo booking as <strong>Enrolled</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Full Student Name *</label>
              <input
                type="text"
                required
                value={convertData.fullName}
                onChange={(e) => setConvertData({ ...convertData, fullName: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Parent Contact Phone *</label>
              <input
                type="tel"
                required
                value={convertData.phone}
                onChange={(e) => setConvertData({ ...convertData, phone: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Enrolled Class *</label>
              <input
                type="text"
                required
                value={convertData.className}
                onChange={(e) => setConvertData({ ...convertData, className: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Assigned Center</label>
              <select
                value={convertData.branch}
                onChange={(e) => setConvertData({ ...convertData, branch: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary cursor-pointer"
              >
                <option value="Main Center (Bagru)">Main Center (Bagru)</option>
                <option value="Branch (Daroh)">Branch (Daroh)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-secondary">Monthly Tuition Fee (₹)</label>
            <input
              type="number"
              value={convertData.monthlyFee}
              onChange={(e) => setConvertData({ ...convertData, monthlyFee: Number(e.target.value) })}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setConvertModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-purple-600 text-white text-xs font-headings font-bold hover:bg-purple-700 shadow-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>Confirm Enrollment</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. Add Manual Booking Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Manual Demo Class Inquiry"
        size="md"
      >
        <form onSubmit={handleSaveNewBooking} className="p-5 space-y-4 font-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Student Name *</label>
              <input
                type="text"
                required
                value={newBookingData.studentName}
                onChange={(e) => setNewBookingData({ ...newBookingData, studentName: e.target.value })}
                placeholder="Student Full Name"
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Parent Phone Number *</label>
              <input
                type="tel"
                required
                value={newBookingData.parentPhone}
                onChange={(e) => setNewBookingData({ ...newBookingData, parentPhone: e.target.value })}
                placeholder="10-digit mobile"
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Subject Offered</label>
              <input
                type="text"
                value={newBookingData.subject}
                onChange={(e) => setNewBookingData({ ...newBookingData, subject: e.target.value })}
                placeholder="e.g. Physics IIT-JEE Prep"
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Target Class</label>
              <input
                type="text"
                value={newBookingData.class}
                onChange={(e) => setNewBookingData({ ...newBookingData, class: e.target.value })}
                placeholder="e.g. 10th Grade / 11th (+1)"
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Assigned Batch Time</label>
              <input
                type="text"
                value={newBookingData.batchTime}
                onChange={(e) => setNewBookingData({ ...newBookingData, batchTime: e.target.value })}
                placeholder="e.g. 4:30 PM - 6:00 PM"
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-secondary">Preferred Center</label>
              <select
                value={newBookingData.branch}
                onChange={(e) => setNewBookingData({ ...newBookingData, branch: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary cursor-pointer"
              >
                <option value="Main Center (Bagru)">Main Center (Bagru)</option>
                <option value="Branch (Daroh)">Branch (Daroh)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-secondary">Initial Notes / Inquiry Details</label>
            <textarea
              rows={2}
              value={newBookingData.adminNotes}
              onChange={(e) => setNewBookingData({ ...newBookingData, adminNotes: e.target.value })}
              placeholder="e.g. Walk-in parent inquiry. Wants weekend morning demo slot."
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs bg-white focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-full text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container shadow-md"
            >
              Save Demo Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* 8. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal}
        onClose={() => {
          setConfirmDeleteModal(false);
          setBookingToDelete(null);
        }}
        onConfirm={handleDeleteBooking}
        title="Delete Demo Booking"
        message={`Are you sure you want to delete the demo booking for "${bookingToDelete?.studentName}"? This action cannot be undone.`}
        confirmText="Delete Booking"
        type="danger"
      />
    </div>
  );
}
