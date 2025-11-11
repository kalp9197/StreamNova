import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { fetchFromTMDB } from '@/lib/tmdb';

// GET - Get all favorites
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const favorites =
      (user.favorites as Array<{
        contentId: number;
        contentType: 'movie' | 'tv';
        title: string;
        posterPath?: string | null;
        backdropPath?: string | null;
        addedAt: Date;
      }>) || [];

    // Enrich favorites with missing titles from TMDB
    const enrichedFavorites = await Promise.all(
      favorites.map(async (item) => {
        // If title is missing or empty, fetch from TMDB
        if (!item.title || item.title.trim() === '') {
          try {
            const endpoint =
              item.contentType === 'movie'
                ? `https://api.themoviedb.org/3/movie/${item.contentId}?language=en-US`
                : `https://api.themoviedb.org/3/tv/${item.contentId}?language=en-US`;

            const tmdbData = await fetchFromTMDB(endpoint);
            const title = tmdbData.title || tmdbData.name || 'Untitled';

            // Update the database with fetched title
            const favoriteIndex = user.favorites.findIndex(
              (f) =>
                f.contentId === item.contentId &&
                f.contentType === item.contentType
            );

            if (favoriteIndex >= 0) {
              const updatedFavorite = {
                ...user.favorites[favoriteIndex],
                title,
                posterPath:
                  user.favorites[favoriteIndex].posterPath ||
                  tmdbData.poster_path ||
                  null,
                backdropPath:
                  user.favorites[favoriteIndex].backdropPath ||
                  tmdbData.backdrop_path ||
                  null,
              };
              user.favorites[favoriteIndex] =
                updatedFavorite as (typeof user.favorites)[0];
            }

            // Update the item with fetched title
            return {
              ...item,
              title,
              // Also update poster/backdrop if missing
              posterPath: item.posterPath || tmdbData.poster_path || null,
              backdropPath: item.backdropPath || tmdbData.backdrop_path || null,
            };
          } catch (error) {
            // If TMDB fetch fails, return item with fallback title
            console.error(
              `Failed to fetch title for ${item.contentType} ${item.contentId}:`,
              error
            );
            return {
              ...item,
              title: item.title || 'Untitled',
            };
          }
        }
        return item;
      })
    );

    // Save updated favorites to database if any were enriched
    const hasUpdates = enrichedFavorites.some(
      (enriched, index) =>
        (!favorites[index].title || favorites[index].title.trim() === '') &&
        enriched.title !== 'Untitled'
    );

    if (hasUpdates) {
      try {
        await user.save();
      } catch (saveError) {
        // Log but don't fail the request if save fails
        console.error('Failed to save enriched favorites:', saveError);
      }
    }

    // Convert dates to ISO strings for JSON serialization
    const favoritesWithDates = enrichedFavorites.map((item) => ({
      ...item,
      addedAt:
        item.addedAt instanceof Date
          ? item.addedAt.toISOString()
          : item.addedAt,
    }));

    return NextResponse.json({
      success: true,
      favorites: favoritesWithDates,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in getFavorites API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
