'use client';

import { create } from 'zustand';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

interface ApiCacheState {
  cache: Map<string, CacheEntry>;
  pendingRequests: Map<string, PendingRequest>;
  // Cache TTL in milliseconds (default: 5 minutes)
  defaultTTL: number;

  // Get cached data if valid, otherwise return null
  get: <T>(key: string) => T | null;

  // Set cache entry
  set: <T>(key: string, data: T, ttl?: number) => void;

  // Check if cache entry exists and is valid
  has: (key: string) => boolean;

  // Invalidate cache entry
  invalidate: (key: string) => void;

  // Clear all cache
  clear: () => void;

  // Get or fetch with deduplication
  getOrFetch: <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ) => Promise<T>;
}

export const useApiCacheStore = create<ApiCacheState>((set, get) => ({
  cache: new Map(),
  pendingRequests: new Map(),
  defaultTTL: 5 * 60 * 1000, // 5 minutes

  get: <T>(key: string): T | null => {
    const entry = get().cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      get().cache.delete(key);
      return null;
    }

    return entry.data as T;
  },

  set: <T>(key: string, data: T, ttl?: number) => {
    const now = Date.now();
    const expiresAt = now + (ttl || get().defaultTTL);

    set((state) => {
      const newCache = new Map(state.cache);
      newCache.set(key, {
        data,
        timestamp: now,
        expiresAt,
      });
      return { cache: newCache };
    });
  },

  has: (key: string): boolean => {
    const entry = get().cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      get().cache.delete(key);
      return false;
    }

    return true;
  },

  invalidate: (key: string) => {
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.delete(key);
      return { cache: newCache };
    });

    // Also clear pending request if exists
    set((state) => {
      const newPending = new Map(state.pendingRequests);
      newPending.delete(key);
      return { pendingRequests: newPending };
    });
  },

  clear: () => {
    set({ cache: new Map(), pendingRequests: new Map() });
  },

  getOrFetch: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // Check cache first
    const cached = get().get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if there's already a pending request for this key
    const pending = get().pendingRequests.get(key);
    if (pending) {
      // If pending request is less than 30 seconds old, reuse it
      const now = Date.now();
      if (now - pending.timestamp < 30000) {
        return pending.promise as Promise<T>;
      }
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        // Cache the result
        get().set(key, data, ttl);

        // Remove from pending requests
        set((state) => {
          const newPending = new Map(state.pendingRequests);
          newPending.delete(key);
          return { pendingRequests: newPending };
        });

        return data;
      })
      .catch((error) => {
        // Remove from pending requests on error
        set((state) => {
          const newPending = new Map(state.pendingRequests);
          newPending.delete(key);
          return { pendingRequests: newPending };
        });

        throw error;
      });

    // Store pending request
    set((state) => {
      const newPending = new Map(state.pendingRequests);
      newPending.set(key, {
        promise,
        timestamp: Date.now(),
      });
      return { pendingRequests: newPending };
    });

    return promise;
  },
}));
