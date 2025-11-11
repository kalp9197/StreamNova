'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, Clock, Users } from 'lucide-react';
import { SMALL_IMG_BASE_URL } from '@/utils/constants';
import { GENRES } from '@/utils/constants';
import { useEffect, useState, useRef } from 'react';
import FavoriteButton from './FavoriteButton';

interface HoverCardProps {
  content: {
    id: number;
    title?: string;
    name?: string;
    vote_average?: number;
    vote_count?: number;
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
    episode_run_time?: number[];
    overview?: string;
    genre_ids?: number[];
    poster_path?: string | null;
    backdrop_path?: string | null;
  };
  isVisible: boolean;
  position: { x: number; y: number };
}

const ContentHoverCard = ({ content, isVisible, position }: HoverCardProps) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide hover card on mobile devices (touch devices)
    if (!isVisible || window.innerWidth < 768) return;

    const updatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardWidth = 320; // w-80 = 320px
      const cardHeight = cardRef.current?.offsetHeight || 300;
      const offset = 16; // Padding from viewport edges
      const gap = 12; // Gap between poster and card

      let x = position.x + gap; // Position to the right with a gap
      let y = position.y;

      // If card would overflow on the right, position it to the left instead
      if (x + cardWidth > viewportWidth - offset) {
        x = position.x - cardWidth - gap; // Position to the left
        // Ensure it doesn't go off the left edge
        if (x < offset) {
          x = offset;
        }
      }

      // Ensure card doesn't go off the right edge
      if (x + cardWidth > viewportWidth - offset) {
        x = viewportWidth - cardWidth - offset;
      }

      // Adjust vertical position - align top with poster top
      // If not enough space above, adjust downward
      if (y < offset) {
        y = offset;
      }

      // Ensure card doesn't go below viewport
      if (y + cardHeight > viewportHeight - offset) {
        y = viewportHeight - cardHeight - offset;
      }

      setAdjustedPosition({ x, y });
    };

    // Use requestAnimationFrame to ensure DOM is updated
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    const handleScroll = () => {
      // Hide card on scroll to prevent positioning issues
      setAdjustedPosition({ x: -9999, y: -9999 });
    };

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, position]);

  // Hide hover card on mobile devices
  if (
    !isVisible ||
    !content ||
    (typeof window !== 'undefined' && window.innerWidth < 768)
  )
    return null;

  const title = content.title || content.name || 'Unknown';
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const runtime = content.runtime || content.episode_run_time?.[0] || null;
  const rating = content.vote_average ? content.vote_average.toFixed(1) : null;
  const voteCount = content.vote_count || 0;
  const genres =
    content.genre_ids
      ?.map((id) => GENRES[id])
      .filter(Boolean)
      .slice(0, 3) || [];

  return (
    <AnimatePresence>
      {isVisible && adjustedPosition.x > 0 && (
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50"
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
            transform: 'translateY(0)',
          }}
        >
          <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden w-80">
            {content.backdrop_path && (
              <div className="relative h-32 overflow-hidden">
                <img
                  src={SMALL_IMG_BASE_URL + content.backdrop_path}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">
                  {title}
                </h3>
                <div className="pointer-events-auto ml-2 flex-shrink-0">
                  <FavoriteButton
                    contentId={content.id}
                    contentType={content.release_date ? 'movie' : 'tv'}
                    title={title}
                    posterPath={content.poster_path}
                    backdropPath={content.backdrop_path}
                    size="sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                {rating && (
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                    <Star className="size-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-yellow-500 font-semibold text-sm">
                      {rating}
                    </span>
                  </div>
                )}
                {year && (
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Calendar className="size-4" />
                    <span>{year}</span>
                  </div>
                )}
                {runtime && (
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock className="size-4" />
                    <span>{runtime}m</span>
                  </div>
                )}
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {content.overview && (
                <p className="text-gray-300 text-sm line-clamp-3">
                  {content.overview}
                </p>
              )}

              {voteCount > 0 && (
                <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
                  <Users className="size-3" />
                  <span>{voteCount.toLocaleString()} votes</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContentHoverCard;
