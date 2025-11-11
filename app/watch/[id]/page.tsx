'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import StreamingSources from '@/components/StreamingSources';
import FavoriteButton from '@/components/FavoriteButton';
import type {
  Movie,
  Trailer,
  Credits,
  Genre,
  CastMember,
  CrewMember,
  Season,
} from '@/types';

// Player types
type PlayerType = 'vidking' | 'videasy' | 'vidlink' | 'vidsrc' | 'multiserver';

// Multi Server sub-types
type MultiServerType = 'api1' | 'api2' | 'api3' | 'api4';

// VIDEASY Player event types
interface VideasyPlayerEvent {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  progress: number;
  timestamp: number;
  duration: number;
  season?: number;
  episode?: number;
}

// VidLink Player event types
interface VidlinkPlayerEvent {
  type: 'PLAYER_EVENT';
  data: {
    event: 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate';
    currentTime: number;
    duration: number;
    mtmdbId: number;
    mediaType: 'movie' | 'tv';
    season?: number;
    episode?: number;
  };
}

interface VidlinkMediaData {
  [key: string]: {
    id: number;
    type: 'movie' | 'tv';
    title: string;
    poster_path?: string;
    backdrop_path?: string;
    progress?: {
      watched: number;
      duration: number;
    };
    last_season_watched?: string;
    last_episode_watched?: string;
    show_progress?: {
      [key: string]: {
        season: string;
        episode: string;
        progress: {
          watched: number;
          duration: number;
        };
      };
    };
    last_updated?: number;
  };
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { contentType } = useContentStore();

  const [id, setId] = useState<string>('');
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [currentTrailerIdx, setCurrentTrailerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Movie>({} as Movie);
  const [similarContent, setSimilarContent] = useState<Movie[]>([]);
  const [embedUrl, setEmbedUrl] = useState('');
  const [credits, setCredits] = useState<Credits | null>(null);
  const [currentSeason, setCurrentSeason] = useState<number | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeasonData, setCurrentSeasonData] = useState<Season | null>(
    null
  );
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerType>('vidking');
  const [selectedMultiServer, setSelectedMultiServer] =
    useState<MultiServerType>('api2'); // Default to Multi Language

  const episodeScrollRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const progressSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const { getHistoryItem, updateWatchHistory, fetchWatchHistory } =
    useWatchHistoryStore();

  // Load player preference from localStorage
  useEffect(() => {
    const savedPlayer = localStorage.getItem('preferredPlayer') as PlayerType;
    const savedMultiServer = localStorage.getItem(
      'preferredMultiServer'
    ) as MultiServerType;
    if (
      savedPlayer === 'vidking' ||
      savedPlayer === 'videasy' ||
      savedPlayer === 'vidlink' ||
      savedPlayer === 'vidsrc' ||
      savedPlayer === 'multiserver'
    ) {
      setSelectedPlayer(savedPlayer);
    }
    if (
      savedMultiServer === 'api1' ||
      savedMultiServer === 'api2' ||
      savedMultiServer === 'api3' ||
      savedMultiServer === 'api4'
    ) {
      setSelectedMultiServer(savedMultiServer);
    }
  }, []);

  // Save player preference to localStorage
  const handlePlayerChange = useCallback((player: PlayerType) => {
    setSelectedPlayer(player);
    localStorage.setItem('preferredPlayer', player);
  }, []);

  // Save multi server preference to localStorage
  const handleMultiServerChange = useCallback((server: MultiServerType) => {
    setSelectedMultiServer(server);
    localStorage.setItem('preferredMultiServer', server);
  }, []);

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

  // Handle player progress events via postMessage (Vidking, VIDEASY, VidLink, and Vidsrc)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Only accept messages from trusted domains
      const isVidking =
        event.origin === 'https://www.vidking.net' ||
        event.origin === 'https://vidking.net';
      const isVideasy =
        event.origin === 'https://player.videasy.net' ||
        event.origin === 'https://www.videasy.net';
      const isVidlink =
        event.origin === 'https://vidlink.pro' ||
        event.origin === 'https://www.vidlink.pro';
      const isVidsrc =
        event.origin === 'https://embed.vidsrc.pk' ||
        event.origin === 'https://www.vidsrc.pk' ||
        event.origin === 'https://vidsrc.pk';
      const isVidsrcWtf =
        event.origin === 'https://www.vidsrc.wtf' ||
        event.origin === 'https://vidsrc.wtf';

