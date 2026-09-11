import React, { useState, useRef } from 'react';

/**
 * PassportPhotoUpload Component
 * Enforces passport-size photo uploads with validation, format checks (JPG, JPEG, PNG),
 * aspect ratio analysis, live preview, and mandatory policy note.
 */
export default function PassportPhotoUpload({
  photoUrl,
  photoFileName,
  onPhotoChange,
  onPhotoRemove,
  error,
  required = true,
  label = 'Passport Size Photograph',
  subLabel = 'Upload a recent, clear, front-facing passport photograph with a light background.',
  id = 'passport-photo-upload',
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [aspectWarning, setAspectWarning] = useState('');
  const [loading, setLoading] = useState(false);

  const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
  const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/jpg'];
  const MAX_SIZE_MB = 5;

  const processFile = (file) => {
    if (!file) return;
    setAspectWarning('');

    // 1. Format validation
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isValidFormat = ACCEPTED_MIMES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);

    if (!isValidFormat) {
      if (onPhotoChange) {
        onPhotoChange(null, null, 'Invalid file format. Only JPG, JPEG, and PNG images are allowed.');
      }
      return;
    }

    // 2. Size validation (Max 5MB)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      if (onPhotoChange) {
        onPhotoChange(null, null, `Photo file size exceeds ${MAX_SIZE_MB}MB. Please upload a smaller image.`);
      }
      return;
    }

    if (file.size < 5 * 1024) {
      if (onPhotoChange) {
        onPhotoChange(null, null, 'Image file is too small (under 5KB). Please upload a clearer photograph.');
      }
      return;
    }

    setLoading(true);

    // 3. Aspect Ratio & Dimension Check using Image object
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const img = new Image();

      img.onload = () => {
        setLoading(false);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const ratio = width / height;

        let warning = '';
        // If the photo is wide landscape (ratio > 1.25), advise the applicant
        if (ratio > 1.25) {
          warning = 'Notice: The uploaded photo is in landscape orientation. Passport photos are recommended to be vertical portrait (3:4 ratio).';
          setAspectWarning(warning);
        } else if (width < 150 || height < 150) {
          warning = 'Low resolution image. For best results, use a photo of at least 300x400 pixels.';
          setAspectWarning(warning);
        }

        if (onPhotoChange) {
          onPhotoChange(base64Data, file, null, warning);
        }
      };

      img.onerror = () => {
        setLoading(false);
        if (onPhotoChange) {
          onPhotoChange(null, null, 'Unable to process image. Please upload a valid JPG or PNG photo.');
        }
      };

      img.src = base64Data;
    };

    reader.onerror = () => {
      setLoading(false);
      if (onPhotoChange) {
        onPhotoChange(null, null, 'Failed to read file.');
      }
    };

    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClearPhoto = (e) => {
    e.stopPropagation();
    setAspectWarning('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPhotoRemove) {
      onPhotoRemove();
    }
  };

  return (
    <div className="space-y-2 font-body">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-secondary">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[10px] text-on-surface-variant font-mono">JPG, JPEG, PNG (Max 5MB)</span>
      </div>

      {photoUrl ? (
        /* Preview Card */
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-center gap-4 transition-all">
          {/* Passport Photo Frame (3.5 x 4.5 standard ratio style) */}
          <div className="relative group shrink-0">
            <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md bg-white flex items-center justify-center relative">
              <img
                src={photoUrl}
                alt="Passport Photo Preview"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                <span className="material-symbols-outlined text-[14px] block">check</span>
              </div>
            </div>
            <span className="block text-center text-[9px] font-headings font-bold text-secondary uppercase tracking-wider mt-1">
              Passport Photo
            </span>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-700 font-headings font-bold text-xs">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Photo Uploaded Successfully</span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate max-w-xs mt-0.5">
                {photoFileName || 'passport_photo.jpg'}
              </p>
            </div>

            {aspectWarning && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[10px] flex items-start gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-sm shrink-0">info</span>
                <span>{aspectWarning}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-headings font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleClearPhoto}
                className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-headings font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Area */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2.5 ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : error
              ? 'border-rose-500 bg-rose-50/40'
              : 'border-outline-variant/40 hover:border-primary/60 bg-surface-container-low/50 hover:bg-surface-container-low'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            {loading ? (
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-[30px]">account_box</span>
            )}
          </div>

          <div>
            <span className="font-headings font-bold text-xs text-secondary block">
              Click to Upload Passport Photo or Drag &amp; Drop
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              JPG, JPEG, or PNG &bull; Front-facing portrait format
            </span>
          </div>

          <button
            type="button"
            className="px-4 py-1.5 rounded-full bg-primary text-white font-headings font-bold text-xs shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 pointer-events-none"
          >
            <span className="material-symbols-outlined text-[15px]">upload</span>
            Select Photo File
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Error Message */}
      {error && (
        <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}

      {/* MANDATORY PROMINENT NOTE AS REQUESTED */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-950 text-[11px] font-semibold flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">info</span>
        <span>Note: Only Passport Size Photo is allowed.</span>
      </div>
    </div>
  );
}
