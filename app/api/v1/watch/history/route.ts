import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';
import type { WatchHistoryItem } from '@/types/watchHistory';

// GET - Get continue watching list
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

    // Sort by lastWatched date (most recent first) and limit to 20
    const watchHistory = (user.watchHistory as WatchHistoryItem[])
      .sort(
        (a: WatchHistoryItem, b: WatchHistoryItem) =>
          new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
      )
      .slice(0, 20)
      .filter((item: WatchHistoryItem) => {
        // Only include items that are not completed (less than 90% watched)
        const progress =
          item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
        return progress < 90;
      });

    return NextResponse.json({
      success: true,
      watchHistory,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in getWatchHistory API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Save or update watch progress
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    const {
      contentId,
      contentType,
      title,
      posterPath,
      backdropPath,
      currentTime,
      duration,
      seasonNumber,
      episodeNumber,
    } = body;

    if (!contentId || !contentType || !title) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if item already exists in watch history
    const existingIndex = (user.watchHistory as WatchHistoryItem[]).findIndex(
      (item: WatchHistoryItem) =>
        item.contentId === contentId &&
        item.contentType === contentType &&
        (contentType === 'movie' ||
          (item.seasonNumber === seasonNumber &&
            item.episodeNumber === episodeNumber))
    );

    const watchItem = {
      contentId,
      contentType,
      title,
      posterPath: posterPath || null,
      backdropPath: backdropPath || null,
      currentTime: currentTime || 0,
      duration: duration || 0,
      lastWatched: new Date(),
      ...(contentType === 'tv' && { seasonNumber, episodeNumber }),
    };

    if (existingIndex >= 0) {
      // Update existing item
      user.watchHistory[existingIndex] = watchItem;
    } else {
      // Add new item
      user.watchHistory.push(watchItem);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Watch progress saved',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in saveWatchProgress API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from watch history
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json(
        { success: false, message: 'Missing contentId or contentType' },
        { status: 400 }
      );
    }

    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    user.watchHistory = (user.watchHistory as WatchHistoryItem[]).filter(
      (item: WatchHistoryItem) =>
        !(
          item.contentId.toString() === contentId &&
          item.contentType === contentType
        )
    ) as unknown as typeof user.watchHistory;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Removed from watch history',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in deleteWatchHistory API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