      if (!isVidking && !isVideasy && !isVidlink && !isVidsrc && !isVidsrcWtf) {
        return;
      }

      try {
        const messageData = JSON.parse(event.data);

        // Handle Vidking Player events
        if (
          isVidking &&
          messageData.type === 'PLAYER_EVENT' &&
          messageData.data
        ) {
          const {
            event: eventType,
            currentTime,
            duration,
            progress,
            season,
            episode,
          } = messageData.data;

          // Only save progress for significant events (not every timeupdate)
          const shouldSave =
            eventType === 'play' ||
            eventType === 'pause' ||
            eventType === 'ended' ||
            eventType === 'seeked' ||
            (eventType === 'timeupdate' && progress % 5 < 0.1); // Save every ~5% progress

          if (shouldSave && user && (content.title || content.name)) {
            // Debounce progress saves
            if (progressSaveTimeoutRef.current) {
              clearTimeout(progressSaveTimeoutRef.current);
            }

            progressSaveTimeoutRef.current = setTimeout(async () => {
              try {
                await cachedPost(
                  '/api/v1/watch/history',
                  {
                    contentId: parseInt(id),
                    contentType,
                    title: content.title || content.name,
                    posterPath: content.poster_path || null,
                    backdropPath: content.backdrop_path || null,
                    currentTime: Math.floor(currentTime),
                    duration: Math.floor(duration),
                    seasonNumber:
                      contentType === 'tv'
                        ? (season ??
                          (currentSeason !== null
                            ? currentSeason
                            : undefined) ??
                          undefined)
                        : undefined,
                    episodeNumber:
                      contentType === 'tv'
                        ? (episode ??
                          (currentEpisode !== null
                            ? currentEpisode
                            : undefined) ??
                          undefined)
                        : undefined,
                  },
                  {
                    invalidateCache: ['/api/v1/watch/history'],
                  }
                );

                // Update local store
                updateWatchHistory({
                  contentId: parseInt(id),
                  contentType,
                  title: content.title || content.name,
                  posterPath: content.poster_path || null,
                  backdropPath: content.backdrop_path || null,
                  currentTime: Math.floor(currentTime),
                  duration: Math.floor(duration),
                  seasonNumber:
                    contentType === 'tv'
                      ? (season ?? currentSeason ?? undefined)
                      : undefined,
                  episodeNumber:
                    contentType === 'tv'
                      ? (episode ?? currentEpisode ?? undefined)
                      : undefined,
                });
              } catch (_error) {
                // Silent fail - don't interrupt viewing experience
              }
            }, 2000); // Debounce for 2 seconds
          }
        }

        // Handle VIDEASY Player events
        if (isVideasy && messageData.id) {
          const {
            id: contentId,
            progress,
            timestamp,
            duration,
            season,
            episode,
          } = messageData as VideasyPlayerEvent;

          // Only save progress for significant updates (every ~5% or on pause/end)
          const shouldSave =
            progress % 5 < 0.1 || // Save every ~5% progress
            progress >= 90; // Save when near completion

          if (
            shouldSave &&
            user &&
            content.title &&
            parseInt(contentId) === parseInt(id)
          ) {
            // Debounce progress saves
            if (progressSaveTimeoutRef.current) {
              clearTimeout(progressSaveTimeoutRef.current);
            }

            progressSaveTimeoutRef.current = setTimeout(async () => {
              try {
                await cachedPost(
                  '/api/v1/watch/history',
                  {
                    contentId: parseInt(id),
                    contentType,
                    title: content.title || content.name,
                    posterPath: content.poster_path || null,
                    backdropPath: content.backdrop_path || null,
                    currentTime: Math.floor(timestamp),
                    duration: Math.floor(duration),
                    seasonNumber:
                      contentType === 'tv'
                        ? (season ??
                          (currentSeason !== null
                            ? currentSeason
                            : undefined) ??
                          undefined)
                        : undefined,
                    episodeNumber:
                      contentType === 'tv'
                        ? (episode ??
                          (currentEpisode !== null
                            ? currentEpisode
                            : undefined) ??
                          undefined)
                        : undefined,
                  },
                  {
                    invalidateCache: ['/api/v1/watch/history'],
                  }
                );

                // Update local store
                updateWatchHistory({
                  contentId: parseInt(id),
                  contentType,
                  title: content.title || content.name,
                  posterPath: content.poster_path || null,
                  backdropPath: content.backdrop_path || null,
                  currentTime: Math.floor(timestamp),
                  duration: Math.floor(duration),
                  seasonNumber:
                    contentType === 'tv'
                      ? (season ?? currentSeason ?? undefined)
                      : undefined,
                  episodeNumber:
                    contentType === 'tv'
                      ? (episode ?? currentEpisode ?? undefined)
                      : undefined,
                });
              } catch (_error) {
                // Silent fail - don't interrupt viewing experience
              }
            }, 2000); // Debounce for 2 seconds
          }
        }

        // Handle VidLink Player events
        if (isVidlink) {
          // Handle MEDIA_DATA (progress storage)
          if (messageData.type === 'MEDIA_DATA' && messageData.data) {
            const mediaData = messageData.data as VidlinkMediaData;
            // VidLink stores data in localStorage automatically, but we can sync it to our backend
            const contentId = parseInt(id);
            const contentData = mediaData[contentId.toString()];

            if (contentData && user && (content.title || content.name)) {
              const progress = contentData.progress;
              if (progress && progress.watched > 0 && progress.duration > 0) {
                // Debounce progress saves
                if (progressSaveTimeoutRef.current) {
                  clearTimeout(progressSaveTimeoutRef.current);
                }

                progressSaveTimeoutRef.current = setTimeout(async () => {
                  try {
                    const seasonNumber = contentData.last_season_watched
                      ? parseInt(contentData.last_season_watched)
                      : undefined;
                    const episodeNumber = contentData.last_episode_watched
                      ? parseInt(contentData.last_episode_watched)
                      : undefined;

                    await cachedPost(
                      '/api/v1/watch/history',
                      {
                        contentId,
                        contentType,
                        title: content.title || content.name,
                        posterPath:
                          contentData.poster_path ||
                          content.poster_path ||
                          null,
                        backdropPath:
                          contentData.backdrop_path ||
                          content.backdrop_path ||
                          null,
                        currentTime: Math.floor(progress.watched),
                        duration: Math.floor(progress.duration),
                        seasonNumber:
                          contentType === 'tv'
                            ? seasonNumber || currentSeason
                            : undefined,
                        episodeNumber:
                          contentType === 'tv'
                            ? episodeNumber || currentEpisode
                            : undefined,
                      },
                      {
                        invalidateCache: ['/api/v1/watch/history'],
                      }
                    );

                    // Update local store
                    updateWatchHistory({
                      contentId,
                      contentType,
                      title: content.title || content.name,
                      posterPath:
                        contentData.poster_path || content.poster_path || null,
                      backdropPath:
                        contentData.backdrop_path ||
                        content.backdrop_path ||
                        null,
                      currentTime: Math.floor(progress.watched),
                      duration: Math.floor(progress.duration),
                      seasonNumber:
                        contentType === 'tv'
                          ? (seasonNumber ??
                            (currentSeason !== null
                              ? currentSeason
                              : undefined) ??
                            undefined)
                          : undefined,
                      episodeNumber:
                        contentType === 'tv'
                          ? (episodeNumber ??
                            (currentEpisode !== null
                              ? currentEpisode
                              : undefined) ??
                            undefined)
                          : undefined,
                    });
                  } catch (_error) {
                    // Silent fail - don't interrupt viewing experience
                  }
                }, 2000); // Debounce for 2 seconds
              }
            }
          }

          // Handle PLAYER_EVENT (real-time events)
          if (messageData.type === 'PLAYER_EVENT' && messageData.data) {
            const {
              event: eventType,
              currentTime,
              duration,
              mtmdbId,
              season,
              episode,
            } = messageData.data as VidlinkPlayerEvent['data'];

            // Only save progress for significant events
            const shouldSave =
              eventType === 'play' ||
              eventType === 'pause' ||
              eventType === 'ended' ||
              eventType === 'seeked' ||
              (eventType === 'timeupdate' && currentTime % 30 < 1); // Save every ~30 seconds

            if (
              shouldSave &&
              user &&
              content.title &&
              mtmdbId === parseInt(id)
            ) {
              // Debounce progress saves
              if (progressSaveTimeoutRef.current) {
                clearTimeout(progressSaveTimeoutRef.current);
              }

              progressSaveTimeoutRef.current = setTimeout(async () => {
                try {
                  await cachedPost(
                    '/api/v1/watch/history',
                    {
                      contentId: parseInt(id),
                      contentType,
                      title: content.title || content.name,
                      posterPath: content.poster_path || null,
                      backdropPath: content.backdrop_path || null,
                      currentTime: Math.floor(currentTime),
                      duration: Math.floor(duration),
                      seasonNumber:
                        contentType === 'tv'
                          ? season || currentSeason
                          : undefined,
                      episodeNumber:
                        contentType === 'tv'
                          ? episode || currentEpisode
                          : undefined,
                    },
                    {
                      invalidateCache: ['/api/v1/watch/history'],
                    }
                  );

                  // Update local store
                  updateWatchHistory({
                    contentId: parseInt(id),
                    contentType,
                    title: content.title || content.name,
                    posterPath: content.poster_path || null,
                    backdropPath: content.backdrop_path || null,
                    currentTime: Math.floor(currentTime),
                    duration: Math.floor(duration),
                    seasonNumber:
                      contentType === 'tv'
                        ? (season ??
                          (currentSeason !== null
                            ? currentSeason
                            : undefined) ??
                          undefined)
                        : undefined,
                    episodeNumber:
                      contentType === 'tv'
                        ? (episode ??
                          (currentEpisode !== null
                            ? currentEpisode
                            : undefined) ??
                          undefined)
                        : undefined,
                  });
                } catch (_error) {
                  // Silent fail - don't interrupt viewing experience
                }
              }, 2000); // Debounce for 2 seconds
            }
          }
        }

        // Handle Vidsrc Player events (if they support progress tracking)
        // Note: Vidsrc may not have documented progress tracking API
        // This is a placeholder for future implementation
        if (isVidsrc) {
          // Vidsrc progress tracking can be added here if they provide postMessage API
          // For now, we'll rely on manual tracking or their internal system
        }

        // Handle Vidsrc.wtf (Multi Server) Player events
        if (isVidsrcWtf) {
          // Handle MEDIA_DATA (progress storage)
          if (messageData.type === 'MEDIA_DATA' && messageData.data) {
            const mediaData = messageData.data as Record<
              string,
              {
                id: number;
                type: 'movie' | 'tv';
                title: string;
                poster_path?: string;
                backdrop_path?: string;
                progress?: {
                  watched: number;
                  duration: number;
                };
                last_season_watched?: string;
                last_episode_watched?: string;
              }
            >;
            const contentId = parseInt(id);
            const contentData = mediaData[contentId.toString()];

            if (contentData && user && (content.title || content.name)) {
              const progress = contentData.progress;
              if (progress && progress.watched > 0 && progress.duration > 0) {
                // Debounce progress saves
                if (progressSaveTimeoutRef.current) {
                  clearTimeout(progressSaveTimeoutRef.current);
                }

                progressSaveTimeoutRef.current = setTimeout(async () => {
                  try {
                    const seasonNumber = contentData.last_season_watched
                      ? parseInt(contentData.last_season_watched)
                      : undefined;
                    const episodeNumber = contentData.last_episode_watched
                      ? parseInt(contentData.last_episode_watched)
                      : undefined;

                    await cachedPost(
                      '/api/v1/watch/history',
                      {
                        contentId,
                        contentType,
                        title: content.title || content.name,
                        posterPath:
                          contentData.poster_path ||
                          content.poster_path ||
                          null,
                        backdropPath:
                          contentData.backdrop_path ||
                          content.backdrop_path ||
                          null,
                        currentTime: Math.floor(progress.watched),
                        duration: Math.floor(progress.duration),
                        seasonNumber:
                          contentType === 'tv'
                            ? seasonNumber || currentSeason
                            : undefined,
                        episodeNumber:
                          contentType === 'tv'
                            ? episodeNumber || currentEpisode
                            : undefined,
                      },
                      {
                        invalidateCache: ['/api/v1/watch/history'],
                      }
                    );

                    // Update local store
                    updateWatchHistory({
                      contentId,
                      contentType,
                      title: content.title || content.name,
                      posterPath:
                        contentData.poster_path || content.poster_path || null,
                      backdropPath:
                        contentData.backdrop_path ||
                        content.backdrop_path ||
                        null,
                      currentTime: Math.floor(progress.watched),
                      duration: Math.floor(progress.duration),
                      seasonNumber:
                        contentType === 'tv'
                          ? (seasonNumber ??
                            (currentSeason !== null
                              ? currentSeason
                              : undefined) ??
                            undefined)
                          : undefined,
                      episodeNumber:
                        contentType === 'tv'
                          ? (episodeNumber ??
                            (currentEpisode !== null
                              ? currentEpisode
                              : undefined) ??
                            undefined)
                          : undefined,
                    });
                  } catch (_error) {
                    // Silent fail - don't interrupt viewing experience
                  }
                }, 2000); // Debounce for 2 seconds
              }
            }
          }
        }
      } catch (_error) {
        // Ignore invalid messages
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
    };
  }, [
    id,
    contentType,
    content,
    user,
    updateWatchHistory,
    currentSeason,
    currentEpisode,
  ]);

  // Load saved watch progress and set season/episode from URL or history
  useEffect(() => {
    if (!id || (!content.title && !content.name)) return;

    // Fetch watch history if not already loaded
    fetchWatchHistory();

    // Get season/episode from URL params or saved history
    const seasonParam = searchParams?.get('season');
    const episodeParam = searchParams?.get('episode');

    if (contentType === 'tv') {
      if (seasonParam && episodeParam) {
        setCurrentSeason(parseInt(seasonParam));
        setCurrentEpisode(parseInt(episodeParam));
      } else {
        // Try to get from saved history (get most recent episode)
        const item = getHistoryItem(parseInt(id), contentType);
        if (item?.seasonNumber && item?.episodeNumber) {
          setCurrentSeason(item.seasonNumber);
          setCurrentEpisode(item.episodeNumber);
        } else {
          // Default to season 1, episode 1
          setCurrentSeason(1);
          setCurrentEpisode(1);
        }
      }
    }
  }, [
    id,
    contentType,
    content.title,
    content.name,
    searchParams,
    getHistoryItem,
    fetchWatchHistory,
  ]);

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

        // Extract seasons from TV show data
        if (contentType === 'tv' && res.content.seasons) {
          // Filter out specials (season 0) and sort by season number
          const validSeasons = res.content.seasons
            .filter((s) => s.season_number > 0)
            .sort((a, b) => a.season_number - b.season_number);
          setSeasons(validSeasons);
        }
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

  // Scroll to current episode when it changes
  useEffect(() => {
    if (currentEpisode && episodeScrollRef.current) {
      setTimeout(() => {
        const episodeElement = episodeScrollRef.current?.querySelector(
          `[data-episode="${currentEpisode}"]`
        );
        if (episodeElement) {
          episodeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }, 300);
    }
  }, [currentEpisode, currentSeasonData]);

  // Fetch season details when season changes (for TV shows)
  useEffect(() => {
    if (contentType !== 'tv' || !id || !currentSeason) return;

    const fetchSeasonDetails = async () => {
      try {
        const res = await cachedGet<{ content: Season }>(
          `/api/v1/tv/${id}/season/${currentSeason}`,
          {
            ttl: 60 * 60 * 1000, // 1 hour cache
          }
        );
        setCurrentSeasonData(res.content);
      } catch (_error) {
        // Silent fail - fallback to basic season info
        const season = seasons.find((s) => s.season_number === currentSeason);
        if (season) {
          setCurrentSeasonData(season);
        }
      }
    };

    fetchSeasonDetails();
  }, [id, contentType, currentSeason, seasons]);

  // Build player embed URL based on selected player
  useEffect(() => {
    // Fix: Check for both title (movies) and name (TV shows)
    if (!id || (!content.title && !content.name)) return;

    // Determine season/episode for TV shows
    let season = currentSeason;
    let episode = currentEpisode;

    if (contentType === 'tv') {
      if (!season || !episode) {
        // Try to get from URL params first
        const seasonParam = searchParams?.get('season');
        const episodeParam = searchParams?.get('episode');

        if (seasonParam && episodeParam) {
          season = parseInt(seasonParam);
          episode = parseInt(episodeParam);
        } else {
          // Try to get from saved history
          fetchWatchHistory();
          const historyItem = getHistoryItem(parseInt(id), contentType);
          if (historyItem?.seasonNumber && historyItem?.episodeNumber) {
            season = historyItem.seasonNumber;
            episode = historyItem.episodeNumber;
          } else {
            // Default to season 1, episode 1
            season = 1;
            episode = 1;
          }
        }
        setCurrentSeason(season);
        setCurrentEpisode(episode);
      }
    }

    // Fetch watch history to get saved progress
    fetchWatchHistory();
    const historyItem = getHistoryItem(
      parseInt(id),
      contentType,
      contentType === 'tv'
        ? (season ?? (currentSeason !== null ? currentSeason : undefined))
        : undefined,
      contentType === 'tv'
        ? (episode ?? (currentEpisode !== null ? currentEpisode : undefined))
        : undefined
    );

    let playerUrl = '';
    const params = new URLSearchParams();

    // Set primary color (Netflix red)
    params.append('color', 'e50914');

    if (selectedPlayer === 'vidking') {
      // Build Vidking Player URL
      params.append('autoPlay', 'true');

      if (contentType === 'movie') {
        playerUrl = `https://www.vidking.net/embed/movie/${id}`;
      } else {
        // TV show
        playerUrl = `https://www.vidking.net/embed/tv/${id}/${season}/${episode}`;
        // Enable TV-specific features
        params.append('nextEpisode', 'true');
        params.append('episodeSelector', 'true');
      }

      // Add saved progress if available
      if (
        historyItem &&
        historyItem.currentTime > 0 &&
        historyItem.duration > 0
      ) {
        // Only resume if not completed (less than 90%)
        const progressPercent =
          (historyItem.currentTime / historyItem.duration) * 100;
        if (progressPercent < 90) {
          params.append(
            'progress',
            Math.floor(historyItem.currentTime).toString()
          );
        }
      }
    } else if (selectedPlayer === 'videasy') {
      // Build VIDEASY Player URL
      if (contentType === 'movie') {
        playerUrl = `https://player.videasy.net/movie/${id}`;
      } else {
        // TV show
        playerUrl = `https://player.videasy.net/tv/${id}/${season}/${episode}`;
        // Enable TV-specific features
        params.append('nextEpisode', 'true');
        params.append('episodeSelector', 'true');
        params.append('autoplayNextEpisode', 'true');
        params.append('overlay', 'true');
      }

      // Add saved progress if available
      if (
        historyItem &&
        historyItem.currentTime > 0 &&
        historyItem.duration > 0
      ) {
        // Only resume if not completed (less than 90%)
        const progressPercent =
          (historyItem.currentTime / historyItem.duration) * 100;
        if (progressPercent < 90) {
          params.append(
            'progress',
            Math.floor(historyItem.currentTime).toString()
          );
        }
      }
    } else if (selectedPlayer === 'vidlink') {
      // Build VidLink Player URL
      if (contentType === 'movie') {
        playerUrl = `https://vidlink.pro/movie/${id}`;
      } else {
        // TV show
        playerUrl = `https://vidlink.pro/tv/${id}/${season}/${episode}`;
        // Enable next episode button
        params.append('nextbutton', 'true');
      }

      // Set VidLink customization
      params.append('primaryColor', 'e50914'); // Netflix red
      params.append('secondaryColor', '170000'); // Dark red
      params.append('iconColor', 'e50914'); // Netflix red
      params.append('icons', 'default');
      params.append('title', 'true');
      params.append('poster', 'true');
      params.append('autoplay', 'false');

      // Add saved progress if available (VidLink uses startAt parameter)
      if (
        historyItem &&
        historyItem.currentTime > 0 &&
        historyItem.duration > 0
      ) {
        // Only resume if not completed (less than 90%)
        const progressPercent =
          (historyItem.currentTime / historyItem.duration) * 100;
        if (progressPercent < 90) {
          params.append(
            'startAt',
            Math.floor(historyItem.currentTime).toString()
          );
        }
      }
    } else if (selectedPlayer === 'vidsrc') {
      // Build Vidsrc Player URL
      if (contentType === 'movie') {
        playerUrl = `https://embed.vidsrc.pk/movie/${id}`;
      } else {
        // TV show - Vidsrc uses {season}-{episode} format
        if (season && episode) {
          playerUrl = `https://embed.vidsrc.pk/tv/${id}/${season}-${episode}`;
        } else if (season) {
          playerUrl = `https://embed.vidsrc.pk/tv/${id}/${season}`;
        } else {
          playerUrl = `https://embed.vidsrc.pk/tv/${id}`;
        }
      }

      // Note: Vidsrc doesn't appear to support progress resume parameters
      // Progress tracking would need to be handled manually if needed
    } else if (selectedPlayer === 'multiserver') {
      // Build Vidsrc.wtf Multi Server Player URL
      const apiVersion =
        selectedMultiServer === 'api1'
          ? '1'
          : selectedMultiServer === 'api2'
            ? '2'
            : selectedMultiServer === 'api3'
              ? '3'
              : '4';

      if (contentType === 'movie') {
        playerUrl = `https://vidsrc.wtf/api/${apiVersion}/movie/`;
        params.append('id', id);

        // API 1 and 2 support color parameter
        if (apiVersion === '1' || apiVersion === '2') {
          params.append('color', 'e50914'); // Netflix red
        }
      } else {
        // TV show
        playerUrl = `https://vidsrc.wtf/api/${apiVersion}/tv/`;
        params.append('id', id);

        if (season) {
          params.append('s', season.toString());
        }
        if (episode) {
          params.append('e', episode.toString());
        }

        // API 1 and 2 support color parameter
        if (apiVersion === '1' || apiVersion === '2') {
          params.append('color', 'e50914'); // Netflix red
        }
      }

      // Note: Vidsrc.wtf doesn't appear to support progress resume parameters
      // Progress tracking is handled via postMessage MEDIA_DATA events
    }

    // Only append query string if there are parameters
    if (params.toString()) {
      setEmbedUrl(`${playerUrl}?${params.toString()}`);
    } else {
      setEmbedUrl(playerUrl);
    }
  }, [
    id,
    contentType,
    content.title,
    content.name,
    currentSeason,
    currentEpisode,
    searchParams,
    selectedPlayer,
    selectedMultiServer,
    getHistoryItem,
    fetchWatchHistory,
  ]);

  const handleSeasonChange = useCallback(
    (season: number) => {
      setCurrentSeason(season);
      setCurrentEpisode(1); // Reset to first episode when season changes
      // Update URL without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('season', season.toString());
      newUrl.searchParams.set('episode', '1');
      router.replace(newUrl.pathname + newUrl.search);
    },
    [router]
  );

  const handleEpisodeChange = useCallback(
    (episode: number) => {
      setCurrentEpisode(episode);
      // Update URL without page reload
      const newUrl = new URL(window.location.href);
      if (currentSeason) {
        newUrl.searchParams.set('season', currentSeason.toString());
      }
      newUrl.searchParams.set('episode', episode.toString());
      router.replace(newUrl.pathname + newUrl.search);

      // Scroll to video player with offset for navbar
      setTimeout(() => {
        if (videoPlayerRef.current) {
          const elementPosition =
            videoPlayerRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 80; // 80px offset for navbar

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    },
    [router, currentSeason]
  );

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
          ref={videoPlayerRef}
        >
          {/* Responsive Container - Ensures player controls are fully visible */}
          <div className="relative w-full max-w-5xl">
            {embedUrl ? (
              <div className="relative w-full rounded-lg overflow-hidden border-2 border-gray-800 shadow-xl bg-black">
                {/* Container with extra height to accommodate player controls */}
                <div
                  className="relative w-full"
                  style={{
                    paddingBottom: 'calc(56.25% + 100px)',
                    height: 0,
                    minHeight: '700px',
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    frameBorder="0"
                    allowFullScreen
                    allow="encrypted-media"
                    className="absolute top-0 left-0 w-full h-full md:min-h-[700px] min-h-[400px]"
                    title={`${
                      selectedPlayer === 'vidking'
                        ? 'Vidking'
                        : selectedPlayer === 'videasy'
                          ? 'VIDEASY'
                          : selectedPlayer === 'vidlink'
                            ? 'VidLink'
                            : selectedPlayer === 'vidsrc'
                              ? 'Vidsrc'
                              : 'Multi Server'
                    } Player`}
                  ></iframe>
                </div>
              </div>
            ) : (
              <div
                className="relative w-full rounded-lg overflow-hidden border-2 border-gray-800"
                style={{
                  paddingBottom: '56.25%',
                  height: 0,
                  minHeight: '600px',
                }}
              >
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900">
                  <p className="text-gray-400">Loading video player...</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Player Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center gap-4 mt-4"
        >
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <span className="text-gray-400 text-sm font-medium">Player:</span>
            <div className="flex gap-2 bg-gray-900 rounded-lg p-1 border border-gray-800 flex-wrap justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerChange('vidking')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlayer === 'vidking'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Vidking
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerChange('videasy')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlayer === 'videasy'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                VIDEASY
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerChange('vidlink')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlayer === 'vidlink'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                VidLink
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerChange('vidsrc')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlayer === 'vidsrc'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Vidsrc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerChange('multiserver')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlayer === 'multiserver'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Multi Server
              </motion.button>
            </div>
          </div>

          {/* Multi Server Sub-Options */}
          {selectedPlayer === 'multiserver' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center items-center gap-4 flex-wrap"
            >
              <span className="text-gray-400 text-sm font-medium">Server:</span>
              <div className="flex gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700 flex-wrap justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMultiServerChange('api1')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedMultiServer === 'api1'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Multi Server
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMultiServerChange('api2')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedMultiServer === 'api2'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Multi Language
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMultiServerChange('api3')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedMultiServer === 'api3'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Multi Embed
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMultiServerChange('api4')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedMultiServer === 'api4'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Premium Embed
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Season and Episode Selectors for TV Shows */}
        {contentType === 'tv' && seasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-8 w-full"
          >
            {/* Season Selector */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 px-4 md:px-0">
                {content.name || content.title}
              </h3>
              <div className="flex items-center gap-3 px-4 md:px-0">
                <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
                  Season:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {seasons.map((season) => (
                    <motion.button
                      key={season.season_number}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSeasonChange(season.season_number)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentSeason === season.season_number
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {season.name || `Season ${season.season_number}`}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Netflix-style Episode Selector */}
            {currentSeasonData &&
              currentSeasonData.episodes &&
              currentSeasonData.episodes.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4 px-4 md:px-0">
                    Episodes
                  </h4>
                  <div className="relative">
                    <div
                      ref={episodeScrollRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 md:px-0 -mx-4 md:mx-0 snap-x snap-mandatory scroll-smooth"
                    >
                      {currentSeasonData.episodes.map((episode, index) => {
                        const historyItem = getHistoryItem(
                          parseInt(id),
                          contentType,
                          currentSeason || undefined,
                          episode.episode_number
                        );
                        const hasProgress =
                          historyItem && historyItem.currentTime > 0;
                        const progressPercent =
                          historyItem && historyItem.duration > 0
                            ? (historyItem.currentTime / historyItem.duration) *
                              100
                            : 0;
                        const isSelected =
                          currentEpisode === episode.episode_number;
                        const episodeStill = episode.still_path
                          ? `${SMALL_IMG_BASE_URL}${episode.still_path}`
                          : content.backdrop_path
                            ? `${SMALL_IMG_BASE_URL}${content.backdrop_path}`
                            : null;

                        return (
                          <motion.div
                            key={episode.episode_number}
                            data-episode={episode.episode_number}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`min-w-[280px] md:min-w-[320px] flex-shrink-0 snap-start group cursor-pointer transition-all ${
                              isSelected
                                ? 'ring-2 ring-red-600 rounded-lg scale-105'
                                : 'hover:scale-105'
                            }`}
                            onClick={() =>
                              handleEpisodeChange(episode.episode_number)
                            }
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                              {episodeStill ? (
                                <motion.img
                                  src={episodeStill}
                                  alt={episode.name}
                                  className="w-full h-full object-cover"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">
                                    No Image
                                  </span>
                                </div>
                              )}

                              {/* Play Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-white/90 rounded-full p-3"
                                >
                                  <svg
                                    className="w-8 h-8 text-black"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </motion.div>
                              </div>

                              {/* Progress Bar */}
                              {hasProgress && progressPercent > 5 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full bg-red-600"
                                  />
                                </div>
                              )}

                              {/* Episode Number Badge */}
                              <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
                                {episode.episode_number}
                              </div>

                              {/* Duration Badge */}
                              {episode.runtime && (
                                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                                  {Math.floor(episode.runtime / 60)}h{' '}
                                  {episode.runtime % 60}m
                                </div>
                              )}
                            </div>

                            {/* Episode Info */}
                            <div className="mt-3 px-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-semibold text-sm md:text-base truncate">
                                    {episode.episode_number}. {episode.name}
                                  </h5>
                                  {episode.overview && (
                                    <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-2">
                                      {episode.overview}
                                    </p>
                                  )}
                                  {episode.air_date && (
                                    <p className="text-gray-500 text-xs mt-1">
                                      {new Date(
                                        episode.air_date
                                      ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex-shrink-0"
                                  >
                                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
          </motion.div>
        )}

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
              className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-4"
            >
              {content?.title || content?.name}
              <FavoriteButton
                contentId={parseInt(id)}
                contentType={contentType}
                title={content?.title || content?.name || ''}
                posterPath={content?.poster_path}
                backdropPath={content?.backdrop_path}
                size="lg"
              />
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

            {/* Streaming Sources */}
            <StreamingSources contentId={id} contentType={contentType} />

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
