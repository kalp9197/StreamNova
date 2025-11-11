'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useContentStore } from '@/store/content';
import { cachedGet } from '@/lib/apiClient';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SMALL_IMG_BASE_URL } from '@/utils/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentHoverCard from './ContentHoverCard';
import { useWatchHistoryStore } from '@/store/watchHistory';
import FavoriteButton from './FavoriteButton';
import type { Movie } from '@/types';

interface GenreSliderProps {
  genreId: number;
  genreName: string;
}

const GenreSlider = ({ genreId, genreName }: GenreSliderProps) => {
  const { contentType } = useContentStore();
  const [content, setContent] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArrows, setShowArrows] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const { fetchWatchHistory, getProgress } = useWatchHistoryStore();

  const sliderRef = useRef<HTMLDivElement>(null);

  // Memoize cache key
  const cacheKey = useMemo(
    () => `/api/v1/${contentType}/genre/${genreId}`,
    [contentType, genreId]
  );

  useEffect(() => {
    const getContent = async () => {
      setLoading(true);
      try {
        const res = await cachedGet<{ content: Movie[] }>(cacheKey, {
          ttl: 10 * 60 * 1000, // 10 minutes cache
        });
        setContent(res.content || []);
      } catch (error) {
        console.error('Error fetching genre content:', error);
        setContent([]);
      } finally {
        setLoading(false);
      }
    };

    getContent();
  }, [cacheKey]);

  // Load watch history once (shared across all sliders)
  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  // Hide hover card on scroll
  useEffect(() => {
    const handleScroll = () => {
      setHoveredItem(null);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const getItemProgress = (contentId: number) => {
    return getProgress(contentId, contentType);
  };

  const handleMouseEnter = (item: Movie, event: React.MouseEvent) => {
    setHoveredItem(item.id);
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right, // Position at the right edge of the poster
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleMouseMove = (item: Movie, event: React.MouseEvent) => {
    if (hoveredItem === item.id) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoverPosition({
        x: rect.right,
        y: rect.top,
      });
    }
  };

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sliderRef.current) {
      sliderRef.current.scrollBy({
        left: sliderRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
    if (isRightSwipe && sliderRef.current) {
      sliderRef.current.scrollBy({
        left: -sliderRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: -sliderRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: sliderRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-black text-white relative px-5 md:px-20"
      >
        <h2 className="mb-4 text-2xl md:text-3xl font-bold">{genreName}</h2>
        <div className="flex space-x-4 overflow-x-scroll scrollbar-hide pb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="min-w-[250px] md:min-w-[300px] aspect-video bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  if (content.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-black text-white relative px-5 md:px-20"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <h2 className="mb-4 text-2xl md:text-3xl font-bold">{genreName}</h2>

      <div
        className="flex space-x-4 overflow-x-scroll scrollbar-hide pb-4"
        ref={sliderRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {content.map((item, index) => {
          const backdropSrc = item.backdrop_path
            ? SMALL_IMG_BASE_URL + item.backdrop_path
            : null;
          const progress = getItemProgress(item.id);
          const hasProgress = progress > 0 && progress < 90;
          const isHovered = hoveredItem === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="min-w-[250px] md:min-w-[300px] group relative"
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={(e) => handleMouseMove(item, e)}
            >
              <Link
                href={`/watch/${item.id}`}
                className="block relative rounded-lg overflow-hidden bg-gray-900"
              >
                <div className="relative aspect-video overflow-hidden">
                  {backdropSrc ? (
                    <motion.img
                      src={backdropSrc}
                      alt="Movie image"
                      className="w-full h-full object-cover transition-transform duration-300"
                      whileHover={{ scale: 1.1 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {hasProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-red-600"
                      />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Favorite Button */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <FavoriteButton
                      contentId={item.id}
                      contentType={contentType}
                      title={item.title || item.name || ''}
                      posterPath={item.poster_path}
                      backdropPath={item.backdrop_path}
                      size="md"
                    />
                  </div>
                </div>
                <p className="mt-2 text-center text-sm md:text-base font-medium truncate">
                  {item.title || item.name}
                </p>
              </Link>

              {/* Hover Card */}
              {isHovered && (
                <ContentHoverCard
                  content={item}
                  isVisible={isHovered}
                  position={hoverPosition}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {showArrows && content.length > 0 && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-1/2 -translate-y-1/2 left-5 md:left-24 flex items-center justify-center size-12 rounded-full bg-black/80 hover:bg-black text-white z-10 backdrop-blur-sm shadow-lg"
            onClick={scrollLeft}
          >
            <ChevronLeft size={24} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-1/2 -translate-y-1/2 right-5 md:right-24 flex items-center justify-center size-12 rounded-full bg-black/80 hover:bg-black text-white z-10 backdrop-blur-sm shadow-lg"
            onClick={scrollRight}
          >
            <ChevronRight size={24} />
          </motion.button>
        </>
      )}
    </motion.div>
  );
};

export default GenreSlider;
