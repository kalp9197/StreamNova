import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import { fetchFromTMDB } from '@/lib/tmdb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { category } = await params;

    // Validate category parameter
    const validCategories = ['popular', 'top_rated', 'upcoming', 'now_playing'];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category' },
        { status: 400 }
      );
    }

    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${category}?language=en-US&page=1`
    );

    return NextResponse.json({ success: true, content: data.results || [] });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message?.includes('404')) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }
    if (err.message?.includes('400')) {
      return NextResponse.json(
        { success: false, message: 'Invalid request' },
        { status: 400 }
      );
    }
    console.log('Error in getMoviesByCategory API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
