import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function FacultyProfile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || 'Prof. Jitender Sharma');
  const [email, setEmail] = useState(user?.email || 'jitender.sharma@saumyaa.edu.in');
  const [phone, setPhone] = useState(user?.phone || '9816099999');
  const [designation, setDesignation] = useState(user?.designation || 'Senior Mathematics & Physics Faculty');
  const [department, setDepartment] = useState(user?.department || 'Science & Mathematics');
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      updateUser({
        name,
        email,
        phone,
        designation,
        department,
        photo_url: photoUrl,
      });
      setSaving(false);
      addToast('Faculty profile updated successfully!', 'success');
    }, 500);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
          My Faculty Profile
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Manage your personal details, academic credentials, and assigned department profile.
        </p>
      </div>

      {/* Profile Form Container */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4 border-b border-outline-variant/15 pb-6">
            <img
              src={photoUrl}
              alt={name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-md"
            />
            <div>
              <h3 className="font-headings font-extrabold text-lg text-secondary">{name}</h3>
              <p className="text-xs text-primary font-bold">{designation}</p>
              <p className="text-xs text-on-surface-variant">{department}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Academic Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2">
            <span className="text-xs font-bold text-secondary block">Assigned Classes & Subjects</span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Class 10th (Maths)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Class 11th (+1 Physics)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Class 12th (+2 Maths)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
