'use client';

import { create } from 'zustand';
import axios from 'axios';

interface SearchHistoryItem {
  id: number;
  title: string;
  searchType: 'movie' | 'tv' | 'person';
  image?: string;
  createdAt?: string;
}

interface SearchHistoryState {
  searchHistory: SearchHistoryItem[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchSearchHistory: (force?: boolean) => Promise<void>;
  clearHistory: () => void;
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

export const useSearchHistoryStore = create<SearchHistoryState>((set, get) => ({
  searchHistory: [],
  isLoading: false,
  lastFetched: null,

  fetchSearchHistory: async (force = false) => {
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
      const res = await axios.get('/api/v1/search/history', {
        withCredentials: true,
      });
      set({
        searchHistory: res.data.content?.slice(0, 5) || [],
        lastFetched: Date.now(),
        isLoading: false,
      });
    } catch (_error) {
      set({ isLoading: false });
      // Silent fail
    }
  },

  clearHistory: () => {
    set({ searchHistory: [], lastFetched: null });
  },
}));
