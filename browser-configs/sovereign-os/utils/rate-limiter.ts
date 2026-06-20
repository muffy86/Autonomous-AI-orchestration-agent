# Rate Limiter
# Prevent abuse and ensure fair usage

export class RateLimiter {
  private limits: Map<string, any> = new Map();
  private requests: Map<string, number[]> = new Map();

  constructor(private defaultLimits: any = {}) {
    // Default limits
    this.defaultLimits = {
      chat: { requests: 60, window: 60000 }, // 60 per minute
      search: { requests: 30, window: 60000 }, // 30 per minute
      command: { requests: 20, window: 60000 }, // 20 per minute
      workflow: { requests: 10, window: 60000 }, // 10 per minute
      ...defaultLimits
    };
  }

  // Check if request is allowed
  async check(clientId: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `${clientId}:${endpoint}`;
    const limit = this.defaultLimits[endpoint] || { requests: 100, window: 60000 };

    // Get request history
    const now = Date.now();
    let history = this.requests.get(key) || [];

    // Remove old requests
    history = history.filter(timestamp => now - timestamp < limit.window);

    // Check limit
    if (history.length >= limit.requests) {
      const oldestRequest = Math.min(...history);
      const resetIn = limit.window - (now - oldestRequest);

      return {
        allowed: false,
        remaining: 0,
        resetIn
      };
    }

    // Add new request
    history.push(now);
    this.requests.set(key, history);

    return {
      allowed: true,
      remaining: limit.requests - history.length,
      resetIn: limit.window
    };
  }

  // Set custom limit for client
  setLimit(clientId: string, endpoint: string, requests: number, window: number) {
    this.limits.set(`${clientId}:${endpoint}`, { requests, window });
  }

  // Clear history for client
  clear(clientId: string) {
    const keys = Array.from(this.requests.keys()).filter(k => k.startsWith(clientId));
    for (const key of keys) {
      this.requests.delete(key);
    }
  }

  // Get stats
  getStats(clientId: string) {
    const stats: any = {};
    
    for (const [key, history] of this.requests) {
      if (key.startsWith(clientId)) {
        const endpoint = key.split(':')[1];
        const limit = this.defaultLimits[endpoint] || { requests: 100, window: 60000 };
        
        stats[endpoint] = {
          used: history.length,
          limit: limit.requests,
          window: limit.window,
          remaining: limit.requests - history.length
        };
      }
    }

    return stats;
  }
}

export default RateLimiter;
