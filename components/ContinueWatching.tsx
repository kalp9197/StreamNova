'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, Clock } from 'lucide-react';
import { useContentStore } from '@/store/content';
import { SMALL_IMG_BASE_URL } from '@/utils/constants';
import { useWatchHistoryStore } from '@/store/watchHistory';

const ContinueWatching = () => {
  const {
    watchHistory,
    isLoading: loading,
    fetchWatchHistory,
  } = useWatchHistoryStore();
  const { setContentType } = useContentStore();

  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  const calculateProgress = (currentTime: number, duration: number) => {
    if (!duration || duration === 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-5 md:px-10 lg:px-20 py-6 sm:py-8 md:py-10">
        <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gray-800 rounded animate-pulse mb-4 sm:mb-6"></div>
        <div className="flex gap-3 sm:gap-4 overflow-x-scroll scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="min-w-[240px] sm:min-w-[280px] md:min-w-[300px] h-[140px] sm:h-[160px] md:h-[170px] bg-gray-800 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (watchHistory.length === 0) {
    return null;
  }

  return (
    <div className="px-4 sm:px-5 md:px-10 lg:px-20 py-6 sm:py-8 md:py-10">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2"
      >
        <Clock className="size-5 sm:size-6 text-red-600" />
        Continue Watching
      </motion.h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-scroll scrollbar-hide pb-4">
        {watchHistory.map((item, index) => {
          const progress = calculateProgress(item.currentTime, item.duration);
          const imageSrc = item.backdropPath
            ? SMALL_IMG_BASE_URL + item.backdropPath
            : item.posterPath
              ? SMALL_IMG_BASE_URL + item.posterPath
              : null;

          // Generate unique key that includes season/episode for TV shows
          const uniqueKey =
            item.contentType === 'tv' &&
            item.seasonNumber !== undefined &&
            item.episodeNumber !== undefined
              ? `${item.contentId}-${item.contentType}-${item.seasonNumber}-${item.episodeNumber}`
              : `${item.contentId}-${item.contentType}`;

          return (
            <motion.div
              key={uniqueKey}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[400px] group relative"
            >
              <Link
                href={
                  item.contentType === 'tv' &&
                  item.seasonNumber &&
                  item.episodeNumber
                    ? `/watch/${item.contentId}?season=${item.seasonNumber}&episode=${item.episodeNumber}`
                    : `/watch/${item.contentId}`
                }
                onClick={() => setContentType(item.contentType)}
                className="block relative rounded-lg overflow-hidden bg-gray-900"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  {imageSrc ? (
                    <motion.img
                      src={imageSrc}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Play className="size-12 text-gray-600" />
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/90 rounded-full p-4"
                    >
                      <Play className="size-8 text-black fill-black" />
                    </motion.div>
                  </div>

                  {/* Progress Bar */}
                  {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-red-600"
                      />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 bg-gray-900">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="capitalize">
                      {item.contentType}
                      {item.contentType === 'tv' &&
                        item.seasonNumber &&
                        item.episodeNumber &&
                        ` • S${item.seasonNumber}E${item.episodeNumber}`}
                    </span>
                    {item.duration > 0 && (
                      <span>
                        {formatTime(item.currentTime)} /{' '}
                        {formatTime(item.duration)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatching;
