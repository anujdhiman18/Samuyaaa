import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      login(data.admin, data.token);
      addToast(`Welcome back, ${data.admin.name}!`, 'success');
      navigate('/admin');
    } catch (error) {
      addToast(error.message || 'Login failed. Check email & password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@saumyaa.com');
    setPassword('admin123');
    addToast('Demo credentials filled: admin@saumyaa.com / admin123', 'info');
  };

  return (
    <div className="min-h-screen bg-surface-container-low dark:bg-zinc-950 flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-outline-variant/20 dark:border-zinc-800 relative overflow-hidden">
        {/* Background decorative accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 text-center mb-8">
          <img
            src="/logo.jpg"
            alt="Saumyaa Studies Logo"
            className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4 shadow-lg bg-white p-1"
          />
          <h2 className="font-headings font-extrabold text-2xl text-secondary dark:text-teal-400">
            Saumyaa Admin Portal
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1">
            Secure Authentication Portal &amp; Management Dashboard
          </p>
        </div>

        {/* Demo Credentials Alert Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-primary-fixed/40 dark:bg-zinc-800 border border-primary/20 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-on-primary-fixed dark:text-zinc-200">Testing Credentials</p>
            <p className="text-[11px] text-on-surface-variant dark:text-zinc-400 font-mono">
              admin@saumyaa.com / admin123
            </p>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="bg-primary text-white px-3 py-1.5 rounded-lg text-[11px] font-headings font-bold hover:bg-primary-container transition-colors shadow-sm"
          >
            Auto Fill
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant dark:text-zinc-300">
              Admin Email *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant/60 dark:text-zinc-500">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@saumyaa.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/40 dark:border-zinc-700 bg-surface-container-lowest dark:bg-zinc-800 text-sm font-medium text-on-surface dark:text-zinc-100 focus:outline-none focus:border-secondary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant dark:text-zinc-300">
              Password *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant/60 dark:text-zinc-500">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-outline-variant/40 dark:border-zinc-700 bg-surface-container-lowest dark:bg-zinc-800 text-sm font-medium text-on-surface dark:text-zinc-100 focus:outline-none focus:border-secondary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-on-surface-variant/60 dark:text-zinc-500 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface-variant dark:text-zinc-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>Remember login session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-secondary hover:bg-on-secondary-fixed-variant text-white font-headings font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
                Authenticating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign In to Admin Panel
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/15 dark:border-zinc-800 pt-4">
          <a
            href="/"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Return to Public Website
          </a>
        </div>
      </div>
    </div>
  );
}
