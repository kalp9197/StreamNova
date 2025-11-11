import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import { fetchFromTMDB } from '@/lib/tmdb';
import { addCorsHeaders, handleCorsPreflight } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      const errorResponse = NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const { id, seasonNumber } = await params;

    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?language=en-US`
    );

    const response = NextResponse.json({ success: true, content: data });
    return addCorsHeaders(req, response);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message?.includes('404')) {
      const notFoundResponse = new NextResponse(null, { status: 404 });
      return addCorsHeaders(req, notFoundResponse);
    }
    console.log('Error in getSeasonDetails API:', err.message);
    const errorResponse = NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
    return addCorsHeaders(req, errorResponse);
  }
}
