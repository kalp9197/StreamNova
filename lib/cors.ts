import { NextRequest, NextResponse } from 'next/server';

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

/**
 * Add CORS headers to a response
 * When credentials are used, we must specify the exact origin (not wildcard)
 */
export function addCorsHeaders(
  req: NextRequest,
  response: NextResponse
): NextResponse {
  const origin = getOrigin(req);

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPreflight(req: NextRequest): NextResponse {
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
