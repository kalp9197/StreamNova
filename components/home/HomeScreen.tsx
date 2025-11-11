'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Info, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import useGetTrendingContent from '@/hooks/useGetTrendingContent';
import {
  MOVIE_CATEGORIES,
  ORIGINAL_IMG_BASE_URL,
  TV_CATEGORIES,
} from '@/utils/constants';
import { useContentStore } from '@/store/content';
import MovieSlider from '@/components/MovieSlider';
import { useState, useEffect } from 'react';
import ContinueWatching from '@/components/ContinueWatching';
import { GENRES } from '@/utils/constants';
import GenreSlider from '@/components/GenreSlider';

const HomeScreen = () => {
  const { trendingContent, loading } = useGetTrendingContent();
  const { contentType } = useContentStore();
  const [imgLoading, setImgLoading] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  // Pull to refresh handler
  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0) return;
      currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(distance, 100));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 50) {
        window.location.reload();
      }
      setPullDistance(0);
      startY = 0;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance]);

  // Update imgLoading based on backdrop_path availability
  useEffect(() => {
    if (!trendingContent?.backdrop_path) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setImgLoading(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [trendingContent?.backdrop_path]);

  if (loading || !trendingContent)
    return (
      <div className="h-screen text-white relative">
        <Navbar />
        <div className="absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center shimmer -z-10">
          <h2 className="text-3xl">Loading...</h2>
        </div>
      </div>
    );

  return (
    <>
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            animate={{ rotate: pullDistance > 50 ? 180 : 0 }}
            className="text-red-600"
          >
            ↓ Pull to refresh
          </motion.div>
        </div>
      )}

      <div className="relative h-screen text-white overflow-hidden">
        <Navbar />

        {imgLoading && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center shimmer -z-10" />
        )}

        {trendingContent?.backdrop_path ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
            src={ORIGINAL_IMG_BASE_URL + trendingContent.backdrop_path}
            alt="Hero img"
            className="absolute top-0 left-0 w-full h-full object-cover -z-50"
            onLoad={() => setImgLoading(false)}
            onError={() => setImgLoading(false)}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900 -z-50" />
        )}

        <div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/60 via-black/40 to-black -z-40"
          aria-hidden="true"
        />

        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 pt-16 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight"
            >
              {trendingContent?.title || trendingContent?.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-gray-300"
            >
              {trendingContent?.release_date?.split('-')[0] ||
                trendingContent?.first_air_date?.split('-')[0]}{' '}
              | {trendingContent?.adult ? '18+' : 'PG-13'}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 line-clamp-2 sm:line-clamp-3"
            >
              {trendingContent?.overview &&
              trendingContent.overview.length > 200
                ? trendingContent.overview.slice(0, 200) + '...'
                : trendingContent?.overview || ''}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8"
          >
            <Link
              href={`/watch/${trendingContent?.id}`}
              className="w-full sm:w-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-md flex items-center justify-center gap-2 text-base sm:text-lg transition-colors shadow-lg"
              >
                <Play className="size-5 sm:size-6 fill-black" />
                Play
              </motion.button>
            </Link>

            <Link
              href={`/watch/${trendingContent?.id}`}
              className="w-full sm:w-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-gray-700/80 hover:bg-gray-700 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-md flex items-center justify-center gap-2 text-base sm:text-lg transition-colors backdrop-blur-sm"
              >
                <Info className="size-5 sm:size-6" />
                More Info
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col gap-10 bg-black py-10">
        <ContinueWatching />

        {/* Genre Filter Chips */}
        <div className="px-4 sm:px-5 md:px-10 lg:px-20">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Browse by Genre
          </h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 12, name: 'Adventure' },
              { id: 14, name: 'Fantasy' },
              { id: 16, name: 'Animation' },
              { id: 18, name: 'Drama' },
              { id: 27, name: 'Horror' },
              { id: 28, name: 'Action' },
              { id: 35, name: 'Comedy' },
              { id: 36, name: 'History' },
              { id: 37, name: 'Western' },
              { id: 53, name: 'Thriller' },
            ].map(({ id, name }) => {
              const isSelected = selectedGenres.includes(id);
              return (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGenres((prev) =>
                        prev.filter((gId) => gId !== id)
                      );
                    } else {
                      setSelectedGenres((prev) => [...prev, id]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {name}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Genre Sliders */}
        {selectedGenres.map((genreId) => {
          const genreName = GENRES[genreId];
          if (!genreName) return null;
          return (
            <motion.div
              key={genreId}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <GenreSlider genreId={genreId} genreName={genreName} />
            </motion.div>
          );
        })}

        {contentType === 'movie'
          ? MOVIE_CATEGORIES.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MovieSlider category={category} />
              </motion.div>
            ))
          : TV_CATEGORIES.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MovieSlider category={category} />
              </motion.div>
            ))}
      </div>
    </>
  );
};

export default HomeScreen;
