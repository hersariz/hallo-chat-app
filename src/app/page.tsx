'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import ChatApp from '@/components/ChatApp';
import { saveUserToFirestore, setupOnlineStatusListeners, setUserOffline } from '@/lib/users';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
        saveUserToFirestore(currentUser);
        setupOnlineStatusListeners(currentUser.uid);
      } else {
        // User is signed out
        setUser(null);
        router.push('/login');
      }
      setLoading(false);
    });

    // Add beforeunload listener to set user offline on page close
    const handleBeforeUnload = () => {
      if (user) {
        setUserOffline(user.uid).catch(console.error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className="h-screen bg-gradient-to-br from-primary-dark via-primary to-secondary">
      <ChatApp user={user} />
    </main>
  );
} 