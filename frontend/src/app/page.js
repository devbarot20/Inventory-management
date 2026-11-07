'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Landing from '@/components/landing/Landing';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Signed-in users go straight to the dashboard; the landing page is for visitors.
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  if (user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return <Landing />;
}
