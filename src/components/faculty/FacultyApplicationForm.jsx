import React, { useState, useEffect } from 'react';
import { facultyApplicationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const initialFormData = {
  // Personal Details
  fullName: '',
  dob: '',
  gender: 'Male',
  contactNumber: '',
  email: '',
  currentAddress: '',
  permanentAddress: '',
  sameAsCurrentAddress: false,

  // Educational Qualifications
  highestDegree: "Master's Degree (M.Sc / M.Tech / M.A)",
  universityName: '',
  graduationYear: '2022',
  specialization: '',
  certifications: '',

  // Professional Experience
  totalExperience: '3 - 5 Years',
  previousInstitutions: '',
  subjectsTaught: '',
  currentStatus: 'Currently Employed',

  // Position Details
  positionApplied: 'Subject Teacher',
  subjectsExpertise: ['Mathematics'],
  preferredTimeSlot: 'Full-time (Morning Shift)',
  expectedJoiningDate: '',

  // Additional Information
  whyJoinReason: '',
  skillsAchievements: '',
  references: [
    { name: '', contact: '', relationship: '' }
  ],

  // Attachments
  resumeFile: null,
  resumeFileName: '',
  idProofFile: null,
  idProofFileName: '',
  certificatesFile: null,
  certificatesFileName: '',

  // Declaration
  acceptedDeclaration: false,
};

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics & Mechanics',
  'Chemistry (Organic/Inorganic)',
  'Biology & Life Sciences',
  'Computer Science / Coding',
  'English & Communication',
  'Reasoning & Mental Ability',
  'Social Studies & General Awareness',
  'JEE / NEET Competitive Specialist',
  'Olympiad Coach'
];

const DEGREE_OPTIONS = [
  "Ph.D. / Doctorate",
  "Master's Degree (M.Sc / M.Tech / M.A / M.Ed)",
  "Bachelor's Degree (B.Sc / B.Tech / B.Ed / B.A)",
  "Diploma / Professional Certification",
  "Other"
];

const POSITION_OPTIONS = [
  'Subject Teacher',
  'Senior Lecturer / Mentor',
  'Head of Department (HOD)',
  'Academic Coordinator',
  'Lab Demonstrator',
  'Olympiad & Competitive Coach'
];

const EMPLOYMENT_STATUS_OPTIONS = [
  'Currently Employed',
  'Serving Notice Period',
  'Immediately Available',
  'Freelance / Online Educator',
  'Fresh Graduate'
];

const TIME_SLOT_OPTIONS = [
  'Full-time (Morning Shift)',
  'Full-time (Evening Shift)',
  'Part-time (Weekend Batches)',
  'Part-time (Flexible / Hourly)'
];

