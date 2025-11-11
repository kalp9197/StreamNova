'use client';

import { useEffect, useState, useMemo } from 'react';
import { useContentStore } from '@/store/content';
import { cachedGet } from '@/lib/apiClient';
import type { Movie } from '@/types';

const useGetTrendingContent = () => {
  const [trendingContent, setTrendingContent] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const { contentType } = useContentStore();

  // Cache key based on contentType
  const cacheKey = useMemo(
    () => `/api/v1/${contentType}/trending`,
    [contentType]
  );

  useEffect(() => {
    const getTrendingContent = async () => {
      setLoading(true);
      try {
        const res = await cachedGet<{ content: Movie }>(cacheKey, {
          ttl: 10 * 60 * 1000, // 10 minutes cache for trending content
        });
        setTrendingContent(res.content);
      } catch (_error) {
        console.error('Error fetching trending content:', _error);
      } finally {
        setLoading(false);
      }
    };

    getTrendingContent();
  }, [cacheKey]);

  return { trendingContent, loading };
};

export default useGetTrendingContent;
