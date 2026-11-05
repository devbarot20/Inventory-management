'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

function AuthModalDialog({ initialMode }) {
  const { closeAuthModal, login, register, loginAsAdmin, loginAsPlanner } = useAuth();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (type) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      if (type === 'admin') {
        await loginAsAdmin();
      } else {
        await loginAsPlanner();
      }
    } catch (err) {
      setAuthError(err.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setAuthError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Account Access
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {isRegister ? 'Create Account' : 'Sign In'}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Demo Credentials */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Pre-configured Test Accounts
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('admin')}
              className="group flex flex-col items-start rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-purple-400 hover:shadow-xs disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-purple-500"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Admin</span>
                <span className="text-[10px] text-slate-400">Full Access</span>
              </div>
              <span className="mt-1 font-mono text-[11px] text-slate-600 dark:text-zinc-400">admin@shop.com</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('planner')}
              className="group flex flex-col items-start rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-blue-400 hover:shadow-xs disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Planner</span>
                <span className="text-[10px] text-slate-400">Analyst</span>
              </div>
              <span className="mt-1 font-mono text-[11px] text-slate-600 dark:text-zinc-400">manager@shop.com</span>
            </button>
          </div>
        </div>

        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
          <span className="absolute bg-white px-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:bg-zinc-900 dark:text-zinc-500">
            or continue with credentials
          </span>
        </div>

        {authError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Assigned Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="user">Demand Planner (User role: View forecasts & analytics)</option>
                <option value="admin">Store Admin (Full access: Promotions & CSV Importer)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Authenticating…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-zinc-400">
            {isRegister ? 'Already have an account?' : "Need an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {isRegister ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { authModalOpen, authModalMode } = useAuth();
  if (!authModalOpen) return null;

  return <AuthModalDialog key={`${authModalOpen}-${authModalMode}`} initialMode={authModalMode} />;
}
