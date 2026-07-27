import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (role === 'Admin') {
      addToast('❌ Admin accounts cannot be created publicly! Access denied.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      addToast('Passwords do not match!', 'warning');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.signup({
        fullName,
        email,
        phone,
        password,
        role: 'Student',
      });

      login(data.user, data.token);
      addToast('🎉 Welcome to Saumyaa Studies! Account created.', 'success');
      navigate('/student/dashboard');
    } catch (error) {
      addToast(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-premium border border-outline-variant/15 relative overflow-hidden">
        <div className="relative z-10 text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
            <span className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </span>
            <div className="flex flex-col text-left">
              <span className="font-headings font-extrabold text-[20px] leading-tight text-secondary tracking-tight">
                Samuyaa
              </span>
              <span className="font-headings text-[11px] uppercase tracking-[0.2em] font-semibold text-primary -mt-0.5">
                Studies
              </span>
            </div>
          </Link>
          <h2 className="font-headings font-extrabold text-2xl text-secondary">
            Student Registration
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Create your student portal account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3.5 relative z-10 text-xs font-body">
          <div className="flex flex-col gap-1">
            <label className="font-headings font-bold text-on-surface-variant">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Gupta"
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-headings font-bold text-on-surface-variant">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || role === 'Admin'}
            className="w-full mt-2 bg-primary hover:bg-primary-container text-white font-headings font-bold py-3.5 rounded-full text-xs transition-all shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {loading ? 'Creating Account...' : 'Create Student Account'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-outline-variant/15 pt-4 text-xs">
          <Link to="/login" className="text-secondary font-headings font-bold hover:underline">
            Already registered? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
