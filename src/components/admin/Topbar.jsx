import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Topbar({ onToggleMobile }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/admin/students?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-outline-variant/15 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 font-body">
      {/* Left: Mobile Toggle & Page Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container-low"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Global Search trigger */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant hover:border-secondary transition-all w-64 md:w-80 justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">search</span>
              <span>Search student, roll, phone...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white rounded font-mono border text-on-surface-variant">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Right Controls: Faculty Shortcut, Admin Profile */}
      <div className="flex items-center gap-3">
        <Link
          to="/faculty"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-headings font-bold text-xs transition-colors"
          title="Switch to Faculty Portal"
        >
          <span className="material-symbols-outlined text-[18px]">co_present</span>
          <span>Faculty Portal</span>
        </Link>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <img
              src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={admin?.name || 'Admin'}
              className="w-9 h-9 rounded-full object-cover border-2 border-primary"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-headings font-bold text-secondary leading-tight">
                {admin?.name || 'Jitender Sharma'}
              </span>
              <span className="text-[10px] text-on-surface-variant font-semibold">
                {admin?.role || 'SuperAdmin'}
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              keyboard_arrow_down
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium border border-outline-variant/15 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-outline-variant/15">
                <p className="text-xs font-headings font-bold text-secondary">{admin?.name}</p>
                <p className="text-[11px] text-on-surface-variant truncate font-mono">
                  {admin?.email || 'admin@saumyaa.com'}
                </p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/admin/profile');
                }}
                className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 font-bold text-primary"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">manage_accounts</span>
                Admin Profile Settings
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/admin/students');
                }}
                className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 font-medium"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                Student Directory
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/admin/fees');
                }}
                className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 font-medium"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
                Fee Payments
              </button>
              <div className="border-t border-outline-variant/15 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 font-headings font-bold hover:bg-rose-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Logout Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Dialog Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-premium border border-outline-variant/15 animate-fadeIn">
            <form onSubmit={handleGlobalSearch} className="flex items-center gap-2 border-b border-outline-variant/15 pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">search</span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student name, phone, roll number, or subject..."
                className="w-full bg-transparent text-xs font-medium focus:outline-none text-on-surface"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </form>
            <div className="py-4 text-center text-xs text-on-surface-variant">
              Press <span className="font-bold">Enter</span> to search active student directory
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
