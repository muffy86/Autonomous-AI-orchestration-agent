import { RateLimiter } from '@/lib/security';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting configurations for different API endpoints
 */
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  
  // File upload - moderate limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
  },
  
  // Chat/messaging - generous limits
  chat: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
  },
  
  // API read operations - generous limits
  read: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  
  // API write operations - moderate limits
  write: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
  },
} as const;

/**
 * Apply rate limiting to an API route
 * Returns null if allowed, or a Response with 429 status if rate limit exceeded
 */
export async function applyRateLimit(
  request: NextRequest,
  endpoint: keyof typeof rateLimitConfigs,
): Promise<NextResponse | null> {
  // Get identifier (IP address or user ID from session)
  const identifier = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const config = rateLimitConfigs[endpoint];
  const result = RateLimiter.check(identifier, endpoint, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      },
    );
  }

  return null;
}

/**
 * Middleware-style rate limiter that wraps route handlers
 */
export function withRateLimit<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  endpoint: keyof typeof rateLimitConfigs,
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const rateLimitResponse = await applyRateLimit(request, endpoint);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request, ...args);
  }) as T;
}
