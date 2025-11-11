'use client';

import { create } from 'zustand';
import axios from 'axios';

interface WatchHistoryItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  currentTime: number;
  duration: number;
  lastWatched: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface WatchHistoryState {
  watchHistory: WatchHistoryItem[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchWatchHistory: (force?: boolean) => Promise<void>;
  updateWatchHistory: (
    item: Partial<WatchHistoryItem> & {
      contentId: number;
      contentType: 'movie' | 'tv';
    }
  ) => void;
  getProgress: (contentId: number, contentType: 'movie' | 'tv') => number;
  getHistoryItem: (
    contentId: number,
    contentType: 'movie' | 'tv'
  ) => WatchHistoryItem | undefined;
  clearHistory: () => void;
}

// Cache TTL: 2 minutes
const CACHE_TTL = 2 * 60 * 1000;

export const useWatchHistoryStore = create<WatchHistoryState>((set, get) => ({
  watchHistory: [],
  isLoading: false,
  lastFetched: null,

  fetchWatchHistory: async (force = false) => {
    const state = get();

    // Return cached data if still valid and not forced
    if (!force && state.lastFetched) {
      const now = Date.now();
      if (now - state.lastFetched < CACHE_TTL) {
        return;
      }
    }

    // Prevent duplicate requests
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true });

    try {
      const res = await axios.get<{
        success: boolean;
        watchHistory: WatchHistoryItem[];
      }>('/api/v1/watch/history', {
        withCredentials: true,
      });
      set({
        watchHistory: res.data.watchHistory || [],
        lastFetched: Date.now(),
        isLoading: false,
      });
    } catch (_error) {
      set({ isLoading: false });
      // Silent fail - don't interrupt user experience
    }
  },

  updateWatchHistory: (item) => {
    set((state) => {
      const existingIndex = state.watchHistory.findIndex(
        (h) =>
          h.contentId === item.contentId && h.contentType === item.contentType
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...state.watchHistory];
        updated[existingIndex] = { ...updated[existingIndex], ...item };
        return { watchHistory: updated };
      } else {
        // Add new item
        return {
          watchHistory: [
            ...state.watchHistory,
            {
              contentId: item.contentId,
              contentType: item.contentType,
              title: item.title || '',
              posterPath: item.posterPath || null,
              backdropPath: item.backdropPath || null,
              currentTime: item.currentTime || 0,
              duration: item.duration || 0,
              lastWatched: new Date().toISOString(),
              seasonNumber: item.seasonNumber,
              episodeNumber: item.episodeNumber,
            } as WatchHistoryItem,
          ],
        };
      }
    });
  },

  getProgress: (contentId: number, contentType: 'movie' | 'tv'): number => {
    const item = get().getHistoryItem(contentId, contentType);
    if (!item || !item.duration) return 0;
    return Math.min((item.currentTime / item.duration) * 100, 100);
  },

  getHistoryItem: (
    contentId: number,
    contentType: 'movie' | 'tv'
  ): WatchHistoryItem | undefined => {
    return get().watchHistory.find(
      (h) => h.contentId === contentId && h.contentType === contentType
    );
  },

  clearHistory: () => {
    set({ watchHistory: [], lastFetched: null });
  },
}));
