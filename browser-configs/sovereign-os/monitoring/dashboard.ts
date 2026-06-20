/**
 * Monitoring & Analytics Dashboard
 * Track system health, performance, and usage
 */

export class MonitoringDashboard {
  private dataLayer: any;
  private metrics: Map<string, any[]> = new Map();
  private alerts: any[] = [];
  private collectors: Map<string, any> = new Map();

  constructor(dataLayer: any) {
    this.dataLayer = dataLayer;
  }

  async init() {
    // Load historical metrics
    const saved = await this.dataLayer.load('metrics-history') || {};
    
    for (const [key, values] of Object.entries(saved)) {
      this.metrics.set(key, values as any[]);
    }

    // Start collectors
    this.startCollectors();

    console.log('✅ Monitoring dashboard ready');
  }

  // ===== Metric Collection =====

  private startCollectors() {
    // System metrics every 10 seconds
    this.collectors.set('system', setInterval(() => {
      this.collectSystemMetrics();
    }, 10000));

    // Agent metrics every 30 seconds
    this.collectors.set('agents', setInterval(() => {
      this.collectAgentMetrics();
    }, 30000));

    // Save metrics every 5 minutes
    this.collectors.set('save', setInterval(() => {
      this.saveMetrics();
    }, 300000));
  }

  stop() {
    for (const [name, interval] of this.collectors) {
      clearInterval(interval);
    }
    this.collectors.clear();
  }

  private async collectSystemMetrics() {
    const metric = {
      timestamp: Date.now(),
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize / 1024 / 1024, // MB
        total: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
        limit: (performance as any).memory.jsHeapSizeLimit / 1024 / 1024
      } : null,
      uptime: Date.now() - this.getStartTime(),
      connections: 0, // Would track WebSocket connections
    };

    this.recordMetric('system', metric);

