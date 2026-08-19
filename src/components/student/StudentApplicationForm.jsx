import React, { useState, useEffect } from 'react';
import { studentApplicationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CLASS_CATEGORIES, STAGE_CLASSES, getStageForClass, formatClassLabel } from '../../config/classConfig';

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
  academicStage: '',
  currentClass: '',
  targetClass: '',
  branch: 'Bagru',
  subjects: ['Mathematics', 'Physics'],
  previousSchool: '',
  parentName: '',
  parentContact: '',
  message: '',
};

export default function StudentApplicationForm({ centerName = 'Saumyaa Studies', onSuccess }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto load draft from LocalStorage
  useEffect(() => {
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
  }, []);

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
    setFormData({
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      contactNumber: '9816512345',
      dob: '2010-05-14',
      academicStage: 'S2',
      currentClass: '10th',
      targetClass: '10th',
      branch: 'Bagru',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      previousSchool: 'DAV Public Senior Secondary School',
      parentName: 'Sanjay Sharma',
      parentContact: '9816598765',
      message: 'Looking for top-tier coaching for Board Exams and Olympiad competitive preparation.',
    });
    setErrors({});
    addToast('Demo student details auto-filled!', 'success');
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

    setSubmitting(true);
    try {
      const res = await studentApplicationService.submitApplication(formData);
      if (res.success) {
        localStorage.removeItem('saumyaa_student_app_draft');
        setSubmittedApp(res.application || { applicationId: res.applicationId, ...formData });
        addToast(res.message || 'Student application submitted successfully!', 'success');
        if (onSuccess) onSuccess(res.application);
      } else {
        addToast(res.message || 'Failed to submit application', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('An error occurred during submission.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedApp) {
    return (
      <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-emerald-500/20 rounded-3xl p-8 shadow-xl text-center font-body animate-fade-in my-8">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[36px]">check_circle</span>
        </div>
        <h2 className="font-headings font-extrabold text-2xl text-secondary mb-2">
          Application Submitted Successfully!
        </h2>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
          Thank you for applying to study at <span className="font-bold text-primary">{centerName}</span>. Your application is now under review by our academic admissions team.
        </p>

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
            <span className="text-on-surface-variant">Preferred Branch:</span>
            <span className="font-bold text-secondary">
              {submittedApp.branch === 'Daroh' ? 'Daroh (Branch)' : 'Bagru (Main)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Parent/Guardian:</span>
            <span className="font-bold text-secondary">{submittedApp.parentName} ({submittedApp.parentContact})</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => {
              setSubmittedApp(null);
              setFormData(initialFormData);
            }}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-md transition-all cursor-pointer"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-body">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary-container to-secondary text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-headings font-bold uppercase tracking-wider mb-3">
            Online Student Admissions 2026-2027
          </span>
          <h1 className="font-headings font-extrabold text-2xl sm:text-3xl tracking-tight mb-2">
            Apply as a Student
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
            Join {centerName} for top-quality academic coaching, interactive learning, and guidance from expert faculty.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/15 relative z-10">
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
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Section 1: Student Information */}
        <div>
          <h2 className="font-headings font-bold text-base text-secondary flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/15">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">1</span>
            Student Personal Details
          </h2>

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
                Preferred Branch / Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.branch || 'Bagru'}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs bg-surface-container-lowest text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  errors.branch ? 'border-rose-500 bg-rose-50/50' : 'border-outline-variant/30'
                }`}
              >
                <option value="Bagru">Bagru (Main)</option>
                <option value="Daroh">Daroh (Branch)</option>
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
          <button
            type="button"
            onClick={handleClearDraft}
            className="px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:text-rose-600 transition-colors"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-full bg-primary text-white font-headings font-bold text-xs hover:bg-primary-container shadow-lg shadow-primary/25 hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Submit Student Application</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
