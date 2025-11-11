'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authUser';
import { Loader } from 'lucide-react';
import AuthScreen from '@/components/home/AuthScreen';
import HomeScreen from '@/components/home/HomeScreen';

export default function HomePage() {
  const { user, isCheckingAuth, authCheck } = useAuthStore();

  useEffect(() => {
    authCheck();
  }, [authCheck]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen">
        <div className="flex justify-center items-center bg-black h-full">
          <Loader className="animate-spin text-red-600 size-10" />
        </div>
      </div>
    );
  }

  return <>{user ? <HomeScreen /> : <AuthScreen />}</>;
}