    // Check alerts
    if (metric.memory && metric.memory.used / metric.memory.limit > 0.9) {
      this.createAlert('high-memory', 'Memory usage above 90%', 'warning');
    }
  }

  private async collectAgentMetrics() {
    // Would collect from actual agents
    const metric = {
      timestamp: Date.now(),
      activeAgents: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgDuration: 0
    };

    this.recordMetric('agents', metric);
  }

  // ===== Metric Recording =====

  recordMetric(category: string, data: any) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const metrics = this.metrics.get(category)!;
    metrics.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });

    // Keep last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  getMetrics(category: string, options: any = {}) {
    const metrics = this.metrics.get(category) || [];
    
    let filtered = metrics;

    // Time range filter
    if (options.from) {
      filtered = filtered.filter(m => m.timestamp >= options.from);
    }
    if (options.to) {
      filtered = filtered.filter(m => m.timestamp <= options.to);
    }

    // Limit
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  getLatestMetric(category: string) {
    const metrics = this.metrics.get(category);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  // ===== Analytics =====

  getSystemStats() {
    const systemMetrics = this.getMetrics('system');
    const agentMetrics = this.getMetrics('agents');

    if (systemMetrics.length === 0) {
      return { uptime: 0, requests: 0, errors: 0 };
    }

    const latest = systemMetrics[systemMetrics.length - 1];
    
    return {
      uptime: latest.uptime,
      memory: latest.memory,
      agents: agentMetrics.length > 0 ? agentMetrics[agentMetrics.length - 1] : {},
      requests: this.getTotalRequests(),
      errors: this.getTotalErrors()
    };
  }

  getPerformanceStats(category: string, metric: string) {
    const data = this.getMetrics(category).map(m => m[metric]).filter(v => v !== undefined);

    if (data.length === 0) return null;

    return {
      min: Math.min(...data),
      max: Math.max(...data),
      avg: data.reduce((a, b) => a + b, 0) / data.length,
      current: data[data.length - 1],
      count: data.length
    };
  }

  getTimeSeries(category: string, metric: string, interval = 60000) {
    const metrics = this.getMetrics(category);
    const series: any = {};

    for (const m of metrics) {
      const bucket = Math.floor(m.timestamp / interval) * interval;
      if (!series[bucket]) {
        series[bucket] = [];
      }
      if (m[metric] !== undefined) {
        series[bucket].push(m[metric]);
      }
    }

    // Calculate average per bucket
    return Object.entries(series).map(([timestamp, values]: [string, any]) => ({
      timestamp: parseInt(timestamp),
      value: values.reduce((a: number, b: number) => a + b, 0) / values.length
    }));
  }

  // ===== Alerts =====

  createAlert(id: string, message: string, severity: 'info' | 'warning' | 'error') {
    const alert = {
      id,
      message,
      severity,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Keep last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    console.log(`⚠️ Alert [${severity}]: ${message}`);

    return alert;
  }

  getAlerts(options: any = {}) {
    let alerts = this.alerts;

    if (options.severity) {
      alerts = alerts.filter(a => a.severity === options.severity);
    }

    if (options.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === options.acknowledged);
    }

    return alerts;
  }

  acknowledgeAlert(id: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // ===== Reports =====

  generateReport(period: 'hour' | 'day' | 'week' | 'month') {
    const now = Date.now();
    const periods: any = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000
    };

    const from = now - periods[period];
    
    const systemMetrics = this.getMetrics('system', { from });
    const agentMetrics = this.getMetrics('agents', { from });

    return {
      period,
      from,
      to: now,
      summary: {
        totalRequests: this.getTotalRequests(),
        totalErrors: this.getTotalErrors(),
        avgResponseTime: this.getAvgResponseTime(),
        uptime: this.getUptime()
      },
      system: {
        avgMemoryUsage: this.calculateAverage(systemMetrics, 'memory.used'),
        peakMemoryUsage: this.calculateMax(systemMetrics, 'memory.used')
      },
      agents: {
        totalTasks: this.calculateSum(agentMetrics, 'completedTasks'),
        failedTasks: this.calculateSum(agentMetrics, 'failedTasks'),
        avgDuration: this.calculateAverage(agentMetrics, 'avgDuration')
      },
      topErrors: this.getTopErrors(),
      alerts: this.getAlerts({ from })
    };
  }

  exportMetrics(format: 'json' | 'csv' = 'json') {
    if (format === 'json') {
      return JSON.stringify({
        metrics: Object.fromEntries(this.metrics),
        alerts: this.alerts,
        exported: Date.now()
      }, null, 2);
    }

    if (format === 'csv') {
      // Convert to CSV
      let csv = 'category,timestamp,metric,value\n';
      
      for (const [category, metrics] of this.metrics) {
        for (const metric of metrics) {
          const timestamp = metric.timestamp;
          for (const [key, value] of Object.entries(metric)) {
            if (key !== 'timestamp' && typeof value !== 'object') {
              csv += `${category},${timestamp},${key},${value}\n`;
            }
          }
        }
      }

      return csv;
    }
  }

  // ===== Utilities =====

  private calculateAverage(metrics: any[], path: string) {
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateSum(metrics: any[], path: string) {
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined);
    return values.reduce((a, b) => a + b, 0);
  }

  private calculateMax(metrics: any[], path: string) {
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined);
    return values.length > 0 ? Math.max(...values) : 0;
  }

  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  private getTotalRequests() {
    // Would track from actual request handler
    return 0;
  }

  private getTotalErrors() {
    return this.alerts.filter(a => a.severity === 'error').length;
  }

  private getAvgResponseTime() {
    // Would calculate from request metrics
    return 0;
  }

  private getUptime() {
    return Date.now() - this.getStartTime();
  }

  private getStartTime() {
    // Would store actual start time
    return Date.now() - 3600000; // Fake 1 hour uptime
  }

  private getTopErrors() {
    const errorCounts: any = {};
    
    for (const alert of this.alerts) {
      if (alert.severity === 'error') {
        errorCounts[alert.message] = (errorCounts[alert.message] || 0) + 1;
      }
    }

    return Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  }

  private async saveMetrics() {
    const metricsObj: any = {};
    
    for (const [key, values] of this.metrics) {
      // Keep last 1000 of each
      metricsObj[key] = values.slice(-1000);
    }

    await this.dataLayer.save('metrics-history', metricsObj);
  }

  // ===== Dashboard API =====

  getDashboardData() {
    return {
      stats: this.getSystemStats(),
      recentAlerts: this.getAlerts({ acknowledged: false }).slice(-5),
      charts: {
        memory: this.getTimeSeries('system', 'memory.used'),
        tasks: this.getTimeSeries('agents', 'completedTasks')
      }
    };
  }
}

export default MonitoringDashboard;
