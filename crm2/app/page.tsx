'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (token) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [token, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
