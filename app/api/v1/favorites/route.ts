import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

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

    // Convert dates to ISO strings for JSON serialization
    const favoritesWithDates = favorites.map((item) => ({
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
