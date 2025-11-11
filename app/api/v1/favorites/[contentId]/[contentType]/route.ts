import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

// GET - Check if content is favorited
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string; contentType: string }> }
) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { contentId, contentType } = await params;

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
        contentType: string;
      }>) || [];
    const isFavorite = favorites.some(
      (item) =>
        item.contentId === parseInt(contentId) &&
        item.contentType === contentType
    );

    return NextResponse.json({
      success: true,
      isFavorite,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in checkFavorite API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Add to favorites
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string; contentType: string }> }
) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { contentId, contentType } = await params;
    const body = await req.json();
    const { title, posterPath, backdropPath } = body;

    if (!contentId || !contentType || !title) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (contentType !== 'movie' && contentType !== 'tv') {
      return NextResponse.json(
        { success: false, message: 'Invalid content type' },
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

    const favorites =
      (user.favorites as Array<{
        contentId: number;
        contentType: string;
        title: string;
        posterPath?: string | null;
        backdropPath?: string | null;
        addedAt: Date;
      }>) || [];
    const existingIndex = favorites.findIndex(
      (item) =>
        item.contentId === parseInt(contentId) &&
        item.contentType === contentType
    );

    if (existingIndex >= 0) {
      return NextResponse.json({
        success: true,
        message: 'Already in favorites',
        isFavorite: true,
      });
    }

    const favoriteItem = {
      contentId: parseInt(contentId),
      contentType: contentType as 'movie' | 'tv',
      title,
      posterPath: posterPath || null,
      backdropPath: backdropPath || null,
      addedAt: new Date(),
    };

    favorites.push(favoriteItem);
    user.favorites = favorites as unknown as typeof user.favorites;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Added to favorites',
      isFavorite: true,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in addFavorite API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from favorites
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string; contentType: string }> }
) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { contentId, contentType } = await params;

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

    const favorites =
      (user.favorites as Array<{
        contentId: number;
        contentType: string;
      }>) || [];
    user.favorites = favorites.filter(
      (item) =>
        !(
          item.contentId.toString() === contentId &&
          item.contentType === contentType
        )
    ) as unknown as typeof user.favorites;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites',
      isFavorite: false,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in removeFavorite API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
