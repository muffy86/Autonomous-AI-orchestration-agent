'use client';

import { useEffect } from 'react';
import { PerformanceMonitor, analyzeBundleSize } from '@/lib/performance';

/**
 * Performance monitoring component that tracks Web Vitals and custom metrics
 */
export function PerformanceMonitorComponent() {
  useEffect(() => {
    // Initialize performance monitoring
    const monitor = PerformanceMonitor.getInstance();

    // Analyze bundle size in development
    if (process.env.NODE_ENV === 'development') {
      // Delay to ensure all scripts are loaded
      setTimeout(() => {
        analyzeBundleSize();
      }, 2000);
    }

    // Track page load performance
    if (typeof window !== 'undefined') {
      // Mark page load start
      monitor.mark('page-load-start');

      // Track when page is fully loaded
      const handleLoad = () => {
        monitor.mark('page-load-end');
        monitor.measure('page-load-time', 'page-load-start', 'page-load-end');

        // Report memory usage if available
        const memory = monitor.getMemoryUsage();
        if (memory && process.env.NODE_ENV === 'development') {
          console.log('[Performance] Memory Usage:', {
            used: `${(memory.used / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memory.total / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memory.limit / 1024 / 1024).toFixed(2)} MB`,
          });
        }
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad, { once: true });
      }

      // Clean up on unmount
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Hook for tracking AI operation performance
 */
export function useAIPerformanceTracking() {
  const trackOperation = (operation: string) => {
    const { AIPerformanceTracker } = require('@/lib/performance');
    return {
      start: () => AIPerformanceTracker.startTracking(operation),
      end: (id: string) => AIPerformanceTracker.endTracking(id, operation),
    };
  };

  return { trackOperation };
}

/**
 * Development-only performance dashboard
 */
export function PerformanceDashboard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Add performance dashboard to window for debugging
    (window as any).__performanceDashboard = {
      getAIMetrics: () => {
        const { AIPerformanceTracker } = require('@/lib/performance');
        return AIPerformanceTracker.getAllMetrics();
      },
      getMemoryUsage: () => {
        const monitor = PerformanceMonitor.getInstance();
        return monitor.getMemoryUsage();
      },
      analyzeBundleSize,
    };

    console.log(
      '🚀 Performance Dashboard available at window.__performanceDashboard',
    );
  }, []);

  return null;
}
