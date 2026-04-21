/**
 * Advanced Observability & Monitoring
 * Metrics, tracing, logging, and performance monitoring
 */

import { nanoid } from 'nanoid';

// ============================================================================
// Distributed Tracing
// ============================================================================

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; message: string; level: string }>;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export class DistributedTracer {
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();

  startSpan(
    operationName: string,
    parentSpanId?: string,
    tags?: Record<string, any>
  ): Span {
    const span: Span = {
      traceId: parentSpanId 
        ? this.activeSpans.get(parentSpanId)?.traceId || nanoid()
        : nanoid(),
      spanId: nanoid(),
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: tags || {},
      logs: [],
      status: 'pending',
    };

    this.spans.set(span.spanId, span);
    this.activeSpans.set(span.spanId, span);

    return span;
  }

  endSpan(spanId: string, status: 'success' | 'error' = 'success', error?: string): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.error = error;

    this.activeSpans.delete(spanId);

    // In production: Export to tracing backend
    // - Jaeger
    // - Zipkin
    // - AWS X-Ray
    // - Google Cloud Trace
    this.exportSpan(span);
  }

  addLog(spanId: string, message: string, level: string = 'info'): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.logs.push({
      timestamp: Date.now(),
      message,
      level,
    });
  }

  addTag(spanId: string, key: string, value: any): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.tags[key] = value;
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getTrace(traceId: string): Span[] {
    return Array.from(this.spans.values()).filter(
      (span) => span.traceId === traceId
    );
  }

  private exportSpan(span: Span): void {
    // In production: Send to tracing backend
    console.log('[TRACE]', {
      trace_id: span.traceId,
      span_id: span.spanId,
      operation: span.operationName,
      duration: span.duration,
      status: span.status,
    });
  }

  getMetrics() {
    const allSpans = Array.from(this.spans.values());
    const completedSpans = allSpans.filter((s) => s.endTime);

    return {
      totalSpans: allSpans.length,
      activeSpans: this.activeSpans.size,
      completedSpans: completedSpans.length,
      averageDuration:
        completedSpans.length > 0
          ? completedSpans.reduce((sum, s) => sum + (s.duration || 0), 0) /
            completedSpans.length
          : 0,
      errorRate:
        completedSpans.length > 0
          ? (completedSpans.filter((s) => s.status === 'error').length /
              completedSpans.length) *
            100
          : 0,
    };
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export class PerformanceMonitor {
  private measurements: Map<string, Array<{
    duration: number;
    timestamp: number;
    tags?: Record<string, any>;
  }>> = new Map();

  measure<T>(
    operation: string,
    fn: () => T | Promise<T>,
    tags?: Record<string, any>
  ): T | Promise<T> {
    const start = Date.now();

    const recordMetric = (duration: number) => {
      const measurements = this.measurements.get(operation) || [];
      measurements.push({ duration, timestamp: Date.now(), tags });
      
      // Keep last 1000 measurements
      if (measurements.length > 1000) {
        measurements.shift();
      }
      
      this.measurements.set(operation, measurements);
    };

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.then(
          (value) => {
            recordMetric(Date.now() - start);
            return value;
          },
          (error) => {
            recordMetric(Date.now() - start);
            throw error;
          }
        ) as T;
      }

      recordMetric(Date.now() - start);
      return result;
    } catch (error) {
      recordMetric(Date.now() - start);
      throw error;
    }
  }

  getStats(operation: string) {
    const measurements = this.measurements.get(operation) || [];
    
    if (measurements.length === 0) {
      return null;
    }

    const durations = measurements.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      avg: sum / durations.length,
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const [operation, _] of this.measurements) {
      stats[operation] = this.getStats(operation);
    }
    
    return stats;
  }

  reset(operation?: string): void {
    if (operation) {
      this.measurements.delete(operation);
    } else {
      this.measurements.clear();
    }
  }
}

// ============================================================================
// Structured Logging
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  traceId?: string;
  spanId?: string;
}

