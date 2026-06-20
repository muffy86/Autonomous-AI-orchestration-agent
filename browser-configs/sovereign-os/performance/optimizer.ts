/**
 * Performance Optimizer
 * Automatic performance tuning and optimization
 */

export class PerformanceOptimizer {
  private metrics: Map<string, any[]> = new Map();
  private optimizations: Map<string, any> = new Map();
  private settings: any;

  constructor(settings: any) {
    this.settings = settings;
  }

  async init() {
    // Start performance monitoring
    this.startMonitoring();
    
    // Apply initial optimizations
    await this.applyOptimizations();
    
    console.log('✅ Performance optimizer ready');
  }

  // ===== Monitoring =====

  private startMonitoring() {
    // Monitor every 5 seconds
    setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
    }, 5000);
  }

  private collectMetrics() {
    const metric = {
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      cpu: this.getCPUUsage(),
      networkLatency: this.getNetworkLatency(),
      responseTime: this.getAvgResponseTime()
    };

    this.recordMetric('performance', metric);

    // Auto-optimize if needed
    if (metric.memory > 0.8) {
      this.optimizeMemory();
    }

    if (metric.responseTime > 1000) {
      this.optimizeSpeed();
    }
  }

  private recordMetric(category: string, data: any) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const metrics = this.metrics.get(category)!;
    metrics.push(data);

    // Keep last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  // ===== Analysis =====

  private analyzePerformance() {
    const recent = this.getRecentMetrics('performance', 10);
    
    if (recent.length === 0) return;

    const avgMemory = this.average(recent, 'memory');
    const avgResponseTime = this.average(recent, 'responseTime');
    const avgLatency = this.average(recent, 'networkLatency');

    // Detect issues
    if (avgMemory > 0.85) {
      this.recommendOptimization('memory', 'High memory usage detected');
    }

    if (avgResponseTime > 2000) {
      this.recommendOptimization('speed', 'Slow response times detected');
    }

    if (avgLatency > 500) {
      this.recommendOptimization('network', 'High network latency detected');
    }
  }

  // ===== Optimizations =====

  private async applyOptimizations() {
    // Enable caching
    await this.settings.set('search.cacheEnabled', true);
    
    // Optimize browser automation
    await this.settings.set('automation.blockImages', false);
    await this.settings.set('automation.blockCSS', false);
    
    // Set reasonable limits
    await this.settings.set('agents.maxConcurrent', 3);
    await this.settings.set('llm.maxTokens', 4096);
  }

  async optimizeMemory() {
    console.log('🔧 Optimizing memory usage...');

    // Clear old caches
    const oldOptimizations = Array.from(this.optimizations.values())
      .filter((opt: any) => Date.now() - opt.timestamp > 3600000);
    
    for (const opt of oldOptimizations) {
      this.optimizations.delete(opt.id);
    }

    // Reduce concurrent agents
    const currentMax = this.settings.get('agents.maxConcurrent');
    if (currentMax > 2) {
      await this.settings.set('agents.maxConcurrent', currentMax - 1);
    }

    // Enable aggressive caching
    await this.settings.set('search.cacheTTL', 7200000); // 2 hours

    this.optimizations.set('memory-' + Date.now(), {
      type: 'memory',
      timestamp: Date.now(),
      actions: ['reduced-agents', 'increased-cache']
    });
  }

  async optimizeSpeed() {
    console.log('🔧 Optimizing speed...');

    // Use faster LLM provider
    const currentProvider = this.settings.get('llm.defaultProvider');
    if (currentProvider !== 'groq') {
      await this.settings.set('llm.defaultProvider', 'groq');
    }

    // Block unnecessary resources in browser
    await this.settings.set('automation.blockImages', true);
    await this.settings.set('automation.blockCSS', true);

    // Reduce response size
    await this.settings.set('llm.maxTokens', 2048);

    this.optimizations.set('speed-' + Date.now(), {
      type: 'speed',
      timestamp: Date.now(),
      actions: ['faster-llm', 'reduced-tokens', 'blocked-resources']
    });
  }

  async optimizeNetwork() {
    console.log('🔧 Optimizing network...');

    // Enable compression
    await this.settings.set('network.compression', true);

    // Use connection pooling
    await this.settings.set('network.keepAlive', true);

    // Reduce timeout
    await this.settings.set('network.timeout', 10000);

    this.optimizations.set('network-' + Date.now(), {
      type: 'network',
      timestamp: Date.now(),
      actions: ['compression', 'keep-alive', 'reduced-timeout']
    });
  }

  private recommendOptimization(type: string, message: string) {
    console.log(`💡 Recommendation [${type}]: ${message}`);
  }

  // ===== Benchmarking =====

  async benchmark(operation: string, fn: Function) {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.recordMetric('benchmark', {
        operation,
        duration,
        success: true,
        timestamp: Date.now()
      });

      return { result, duration };
    } catch (error: any) {
      const duration = performance.now() - start;

      this.recordMetric('benchmark', {
        operation,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  getBenchmarkResults(operation?: string) {
    const benchmarks = this.metrics.get('benchmark') || [];

    if (operation) {
      return benchmarks.filter((b: any) => b.operation === operation);
    }

    return benchmarks;
  }

  // ===== Reports =====

  getPerformanceReport() {
    const recent = this.getRecentMetrics('performance', 20);

    if (recent.length === 0) {
      return { status: 'no-data' };
    }

    return {
      memory: {
        current: recent[recent.length - 1].memory,
        average: this.average(recent, 'memory'),
        peak: this.max(recent, 'memory')
      },
      responseTime: {
        current: recent[recent.length - 1].responseTime,
        average: this.average(recent, 'responseTime'),
        peak: this.max(recent, 'responseTime')
      },
      networkLatency: {
        current: recent[recent.length - 1].networkLatency,
        average: this.average(recent, 'networkLatency'),
        peak: this.max(recent, 'networkLatency')
      },
      optimizations: Array.from(this.optimizations.values()),
      recommendations: this.getRecommendations()
    };
  }

  private getRecommendations() {
    const recommendations = [];
    const report = this.getPerformanceReport();

    if (report.memory?.average > 0.7) {
      recommendations.push({
        type: 'memory',
        severity: 'warning',
        message: 'Consider reducing concurrent agents or enabling more aggressive caching'
      });
    }

    if (report.responseTime?.average > 1500) {
      recommendations.push({
        type: 'speed',
        severity: 'warning',
        message: 'Consider using a faster LLM provider like Groq or reducing max tokens'
      });
    }

    return recommendations;
  }

  // ===== Utilities =====

  private getRecentMetrics(category: string, count: number) {
    const metrics = this.metrics.get(category) || [];
    return metrics.slice(-count);
  }

  private average(metrics: any[], key: string) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m[key] || 0), 0);
    return sum / metrics.length;
  }

  private max(metrics: any[], key: string) {
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(m => m[key] || 0));
  }

  private getMemoryUsage() {
    if ((performance as any).memory) {
      const used = (performance as any).memory.usedJSHeapSize;
      const limit = (performance as any).memory.jsHeapSizeLimit;
      return used / limit;
    }
    return 0;
  }

  private getCPUUsage() {
    // Simplified CPU estimation
    return Math.random() * 0.5; // 0-50%
  }

  private getNetworkLatency() {
    // Would measure actual network latency
    return Math.random() * 200; // 0-200ms
  }

  private getAvgResponseTime() {
    // Would measure actual response times
    return Math.random() * 1000; // 0-1000ms
  }

  // ===== Cache Management =====

  async optimizeCache() {
    console.log('🔧 Optimizing cache...');

    // Clear old entries
    // Would integrate with actual cache system

    return {
      cleared: 0,
      retained: 0
    };
  }

  // ===== Connection Pooling =====

  async optimizeConnections() {
    console.log('🔧 Optimizing connections...');

    // Implement connection pooling
    await this.settings.set('network.maxConnections', 10);
    await this.settings.set('network.keepAlive', true);
    await this.settings.set('network.keepAliveTimeout', 30000);
  }

  // ===== Compression =====

  async enableCompression() {
    console.log('🔧 Enabling compression...');

    await this.settings.set('network.compression', true);
    await this.settings.set('network.compressionLevel', 6); // 0-9
  }
}

export default PerformanceOptimizer;
