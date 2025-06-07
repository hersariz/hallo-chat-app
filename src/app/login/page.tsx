'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in, redirect to home
        router.push('/');
      } else {
        // User is signed out, show login
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-secondary">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-24 w-64 h-64 bg-light/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Login container */}
        <div className="z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full text-primary text-3xl font-bold mb-4 shadow-lg">
              <span className="transform -translate-y-0.5">H</span>
            </div>
            <h1 className="text-4xl font-bold text-white text-shadow">Hallo</h1>
            <p className="text-white/80 mt-2 text-shadow">Aplikasi Chat Modern dengan Fitur Lengkap</p>
          </div>
          
          <LoginForm />
          
          <div className="mt-10 text-center text-white/70 text-sm">
            <p>© 2023 Hallo Chat App. Semua hak dilindungi.</p>
          </div>
        </div>
      </div>
    </main>
  );
} 