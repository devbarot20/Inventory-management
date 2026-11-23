'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

function AuthModalDialog({ initialMode }) {
  const router = useRouter();
  const { closeAuthModal, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    isAdmin: false,
    adminKey: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    setNotice(null);
    try {
      if (forgot) {
        const res = await apiFetch('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: formData.email }),
        });
        setNotice(res.message);
      } else if (isRegister) {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          ...(formData.isAdmin && formData.adminKey ? { adminKey: formData.adminKey.trim() } : {}),
        };
        const u = await register(payload);
        if (u?.role === 'admin') {
          router.push('/admin');
        }
      } else {
        const u = await login(formData.email, formData.password);
        if (u?.role === 'admin') {
          router.push('/admin');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setForgot(false);
    setNotice(null);
    setIsRegister((prev) => !prev);
    setAuthError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      isAdmin: false,
      adminKey: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Account Access
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {forgot ? 'Reset Password' : isRegister ? 'Create Account' : 'Sign In'}
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

        {authError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {authError}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && !forgot && (
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

          {!forgot && (
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
          )}

          {isRegister && !forgot && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Register as Platform Administrator</span>
              </label>
              {formData.isAdmin && (
                <div className="mt-2.5 space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Admin Secret Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter secret provisioning key"
                    required={formData.isAdmin}
                    value={formData.adminKey}
                    onChange={(e) => setFormData({ ...formData, adminKey: e.target.value })}
                    className="w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-900/60 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Provides access to /admin user management, platform metrics & audit logs.
                  </p>
                </div>
              )}
            </div>
          )}

          {!forgot && !isRegister && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                🛡️ Admins auto-redirect to /admin
              </span>
              <button
                type="button"
                onClick={() => {
                  setForgot(true);
                  setAuthError(null);
                }}
                className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : forgot ? 'Send reset link' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          {forgot ? (
            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setForgot(false);
                  setNotice(null);
                }}
                className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Back to sign in
              </button>
            </div>
          ) : (
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
          )}
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
