import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js proxy to handle CORS for all API routes
 * This ensures CORS headers are set correctly when credentials are used
 */
export function proxy(request: NextRequest) {
  // Only handle API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight(request);
  }

  // For actual requests, we'll add CORS headers in the route handlers
  // This proxy just handles preflight
  return NextResponse.next();
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
function handleCorsPreflight(req: NextRequest): NextResponse {
  const origin = getOrigin(req);

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Get the origin from the request, defaulting to localhost for development
 */
function getOrigin(req: NextRequest): string {
  const origin = req.headers.get('origin');

  // In development, allow localhost origins
  if (process.env.NODE_ENV === 'development') {
    if (
      origin &&
      (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ) {
      return origin;
    }
    // Default to localhost:3000 for development
    return 'http://localhost:3000';
  }

  // In production, use the origin from the request or fallback to environment variable
  if (origin) {
    return origin;
  }

  // Fallback to environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export const config = {
  matcher: '/api/:path*',
};
