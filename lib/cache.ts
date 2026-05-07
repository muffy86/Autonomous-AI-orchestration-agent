/**
 * Caching utilities for API responses and data
 * Implements in-memory caching with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache with TTL support
 */
class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const globalCache = new Cache();

/**
 * Cache TTL presets (in milliseconds)
 */
export const CacheTTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Cached function wrapper
 * Caches the result of an async function
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CacheTTL.FIVE_MINUTES,
): Promise<T> {
  // Try to get from cache
  const cached = globalCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  globalCache.set(key, result, ttl);
  
  return result;
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  globalCache.delete(key);
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const stats = globalCache.getStats();
  const regex = new RegExp(pattern);
  
  for (const key of stats.keys) {
    if (regex.test(key)) {
      globalCache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    globalCache.destroy();
  });
}

/**
 * Memoization decorator for class methods
 */
export function memoize(ttl: number = CacheTTL.FIVE_MINUTES) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      return cached(cacheKey, () => originalMethod.apply(this, args), ttl);
    };

    return descriptor;
  };
}
