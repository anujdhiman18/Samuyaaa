import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FacultyTopbar({ onToggleMobile }) {
  const { user, branchLabel, isChildBranch, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/15 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 font-body">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-secondary">
          <span>Academic Year 2026-2027</span>
          <span>&bull;</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${isChildBranch ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300'}`}>
            🏢 {branchLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User Profile Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full hover:bg-surface-container-low border border-outline-variant/20 transition-all cursor-pointer"
          >
            <img
              src={user?.photo_url || '/Unknown.jpg'}
              alt={user?.name || 'Faculty Member'}
              className="w-7 h-7 rounded-full object-cover border border-outline-variant/30"
            />
            <div className="text-left hidden md:block">
              <span className="font-headings font-bold text-xs text-secondary block leading-tight">
                {user?.name || 'Faculty Member'}
              </span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                {user?.role || 'Faculty'}
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              expand_more
            </span>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-outline-variant/20 py-2 z-50 animate-fade-in font-body"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-4 py-2.5 border-b border-outline-variant/15">
                <p className="text-xs font-bold text-secondary">{user?.name}</p>
                <p className="text-[10px] font-mono text-on-surface-variant">{user?.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold">
                    {user?.designation || 'Faculty Member'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${isChildBranch ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300'}`}>
                    🏢 {branchLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/faculty/profile')}
                className="w-full text-left px-4 py-2 text-xs font-bold text-secondary hover:bg-surface-container flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
