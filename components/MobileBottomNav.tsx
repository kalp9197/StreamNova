'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, Heart, Clock, User } from 'lucide-react';
import { useAuthStore } from '@/store/authUser';

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsVisible(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isVisible || !user) {
    return null;
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/favorites', icon: Heart, label: 'Favorites' },
    { href: '/history', icon: Clock, label: 'History' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 md:hidden"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              <Icon className="size-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
