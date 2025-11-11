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

const HomeScreen = () => {
  const { trendingContent, loading } = useGetTrendingContent();
  const { contentType } = useContentStore();
  const [imgLoading, setImgLoading] = useState(true);

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

        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center px-8 md:px-16 lg:px-32 pt-20">
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
              className="mt-4 text-5xl md:text-7xl font-extrabold leading-tight"
            >
              {trendingContent?.title || trendingContent?.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-4 text-lg md:text-xl text-gray-300"
            >
              {trendingContent?.release_date?.split('-')[0] ||
                trendingContent?.first_air_date?.split('-')[0]}{' '}
              | {trendingContent?.adult ? '18+' : 'PG-13'}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-4 text-base md:text-lg text-gray-200 line-clamp-3"
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
            className="flex gap-4 mt-8"
          >
            <Link href={`/watch/${trendingContent?.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-md flex items-center gap-2 text-lg transition-colors shadow-lg"
              >
                <Play className="size-6 fill-black" />
                Play
              </motion.button>
            </Link>

            <Link href={`/watch/${trendingContent?.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-700/80 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-md flex items-center gap-2 text-lg transition-colors backdrop-blur-sm"
              >
                <Info className="size-6" />
                More Info
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col gap-10 bg-black py-10">
        <ContinueWatching />

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
