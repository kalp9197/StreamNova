'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="hero-bg relative">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-4 pb-10">
        <h1 className="text-3xl pb-2 text-white">StreamNova</h1>
        <Link
          href="/login"
          className="text-white bg-violet-600 py-1 px-2 rounded"
        >
          Sign In
        </Link>
      </header>

      <div className="flex flex-col items-center justify-center text-center py-20 sm:py-32 md:py-40 text-white max-w-6xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 px-2">
          Unlimited movies, TV shows, and more
        </h1>
        <p className="mb-4 text-sm sm:text-base md:text-lg px-2">
          Ready to watch? Enter your email to create your account
        </p>

        <form
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-5/6 md:w-2/3 lg:w-1/2 max-w-lg"
          onSubmit={handleFormSubmit}
        >
          <input
            type="email"
            placeholder="Email address"
            className="p-3 sm:p-2 rounded flex-1 bg-black/80 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-violet-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-base sm:text-lg md:text-xl lg:text-2xl px-4 sm:px-2 md:px-6 py-2.5 sm:py-1 md:py-2 rounded flex justify-center items-center gap-2 transition-colors"
          >
            Get Started
            <ChevronRight className="size-6 sm:size-8 md:size-10" />
          </button>
        </form>
      </div>

      <div className="h-2 w-full bg-[#232323]" aria-hidden="true" />

      <div className="py-8 sm:py-10 bg-black text-white">
        <div className="flex max-w-6xl mx-auto items-center justify-center md:flex-row flex-col px-4 md:px-2 gap-6 md:gap-0">
          <div className="flex-1 text-center md:text-left px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
              Watch everywhere
            </h2>
            <p className="text-base sm:text-lg md:text-xl">
              Stream unlimited movies and TV shows on your phone, tablet,
              laptop, and TV.
            </p>
          </div>

          <div className="flex-1 relative overflow-hidden w-full max-w-md md:max-w-none">
            <img
              src="/device-pile.png"
              alt="Device image"
              className="mt-4 z-20 relative w-full h-auto"
            />
            <video
              className="absolute top-2 left-1/2 -translate-x-1/2 h-4/6 z-10 max-w-[63%]"
              playsInline
              autoPlay
              muted
              loop
            >
              <source src="/video-devices.m4v" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      <div className="h-2 w-full bg-[#232323]" aria-hidden="true" />
    </div>
  );
};

export default AuthScreen;
