import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { credentialRequestService } from '../../services/api';

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

  // Credential Request State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [requests, setRequests] = useState([]);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const res = await credentialRequestService.getRequests();
      if (res && res.requests) {
        const facId = user?._id || user?.id || 'f_jitender';
        const myReqs = res.requests.filter((r) => r.facultyId === facId || r.facultyName === user?.name);
        setRequests(myReqs);
      }
    } catch (e) {
      console.warn('Error fetching credential requests:', e);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      updateUser({
        name,
        phone,
        designation,
        department,
        photo_url: photoUrl,
      });
      setSaving(false);
      addToast('Faculty profile updated successfully!', 'success');
    }, 400);
  };

  const handleRequestUsernameChange = async (e) => {
    e.preventDefault();
    if (!newUsername || newUsername === email) {
      addToast('Please enter a new username / email', 'warning');
      return;
    }
    setRequesting(true);
    try {
      const res = await credentialRequestService.submitRequest({
        facultyId: user?._id || user?.id || 'f_jitender',
        facultyName: user?.name || 'Prof. Jitender Sharma',
        userType: 'Faculty',
        requestType: 'Username / Email Change',
        oldValue: email,
        newValue: newUsername,
      });

      if (res && res.success) {
        addToast('Username change request submitted to Admin for approval!', 'success');
        setNewUsername('');
        fetchMyRequests();
      }
    } catch (err) {
      addToast('Error submitting credential request', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      addToast('Please enter a new password', 'warning');
      return;
    }
    setRequesting(true);
    try {
      const res = await credentialRequestService.submitRequest({
        facultyId: user?._id || user?.id || 'f_jitender',
        facultyName: user?.name || 'Prof. Jitender Sharma',
        userType: 'Faculty',
        requestType: 'Password Change',
        oldValue: '••••••••',
        newValue: newPassword,
      });

      if (res && res.success) {
        addToast('Password change request submitted to Admin for approval!', 'success');
        setNewPassword('');
        fetchMyRequests();
      }
    } catch (err) {
      addToast('Error submitting password request', 'error');
    } finally {
      setRequesting(false);
    }
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
          Manage personal profile details & request username or password updates requiring Admin approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
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
                <label className="block text-xs font-bold text-secondary mb-1">
                  Current Username / Email <span className="text-[10px] text-amber-700 font-normal">(Admin Lock)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono bg-surface-container text-on-surface-variant cursor-not-allowed"
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
              <span className="text-xs font-bold text-secondary block">Assigned Classes & Courses (Admin Allocated)</span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Class 10th (Mathematics)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Class 11th (+1 Physics)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Class 12th (+2 Mathematics)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Credentials Update (Requires Admin Approval) */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 space-y-6">
          <div className="border-b border-outline-variant/15 pb-3">
            <h3 className="font-headings font-extrabold text-base text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">lock</span>
              Account Security & Credentials
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Username & Password changes require explicit approval from the System Administrator.
            </p>
          </div>

          {/* Request Username Change */}
          <form onSubmit={handleRequestUsernameChange} className="space-y-3">
            <h4 className="font-bold text-xs text-secondary">Request Username / Email Change</h4>
            <input
              type="email"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new email address..."
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={requesting}
              className="w-full py-2 rounded-full border border-primary/30 text-primary font-bold text-xs hover:bg-primary/10 transition-colors cursor-pointer"
            >
              Submit Username Change Request
            </button>
          </form>

          {/* Request Password Change */}
          <form onSubmit={handleRequestPasswordChange} className="space-y-3 pt-4 border-t border-outline-variant/15">
            <h4 className="font-bold text-xs text-secondary">Request Password Change</h4>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password..."
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={requesting}
              className="w-full py-2 rounded-full bg-secondary text-white font-bold text-xs hover:bg-secondary/90 transition-colors cursor-pointer"
            >
              Submit Password Change Request
            </button>
          </form>

          {/* Request History */}
          {requests.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-outline-variant/15">
              <h4 className="font-bold text-xs text-secondary">My Request Approval Status</h4>
              <div className="space-y-2 text-[11px]">
                {requests.map((r) => (
                  <div key={r._id || r.id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-secondary">{r.requestType}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status === 'Pending' ? '🟡 Pending Admin Approval' : r.status}
                      </span>
                    </div>
                    <p className="font-mono text-on-surface-variant text-[10px]">Requested: {r.newValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
