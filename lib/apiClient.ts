'use client';

import axios from 'axios';
import { useApiCacheStore } from '@/store/apiCache';

// Create axios instance with default config
const apiClient = axios.create({
  withCredentials: true,
});

// Cache key generator
export const getCacheKey = (
  endpoint: string,
  params?: Record<string, unknown>
): string => {
  const paramStr = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';
  return `${endpoint}${paramStr}`;
};

// Cached GET request
export const cachedGet = async <T>(
  endpoint: string,
  options?: {
    params?: Record<string, unknown>;
    ttl?: number;
    force?: boolean;
  }
): Promise<T> => {
  const cache = useApiCacheStore.getState();
  const cacheKey = getCacheKey(endpoint, options?.params);

  // Return cached data if available and not forced
  if (!options?.force) {
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch with deduplication
  return cache.getOrFetch(
    cacheKey,
    async () => {
      const response = await apiClient.get(endpoint, {
        params: options?.params,
      });
      return response.data as T;
    },
    options?.ttl
  );
};

// Cached POST request (no caching, but can invalidate cache)
export const cachedPost = async <T>(
  endpoint: string,
  data?: unknown,
  options?: {
    invalidateCache?: string[];
  }
): Promise<T> => {
  const response = await apiClient.post<T>(endpoint, data);

  // Invalidate specified cache keys
  if (options?.invalidateCache) {
    const cache = useApiCacheStore.getState();
    options.invalidateCache.forEach((key) => cache.invalidate(key));
  }

  return response.data;
};

// Cached DELETE request (invalidates cache)
export const cachedDelete = async <T>(
  endpoint: string,
  options?: {
    invalidateCache?: string[];
  }
): Promise<T> => {
  const response = await apiClient.delete<T>(endpoint);

  // Invalidate specified cache keys
  if (options?.invalidateCache) {
    const cache = useApiCacheStore.getState();
    options.invalidateCache.forEach((key) => cache.invalidate(key));
  }

  return response.data;
};

export default apiClient;
