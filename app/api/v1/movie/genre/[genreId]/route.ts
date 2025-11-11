import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import { fetchFromTMDB } from '@/lib/tmdb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ genreId: string }> }
) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { genreId } = await params;
    const genreIdNum = parseInt(genreId, 10);

    if (isNaN(genreIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid genre ID' },
        { status: 400 }
      );
    }

    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/discover/movie?with_genres=${genreIdNum}&language=en-US&page=1&sort_by=popularity.desc`
    );

    return NextResponse.json({ success: true, content: data.results });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in getMoviesByGenre API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
