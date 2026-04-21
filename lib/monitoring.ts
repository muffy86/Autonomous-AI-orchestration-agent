/**
 * Performance Monitoring and Metrics Collection
 * Automatically tracks system performance
 */

import { logger } from './logger';

interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  slowRequests: number;
  activeRequests: number;
  peakMemoryUsage: number;
  averageResponseTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    slowRequests: 0,
    activeRequests: 0,
    peakMemoryUsage: 0,
    averageResponseTime: 0,
  };

  private slowRequestThreshold = 1000; // 1 second
  private startTime = Date.now();

  // Track a request
  startRequest(): () => void {
    this.metrics.activeRequests++;
    this.metrics.requestCount++;
    const start = Date.now();

    // Return cleanup function
    return () => {
      const duration = Date.now() - start;
      this.metrics.activeRequests--;
      this.metrics.totalResponseTime += duration;
      this.metrics.averageResponseTime = 
        this.metrics.totalResponseTime / this.metrics.requestCount;

      if (duration > this.slowRequestThreshold) {
        this.metrics.slowRequests++;
        logger.warn('Slow request detected', {
          duration: `${duration}ms`,
          threshold: `${this.slowRequestThreshold}ms`,
        });
      }

      // Track memory
      const memUsage = process.memoryUsage().heapUsed;
      if (memUsage > this.metrics.peakMemoryUsage) {
        this.metrics.peakMemoryUsage = memUsage;
      }
    };
  }

  // Track an error
  recordError(error: Error, context?: Record<string, any>) {
    this.metrics.errorCount++;
    logger.error('Application error', error, context);
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics & { uptime: number; errorRate: number } {
    return {
      ...this.metrics,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      errorRate: this.metrics.requestCount > 0 
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
        : 0,
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      slowRequests: 0,
      activeRequests: 0,
      peakMemoryUsage: 0,
      averageResponseTime: 0,
    };
    this.startTime = Date.now();
    logger.info('Performance metrics reset');
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics();
    const memoryMB = Math.round(metrics.peakMemoryUsage / 1024 / 1024);
    
    return `
Performance Report
==================
Uptime: ${metrics.uptime}s
Total Requests: ${metrics.requestCount}
Active Requests: ${metrics.activeRequests}
Errors: ${metrics.errorCount} (${metrics.errorRate.toFixed(2)}%)
Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
Slow Requests: ${metrics.slowRequests}
Peak Memory: ${memoryMB}MB
    `.trim();
  }

  // Start automatic reporting
  startAutoReporting(intervalMinutes = 15) {
    setInterval(() => {
      logger.info('Automatic performance report', {
        report: this.generateReport(),
      });
    }, intervalMinutes * 60 * 1000);
    
    logger.info('Auto-reporting started', {
      interval: `${intervalMinutes} minutes`,
    });
  }
}

// Export singleton
export const performanceMonitor = new PerformanceMonitor();

// Helper function to wrap async functions with monitoring
export function monitored<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  return (async (...args: any[]) => {
    const endRequest = performanceMonitor.startRequest();
    const fnName = name || fn.name || 'anonymous';
    
    try {
      logger.debug(`Starting: ${fnName}`);
      const result = await fn(...args);
      logger.debug(`Completed: ${fnName}`);
      return result;
    } catch (error) {
      performanceMonitor.recordError(
        error as Error,
        { function: fnName, args }
      );
      throw error;
    } finally {
      endRequest();
    }
  }) as T;
}
