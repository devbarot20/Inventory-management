'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, login, register, loginAsAdmin, loginAsPlanner } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    setIsRegister(authModalMode === 'register');
    setAuthError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
  }, [authModalOpen, authModalMode]);

  if (!authModalOpen) return null;

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
      setAuthError(err.message || 'Demo login failed. Ensure database has demo seed data.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Demand Forecaster Portal
            </span>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {isRegister ? 'Create Account' : 'Sign In'}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 1-Click Quick Demo Access */}
        <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            ⚡ One-Click Demo Access
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('admin')}
              className="group flex flex-col items-start rounded-lg border border-purple-200 bg-white p-2.5 text-left transition hover:border-purple-400 hover:shadow-xs disabled:opacity-60 dark:border-purple-900 dark:bg-zinc-800"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Store Admin</span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Full Access</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">admin@shop.com</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('planner')}
              className="group flex flex-col items-start rounded-lg border border-blue-200 bg-white p-2.5 text-left transition hover:border-blue-400 hover:shadow-xs disabled:opacity-60 dark:border-blue-900 dark:bg-zinc-800"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Demand Planner</span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Analyst View</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">manager@shop.com</span>
            </button>
          </div>
        </div>

        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
          <span className="absolute bg-white px-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:bg-zinc-900 dark:text-zinc-500">
            or continue with credentials
          </span>
        </div>

        {authError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Role & Permissions
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="user">Demand Planner (User role: View forecasts, analytics)</option>
                <option value="admin">Store Admin (Full access: CSV Importer, promotions)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-base font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Authenticating…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="pt-2 text-center text-sm text-slate-500 dark:text-zinc-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
