import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import { fetchFromTMDB } from '@/lib/tmdb';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { query } = await params;
    const decodedQuery = decodeURIComponent(query);

    // Fetch multi-search results from TMDB (searches across movies, TV shows, and people)
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(decodedQuery)}&include_adult=false&language=en-US&page=1`
    );

    // Return results immediately (non-blocking)
    const searchResults = response.results || [];

    // Save search history asynchronously (non-blocking)
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      let searchType: 'movie' | 'tv' | 'person' = 'movie';
      let title = '';
      let image = '';

      // Determine search type and extract relevant data
      if (firstResult.media_type === 'movie') {
        searchType = 'movie';
        title = firstResult.title || '';
        image = firstResult.poster_path || '';
      } else if (firstResult.media_type === 'tv') {
        searchType = 'tv';
        title = firstResult.name || '';
        image = firstResult.poster_path || '';
      } else if (firstResult.media_type === 'person') {
        searchType = 'person';
        title = firstResult.name || '';
        image = firstResult.profile_path || '';
      }

      // Don't await - fire and forget
      connectDB()
        .then(() => {
          return User.findByIdAndUpdate(
            authResult.user._id,
            {
              $push: {
                searchHistory: {
                  $each: [
                    {
                      id: firstResult.id,
                      image,
                      title,
                      searchType,
                      createdAt: new Date(),
                    },
                  ],
                  $slice: -20, // Keep only last 20 items
                },
              },
            },
            { new: true }
          );
        })
        .catch((error) => {
          // Silent fail - don't interrupt search experience
          const err = error as { message?: string };
          console.error('Error saving search history:', err.message);
        });
    }

    if (searchResults.length === 0) {
      return NextResponse.json({ success: true, content: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, content: searchResults });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in unified search API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
