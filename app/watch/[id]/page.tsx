'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authUser';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useContentStore } from '@/store/content';
import { cachedGet, cachedPost } from '@/lib/apiClient';
import Navbar from '@/components/Navbar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';
import {
  ORIGINAL_IMG_BASE_URL,
  SMALL_IMG_BASE_URL,
  PROFILE_IMG_BASE_URL,
} from '@/utils/constants';
import { formatReleaseDate } from '@/utils/dateFunction';
import WatchPageSkeleton from '@/components/skeletons/WatchPageSkeleton';
import Link from 'next/link';
import { useWatchHistoryStore } from '@/store/watchHistory';
import type {
  Movie,
  Trailer,
  Credits,
  Genre,
  CastMember,
  CrewMember,
} from '@/types';

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { contentType } = useContentStore();

  const [id, setId] = useState<string>('');
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [currentTrailerIdx, setCurrentTrailerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Movie>({} as Movie);
  const [similarContent, setSimilarContent] = useState<Movie[]>([]);
  const [embedUrl, setEmbedUrl] = useState('');
  const [watchProgress, setWatchProgress] = useState<{
    currentTime: number;
    duration: number;
  } | null>(null);
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [credits, setCredits] = useState<Credits | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const progressSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const startTimeRef = useRef<number>(Date.now());

  const { getHistoryItem, updateWatchHistory, fetchWatchHistory } =
    useWatchHistoryStore();

  // Memoize cache keys
  const detailsCacheKey = useMemo(
    () => (id ? `/api/v1/${contentType}/${id}/details` : null),
    [contentType, id]
  );
  const trailersCacheKey = useMemo(
    () => (id ? `/api/v1/${contentType}/${id}/trailers` : null),
    [contentType, id]
  );
  const similarCacheKey = useMemo(
    () => (id ? `/api/v1/${contentType}/${id}/similar` : null),
    [contentType, id]
  );
  const creditsCacheKey = useMemo(
    () => (id ? `/api/v1/${contentType}/${id}/credits` : null),
    [contentType, id]
  );

  // Load saved watch progress from store
  useEffect(() => {
    if (!id || !content.title) return;

    // Fetch watch history if not already loaded
    fetchWatchHistory();

    const item = getHistoryItem(parseInt(id), contentType);
    if (item) {
      setSavedProgress(item.currentTime);
      setWatchProgress({
        currentTime: item.currentTime,
        duration: item.duration || 0,
      });
    }
  }, [id, contentType, content.title, getHistoryItem, fetchWatchHistory]);

  // Save watch progress periodically
  const saveWatchProgress = useCallback(async () => {
    if (!id || !content.title || !user) return;

    const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const currentTime = savedProgress + elapsedTime;

    try {
      await cachedPost(
        '/api/v1/watch/history',
        {
          contentId: parseInt(id),
          contentType,
          title: content.title || content.name,
          posterPath: content.poster_path || null,
          backdropPath: content.backdrop_path || null,
          currentTime,
          duration: watchProgress?.duration || 0,
          seasonNumber: content.season_number,
          episodeNumber: content.episode_number,
        },
        {
          invalidateCache: ['/api/v1/watch/history'], // Invalidate watch history cache
        }
      );

      // Update local store
      updateWatchHistory({
        contentId: parseInt(id),
        contentType,
        title: content.title || content.name,
        posterPath: content.poster_path || null,
        backdropPath: content.backdrop_path || null,
        currentTime,
        duration: watchProgress?.duration || 0,
        seasonNumber: content.season_number,
        episodeNumber: content.episode_number,
      });
    } catch (_error) {
      // Silent fail - don't interrupt viewing experience
    }
  }, [
    id,
    contentType,
    content,
    savedProgress,
    watchProgress,
    user,
    updateWatchHistory,
  ]);

  // Start tracking progress when page loads
  useEffect(() => {
    if (!embedUrl || !content.title) return;

    startTimeRef.current = Date.now();

    // Save progress every 30 seconds
    progressSaveIntervalRef.current = setInterval(() => {
      saveWatchProgress();
    }, 30000);

    // Save progress when user leaves page
    const handleBeforeUnload = () => {
      saveWatchProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveWatchProgress(); // Final save
    };
  }, [embedUrl, content.title, saveWatchProgress]);

  useEffect(() => {
    params.then((p) => setId(p.id));
    if (!user) {
      router.push('/login');
    }
  }, [user, router, params]);

  useEffect(() => {
    if (!trailersCacheKey) return;

    const getTrailers = async () => {
      try {
        const res = await cachedGet<{ trailers: Trailer[] }>(trailersCacheKey, {
          ttl: 30 * 60 * 1000, // 30 minutes cache for trailers
        });
        setTrailers(res.trailers);
      } catch (_error) {
        setTrailers([]);
      }
    };
    getTrailers();
  }, [trailersCacheKey]);

  useEffect(() => {
    if (!similarCacheKey) return;

    const getSimilarContent = async () => {
      try {
        const res = await cachedGet<{ similar: Movie[] }>(similarCacheKey, {
          ttl: 30 * 60 * 1000, // 30 minutes cache
        });
        setSimilarContent(res.similar?.slice(0, 10) || []);
      } catch (_error) {
        setSimilarContent([]);
      }
    };
    getSimilarContent();
  }, [similarCacheKey]);

  useEffect(() => {
    if (!detailsCacheKey || !creditsCacheKey) return;

    const getContentDetails = async () => {
      try {
        const res = await cachedGet<{ content: Movie; subtitles?: string }>(
          detailsCacheKey,
          {
            ttl: 30 * 60 * 1000, // 30 minutes cache
          }
        );
        setContent(res.content);

        let embed = `https://vidsrc.xyz/embed/${contentType}/${id}`;
        if (
          contentType === 'tv' &&
          res.content.season_number &&
          res.content.episode_number
        ) {
          embed = `https://vidsrc.xyz/embed/tv/${id}/${res.content.season_number}-${res.content.episode_number}`;
        }

        const subtitles = res.content.subtitles || '';

        if (subtitles) {
          embed += `?sub_url=${encodeURIComponent(subtitles)}&ds_lang=en`;
        }

        setEmbedUrl(embed);
      } catch (_error) {
        setContent({} as Movie);
      } finally {
        setLoading(false);
      }
    };

    const getCredits = async () => {
      try {
        const res = await cachedGet<{ credits: Credits }>(creditsCacheKey, {
          ttl: 30 * 60 * 1000, // 30 minutes cache
        });
        setCredits(res.credits);
      } catch (_error) {
        // Silent fail
      }
    };

    getContentDetails();
    getCredits();
  }, [detailsCacheKey, creditsCacheKey, contentType, id]);

  const handleNext = () => {
    if (currentTrailerIdx < trailers.length - 1)
      setCurrentTrailerIdx(currentTrailerIdx + 1);
  };

  const handlePrev = () => {
    if (currentTrailerIdx > 0) setCurrentTrailerIdx(currentTrailerIdx - 1);
  };

  const scrollLeft = () => {
    if (sliderRef.current)
      sliderRef.current.scrollBy({
        left: -sliderRef.current.offsetWidth,
        behavior: 'smooth',
      });
  };

  const scrollRight = () => {
    if (sliderRef.current)
      sliderRef.current.scrollBy({
        left: sliderRef.current.offsetWidth,
        behavior: 'smooth',
      });
  };

  if (!user) {
    return null;
  }

  if (loading)
    return (
      <div className="min-h-screen bg-black p-10 pt-32">
        <WatchPageSkeleton />
      </div>
    );

  if (!content) {
    return (
      <div className="bg-black text-white min-h-screen flex justify-center items-center pt-32">
        <div className="text-center">
          <Navbar />
          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl sm:text-5xl font-bold text-red-600"
          >
            Content Not Found 😥
          </motion.h2>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white pt-20">
      <Navbar />
      <div className="mx-auto container px-4 md:px-6 lg:px-8 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex justify-center mb-8"
        >
          <div className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-2xl">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                allowFullScreen
                className="rounded-lg border-2 border-gray-800 shadow-xl"
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <p className="text-gray-400">Loading video player...</p>
              </div>
            )}
          </div>
        </motion.div>

        {trailers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16"
          >
            <h3 className="text-3xl font-bold text-center mb-6">
              🎞 Watch Trailers
            </h3>
            <div className="flex justify-center items-center gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors ${
                  currentTrailerIdx === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={currentTrailerIdx === 0}
                onClick={handlePrev}
              >
                <ChevronLeft size={24} />
              </motion.button>

              <span className="text-gray-400">
                {currentTrailerIdx + 1} / {trailers.length}
              </span>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors ${
                  currentTrailerIdx === trailers.length - 1
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                disabled={currentTrailerIdx === trailers.length - 1}
                onClick={handleNext}
              >
                <ChevronRight size={24} />
              </motion.button>
            </div>

            <div className="flex justify-center">
              <div className="max-w-4xl w-full aspect-video rounded-lg overflow-hidden shadow-xl">
                {trailers[currentTrailerIdx]?.key && (
                  <ReactPlayer
                    controls={true}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/watch?v=${trailers[currentTrailerIdx]?.key}`}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col md:flex-row items-start justify-between gap-10 max-w-5xl mx-auto mt-10 px-4 md:px-6"
        >
          <div className="flex-1 text-center md:text-left w-full min-w-0">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {content?.title || content?.name}
            </motion.h2>

            {/* Ratings and Meta Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 mb-4"
            >
              {content?.vote_average && (
                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg">
                  <span className="text-yellow-500 font-bold text-lg">
                    ⭐ {content.vote_average.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({content.vote_count?.toLocaleString() || 0} votes)
                  </span>
                </div>
              )}
              <span className="text-gray-300">
                {formatReleaseDate(
                  content?.release_date || content?.first_air_date || ''
                )}
              </span>
              {content?.runtime && (
                <span className="text-gray-300">
                  {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
                </span>
              )}
              {content?.episode_run_time?.[0] && (
                <span className="text-gray-300">
                  {content.episode_run_time[0]}m per episode
                </span>
              )}
              {content?.adult ? (
                <span className="text-red-600 font-semibold px-2 py-1 bg-red-600/20 rounded">
                  18+
                </span>
              ) : (
                <span className="text-green-600 font-semibold px-2 py-1 bg-green-600/20 rounded">
                  PG-13
                </span>
              )}
            </motion.div>

            {/* Genres */}
            {content?.genres && content.genres.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start"
              >
                {content.genres.map((genre: Genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-medium"
                  >
                    {genre.name}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Overview */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-lg text-gray-200 leading-relaxed mb-6 break-words"
            >
              {content?.overview}
            </motion.p>

            {/* Cast Section */}
            {credits?.cast && credits.cast.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 w-full"
              >
                <h3 className="text-2xl font-bold mb-4">Cast</h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
                  {credits.cast
                    .slice(0, 10)
                    .map((actor: CastMember, index: number) => (
                      <motion.div
                        key={actor.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        className="min-w-[120px] text-center"
                      >
                        {actor.profile_path ? (
                          <img
                            src={PROFILE_IMG_BASE_URL + actor.profile_path}
                            alt={actor.name}
                            className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-gray-700"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-2 flex items-center justify-center border-2 border-gray-700">
                            <span className="text-gray-500 text-xs">
                              No Photo
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-semibold text-white truncate">
                          {actor.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {actor.character}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Crew Section */}
            {credits?.crew && credits.crew.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 w-full"
              >
                <h3 className="text-xl font-bold mb-3">Key Crew</h3>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {credits.crew
                    .filter((member: CrewMember) =>
                      [
                        'Director',
                        'Producer',
                        'Writer',
                        'Screenplay',
                        'Creator',
                      ].includes(member.job)
                    )
                    .slice(0, 6)
                    .map((member: CrewMember, index: number) => (
                      <motion.div
                        key={member.credit_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 + index * 0.05 }}
                        className="text-sm"
                      >
                        <span className="text-gray-400">{member.job}: </span>
                        <span className="text-white font-medium">
                          {member.name}
                        </span>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </div>
          {content?.poster_path && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              src={ORIGINAL_IMG_BASE_URL + content.poster_path}
              alt="Poster"
              className="max-h-[500px] rounded-lg border-2 border-gray-700 shadow-2xl"
            />
          )}
        </motion.div>

        {similarContent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-16 w-full"
          >
            <h3 className="text-3xl font-bold mb-6 px-4 md:px-6">
              More Like This
            </h3>
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:-mx-6 md:px-6"
              ref={sliderRef}
            >
              {similarContent.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="min-w-[200px] group"
                >
                  <Link
                    href={`/watch/${item.id}`}
                    onClick={() => {
                      // Content type is already set from the current page
                    }}
                  >
                    <div className="relative rounded-lg overflow-hidden">
                      {item.poster_path ? (
                        <motion.img
                          src={SMALL_IMG_BASE_URL + item.poster_path}
                          alt={item.title || item.name}
                          className="w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
                          whileHover={{ scale: 1.05 }}
                        />
                      ) : (
                        <div className="w-full h-[300px] bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-center text-sm truncate">
                      {item.title || item.name}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollLeft}
                className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollRight}
                className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
