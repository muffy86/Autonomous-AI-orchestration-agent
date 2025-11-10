/**
 * Performance monitoring utilities for the AI Chatbot application
 */

// Web Vitals tracking
export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

/**
 * Get performance rating based on metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals metrics
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
  
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics service (e.g., Vercel Analytics, Google Analytics, etc.)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta,
        },
      });
    }
  }
}

/**
 * Performance observer for custom metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  
  private constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private initializeObservers() {
    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.reportNavigationMetrics(navEntry);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (e) {
      console.warn('Navigation timing observer not supported');
    }
    
    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.reportResourceMetrics(entry as PerformanceResourceTiming);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource timing observer not supported');
    }
    
    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.reportLongTask(entry);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('Long task observer not supported');
    }
  }
  
  private reportNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.connectEnd - entry.secureConnectionStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParse: entry.domContentLoadedEventStart - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Navigation Metrics:', metrics);
    }
  }
  
  private reportResourceMetrics(entry: PerformanceResourceTiming) {
    // Only report slow resources (>1s)
    if (entry.duration > 1000) {
      const resourceData = {
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        type: this.getResourceType(entry.name),
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Performance] Slow Resource:', resourceData);
      }
    }
  }
  
  private reportLongTask(entry: PerformanceEntry) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Performance] Long Task:', {
        duration: entry.duration,
        startTime: entry.startTime,
      });
    }
  }
  
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }
  
  /**
   * Measure custom performance marks
   */
  mark(name: string) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }
  
  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
        }
        
        return measure.duration;
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e);
      }
    }
    return 0;
  }
  
  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }
  
  /**
   * Clean up observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Bundle analyzer helper
 */
export function analyzeBundleSize() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Estimate bundle size from loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('/_next/static/')) {
        // Estimate size from resource timing if available
        const resourceEntry = performance.getEntriesByName(src)[0] as PerformanceResourceTiming;
        if (resourceEntry?.transferSize) {
          totalSize += resourceEntry.transferSize;
        }
      }
    });
    
    console.log(`[Performance] Estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    return totalSize;
  }
  return 0;
}

/**
 * AI-specific performance tracking
 */
const aiMetrics: Map<string, number[]> = new Map();

export const AIPerformanceTracker = {
  startTracking(operation: string): string {
    const id = `${operation}-${Date.now()}-${Math.random()}`;
    const startTime = performance.now();
    
    if (!aiMetrics.has(operation)) {
      aiMetrics.set(operation, []);
    }
    
    // Store start time temporarily
    (globalThis as any)[`perf_${id}`] = startTime;
    
    return id;
  },
  
  endTracking(id: string, operation: string) {
    const startTime = (globalThis as any)[`perf_${id}`];
    if (!startTime) return;
    
    const duration = performance.now() - startTime;
    const metrics = aiMetrics.get(operation) || [];
    metrics.push(duration);
    aiMetrics.set(operation, metrics);
    
    // Clean up
    delete (globalThis as any)[`perf_${id}`];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Performance] ${operation}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  },
  
  getMetrics(operation: string) {
    const metrics = aiMetrics.get(operation) || [];
    if (metrics.length === 0) return null;
    
    const sorted = [...metrics].sort((a, b) => a - b);
    return {
      count: metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },
  
  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const [operation, _] of aiMetrics) {
      result[operation] = AIPerformanceTracker.getMetrics(operation);
    }
    return result;
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  PerformanceMonitor.getInstance();
}