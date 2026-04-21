/**
 * Database Connection Pool Manager
 * Provides intelligent connection pooling, load balancing, and failover
 */

import 'server-only';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  totalQueries: number;
  failedQueries: number;
  avgResponseTime: number;
  uptime: number;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private pools: Map<string, postgres.Sql> = new Map();
  private drizzleInstances: Map<string, ReturnType<typeof drizzle>> = new Map();
  private healthStatus: Map<string, ConnectionHealth> = new Map();
  private stats: Map<string, PoolStats> = new Map();
  private currentPrimary: string = 'primary';
  private readonly maxFailures = 3;
  private readonly healthCheckInterval = 30000; // 30 seconds
  private healthCheckTimer?: NodeJS.Timeout;

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  private constructor() {
    this.initializeConnections();
    this.startHealthChecks();
  }

  private initializeConnections(): void {
    const primaryConfig = this.parseConnectionString(process.env.POSTGRES_URL!);
    const readReplicaUrl = process.env.POSTGRES_READ_REPLICA_URL;

    // Primary connection (read/write)
    this.createConnection('primary', primaryConfig, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: true,
      transform: { undefined: null },
      onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Read replica connection (read-only) if available
    if (readReplicaUrl) {
      const replicaConfig = this.parseConnectionString(readReplicaUrl);
      this.createConnection('replica', replicaConfig, {
        max: 15,
        idle_timeout: 30,
        connect_timeout: 10,
        prepare: true,
        transform: { undefined: null },
      });
    }

    // Analytics connection (separate pool for heavy queries)
    this.createConnection('analytics', primaryConfig, {
      max: 5,
      idle_timeout: 60,
      connect_timeout: 15,
      prepare: false, // Analytics queries are often one-off
      transform: { undefined: null },
    });
  }

  private parseConnectionString(url: string): ConnectionConfig {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      username: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get('sslmode') !== 'disable',
    };
  }

  private createConnection(
    name: string,
    config: ConnectionConfig,
    options: postgres.Options<{}>
  ): void {
    try {
      const connectionString = `postgres://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${config.ssl ? '?sslmode=require' : ''}`;
      
      const pool = postgres(connectionString, {
        ...options,
        onnotice: (notice) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[${name}] Notice:`, notice);
          }
        },
        connection: {
          application_name: `ai-chatbot-${name}`,
        },
      });

      const db = drizzle(pool, {
        logger: process.env.NODE_ENV === 'development',
      });

      this.pools.set(name, pool);
      this.drizzleInstances.set(name, db);
      
      // Initialize health status
      this.healthStatus.set(name, {
        isHealthy: true,
        latency: 0,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      });

      // Initialize stats
      this.stats.set(name, {
        totalConnections: options.max || 10,
        activeConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
        totalQueries: 0,
        failedQueries: 0,
        avgResponseTime: 0,
        uptime: Date.now(),
      });

      console.log(`Database connection pool '${name}' initialized`);
    } catch (error) {
      console.error(`Failed to create connection pool '${name}':`, error);
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [name, pool] of this.pools.entries()) {
      try {
        const startTime = Date.now();
        await pool`SELECT 1`;
        const latency = Date.now() - startTime;

        const health = this.healthStatus.get(name)!;
        health.isHealthy = true;
        health.latency = latency;
        health.lastCheck = new Date();
        health.consecutiveFailures = 0;

        // Update stats
        const stats = this.stats.get(name)!;
        stats.totalQueries++;
      } catch (error) {
        const health = this.healthStatus.get(name)!;
        health.isHealthy = false;
        health.consecutiveFailures++;
        health.lastCheck = new Date();

        const stats = this.stats.get(name)!;
        stats.failedQueries++;

        console.error(`Health check failed for pool '${name}':`, error);

        // Failover logic
        if (name === this.currentPrimary && health.consecutiveFailures >= this.maxFailures) {
          this.performFailover();
        }
      }
    }
  }

  private performFailover(): void {
    console.warn('Primary database connection failed, attempting failover...');
    
    // Try to use replica as primary
    if (this.pools.has('replica')) {
      const replicaHealth = this.healthStatus.get('replica')!;
      if (replicaHealth.isHealthy) {
        this.currentPrimary = 'replica';
        console.log('Failover successful: using replica as primary');
        return;
      }
    }

    console.error('Failover failed: no healthy connections available');
  }

  // Get database instance for different use cases
  getDatabase(type: 'write' | 'read' | 'analytics' = 'write'): ReturnType<typeof drizzle> {
    let poolName: string;

    switch (type) {
      case 'write':
        poolName = this.currentPrimary;
        break;
      case 'read':
        // Use replica for reads if available and healthy, otherwise use primary
        if (this.pools.has('replica') && this.healthStatus.get('replica')?.isHealthy) {
          poolName = 'replica';
        } else {
          poolName = this.currentPrimary;
        }
        break;
      case 'analytics':
        poolName = 'analytics';
        break;
      default:
        poolName = this.currentPrimary;
    }

    const db = this.drizzleInstances.get(poolName);
    if (!db) {
      throw new Error(`Database connection '${poolName}' not available`);
    }

    return db;
  }

  // Execute query with automatic retry and failover
  async executeWithRetry<T>(
    queryFn: (db: ReturnType<typeof drizzle>) => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      preferredPool?: 'write' | 'read' | 'analytics';
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000, preferredPool = 'write' } = options;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const db = this.getDatabase(preferredPool);
        const startTime = Date.now();
        
        const result = await queryFn(db);
        
        // Update stats
        const duration = Date.now() - startTime;
        this.updateQueryStats(preferredPool, duration, true);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.updateQueryStats(preferredPool, 0, false);
        
        console.error(`Query attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    throw lastError!;
  }

  private updateQueryStats(poolType: string, duration: number, success: boolean): void {
    const poolName = this.getPoolNameForType(poolType);
    const stats = this.stats.get(poolName);
    
    if (stats) {
      stats.totalQueries++;
      if (!success) {
        stats.failedQueries++;
      }
      
      if (success && duration > 0) {
        // Update average response time
        const totalTime = stats.avgResponseTime * (stats.totalQueries - 1) + duration;
        stats.avgResponseTime = totalTime / stats.totalQueries;
      }
    }
  }

  private getPoolNameForType(type: string): string {
    switch (type) {
      case 'read':
        return this.pools.has('replica') && this.healthStatus.get('replica')?.isHealthy 
          ? 'replica' 
          : this.currentPrimary;
      case 'analytics':
        return 'analytics';
      default:
        return this.currentPrimary;
    }
  }

  // Get pool statistics
  getPoolStats(poolName?: string): PoolStats | Map<string, PoolStats> {
    if (poolName) {
      const stats = this.stats.get(poolName);
      if (!stats) {
        throw new Error(`Pool '${poolName}' not found`);
      }
      return {
        ...stats,
        uptime: Date.now() - stats.uptime,
      };
    }

    const allStats = new Map<string, PoolStats>();
    for (const [name, stats] of this.stats.entries()) {
      allStats.set(name, {
        ...stats,
        uptime: Date.now() - stats.uptime,
      });
    }
    return allStats;
  }

  // Get health status
  getHealthStatus(poolName?: string): ConnectionHealth | Map<string, ConnectionHealth> {
    if (poolName) {
      const health = this.healthStatus.get(poolName);
      if (!health) {
        throw new Error(`Pool '${poolName}' not found`);
      }
      return health;
    }

    return new Map(this.healthStatus);
  }

  // Get overall system health
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    primaryPool: string;
    availablePools: string[];
    unhealthyPools: string[];
    totalConnections: number;
    totalQueries: number;
    avgResponseTime: number;
  } {
    const availablePools: string[] = [];
    const unhealthyPools: string[] = [];
    let totalConnections = 0;
    let totalQueries = 0;
    let totalResponseTime = 0;
    let queryCount = 0;

    for (const [name, health] of this.healthStatus.entries()) {
      if (health.isHealthy) {
        availablePools.push(name);
      } else {
        unhealthyPools.push(name);
      }

      const stats = this.stats.get(name)!;
      totalConnections += stats.totalConnections;
      totalQueries += stats.totalQueries;
      
      if (stats.totalQueries > 0) {
        totalResponseTime += stats.avgResponseTime * stats.totalQueries;
        queryCount += stats.totalQueries;
      }
    }

    let status: 'healthy' | 'degraded' | 'critical';
    if (unhealthyPools.length === 0) {
      status = 'healthy';
    } else if (availablePools.length > 0) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return {
      status,
      primaryPool: this.currentPrimary,
      availablePools,
      unhealthyPools,
      totalConnections,
      totalQueries,
      avgResponseTime: queryCount > 0 ? totalResponseTime / queryCount : 0,
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    console.log('Shutting down database connection pools...');
    
    for (const [name, pool] of this.pools.entries()) {
      try {
        await pool.end();
        console.log(`Pool '${name}' closed successfully`);
      } catch (error) {
        console.error(`Error closing pool '${name}':`, error);
      }
    }

    this.pools.clear();
    this.drizzleInstances.clear();
    this.healthStatus.clear();
    this.stats.clear();
  }

  // Manual failover trigger
  async triggerFailover(targetPool?: string): Promise<boolean> {
    if (targetPool && this.pools.has(targetPool)) {
      const health = this.healthStatus.get(targetPool)!;
      if (health.isHealthy) {
        this.currentPrimary = targetPool;
        console.log(`Manual failover to '${targetPool}' successful`);
        return true;
      }
    }

    // Auto-select healthy pool
    for (const [name, health] of this.healthStatus.entries()) {
      if (health.isHealthy && name !== this.currentPrimary) {
        this.currentPrimary = name;
        console.log(`Manual failover to '${name}' successful`);
        return true;
      }
    }

    console.error('Manual failover failed: no healthy pools available');
    return false;
  }

  // Connection pool scaling
  async scalePool(poolName: string, newSize: number): Promise<boolean> {
    try {
      // Note: postgres.js doesn't support dynamic pool resizing
      // This would require recreating the connection pool
      console.log(`Pool scaling requested for '${poolName}' to ${newSize} connections`);
      console.log('Note: Dynamic pool scaling requires pool recreation');
      return false;
    } catch (error) {
      console.error(`Failed to scale pool '${poolName}':`, error);
      return false;
    }
  }
}

// Export singleton instance
export const connectionPool = DatabaseConnectionPool.getInstance();

// Convenience exports
export const getWriteDB = () => connectionPool.getDatabase('write');
export const getReadDB = () => connectionPool.getDatabase('read');
export const getAnalyticsDB = () => connectionPool.getDatabase('analytics');

// Process cleanup
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await connectionPool.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await connectionPool.shutdown();
  process.exit(0);
});