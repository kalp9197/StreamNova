import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, handleCorsPreflight } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.delete('jwt-netflix');

    return addCorsHeaders(req, response);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in logout API:', err.message);
    const errorResponse = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(req, errorResponse);
  }
}