export class StructuredLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private minLevel: LogLevel = LogLevel.INFO;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...context, error: error?.stack });
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, { ...context, error: error?.stack });
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
    };

    this.logs.push(entry);

    // Maintain size limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const levelName = LogLevel[level];
    const logMethod = level >= LogLevel.ERROR ? console.error : 
                      level >= LogLevel.WARN ? console.warn : console.log;
    
    logMethod(`[${levelName}] ${message}`, context || '');

    // In production: Export to logging service
    // - CloudWatch Logs
    // - Elasticsearch
    // - Splunk
    // - Datadog
    if (process.env.NODE_ENV === 'production') {
      this.exportLog(entry);
    }
  }

  private exportLog(entry: LogEntry): void {
    // In production: Send to logging backend
    // Example: JSON to stdout for container logging
    console.log(JSON.stringify({
      timestamp: new Date(entry.timestamp).toISOString(),
      level: LogLevel[entry.level],
      message: entry.message,
      ...entry.context,
    }));
  }

  query(filters: {
    level?: LogLevel;
    since?: number;
    search?: string;
  }): LogEntry[] {
    let results = [...this.logs];

    if (filters.level !== undefined) {
      results = results.filter((log) => log.level >= filters.level!);
    }

    if (filters.since) {
      results = results.filter((log) => log.timestamp >= filters.since!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.context).toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  clear(): void {
    this.logs = [];
  }
}

// ============================================================================
// Application Performance Monitoring (APM)
// ============================================================================

export class APMMonitor {
  private tracer: DistributedTracer;
  private perfMonitor: PerformanceMonitor;
  private logger: StructuredLogger;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.tracer = new DistributedTracer();
    this.perfMonitor = new PerformanceMonitor();
    this.logger = new StructuredLogger();
    this.metricsCollector = new MetricsCollector();
  }

  async trace<T>(
    operation: string,
    fn: () => Promise<T>,
    tags?: Record<string, any>
  ): Promise<T> {
    const span = this.tracer.startSpan(operation, undefined, tags);
    
    try {
      const result = await this.perfMonitor.measure(operation, fn, tags);
      this.tracer.endSpan(span.spanId, 'success');
      this.metricsCollector.increment(`${operation}.success`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.tracer.endSpan(span.spanId, 'error', errorMessage);
      this.metricsCollector.increment(`${operation}.error`);
      this.logger.error(`Operation ${operation} failed`, error as Error, tags);
      throw error;
    }
  }

  getTracer(): DistributedTracer {
    return this.tracer;
  }

  getPerformanceMonitor(): PerformanceMonitor {
    return this.perfMonitor;
  }

  getLogger(): StructuredLogger {
    return this.logger;
  }

  getMetrics(): MetricsCollector {
    return this.metricsCollector;
  }

  getDashboard() {
    return {
      tracing: this.tracer.getMetrics(),
      performance: this.perfMonitor.getAllStats(),
      metrics: this.metricsCollector.getAllMetrics(),
      recentLogs: this.logger.getLogs(50),
    };
  }
}

// ============================================================================
// Metrics Collector
// ============================================================================

export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private timers: Map<string, number> = new Map();

  increment(metric: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(metric, tags);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  decrement(metric: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(metric, tags);
    this.counters.set(key, (this.counters.get(key) || 0) - value);
  }

  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(metric, tags);
    this.gauges.set(key, value);
  }

  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(metric, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    
    // Keep last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(key, values);
  }

  startTimer(metric: string): () => void {
    const key = `${metric}_${nanoid()}`;
    this.timers.set(key, Date.now());

    return () => {
      const startTime = this.timers.get(key);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.histogram(metric, duration);
        this.timers.delete(key);
      }
    };
  }

  private buildKey(metric: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return metric;
    }

    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');

    return `${metric}{${tagStr}}`;
  }

  getCounter(metric: string, tags?: Record<string, string>): number {
    const key = this.buildKey(metric, tags);
    return this.counters.get(key) || 0;
  }

  getGauge(metric: string, tags?: Record<string, string>): number {
    const key = this.buildKey(metric, tags);
    return this.gauges.get(key) || 0;
  }

  getHistogramStats(metric: string, tags?: Record<string, string>) {
    const key = this.buildKey(metric, tags);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Array.from(this.histograms.keys()).reduce((acc, key) => {
        acc[key] = this.getHistogramStats(key, {});
        return acc;
      }, {} as Record<string, any>),
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
  }
}

// ============================================================================
// Alerting System
// ============================================================================

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private handlers: Array<(alert: Alert) => void> = [];

  triggerAlert(
    severity: Alert['severity'],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): string {
    const alert: Alert = {
      id: nanoid(),
      severity,
      title,
      message,
      timestamp: Date.now(),
      acknowledged: false,
      metadata,
    };

    this.alerts.set(alert.id, alert);

    // Notify handlers
    for (const handler of this.handlers) {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    }

    // Console output
    const emoji = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} ALERT [${severity.toUpperCase()}]: ${title} - ${message}`);

    return alert.id;
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  getAlerts(acknowledged?: boolean): Alert[] {
    const alerts = Array.from(this.alerts.values());
    
    if (acknowledged !== undefined) {
      return alerts.filter((a) => a.acknowledged === acknowledged);
    }
    
    return alerts;
  }

  registerHandler(handler: (alert: Alert) => void): void {
    this.handlers.push(handler);
  }

  clearAcknowledged(): void {
    for (const [id, alert] of this.alerts) {
      if (alert.acknowledged) {
        this.alerts.delete(id);
      }
    }
  }
}
