import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';
import { RateLimiter, rateLimitConfig, applySecurityHeaders, isTrustedOrigin } from './lib/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply security headers to all responses
  applySecurityHeaders(response.headers);

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    const pingResponse = new Response('pong', { status: 200 });
    applySecurityHeaders(pingResponse.headers);
    return pingResponse;
  }

  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';

  // Apply rate limiting based on route
  let rateLimitResult: { allowed: boolean; remaining: number; resetTime: number } | undefined;
  
  if (pathname.startsWith('/api/auth')) {
    rateLimitResult = RateLimiter.check(clientIP, 'auth', rateLimitConfig.auth);
  } else if (pathname.startsWith('/api/chat')) {
    rateLimitResult = RateLimiter.check(clientIP, 'chat', rateLimitConfig.chat);
  } else if (pathname.startsWith('/api/files/upload')) {
    rateLimitResult = RateLimiter.check(clientIP, 'upload', rateLimitConfig.upload);
  } else if (pathname.startsWith('/api')) {
    rateLimitResult = RateLimiter.check(clientIP, 'api', rateLimitConfig.api);
  }

  // Check rate limit
  if (rateLimitResult && !rateLimitResult.allowed) {
    const rateLimitResponse = new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitConfig.api.max.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    );
    
    applySecurityHeaders(rateLimitResponse.headers);
    return rateLimitResponse;
  }

  // Add rate limit headers to successful responses
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Limit', rateLimitConfig.api.max.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  }

  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // Check for trusted origin
    if (!isTrustedOrigin(request)) {
      const csrfResponse = new NextResponse(
        JSON.stringify({
          error: 'CSRF protection',
          message: 'Request from untrusted origin',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      applySecurityHeaders(csrfResponse.headers);
      return csrfResponse;
    }
  }

  if (pathname.startsWith('/api/auth')) {
    return response;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    const redirectResponse = NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
    applySecurityHeaders(redirectResponse.headers);
    return redirectResponse;
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    applySecurityHeaders(redirectResponse.headers);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
