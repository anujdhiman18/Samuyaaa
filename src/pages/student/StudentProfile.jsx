import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/api';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student Editable Fields ONLY
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudentById(user?.id || 's1');
      if (res && res.student) {
        setStudent(res.student);
        setPhone(res.student.phone || '');
        setPhotoUrl(res.student.photo || user?.avatar || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentUpdate = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      addToast('Passwords do not match!', 'warning');
      return;
    }

    setUpdating(true);
    try {
      await studentService.updateStudent(user?.id || 's1', {
        phone,
        photo: photoUrl,
      });

      updateUser({
        ...user,
        phone,
        avatar: photoUrl,
      });

      addToast('Profile updated successfully! (Phone & Photo)', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs animate-pulse">Loading personal profile...</div>;
  }

  const p = student || {
    fullName: user?.name || 'Rahul Gupta',
    rollNumber: user?.rollNumber || 'SAU-10-001',
    className: user?.className || '10th',
    fatherName: 'Rajesh Gupta',
    motherName: 'Sunita Gupta',
    phone: '9816012345',
    parentPhone: '8894190175',
    email: 'rahul.g@gmail.com',
    address: 'House #42, Main Market, Jamula, Palampur',
    dateOfAdmission: '2025-04-10',
    subjects: ['Mathematics Advanced', 'Integrated Science'],
    dob: '2009-08-15',
    bloodGroup: 'B+',
    emergencyContact: '8894190175',
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Personal Information &amp; Profile
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Official academic enrollment record.
        </p>
      </div>

      {/* Grid: Profile View & Editable Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Profile View (Read-Only) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 space-y-6">
          <div className="flex items-center gap-4 border-b border-outline-variant/15 pb-6">
            <img
              src={photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={p.fullName}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-secondary shadow-md"
            />
            <div>
              <h2 className="font-headings font-extrabold text-xl text-secondary">
                {p.fullName}
              </h2>
              <p className="font-mono text-xs font-bold text-primary mt-0.5">
                Roll No: {p.rollNumber} &bull; Class {p.className}
              </p>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider mt-2 inline-block">
                Active Enrolled Student
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Father's Name (Admin Only)
              </span>
              <span className="font-bold text-on-surface mt-0.5 block">{p.fatherName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Mother's Name (Admin Only)
              </span>
              <span className="font-bold text-on-surface mt-0.5 block">{p.motherName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Parent Emergency Phone (Admin Only)
              </span>
              <span className="font-bold text-secondary mt-0.5 block">{p.parentPhone}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Email Address (Admin Only)
              </span>
              <span className="font-bold text-on-surface mt-0.5 block">{p.email || 'Not Provided'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Date of Birth (Admin Only)
              </span>
              <span className="font-bold text-on-surface mt-0.5 block">{p.dob || '15 Aug 2009'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Blood Group (Admin Only)
              </span>
              <span className="font-bold text-rose-600 mt-0.5 block">{p.bloodGroup || 'B+'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 sm:col-span-2">
              <span className="font-headings text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Residential Address (Admin Only)
              </span>
              <span className="font-bold text-on-surface mt-0.5 block">{p.address}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Student Editable Form (Photo, Phone, Password ONLY) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <h3 className="font-headings font-bold text-base text-secondary mb-1">
            Edit Student Information
          </h3>
          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
            Students are permitted to update only Profile Photo, Phone Number, and Account Password.
          </p>

          <form onSubmit={handleStudentUpdate} className="space-y-4 text-xs font-body">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Student Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Profile Photo Image URL
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                New Password (Optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface"
              />
            </div>

            {password && (
              <div className="flex flex-col gap-1">
                <label className="font-headings font-bold text-on-surface-variant">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-primary hover:bg-primary-container text-white font-headings font-bold py-3 rounded-full text-xs transition-all shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn mt-4"
            >
              {updating ? 'Saving...' : 'Update Information'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
