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

    // Fetch search results from TMDB
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(decodedQuery)}&include_adult=false&language=en-US&page=1`
    );

    // Return results immediately (non-blocking)
    const searchResults = response.results || [];

    // Save search history asynchronously (non-blocking)
    if (searchResults.length > 0) {
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
                      id: searchResults[0].id,
                      image: searchResults[0].poster_path,
                      title: searchResults[0].title,
                      searchType: 'movie',
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
    console.error('Error in searchMovie API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
