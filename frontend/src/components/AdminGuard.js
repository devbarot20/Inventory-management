'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * AdminGuard — wraps any page/layout that requires admin role.
 * - Shows a spinner while auth is loading.
 * - Redirects to /dashboard if the user is not logged in or not an admin (unless on /admin/login).
 */
export default function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin') && !isLoginPage) {
      if (!user) {
        router.replace('/admin/login');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, isLoginPage]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-zinc-400">
          Verifying admin access…
        </p>
      </div>
    );
  }

  if ((!user || user.role !== 'admin') && !isLoginPage) {
    // Will redirect via useEffect; render nothing in the meantime
    return null;
  }

  return children;
}
