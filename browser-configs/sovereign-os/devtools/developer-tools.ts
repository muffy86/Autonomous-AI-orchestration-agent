/**
 * Developer Tools
 * Debugging, profiling, and development utilities
 */

export class DeveloperTools {
  private logs: any[] = [];
  private profiles: Map<string, any> = new Map();
  private breakpoints: Set<string> = new Set();
  private enabled: boolean = false;

  constructor() {}

  enable() {
    this.enabled = true;
    console.log('🔧 Developer Tools enabled');
    
    // Intercept console methods
    this.interceptConsole();
    
    // Add global access
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).__devTools = this;
    }
  }

  disable() {
    this.enabled = false;
    console.log('🔧 Developer Tools disabled');
  }

  // ===== Logging =====

  private interceptConsole() {
    const original = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    console.log = (...args: any[]) => {
      this.log('log', args);
      original.log.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.log('error', args);
      original.error.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.log('warn', args);
      original.warn.apply(console, args);
    };

    console.info = (...args: any[]) => {
      this.log('info', args);
      original.info.apply(console, args);
    };
  }

  private log(level: string, args: any[]) {
    if (!this.enabled) return;

    this.logs.push({
      level,
      message: args.map(a => this.stringify(a)).join(' '),
      timestamp: Date.now(),
      stack: new Error().stack
    });

    // Keep last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  getLogs(filter?: string) {
    if (!filter) return this.logs;

    return this.logs.filter(log => 
      log.level === filter || 
      log.message.toLowerCase().includes(filter.toLowerCase())
    );
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(format: 'json' | 'text' = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    return this.logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
  }

  // ===== Profiling =====

  startProfile(name: string) {
    this.profiles.set(name, {
      name,
      start: performance.now(),
      marks: [],
      running: true
    });
  }

  mark(profileName: string, label: string) {
    const profile = this.profiles.get(profileName);
    if (!profile) return;

    profile.marks.push({
      label,
      time: performance.now() - profile.start
    });
  }

  endProfile(name: string) {
    const profile = this.profiles.get(name);
    if (!profile) return null;

    profile.end = performance.now();
    profile.duration = profile.end - profile.start;
    profile.running = false;

    return profile;
  }

  getProfile(name: string) {
    return this.profiles.get(name);
  }

  getAllProfiles() {
    return Array.from(this.profiles.values());
  }

  // ===== Performance Timing =====

  async measure(name: string, fn: Function) {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;

      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`⏱️ ${name} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  }

  // ===== Memory Inspection =====

  inspectMemory() {
    if (!(performance as any).memory) {
      return { supported: false };
    }

    const memory = (performance as any).memory;

    return {
      supported: true,
      usedJSHeapSize: this.formatBytes(memory.usedJSHeapSize),
      totalJSHeapSize: this.formatBytes(memory.totalJSHeapSize),
      jsHeapSizeLimit: this.formatBytes(memory.jsHeapSizeLimit),
      usage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
    };
  }

  // ===== Breakpoints =====

  addBreakpoint(location: string) {
    this.breakpoints.add(location);
    console.log(`🔴 Breakpoint added: ${location}`);
  }

  removeBreakpoint(location: string) {
    this.breakpoints.delete(location);
    console.log(`⚪ Breakpoint removed: ${location}`);
  }

  checkBreakpoint(location: string) {
    if (this.breakpoints.has(location)) {
      console.log(`⏸️ Hit breakpoint: ${location}`);
      // In browser, this would trigger debugger
      if (typeof debugger !== 'undefined') {
        debugger;
      }
      return true;
    }
    return false;
  }

  // ===== Network Inspection =====

  private networkRequests: any[] = [];

  logNetworkRequest(url: string, options: any) {
    this.networkRequests.push({
      url,
      method: options.method || 'GET',
      timestamp: Date.now()
    });
  }

  logNetworkResponse(url: string, response: any) {
    const request = this.networkRequests.find(r => r.url === url && !r.response);
    if (request) {
      request.response = {
        status: response.status,
        duration: Date.now() - request.timestamp
      };
    }
  }

  getNetworkRequests() {
    return this.networkRequests;
  }

  // ===== State Inspection =====

  inspectObject(obj: any, depth = 2) {
    return this.stringifyDeep(obj, depth);
  }

  private stringifyDeep(obj: any, depth: number, current = 0): string {
    if (current >= depth) return '[Object]';
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object') return String(obj);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.slice(0, 10).map(item => 
        this.stringifyDeep(item, depth, current + 1)
      );
      return `[${items.join(', ')}${obj.length > 10 ? `, ... +${obj.length - 10} more` : ''}]`;
    }

    const keys = Object.keys(obj).slice(0, 10);
    const pairs = keys.map(key => 
      `${key}: ${this.stringifyDeep(obj[key], depth, current + 1)}`
    );
    
    return `{${pairs.join(', ')}${Object.keys(obj).length > 10 ? ', ...' : ''}}`;
  }

  // ===== Debug Commands =====

  debug(message: string, data?: any) {
    if (!this.enabled) return;

    console.log(`🐛 ${message}`);
    if (data) {
      console.log(this.inspectObject(data));
    }
  }

  trace(message: string) {
    if (!this.enabled) return;

    console.log(`📍 ${message}`);
    console.trace();
  }

  assert(condition: boolean, message: string) {
    if (!condition) {
      console.error(`❌ Assertion failed: ${message}`);
      console.trace();
    }
  }

  // ===== Performance Monitoring =====

  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const paint = performance.getEntriesByType('paint');

    return {
      navigation: navigation ? {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive,
        domComplete: navigation.domComplete
      } : null,
      paint: {
        firstPaint: paint.find((p: any) => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find((p: any) => p.name === 'first-contentful-paint')?.startTime || 0
      },
      memory: this.inspectMemory()
    };
  }

  // ===== Utilities =====

  private stringify(obj: any): string {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    
    try {
      return JSON.stringify(obj);
    } catch {
      return '[Object]';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // ===== Export/Import =====

  export() {
    return {
      logs: this.logs,
      profiles: Array.from(this.profiles.entries()),
      networkRequests: this.networkRequests,
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  import(data: any) {
    if (data.logs) this.logs = data.logs;
    if (data.profiles) this.profiles = new Map(data.profiles);
    if (data.networkRequests) this.networkRequests = data.networkRequests;
  }
}

// Global access
if (typeof globalThis !== 'undefined') {
  (globalThis as any).DevTools = DeveloperTools;
}

export default DeveloperTools;
