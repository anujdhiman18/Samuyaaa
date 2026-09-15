import React, { useState, useEffect } from 'react';
import { studentApplicationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CLASS_CATEGORIES, STAGE_CLASSES, getStageForClass, formatClassLabel } from '../../config/classConfig';
import PassportPhotoUpload from '../common/PassportPhotoUpload';

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology / Life Sciences',
  'English & Communication',
  'Computer Science / Coding',
  'Social Studies & General Awareness',
];

const initialFormData = {
  fullName: '',
  email: '',
  contactNumber: '',
  dob: '',
  photoUrl: '',
  photoFileName: '',
  academicStage: '',
  currentClass: '',
  targetClass: '',
  branch: 'Main Center (Bagru)',
  subjects: ['Mathematics', 'Physics'],
  previousSchool: '',
  parentName: '',
  parentContact: '',
  message: '',
};

export default function StudentApplicationForm({ centerName = 'Saumyaa Studies', onSuccess, editingApp = null, onCancelEdit }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [isSelfEditing, setIsSelfEditing] = useState(false);
  const [lastSubmittedSnapshot, setLastSubmittedSnapshot] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [lockInfo, setLockInfo] = useState({ isLocked: false });

  const isEditing = Boolean(editingApp) || isSelfEditing || Boolean(formData.applicationId);
  const activeAppId = formData.applicationId || editingApp?.applicationId || submittedApp?.applicationId;

  const populateFormDataFromApp = (app) => {
    let stage = app.academicStage || '';
    let currClass = app.currentClass || '';
    if (!stage && app.targetClass) {
      stage = getStageForClass(app.targetClass);
      if (!currClass && app.targetClass !== stage) {
        currClass = app.targetClass;
      }
    }

    setFormData({
      _id: app._id || app.id || '',
      id: app._id || app.id || '',
      applicationId: app.applicationId || '',
      fullName: app.fullName || '',
      email: app.email || '',
      contactNumber: app.contactNumber || app.phone || '',
      dob: app.dob || '',
      photoUrl: app.photoUrl || app.photo || '',
      photoFileName: app.photoFileName || '',
      academicStage: stage || 'S2',
      currentClass: currClass || '10th',
      targetClass: currClass || stage || '10th',
      branch: app.branch || 'Main Center (Bagru)',
      subjects: Array.isArray(app.subjects) ? app.subjects : [app.subjects || 'Mathematics'],
      previousSchool: app.previousSchool || '',
      parentName: app.parentName || '',
      parentContact: app.parentContact || '',
      message: app.message || '',
      status: app.status || 'Pending',
    });
  };

  // Load editingApp if provided, otherwise load draft
  useEffect(() => {
    if (editingApp) {
      populateFormDataFromApp(editingApp);
      setIsSelfEditing(true);
      return;
    }

    try {
      const saved = localStorage.getItem('saumyaa_student_app_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        let stage = parsed.academicStage || '';
        let currClass = parsed.currentClass || '';

        if (!stage && parsed.targetClass) {
          stage = getStageForClass(parsed.targetClass);
          if (!currClass && parsed.targetClass !== stage) {
            currClass = parsed.targetClass;
          }
        }
        if (stage && currClass && STAGE_CLASSES[stage] && !STAGE_CLASSES[stage].includes(currClass)) {
          currClass = '';
        }

        setFormData((prev) => ({
          ...prev,
          ...parsed,
          academicStage: stage,
          currentClass: currClass,
          targetClass: currClass || stage,
        }));
        setDraftSaved(true);
      }
    } catch (e) {
      console.warn('Could not load student draft:', e);
    }
  }, [editingApp]);

  // Check 30-day approval lock on email or phone change
  useEffect(() => {
    if (isEditing) {
      setLockInfo({ isLocked: false });
      return;
    }
    if (formData.email || formData.contactNumber) {
      const eligibility = studentApplicationService.checkEligibility(formData.email, formData.contactNumber);
      setLockInfo(eligibility);
    } else {
      setLockInfo({ isLocked: false });
    }
  }, [formData.email, formData.contactNumber, isEditing]);

  const handleEditSubmittedApp = () => {
    if (!submittedApp) return;
    setLastSubmittedSnapshot(submittedApp);
    populateFormDataFromApp(submittedApp);
    setIsSelfEditing(true);
    setSubmittedApp(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
    addToast('Editing mode active. You can modify any details and update your application.', 'info');
  };

  const handleCancelSelfEdit = () => {
    if (lastSubmittedSnapshot) {
      setSubmittedApp(lastSubmittedSnapshot);
      setIsSelfEditing(false);
    } else if (onCancelEdit) {
      onCancelEdit();
    } else {
      setIsSelfEditing(false);
      setFormData(initialFormData);
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('saumyaa_student_app_draft', JSON.stringify(formData));
      setDraftSaved(true);
      addToast('Draft saved to browser storage!', 'info');
    } catch (e) {
      addToast('Failed to save draft.', 'error');
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('saumyaa_student_app_draft');
    setFormData(initialFormData);
    setDraftSaved(false);
    setErrors({});
    addToast('Form cleared.', 'info');
  };

  const handleAutoFillDemo = () => {
    // Generate sample SVG passport photo data url for instant testing
    const demoPhotoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23e0e7ff"/><circle cx="150" cy="140" r="60" fill="%234f46e5"/><path d="M60,340 C60,240 240,240 240,340 Z" fill="%233730a3"/><text x="150" y="380" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e1b4b" text-anchor="middle">PASSPORT PHOTO</text></svg>`;

    setFormData({
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      contactNumber: '9816512345',
      dob: '2010-05-14',
      photoUrl: demoPhotoSvg,
      photoFileName: 'aarav_sharma_passport_photo.jpg',
      academicStage: 'S2',
      currentClass: '10th',
      targetClass: '10th',
      branch: 'Main Center (Bagru)',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      previousSchool: 'DAV Public Senior Secondary School',
      parentName: 'Sanjay Sharma',
      parentContact: '9816598765',
      message: 'Looking for top-tier coaching for Board Exams and Olympiad competitive preparation.',
    });
    setErrors({});
    addToast('Demo student details & passport photo auto-filled!', 'success');
  };

  const handleStageChange = (stageCode) => {
    setFormData((prev) => {
      const validClasses = STAGE_CLASSES[stageCode] || [];
      const newClass = validClasses.includes(prev.currentClass) ? prev.currentClass : '';
      return {
        ...prev,
        academicStage: stageCode,
        currentClass: newClass,
        targetClass: newClass || stageCode,
      };
    });
    if (errors.academicStage || errors.currentClass) {
      setErrors((prev) => ({ ...prev, academicStage: null, currentClass: null }));
    }
  };

  const handleClassChange = (className) => {
    setFormData((prev) => {
      return {
        ...prev,
        currentClass: className,
        targetClass: className || prev.academicStage,
      };
    });
    if (errors.currentClass) {
      setErrors((prev) => ({ ...prev, currentClass: null }));
    }
  };

  const handleSubjectToggle = (subj) => {
    setFormData((prev) => {
      const current = prev.subjects || [];
      if (current.includes(subj)) {
        return { ...prev, subjects: current.filter((s) => s !== subj) };
      } else {
        return { ...prev, subjects: [...current, subj] };
      }
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.photoUrl) errs.photoUrl = 'Passport size photograph is mandatory. Please upload your photo.';
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
    if (!formData.contactNumber.trim() || formData.contactNumber.length < 10)
      errs.contactNumber = 'Valid 10-digit contact number is required';
    if (!formData.parentName.trim()) errs.parentName = 'Parent/Guardian name is required';
    if (!formData.parentContact.trim() || formData.parentContact.length < 10)
      errs.parentContact = 'Valid parent contact number is required';
    if (!formData.academicStage) errs.academicStage = 'Please select an academic stage';
    if (!formData.currentClass) errs.currentClass = 'Please select your current class / grade';
    if (!formData.branch) errs.branch = 'Please select a preferred branch';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please complete all required fields.', 'error');
      return;
    }

    if (!isEditing && lockInfo.isLocked) {
      addToast(lockInfo.message, 'error');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      const targetAppId = formData._id || formData.id || editingApp?._id || editingApp?.id || formData.applicationId;
      if (isEditing && targetAppId) {
        res = await studentApplicationService.updateApplication(targetAppId, formData);
      } else {
        res = await studentApplicationService.submitApplication(formData);
      }

      if (res.success) {
        localStorage.removeItem('saumyaa_student_app_draft');
        const updatedOrNewApp = res.application || {
          applicationId: res.applicationId || formData.applicationId || editingApp?.applicationId,
          ...formData,
        };
        setSubmittedApp(updatedOrNewApp);
        setLastSubmittedSnapshot(updatedOrNewApp);
        setIsSelfEditing(false);
        addToast(res.message || (isEditing ? 'Application updated successfully!' : 'Student application submitted successfully!'), 'success');
        if (onSuccess) onSuccess(updatedOrNewApp);
      } else {
        addToast(res.message || 'Failed to submit application', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'An error occurred during submission.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedApp) {
    const isApproved = submittedApp.status === 'Approved';

    return (
      <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-emerald-500/20 rounded-3xl p-8 shadow-xl text-center font-body animate-fade-in my-8">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[36px]">check_circle</span>
        </div>
        <h2 className="font-headings font-extrabold text-2xl text-secondary mb-2">
          {submittedApp.status && submittedApp.status !== 'Pending' ? 'Application Updated Successfully!' : 'Application Submitted Successfully!'}
        </h2>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
          Thank you for applying to study at <span className="font-bold text-primary">{centerName}</span>. Your application is now under review by our academic admissions team.
        </p>

        {/* Application Summary Card */}
        <div className="bg-surface-container/60 border border-outline-variant/20 rounded-2xl p-4 text-left max-w-md mx-auto mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs border-b border-outline-variant/15 pb-2">
            <span className="text-on-surface-variant font-medium">Application ID:</span>
            <span className="font-mono font-bold text-primary text-sm px-2 py-0.5 bg-primary/10 rounded-md">
              {submittedApp.applicationId}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-on-surface-variant">Applicant Name:</span>
            <span className="font-bold text-secondary">{submittedApp.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Applying For:</span>
            <span className="font-bold text-secondary">
              {submittedApp.currentClass ? (
                <>
                  <span className="text-primary font-extrabold mr-1">{submittedApp.currentClass}</span>
                  <span className="text-on-surface-variant text-[11px]">({formatClassLabel(submittedApp.academicStage || submittedApp.targetClass)})</span>
                </>
              ) : (
                formatClassLabel(submittedApp.targetClass)
              )}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Preferred Center:</span>
            <span className="font-bold text-secondary">
              {submittedApp.branch?.includes('Daroh') || submittedApp.branch === 'Branch (Daroh)' ? 'Branch (Daroh)' : 'Main Center (Bagru)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Parent/Guardian:</span>
            <span className="font-bold text-secondary">{submittedApp.parentName} ({submittedApp.parentContact})</span>
          </div>
          {submittedApp.status && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-outline-variant/15">
              <span className="text-on-surface-variant">Current Status:</span>
              <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full text-[11px]">
                {submittedApp.status}
              </span>
            </div>
          )}
        </div>

        {/* Next Steps Reminder */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left max-w-md mx-auto mb-6 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span className="material-symbols-outlined text-sm text-amber-700">info</span>
            <span>Next Step: Interview</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Your application is now under review as a shortlisted candidate. The Admin/Management will assign your specific <strong>Day, Date, Time, and Venue/Mode</strong> for the Interview. You can track this anytime using your Application ID in the <strong>Track Status</strong> tab.
          </p>
        </div>

        {/* Action Buttons: Edit / Modify Option + Submit Another */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          {!isApproved && (
            <button
              onClick={handleEditSubmittedApp}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-secondary hover:bg-secondary-container text-white font-headings font-bold text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit / Modify Application Details
            </button>
          )}

          <button
            onClick={() => {
              setSubmittedApp(null);
              setIsSelfEditing(false);
              setFormData(initialFormData);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Submit Another Application
          </button>
        </div>

        {!isApproved && (
          <p className="text-[11px] text-on-surface-variant/70 mt-3 italic">
            ✏️ You can edit and update your application details anytime until final Admin approval.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-body">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary-container to-secondary text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-headings font-bold uppercase tracking-wider mb-3">
            {isEditing ? 'Modify Pending Application' : 'Online Student Admissions 2026-2027'}
          </span>
          <h1 className="font-headings font-extrabold text-2xl sm:text-3xl tracking-tight mb-2">
            {isEditing && activeAppId ? `Edit Application (${activeAppId})` : 'Apply as a Student'}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
            {isEditing
              ? 'Update and correct your application details. Your pending application will be refreshed for Admin review.'
              : `Join ${centerName} for top-quality academic coaching, interactive learning, and guidance from expert faculty.`}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/15 relative z-10">
          {isEditing ? (
            <button
              type="button"
              onClick={handleCancelSelfEdit}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-headings font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Cancel Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-headings font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                Auto-Fill Demo
              </button>
              {draftSaved && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-3.5 py-1.5 rounded-full bg-rose-500/30 hover:bg-rose-500/40 text-white font-headings font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Clear Draft
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="ml-auto px-3.5 py-1.5 rounded-full bg-white text-secondary hover:bg-surface-container font-headings font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">save</span>
                Save Draft
              </button>
            </>
          )}
        </div>
      </div>

      {/* PROMINENT MANDATORY ADMISSIONS NOTICE BANNER */}
      <div className="mb-6 p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 shadow-md animate-fade-in font-body">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">gavel</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-headings font-extrabold text-[10px] uppercase tracking-wider">
                Admissions Policy Notice
              </span>
              <span className="text-xs font-bold text-amber-900">
                Evaluation &amp; Selection Procedure
              </span>
            </div>
            <blockquote className="text-xs font-semibold text-amber-950 leading-relaxed italic border-l-2 border-amber-500 pl-2.5">
              “Students or faculty applying through this website will not be given direct admission or joining. Applicants will first be treated as shortlisted candidates and will therefore be called for an Interview on a particular day, date, and time as provided by the Admin/Management. Final admission or joining will be subject to successful completion of the selection process.”
            </blockquote>
            
            {/* Status Flow Indicator */}
            <div className="pt-2 flex items-center flex-wrap gap-1.5 text-[10px] text-amber-900/90 font-medium">
              <span className="font-bold text-amber-950">Status Flow:</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 font-mono">1. Application Submitted</span>
              <span>&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 font-mono">2. Shortlisted</span>
              <span>&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-bold font-mono">3. Interview</span>
              <span>&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 font-mono">4. Final Selection</span>
              <span>&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 font-bold font-mono">5. Admission/Joining</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Restriction Lock Banner */}
      {!isEditing && lockInfo.isLocked && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-sm animate-fade-in font-body">
          <span className="material-symbols-outlined text-amber-600 text-2xl mt-0.5">lock_clock</span>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">
              🔒 30-Day Application Lock Active
            </h4>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              {lockInfo.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Section 1: Student Information */}
        <div>
          <h2 className="font-headings font-bold text-base text-secondary flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/15">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">1</span>
            Student Personal Details
          </h2>

          {/* Mandatory Passport Photo Upload */}
          <div className="mb-6">
            <PassportPhotoUpload
              photoUrl={formData.photoUrl}
              photoFileName={formData.photoFileName}
              onPhotoChange={(base64Data, file, errorMsg) => {
                if (errorMsg) {
                  setErrors((prev) => ({ ...prev, photoUrl: errorMsg }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    photoUrl: base64Data,
                    photoFileName: file?.name || 'student_passport_photo.jpg',
                  }));
                  setErrors((prev) => ({ ...prev, photoUrl: null }));
                }
              }}
              onPhotoRemove={() => {
                setFormData((prev) => ({ ...prev, photoUrl: '', photoFileName: '' }));
              }}
              error={errors.photoUrl}
              required={true}
              id="student-passport-photo-upload"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.fullName ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              />
              {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob || ''}
                min="1995-01-01"
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Student Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Student Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g. 9816512345"
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.contactNumber ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              />
              {errors.contactNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.contactNumber}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Parent / Guardian Information */}
        <div>
          <h2 className="font-headings font-bold text-base text-secondary flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/15">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">2</span>
            Parent / Guardian Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Parent / Guardian Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="e.g. Sanjay Sharma"
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.parentName ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              />
              {errors.parentName && <p className="text-[11px] text-rose-500 mt-1">{errors.parentName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Parent / Guardian Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.parentContact}
                onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                placeholder="e.g. 9816598765"
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.parentContact ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              />
              {errors.parentContact && <p className="text-[11px] text-rose-500 mt-1">{errors.parentContact}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Academic Details */}
        <div>
          <h2 className="font-headings font-bold text-base text-secondary flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/15">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">3</span>
            Academic Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Academic Stage <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.academicStage || ''}
                onChange={(e) => handleStageChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.academicStage ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              >
                <option value="" disabled>Select academic stage</option>
                {CLASS_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.academicStage && <p className="text-[11px] text-rose-500 mt-1">{errors.academicStage}</p>}
            </div>

            {formData.academicStage ? (
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Current Class / Grade <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.currentClass || ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                    errors.currentClass ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                  }`}
                >
                  <option value="" disabled>Select current class / grade</option>
                  {(STAGE_CLASSES[formData.academicStage] || []).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                {errors.currentClass && <p className="text-[11px] text-rose-500 mt-1">{errors.currentClass}</p>}
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Select Center <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.branch || 'Main Center (Bagru)'}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.branch ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              >
                <option value="Main Center (Bagru)">Main Center (Bagru)</option>
                <option value="Branch (Daroh)">Branch (Daroh)</option>
              </select>
              {errors.branch && <p className="text-[11px] text-rose-500 mt-1">{errors.branch}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-1">
                Previous School / Institution Name
              </label>
              <input
                type="text"
                value={formData.previousSchool}
                onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                placeholder="e.g. DAV Public School"
                className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-2">
              Subjects of Interest
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((subj) => {
                const isSelected = (formData.subjects || []).includes(subj);
                return (
                  <button
                    type="button"
                    key={subj}
                    onClick={() => handleSubjectToggle(subj)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
                    }`}
                  >
                    {subj} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Message / Reason */}
        <div>
          <h2 className="font-headings font-bold text-base text-secondary flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/15">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">4</span>
            Statement / Reason for Joining
          </h2>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Short Message or Academic Goals
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your learning goals or reason for joining Saumyaa Studies..."
              className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {isEditing ? (
            <button
              type="button"
              onClick={handleCancelSelfEdit}
              className="px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:text-rose-600 transition-colors cursor-pointer"
            >
              Reset Form
            </button>
          )}

          <button
            type="submit"
            disabled={submitting || (!isEditing && lockInfo.isLocked)}
            className="px-8 py-3 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-lg shadow-primary/25 hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{isEditing ? 'Updating Application...' : 'Submitting Application...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">{isEditing ? 'save' : 'send'}</span>
                <span>{isEditing ? 'Update Application' : 'Submit Student Application'}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
