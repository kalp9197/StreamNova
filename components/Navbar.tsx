'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authUser';
import { useContentStore } from '@/store/content';
import EnhancedSearchBar from './EnhancedSearchBar';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const { setContentType } = useContentStore();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between p-4 h-20">
        <div className="flex items-center gap-8">
          <Link href="/">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent cursor-pointer"
            >
              StreamNova
            </motion.h1>
          </Link>

          <div className="hidden lg:flex gap-6 items-center">
            <Link
              href="/"
              onClick={() => setContentType('movie')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Movies
            </Link>
            <Link
              href="/"
              onClick={() => setContentType('tv')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              TV Shows
            </Link>
            <Link
              href="/history"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Search History
            </Link>
            <Link
              href="/favorites"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Favorites
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="hidden md:block">
            <EnhancedSearchBar />
          </div>

          {user && (
            <>
              {user.image ? (
                <Link href="/profile">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    src={user.image}
                    alt="User avatar"
                    className="h-10 w-10 rounded-full cursor-pointer border-2 border-gray-700 hover:border-red-600 transition-colors"
                  />
                </Link>
              ) : (
                <Link href="/profile">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center cursor-pointer border-2 border-gray-700 hover:border-red-600 transition-colors"
                  >
                    <span className="text-sm font-bold text-white">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </motion.div>
                </Link>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="text-gray-300 hover:text-red-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="size-6" />
              </motion.button>
            </>
          )}

          <div className="lg:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Menu"
            >
              <Menu className="size-6" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full lg:hidden border-t border-gray-800 bg-black/95 backdrop-blur-md"
          >
            <div className="p-4">
              <div className="mb-4">
                <EnhancedSearchBar />
              </div>
              <Link
                href="/"
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={toggleMobileMenu}
              >
                Movies
              </Link>
              <Link
                href="/"
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={toggleMobileMenu}
              >
                TV Shows
              </Link>
              <Link
                href="/history"
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={toggleMobileMenu}
              >
                Search History
              </Link>
              <Link
                href="/favorites"
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={toggleMobileMenu}
              >
                Favorites
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
