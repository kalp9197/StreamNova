'use client';

import { motion } from 'framer-motion';
import { Heart, Play } from 'lucide-react';
import Link from 'next/link';

const FavoritesEmpty = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <Heart className="size-24 text-gray-700 mx-auto mb-6" />
      <h2 className="text-3xl font-bold mb-4">No favorites yet</h2>
      <p className="text-gray-400 mb-8">
        Start adding movies and TV shows to your favorites!
      </p>
      <Link href="/">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
        >
          <Play className="size-5" />
          Discover Content
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default FavoritesEmpty;
