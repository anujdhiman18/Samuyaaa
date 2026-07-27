import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function StudentTopbar({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-outline-variant/15 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 font-body">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container-low"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <span className="text-xs font-headings font-bold text-secondary hidden sm:inline-block">
          Class {user?.className || '10th'} &bull; Roll: {user?.rollNumber || 'SAU-10-001'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Icon */}
        <Link
          to="/student/notifications"
          className="p-2.5 rounded-full hover:bg-surface-container-low text-on-surface transition-colors relative"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={user?.name || 'Student'}
              className="w-9 h-9 rounded-full object-cover border-2 border-secondary"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-headings font-bold text-secondary leading-tight">
                {user?.name || 'Rahul Gupta'}
              </span>
              <span className="text-[10px] text-on-surface-variant font-semibold">
                Student &bull; {user?.className || '10th'}
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              keyboard_arrow_down
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium border border-outline-variant/15 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-outline-variant/15">
                <p className="text-xs font-headings font-bold text-secondary">{user?.name}</p>
                <p className="text-[11px] text-on-surface-variant font-mono">
                  Roll: {user?.rollNumber || 'SAU-10-001'}
                </p>
              </div>
              <Link
                to="/student/profile"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 font-medium"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                Personal Information
              </Link>
              <Link
                to="/student/marks"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 font-medium"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">grade</span>
                Marks &amp; Results
              </Link>
              <div className="border-t border-outline-variant/15 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 font-headings font-bold hover:bg-rose-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Logout Student
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
