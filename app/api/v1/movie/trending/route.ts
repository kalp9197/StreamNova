import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import { fetchFromTMDB } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const data = await fetchFromTMDB(
      'https://api.themoviedb.org/3/trending/movie/day?language=en-US'
    );
    const randomMovie =
      data.results[Math.floor(Math.random() * data.results?.length)];

    return NextResponse.json({ success: true, content: randomMovie });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in getTrendingMovie API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