export default function FacultyApplicationForm({ centerName = "Saumyaa Studies", onSuccess }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSinglePageMode, setIsSinglePageMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto load saved draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`saumyaa_faculty_app_draft`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed, resumeFile: null, idProofFile: null, certificatesFile: null }));
        setDraftSaved(true);
      }
    } catch (e) {
      console.warn('Could not load faculty draft:', e);
    }
  }, []);

  // Save draft helper
  const handleSaveDraft = () => {
    try {
      const { resumeFile, idProofFile, certificatesFile, ...draftable } = formData;
      localStorage.setItem('saumyaa_faculty_app_draft', JSON.stringify(draftable));
      setDraftSaved(true);
      addToast('Draft saved successfully! You can resume anytime.', 'info');
    } catch (e) {
      addToast('Failed to save draft.', 'error');
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('saumyaa_faculty_app_draft');
    setFormData(initialFormData);
    setDraftSaved(false);
    setErrors({});
    addToast('Form cleared.', 'info');
  };

  // Auto-fill sample application data for demonstration
  const handleAutoFillDemo = () => {
    setFormData({
      fullName: 'Prof. Ramesh Chander',
      dob: '1988-06-18',
      gender: 'Male',
      contactNumber: '9816543210',
      email: 'ramesh.chander@gmail.com',
      currentAddress: 'Villa #12, Rose Colony, Main Highway, Palampur, HP',
      permanentAddress: 'Villa #12, Rose Colony, Main Highway, Palampur, HP',
      sameAsCurrentAddress: true,

      highestDegree: "Master's Degree (M.Sc / M.Tech / M.A / M.Ed)",
      universityName: 'Himachal Pradesh University, Shimla',
      graduationYear: '2012',
      specialization: 'Organic Chemistry & Chemical Kinetics',
      certifications: 'CSIR-NET Lecturer Certificate, B.Ed with Honors',

      totalExperience: '5 - 10 Years',
      previousInstitutions: 'St. Xavier Senior Secondary, Resonance Academy',
      subjectsTaught: 'Senior Chemistry (Class 11 & 12), NEET Organic Chemistry',
      currentStatus: 'Serving Notice Period',

      positionApplied: 'Head of Department (HOD)',
      subjectsExpertise: ['Chemistry (Organic/Inorganic)', 'JEE / NEET Competitive Specialist'],
      preferredTimeSlot: 'Full-time (Morning Shift)',
      expectedJoiningDate: '2026-08-20',

      whyJoinReason: `${centerName} has earned an stellar reputation for academic rigour and student mentorship. I wish to contribute my 10+ years of teaching excellence to build top rankers here.`,
      skillsAchievements: 'Authored 3 study modules for NEET aspirants. Conducted hands-on chemistry lab demonstrations for 500+ students.',
      references: [
        { name: 'Dr. S. K. Sood', contact: '9816098765', relationship: 'Former Principal at St. Xavier' },
        { name: 'Er. Vikas Mahajan', contact: '9876501234', relationship: 'Academic Director, Resonance' }
      ],

      resumeFile: null,
      resumeFileName: 'Ramesh_Chander_CV.pdf',
      idProofFile: null,
      idProofFileName: 'Aadhaar_Ramesh.pdf',
      certificatesFile: null,
      certificatesFileName: 'MSc_Chemistry_Degree.pdf',

      acceptedDeclaration: true,
    });
    setErrors({});
    addToast('Demo data auto-filled into application form!', 'success');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'sameAsCurrentAddress') {
        setFormData((prev) => ({
          ...prev,
          sameAsCurrentAddress: checked,
          permanentAddress: checked ? prev.currentAddress : prev.permanentAddress,
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        if (name === 'currentAddress' && prev.sameAsCurrentAddress) {
          next.permanentAddress = value;
        }
        return next;
      });
    }

    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubjectToggle = (subjectName) => {
    setFormData((prev) => {
      const current = prev.subjectsExpertise || [];
      const updated = current.includes(subjectName)
        ? current.filter((s) => s !== subjectName)
        : [...current, subjectName];
      return { ...prev, subjectsExpertise: updated };
    });
  };

  // References list helpers
  const handleReferenceChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.references];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, references: updated };
    });
  };

  const handleAddReference = () => {
    if (formData.references.length >= 3) {
      addToast('You can add up to 3 references.', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      references: [...prev.references, { name: '', contact: '', relationship: '' }],
    }));
  };

  const handleRemoveReference = (index) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  };

  // Mock File Upload Handler
  const handleFileUpload = (fieldName, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be less than 10MB', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [fieldName + 'File']: file,
      [fieldName + 'FileName']: file.name,
    }));
    addToast(`Attached: ${file.name}`, 'success');
  };

  // Validation logic per step
  const validateStep = (stepNumber) => {
    const errs = {};
    if (stepNumber === 1 || isSinglePageMode) {
      if (!formData.fullName.trim()) errs.fullName = 'Full Name is required.';
      if (!formData.dob) errs.dob = 'Date of Birth is required.';
      if (!formData.contactNumber.trim()) errs.contactNumber = 'Contact Number is required.';
      else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\s+/g, ''))) {
        errs.contactNumber = 'Enter a valid 10-digit contact number.';
      }
      if (!formData.email.trim()) errs.email = 'Email Address is required.';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errs.email = 'Enter a valid email address.';
      }
      if (!formData.currentAddress.trim()) errs.currentAddress = 'Current Address is required.';
      if (!formData.permanentAddress.trim()) errs.permanentAddress = 'Permanent Address is required.';
    }

    if (stepNumber === 2 || isSinglePageMode) {
      if (!formData.universityName.trim()) errs.universityName = 'University/Institution Name is required.';
      if (!formData.specialization.trim()) errs.specialization = 'Specialization / Major Subject is required.';
    }

    if (stepNumber === 3 || isSinglePageMode) {
      if (!formData.previousInstitutions.trim()) errs.previousInstitutions = 'Please specify previous institutions or write N/A.';
      if (!formData.subjectsTaught.trim()) errs.subjectsTaught = 'Please enter subjects previously taught.';
    }

    if (stepNumber === 4 || isSinglePageMode) {
      if (!formData.expectedJoiningDate) errs.expectedJoiningDate = 'Expected Joining Date is required.';
      if (!formData.subjectsExpertise || formData.subjectsExpertise.length === 0) {
        errs.subjectsExpertise = 'Select at least one area of expertise.';
      }
    }

    if (stepNumber === 5 || isSinglePageMode) {
      if (!formData.whyJoinReason.trim()) errs.whyJoinReason = 'Please enter a short explanation of why you wish to join.';
    }

    if (stepNumber === 6 || isSinglePageMode) {
      if (!formData.acceptedDeclaration) {
        errs.acceptedDeclaration = 'You must accept the declaration to submit.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 150, behavior: 'smooth' });
      }
    } else {
      addToast('Please complete all required fields in this step.', 'error');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(6)) {
      addToast('Please complete all mandatory fields and accept the declaration.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Process file attachments if files were selected
      const fileAttachments = [];
      if (formData.resumeFile) {
        const b64 = await readFileAsBase64(formData.resumeFile);
        if (b64) fileAttachments.push({ filename: formData.resumeFileName || 'Resume.pdf', content: b64, contentType: formData.resumeFile.type });
      }
      if (formData.idProofFile) {
        const b64 = await readFileAsBase64(formData.idProofFile);
        if (b64) fileAttachments.push({ filename: formData.idProofFileName || 'ID_Proof.pdf', content: b64, contentType: formData.idProofFile.type });
      }
      if (formData.certificatesFile) {
        const b64 = await readFileAsBase64(formData.certificatesFile);
        if (b64) fileAttachments.push({ filename: formData.certificatesFileName || 'Certificates.pdf', content: b64, contentType: formData.certificatesFile.type });
      }

      const payload = {
        fullName: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        email: formData.email,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,

        highestDegree: formData.highestDegree,
        universityName: formData.universityName,
        graduationYear: formData.graduationYear,
        specialization: formData.specialization,
        certifications: formData.certifications,

        totalExperience: formData.totalExperience,
        previousInstitutions: formData.previousInstitutions,
        subjectsTaught: formData.subjectsTaught,
        currentStatus: formData.currentStatus,

        positionApplied: formData.positionApplied,
        subjectsExpertise: formData.subjectsExpertise,
        preferredTimeSlot: formData.preferredTimeSlot,
        expectedJoiningDate: formData.expectedJoiningDate,

        whyJoinReason: formData.whyJoinReason,
        skillsAchievements: formData.skillsAchievements,
        references: formData.references.filter((r) => r.name.trim() !== ''),

        resumeFileName: formData.resumeFileName || 'Resume.pdf',
        idProofFileName: formData.idProofFileName || 'ID_Proof.pdf',
        certificatesFileName: formData.certificatesFileName || 'Certificates.pdf',
        fileAttachments,
      };

      const result = await facultyApplicationService.submitApplication(payload);
      if (result.success) {
        localStorage.removeItem('saumyaa_faculty_app_draft');
        setSubmittedApp(result);
        if (result.emailSent) {
          addToast('Application submitted & emailed to anujdhiman1706@gmail.com & jitender0585@gmail.com!', 'success');
        } else {
          addToast(`Application saved! Warning: Email service error (${result.emailWarning || 'Check EMAIL_PASS in server/.env'}).`, 'warning');
        }
        if (onSuccess) onSuccess(result);
      }
    } catch (err) {
      addToast(err.message || 'Submission error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // If application is successfully submitted, render the success receipt view
  if (submittedApp) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 font-body">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-premium border border-outline-variant/20 space-y-8 text-center print:shadow-none print:border-none print:p-0">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl">verified</span>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-primary/10 text-primary font-headings font-extrabold text-xs uppercase tracking-widest rounded-full">
              Application Submitted
            </span>
            <h1 className="font-headings font-extrabold text-3xl md:text-4xl text-secondary">
              Welcome to the {centerName} Talent Pool!
            </h1>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Your faculty joining application has been recorded in our academic recruitment database. Our HOD & Board of Directors will review your credentials shortly.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 text-left space-y-4 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-outline-variant/20 gap-2">
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-semibold">Application Ref Code</span>
                <p className="font-headings font-extrabold text-xl text-primary">{submittedApp.applicationId}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs text-on-surface-variant uppercase font-semibold">Submission Date</span>
                <p className="text-sm font-semibold text-secondary">
                  {new Date(submittedApp.application.appliedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Applicant Name:</span>
                <p className="font-headings font-bold text-sm text-secondary">{submittedApp.application.fullName}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Position Applied:</span>
                <p className="font-headings font-bold text-sm text-secondary">{submittedApp.application.positionApplied}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Contact Email:</span>
                <p className="font-semibold text-on-surface">{submittedApp.application.email}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Phone Number:</span>
                <p className="font-semibold text-on-surface">{submittedApp.application.contactNumber}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Highest Qualification:</span>
                <p className="font-semibold text-on-surface">{submittedApp.application.highestDegree} ({submittedApp.application.specialization})</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Teaching Experience:</span>
                <p className="font-semibold text-on-surface">{submittedApp.application.totalExperience}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4 justify-center print:hidden">
            <button
              onClick={handlePrintReceipt}
              className="bg-secondary text-white font-headings font-bold text-xs px-6 py-3 rounded-full shadow-premium hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print / Save PDF Receipt
            </button>
            <button
              onClick={() => {
                setSubmittedApp(null);
                setFormData(initialFormData);
                setCurrentStep(1);
              }}
              className="border border-outline-variant/30 text-on-surface-variant font-headings font-bold text-xs px-6 py-3 rounded-full hover:bg-surface-container transition-colors"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepsList = [
    { num: 1, title: 'Personal Details', icon: 'person' },
    { num: 2, title: 'Qualifications', icon: 'school' },
    { num: 3, title: 'Experience', icon: 'work' },
    { num: 4, title: 'Position Details', icon: 'assignment_ind' },
    { num: 5, title: 'Additional & Refs', icon: 'psychology' },
    { num: 6, title: 'Attachments', icon: 'cloud_upload' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-body text-on-surface">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-secondary/90 via-secondary to-primary/90 text-white rounded-3xl p-6 md:p-10 shadow-premium mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-headings font-extrabold uppercase tracking-wider text-white border border-white/20">
                Academic Recruitment Portal
              </span>
              {draftSaved && (
                <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Draft Auto-Saved
                </span>
              )}
            </div>
            <h1 className="font-headings font-extrabold text-2xl md:text-4xl text-white tracking-tight">
              Faculty Application & Joining Form
            </h1>
            <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed font-light">
              Join the academic team at <strong className="font-semibold text-white">{centerName}</strong>. We are actively seeking passionate educators, subject matter experts, and research scholars.
            </p>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-headings font-bold text-[11px] px-3.5 py-2 rounded-full backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
              title="Auto fill sample data for quick preview"
            >
              <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
              Auto-Fill Demo
            </button>

            <button
              type="button"
              onClick={() => setIsSinglePageMode(!isSinglePageMode)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-headings font-bold text-[11px] px-3 py-2 rounded-full transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSinglePageMode ? 'view_carousel' : 'format_list_bulleted'}
              </span>
              {isSinglePageMode ? 'Step Wizard' : 'All-in-One Scroll'}
            </button>

            {draftSaved && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-400/30 text-[11px] font-bold px-3 py-2 rounded-full transition-colors"
                title="Reset all fields"
              >
                Clear Form
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wizard Progress Bar (if in Step Wizard Mode) */}
      {!isSinglePageMode && (
        <div className="mb-8 bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm">
          {/* Steps Desktop Nav */}
          <div className="hidden md:grid grid-cols-6 gap-2">
            {stepsList.map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : isCompleted
                      ? 'text-emerald-700 hover:bg-emerald-50'
                      : 'text-on-surface-variant/60 hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-headings transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? <span className="material-symbols-outlined text-[16px]">check</span> : step.num}
                  </div>
                  <span className="text-[11px] font-headings tracking-tight truncate w-full text-center">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Steps Mobile Indicator */}
          <div className="md:hidden flex items-center justify-between px-2">
            <span className="text-xs font-headings font-bold text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                {stepsList[currentStep - 1].icon}
              </span>
              Step {currentStep} of 6: {stepsList[currentStep - 1].title}
            </span>
            <span className="text-xs font-bold text-primary font-headings">
              {Math.round((currentStep / 6) * 100)}% Complete
            </span>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-surface-container-high h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-secondary to-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ==================== SECTION 1: PERSONAL DETAILS ==================== */}
        {(currentStep === 1 || isSinglePageMode) && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/15 shadow-premium space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <div>
                <h2 className="font-headings font-extrabold text-lg text-secondary">1. Personal Details</h2>
                <p className="text-xs text-on-surface-variant">Full legal name, contact information, and residence details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Dr. Rajesh Kumar Sharma"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.fullName ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-rose-500 font-medium">{errors.fullName}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ''}
                  min="1960-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors cursor-pointer ${
                    errors.dob ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.dob && <p className="text-[11px] text-rose-500 font-medium">{errors.dob}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 9816012345"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.contactNumber ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.contactNumber && <p className="text-[11px] text-rose-500 font-medium">{errors.contactNumber}</p>}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. rajesh.sharma@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.email ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-500 font-medium">{errors.email}</p>}
              </div>

              {/* Current Address */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Current Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="currentAddress"
                  rows={2}
                  value={formData.currentAddress}
                  onChange={handleInputChange}
                  placeholder="House number, Street, City, State, Pincode"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.currentAddress ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.currentAddress && <p className="text-[11px] text-rose-500 font-medium">{errors.currentAddress}</p>}
              </div>

              {/* Permanent Address */}
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                    Permanent Address <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-primary font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      name="sameAsCurrentAddress"
                      checked={formData.sameAsCurrentAddress}
                      onChange={handleInputChange}
                      className="rounded accent-primary"
                    />
                    Same as Current Address
                  </label>
                </div>
                <textarea
                  name="permanentAddress"
                  rows={2}
                  disabled={formData.sameAsCurrentAddress}
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  placeholder="Permanent residential address"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    formData.sameAsCurrentAddress ? 'bg-surface-container text-on-surface-variant/70 cursor-not-allowed' : ''
                  } ${errors.permanentAddress ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'}`}
                />
                {errors.permanentAddress && <p className="text-[11px] text-rose-500 font-medium">{errors.permanentAddress}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 2: EDUCATIONAL QUALIFICATIONS ==================== */}
        {(currentStep === 2 || isSinglePageMode) && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/15 shadow-premium space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">school</span>
              </div>
              <div>
                <h2 className="font-headings font-extrabold text-lg text-secondary">2. Educational Qualifications</h2>
                <p className="text-xs text-on-surface-variant">Academic degrees, university details, and additional certifications.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highest Degree */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Highest Degree Obtained</label>
                <select
                  name="highestDegree"
                  value={formData.highestDegree}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  {DEGREE_OPTIONS.map((deg) => (
                    <option key={deg} value={deg}>
                      {deg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year of Graduation */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Year of Graduation</label>
                <select
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  {Array.from({ length: 45 }, (_, i) => 2026 - i).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* University/Institution Name */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  University / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="universityName"
                  value={formData.universityName}
                  onChange={handleInputChange}
                  placeholder="e.g. Panjab University / IIT Delhi / NIT Hamirpur"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.universityName ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.universityName && <p className="text-[11px] text-rose-500 font-medium">{errors.universityName}</p>}
              </div>

              {/* Specialization / Subject */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Specialization / Major Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g. Pure Physics, Organic Chemistry, Applied Mathematics, Biotechnology"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.specialization ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.specialization && <p className="text-[11px] text-rose-500 font-medium">{errors.specialization}</p>}
              </div>

              {/* Additional Certifications */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary">
                  Additional Certifications (if any)
                </label>
                <textarea
                  name="certifications"
                  rows={2}
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="e.g. CSIR-NET JRF, GATE Qualified, B.Ed, NPTEL Advanced Physics, B.Ed with distinction"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 3: PROFESSIONAL EXPERIENCE ==================== */}
        {(currentStep === 3 || isSinglePageMode) && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/15 shadow-premium space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">work</span>
              </div>
              <div>
                <h2 className="font-headings font-extrabold text-lg text-secondary">3. Professional Experience</h2>
                <p className="text-xs text-on-surface-variant">Teaching track record, former institutes, and current status.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Years of Teaching Experience */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Total Years of Teaching Experience</label>
                <select
                  name="totalExperience"
                  value={formData.totalExperience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="Fresh Graduate / < 1 Year">Fresh Graduate / &lt; 1 Year</option>
                  <option value="1 - 3 Years">1 - 3 Years</option>
                  <option value="3 - 5 Years">3 - 5 Years</option>
                  <option value="5 - 10 Years">5 - 10 Years</option>
                  <option value="10+ Years">10+ Years (Senior Veteran)</option>
                </select>
              </div>

              {/* Current Employment Status */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Current Employment Status</label>
                <select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  {EMPLOYMENT_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous Institution(s) */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Previous Institution(s) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="previousInstitutions"
                  value={formData.previousInstitutions}
                  onChange={handleInputChange}
                  placeholder="e.g. Allen Career Institute Kota, DAV Public School, Resonance"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.previousInstitutions ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.previousInstitutions && <p className="text-[11px] text-rose-500 font-medium">{errors.previousInstitutions}</p>}
              </div>

              {/* Subjects / Courses Taught */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Subjects / Courses Taught Previously <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="subjectsTaught"
                  rows={2}
                  value={formData.subjectsTaught}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Secondary Physics (Class 11 & 12), JEE Advanced Problem Sets, NEET Biology"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.subjectsTaught ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.subjectsTaught && <p className="text-[11px] text-rose-500 font-medium">{errors.subjectsTaught}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 4: POSITION DETAILS ==================== */}
        {(currentStep === 4 || isSinglePageMode) && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/15 shadow-premium space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">assignment_ind</span>
              </div>
              <div>
                <h2 className="font-headings font-extrabold text-lg text-secondary">4. Position Details</h2>
                <p className="text-xs text-on-surface-variant">Role applied for, subjects of expertise, shift preferences, and joining date.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Position Applied For */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Position Applied For</label>
                <select
                  name="positionApplied"
                  value={formData.positionApplied}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  {POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Time Slot */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">Preferred Time Slot / Work Mode</label>
                <select
                  name="preferredTimeSlot"
                  value={formData.preferredTimeSlot}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  {TIME_SLOT_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Joining Date */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                  Expected Joining Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="expectedJoiningDate"
                  value={formData.expectedJoiningDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.expectedJoiningDate ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.expectedJoiningDate && <p className="text-[11px] text-rose-500 font-medium">{errors.expectedJoiningDate}</p>}
              </div>

              {/* Subject(s) / Area of Expertise Multi-Check Pills */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-headings font-bold text-secondary flex items-center justify-between">
                  <span>Subject(s) / Area of Expertise <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Select all that apply</span>
                </label>

                <div className="flex flex-wrap gap-2 pt-1">
                  {SUBJECT_OPTIONS.map((subj) => {
                    const isSelected = formData.subjectsExpertise.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => handleSubjectToggle(subj)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white shadow-md font-bold'
                            : 'bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isSelected ? 'check_circle' : 'add'}
                        </span>
                        {subj}
                      </button>
                    );
                  })}
                </div>
                {errors.subjectsExpertise && <p className="text-[11px] text-rose-500 font-medium">{errors.subjectsExpertise}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 5: ADDITIONAL INFO & REFERENCES ==================== */}
        {(currentStep === 5 || isSinglePageMode) && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/15 shadow-premium space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <h2 className="font-headings font-extrabold text-lg text-secondary">5. Additional Information & References</h2>
                <p className="text-xs text-on-surface-variant">Motivation for joining, special achievements, and professional references.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Why join center */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-headings font-bold text-secondary flex items-center gap-1">
                    Why do you want to join {centerName}? <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-on-surface-variant">
                    {formData.whyJoinReason.length}/500 chars
                  </span>
                </div>
                <textarea
                  name="whyJoinReason"
                  maxLength={500}
                  rows={3}
                  value={formData.whyJoinReason}
                  onChange={handleInputChange}
                  placeholder={`Explain your teaching philosophy, passion for education, and interest in joining ${centerName}...`}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    errors.whyJoinReason ? 'border-rose-500 bg-rose-50/20' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
                {errors.whyJoinReason && <p className="text-[11px] text-rose-500 font-medium">{errors.whyJoinReason}</p>}
              </div>

              {/* Special skills & achievements */}
              <div className="space-y-1">
                <label className="text-xs font-headings font-bold text-secondary">
                  Special Skills, Awards or Academic Achievements
                </label>
                <textarea
                  name="skillsAchievements"
                  rows={2}
                  value={formData.skillsAchievements}
                  onChange={handleInputChange}
                  placeholder="e.g. Authored physics textbooks, Top AIR ranks mentored, Smart Board / Digital pedagogy expert, Olympiad coach"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* References Manager */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headings font-bold text-sm text-secondary">Professional References</h3>
                    <p className="text-xs text-on-surface-variant">Provide contacts of former principals, department heads, or colleagues.</p>
                  </div>
                  {formData.references.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddReference}
                      className="bg-surface-container hover:bg-surface-container-high text-primary font-headings font-bold text-xs px-3.5 py-1.5 rounded-full border border-outline-variant/30 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Reference
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.references.map((ref, idx) => (
                    <div key={idx} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 relative space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-headings font-bold text-secondary">Reference #{idx + 1}</span>
                        {formData.references.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveReference(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={ref.name}
                          onChange={(e) => handleReferenceChange(idx, 'name', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:border-primary bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Contact Number / Email"
                          value={ref.contact}
                          onChange={(e) => handleReferenceChange(idx, 'contact', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:border-primary bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Relationship (e.g. Ex-HOD / Principal)"
                          value={ref.relationship}
                          onChange={(e) => handleReferenceChange(idx, 'relationship', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:border-primary bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 6: ATTACHMENTS & DECLARATION ==================== */}
        {(currentStep === 6 || isSinglePageMode) && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/15 shadow-premium space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
              </div>
              <div>
                <h2 className="font-headings font-extrabold text-lg text-secondary">6. Attachments & Declaration</h2>
                <p className="text-xs text-on-surface-variant">Upload supporting documents (Resume, ID proof, certificates) and confirm declaration.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resume / CV Upload */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors bg-surface-container-low/50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <h4 className="font-headings font-bold text-xs text-secondary">Resume / CV Upload</h4>
                  <p className="text-[11px] text-on-surface-variant">PDF, DOC, DOCX up to 10MB</p>
                </div>
                {formData.resumeFileName ? (
                  <div className="px-3 py-1.5 bg-primary-fixed/50 text-primary rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                    <span className="truncate max-w-[140px]">{formData.resumeFileName}</span>
                  </div>
                ) : (
                  <label className="bg-primary text-white font-headings font-bold text-xs px-4 py-2 rounded-full cursor-pointer shadow-sm hover:bg-primary-container transition-all">
                    Choose Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileUpload('resume', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              {/* ID Proof Upload */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors bg-surface-container-low/50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <div>
                  <h4 className="font-headings font-bold text-xs text-secondary">ID Proof (Aadhaar/PAN)</h4>
                  <p className="text-[11px] text-on-surface-variant">Image or PDF file</p>
                </div>
                {formData.idProofFileName ? (
                  <div className="px-3 py-1.5 bg-secondary-fixed/50 text-secondary rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                    <span className="truncate max-w-[140px]">{formData.idProofFileName}</span>
                  </div>
                ) : (
                  <label className="bg-secondary text-white font-headings font-bold text-xs px-4 py-2 rounded-full cursor-pointer shadow-sm hover:bg-secondary-container transition-all">
                    Choose ID Proof
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload('idProof', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              {/* Educational Certificates */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors bg-surface-container-low/50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                </div>
                <div>
                  <h4 className="font-headings font-bold text-xs text-secondary">Degree Certificates</h4>
                  <p className="text-[11px] text-on-surface-variant">Highest Degree / Marksheets</p>
                </div>
                {formData.certificatesFileName ? (
                  <div className="px-3 py-1.5 bg-tertiary-fixed/50 text-tertiary rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                    <span className="truncate max-w-[140px]">{formData.certificatesFileName}</span>
                  </div>
                ) : (
                  <label className="bg-tertiary text-white font-headings font-bold text-xs px-4 py-2 rounded-full cursor-pointer shadow-sm hover:bg-tertiary-container transition-all">
                    Choose Certificates
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload('certificates', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="pt-4 border-t border-outline-variant/15 space-y-2">
              <label className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl cursor-pointer border border-outline-variant/20">
                <input
                  type="checkbox"
                  name="acceptedDeclaration"
                  checked={formData.acceptedDeclaration}
                  onChange={handleInputChange}
                  className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0"
                />
                <span className="text-xs text-on-surface leading-relaxed">
                  I hereby declare that all information provided in this application form is true, accurate, and complete to the best of my knowledge. I understand that any false statement or omission may invalidate my application or subject me to termination if selected.
                </span>
              </label>
              {errors.acceptedDeclaration && (
                <p className="text-[11px] text-rose-500 font-medium px-1">{errors.acceptedDeclaration}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-outline-variant/40 text-xs font-headings font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Save Draft
          </button>

          {!isSinglePageMode ? (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-2.5 rounded-full border border-outline-variant/40 text-xs font-headings font-bold text-secondary hover:bg-surface-container transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Previous
                </button>
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-primary hover:bg-primary-container text-white font-headings font-bold text-xs px-7 py-2.5 rounded-full shadow-premium hover:shadow-glow-primary active:scale-95 transition-all flex items-center gap-1"
                >
                  Next Step
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold text-xs px-8 py-3 rounded-full shadow-premium hover:shadow-xl transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Submit Faculty Application
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-headings font-bold text-xs px-8 py-3 rounded-full shadow-premium hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Submit Faculty Application
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
