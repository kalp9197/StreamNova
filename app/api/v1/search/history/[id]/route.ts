import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();

    const { id } = await params;
    const parsedId = parseInt(id);

    await User.findByIdAndUpdate(authResult.user._id, {
      $pull: {
        searchHistory: { id: parsedId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from search history',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in removeItemFromSearchHistory API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
