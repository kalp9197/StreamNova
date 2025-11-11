'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { cachedGet, cachedPost, cachedDelete } from '@/lib/apiClient';

export interface FavoriteItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  addedAt: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchFavorites: (force?: boolean) => Promise<void>;
  addFavorite: (
    contentId: number,
    contentType: 'movie' | 'tv',
    title: string,
    posterPath?: string | null,
    backdropPath?: string | null
  ) => Promise<boolean>;
  removeFavorite: (
    contentId: number,
    contentType: 'movie' | 'tv'
  ) => Promise<boolean>;
  toggleFavorite: (
    contentId: number,
    contentType: 'movie' | 'tv',
    title: string,
    posterPath?: string | null,
    backdropPath?: string | null
  ) => Promise<boolean>;
  isFavorite: (contentId: number, contentType: 'movie' | 'tv') => boolean;
  checkFavorite: (
    contentId: number,
    contentType: 'movie' | 'tv'
  ) => Promise<boolean>;
}

// Cache TTL: 2 minutes
const CACHE_TTL = 2 * 60 * 1000;

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,
  lastFetched: null,

  fetchFavorites: async (force = false) => {
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
      const res = await cachedGet<{
        success: boolean;
        favorites: FavoriteItem[];
      }>('/api/v1/favorites', {
        ttl: CACHE_TTL,
        force,
      });

      set({
        favorites: res.favorites || [],
        lastFetched: Date.now(),
        isLoading: false,
      });
    } catch (_error) {
      set({ isLoading: false });
      // Silent fail - don't interrupt user experience
    }
  },

  addFavorite: async (
    contentId,
    contentType,
    title,
    posterPath,
    backdropPath
  ) => {
    try {
      const res = await cachedPost<{
        success: boolean;
        message: string;
        isFavorite: boolean;
      }>(
        `/api/v1/favorites/${contentId}/${contentType}`,
        {
          title,
          posterPath,
          backdropPath,
        },
        {
          invalidateCache: ['/api/v1/favorites'],
        }
      );

      if (res.success) {
        // Update local state
        const newFavorite: FavoriteItem = {
          contentId,
          contentType,
          title,
          posterPath: posterPath || null,
          backdropPath: backdropPath || null,
          addedAt: new Date().toISOString(),
        };

        set((state) => ({
          favorites: [...state.favorites, newFavorite],
        }));

        toast.success('Added to favorites');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add to favorites');
      return false;
    }
  },

  removeFavorite: async (contentId, contentType) => {
    try {
      const res = await cachedDelete<{
        success: boolean;
        message: string;
        isFavorite: boolean;
      }>(`/api/v1/favorites/${contentId}/${contentType}`, {
        invalidateCache: ['/api/v1/favorites'],
      });

      if (res.success) {
        // Update local state
        set((state) => ({
          favorites: state.favorites.filter(
            (item) =>
              !(
                item.contentId === contentId && item.contentType === contentType
              )
          ),
        }));

        toast.success('Removed from favorites');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || 'Failed to remove from favorites'
      );
      return false;
    }
  },

  toggleFavorite: async (
    contentId,
    contentType,
    title,
    posterPath,
    backdropPath
  ) => {
    const state = get();
    const isCurrentlyFavorite = state.isFavorite(contentId, contentType);

    if (isCurrentlyFavorite) {
      return await state.removeFavorite(contentId, contentType);
    } else {
      return await state.addFavorite(
        contentId,
        contentType,
        title,
        posterPath,
        backdropPath
      );
    }
  },

  isFavorite: (contentId, contentType) => {
    return get().favorites.some(
      (item) => item.contentId === contentId && item.contentType === contentType
    );
  },

  checkFavorite: async (contentId, contentType) => {
    try {
      const res = await cachedGet<{
        success: boolean;
        isFavorite: boolean;
      }>(`/api/v1/favorites/${contentId}/${contentType}`, {
        ttl: 5 * 60 * 1000, // 5 minutes cache
      });

      return res.isFavorite || false;
    } catch (_error) {
      return false;
    }
  },
}));
