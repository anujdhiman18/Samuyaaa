import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { facultyPanelService } from '../../services/api';

export default function FacultyLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('jitender.sharma@saumyaa.edu.in');
  const [password, setPassword] = useState('faculty123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await facultyPanelService.loginFaculty({ email, password });
      if (res && res.success) {
        login(res.user, res.token);
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        navigate('/faculty/dashboard');
      } else {
        addToast(res?.message || 'Invalid faculty credentials', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await facultyPanelService.loginFaculty({
        email: 'jitender.sharma@saumyaa.edu.in',
        password: 'faculty123',
      });
      if (res && res.success) {
        login(res.user, res.token);
        addToast('Logged in as Faculty Member (Demo Mode)', 'success');
        navigate('/faculty/dashboard');
      }
    } catch (err) {
      addToast('Demo login error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-premium border border-outline-variant/15 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.jpg"
            alt="Saumyaa Logo"
            className="w-14 h-14 object-contain mx-auto rounded-2xl shadow-md bg-white p-1"
          />
          <h1 className="font-headings font-extrabold text-2xl text-secondary">Faculty Portal Login</h1>
          <p className="text-xs text-on-surface-variant">
            Access assigned classes, attendance registers, gradebooks, & study materials.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Faculty Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-body"
              placeholder="faculty@saumyaa.edu.in"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-body"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-full font-headings font-bold text-xs shadow-premium hover:bg-primary-container disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Faculty Portal'}
          </button>
        </form>

        {/* Demo Fast Fill & Login Shortcuts */}
        <div className="pt-4 border-t border-outline-variant/15 text-center space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEmail('jitender.sharma@saumyaa.edu.in');
                setPassword('faculty123');
                addToast('Filled Faculty Demo Credentials!', 'info');
              }}
              type="button"
              className="py-2.5 px-3 rounded-full border border-primary/30 bg-primary/10 text-primary font-headings font-bold text-xs hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Fill Demo Info
            </button>

            <button
              onClick={handleDemoLogin}
              type="button"
              className="py-2.5 px-3 rounded-full bg-secondary text-white font-headings font-bold text-xs hover:bg-secondary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Auto Sign In
            </button>
          </div>

          <div className="flex justify-between text-xs font-bold text-on-surface-variant pt-2">
            <Link to="/login" className="hover:text-primary">Admin / General Login</Link>
            <Link to="/" className="hover:text-primary">Back to Website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
