import { NextRequest, NextResponse } from 'next/server';
import { getTitleSourcesByTMDB } from '@/lib/watchmode';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('type') as 'movie' | 'tv' | null;
    const regions = searchParams.get('regions') || 'US';

    if (!contentType || (contentType !== 'movie' && contentType !== 'tv')) {
      return NextResponse.json(
        { success: false, message: 'Invalid content type. Must be "movie" or "tv"' },
        { status: 400 }
      );
    }

    const sources = await getTitleSourcesByTMDB(parseInt(id), contentType, regions);

    return NextResponse.json({
      success: true,
      sources,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching Watchmode sources:', err.message);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch streaming sources' },
      { status: 500 }
    );
  }
}

