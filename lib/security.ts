/**
 * Security utilities and validation functions
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
export const rateLimitConfig = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.',
  },
  // Chat endpoints
  chat: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 chat requests per minute
    message: 'Too many chat requests, please slow down.',
  },
  // File upload endpoints
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 uploads per 5 minutes
    message: 'Too many file uploads, please try again later.',
  },
};

// Input validation schemas
export const securitySchemas = {
  // Email validation with additional security checks
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must not exceed 254 characters')
    .refine((email) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /[<>]/,  // HTML tags
        /javascript:/i,  // JavaScript protocol
        /data:/i,  // Data protocol
        /vbscript:/i,  // VBScript protocol
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(email));
    }, 'Email contains invalid characters'),

  // Password validation with strength requirements
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .refine((password) => {
      // Check for at least one uppercase letter
      return /[A-Z]/.test(password);
    }, 'Password must contain at least one uppercase letter')
    .refine((password) => {
      // Check for at least one lowercase letter
      return /[a-z]/.test(password);
    }, 'Password must contain at least one lowercase letter')
    .refine((password) => {
      // Check for at least one number
      return /\d/.test(password);
    }, 'Password must contain at least one number')
    .refine((password) => {
      // Check for at least one special character
      return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    }, 'Password must contain at least one special character'),

  // Chat message validation
  chatMessage: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must not exceed 4000 characters')
    .refine((message) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,  // Script tags
        /javascript:/i,  // JavaScript protocol
        /data:text\/html/i,  // HTML data URLs
        /vbscript:/i,  // VBScript protocol
        /on\w+\s*=/i,  // Event handlers
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(message));
    }, 'Message contains potentially unsafe content'),

  // File upload validation
  fileUpload: z.object({
    name: z
      .string()
      .min(1, 'Filename cannot be empty')
      .max(255, 'Filename must not exceed 255 characters')
      .refine((name) => {
        // Check for safe file extensions
        const allowedExtensions = /\.(jpg|jpeg|png|gif|pdf|txt|md|json)$/i;
        return allowedExtensions.test(name);
      }, 'File type not allowed')
      .refine((name) => {
        // Check for suspicious patterns in filename
        const suspiciousPatterns = [
          /\.\./,  // Directory traversal
          /[<>:"|?*]/,  // Invalid filename characters
        ];
        
        // Check for Windows reserved names (base name without extension)
        const baseName = name.split('.')[0];
        const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
        
        return !suspiciousPatterns.some(pattern => pattern.test(name)) && 
               !reservedNames.test(baseName);
      }, 'Filename contains invalid characters'),
    size: z
      .number()
      .min(1, 'File cannot be empty')
      .max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
    type: z
      .string()
      .refine((type) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/json',
        ];
        return allowedTypes.includes(type);
      }, 'File type not allowed'),
  }),

  // UUID validation
  uuid: z
    .string()
    .uuid('Invalid UUID format'),

  // URL validation with security checks
  url: z
    .string()
    .url('Invalid URL format')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        // Only allow HTTP and HTTPS protocols
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'URL must use HTTP or HTTPS protocol')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        // Block localhost and private IP ranges in production
        if (process.env.NODE_ENV === 'production') {
          const hostname = parsed.hostname.toLowerCase();
          const privateRanges = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            '::1',
          ];
          return !privateRanges.includes(hostname) && 
                 !hostname.startsWith('192.168.') &&
                 !hostname.startsWith('10.') &&
                 !hostname.match(/^172\.(1[6-9]|2\d|3[01])\./);
        }
        return true;
      } catch {
        return false;
      }
    }, 'URL points to restricted address'),
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize text content for safe display
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>&"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return entities[char] || char;
    });
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomArray);
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(randomArray);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      randomArray[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  sanitize = true
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    
    if (sanitize && typeof validated === 'string') {
      return { success: true, data: sanitizeText(validated) as T };
    }
    
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Check if request is from a trusted origin
 */
export function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  const trustedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean);
  
  if (origin && trustedOrigins.includes(origin)) {
    return true;
  }
  
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return trustedOrigins.some(trusted => {
        if (!trusted) return false;
        const trustedUrl = new URL(trusted);
        return refererUrl.origin === trustedUrl.origin;
      });
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; '),
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * Rate limiting for API routes
 */
const rateLimiterInstances: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();

export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: { windowMs: number; max: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  
  if (!rateLimiterInstances.has(endpoint)) {
    rateLimiterInstances.set(endpoint, new Map());
  }
  
  const endpointLimits = rateLimiterInstances.get(endpoint);
  if (!endpointLimits) {
    throw new Error('Failed to get endpoint limits');
  }
  const userLimit = endpointLimits.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    endpointLimits.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  if (userLimit.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userLimit.resetTime,
    };
  }
  
  userLimit.count++;
  return {
    allowed: true,
    remaining: config.max - userLimit.count,
    resetTime: userLimit.resetTime,
  };
}

export function cleanupRateLimiter(): void {
  const now = Date.now();
  
  for (const [endpoint, limits] of rateLimiterInstances) {
    for (const [identifier, limit] of limits) {
      if (now > limit.resetTime) {
        limits.delete(identifier);
      }
    }
    
    if (limits.size === 0) {
      rateLimiterInstances.delete(endpoint);
    }
  }
}

// Cleanup rate limiter every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupRateLimiter();
  }, 5 * 60 * 1000);
}