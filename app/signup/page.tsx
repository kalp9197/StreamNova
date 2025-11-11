'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authUser';

function SignUpForm() {
  const searchParams = useSearchParams();
  const emailValue = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailValue);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { signup, isSigningUp } = useAuthStore();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup({ email, username, password });
  };

  return (
    <div className="flex justify-center items-center mt-20 mx-3">
      <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md">
        <h1 className="text-center text-white text-2xl font-bold mb-4">
          Sign Up
        </h1>

        <form className="space-y-4" onSubmit={handleSignUp}>
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-300 block"
            >
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
              placeholder="abc@example.com"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-300 block"
            >
              Username
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
              placeholder="abc"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-300 block"
            >
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
              placeholder="••••••••"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-violet-600 text-white font-semibold rounded-md hover:bg-violet-700 disabled:opacity-50"
            disabled={isSigningUp}
          >
            {isSigningUp ? 'Loading...' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center text-gray-400">
          Already a member?{' '}
          <Link href="/login" className="text-violet-500 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="h-screen w-full hero-bg">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/">
          <h1 className="text-3xl pb-2 text-white">StreamNova</h1>
        </Link>
      </header>

      <Suspense
        fallback={
          <div className="flex justify-center items-center mt-20 mx-3">
            <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md">
              <div className="text-center text-white">Loading...</div>
            </div>
          </div>
        }
      >
        <SignUpForm />
      </Suspense>
    </div>
  );
}
