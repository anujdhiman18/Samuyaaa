import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      const loggedUser = data.user || data.admin;

      login(loggedUser, data.token);
      addToast(`Welcome back, ${loggedUser.name}!`, 'success');

      if (loggedUser.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      addToast(error.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-premium border border-outline-variant/15 relative overflow-hidden">
        {/* Decorative Background Accents matching main website */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-2 group">
            <img
              src="/logo.jpg"
              alt="Saumyaa Studies Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-white p-0.5"
            />
            <span className="font-headings font-extrabold text-xl text-secondary tracking-tight">
              Saumyaa Studies
            </span>
          </Link>
          <h2 className="font-headings font-extrabold text-2xl text-secondary">
            Account Sign In
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Sign in to access your portal account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Email Address *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant/60">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest font-body text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Password *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant/60">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest font-body text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary hover:bg-primary-container text-white font-headings font-bold py-3.5 rounded-full text-xs transition-all shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs">
          <Link to="/signup" className="text-primary font-headings font-bold hover:underline">
            New Student? Register
          </Link>
          <Link to="/" className="text-secondary font-headings font-bold hover:underline">
            Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
