import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    return NextResponse.json({
      success: true,
      content: authResult.user.searchHistory,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in getSearchHistory API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
