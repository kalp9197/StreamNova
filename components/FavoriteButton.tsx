'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavoritesStore } from '@/store/favorites';
import { useAuthStore } from '@/store/authUser';

interface FavoriteButtonProps {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FavoriteButton = ({
  contentId,
  contentType,
  title,
  posterPath,
  backdropPath,
  size = 'md',
  className = '',
}: FavoriteButtonProps) => {
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite, fetchFavorites } = useFavoritesStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const isFavorited = user ? isFavorite(contentId, contentType) : false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      return;
    }

    setIsLoading(true);
    await toggleFavorite(
      contentId,
      contentType,
      title,
      posterPath,
      backdropPath
    );
    setIsLoading(false);
  };

  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: 'size-5',
    md: 'size-6',
    lg: 'size-8',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      disabled={isLoading}
      className={`${sizeClasses[size]} ${className} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`w-full h-full ${
          isFavorited
            ? 'fill-red-600 text-red-600'
            : 'fill-none text-gray-400 hover:text-red-600'
        } transition-colors`}
      />
    </motion.button>
  );
};

export default FavoriteButton;
