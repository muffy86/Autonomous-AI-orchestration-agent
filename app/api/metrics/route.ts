/**
 * Metrics and Monitoring Endpoint
 * Provides detailed system metrics for monitoring and alerting
 */

import { NextResponse } from 'next/server';
import { connectionPool } from '@/lib/db/connection-pool';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MetricsResponse {
  timestamp: string;
  uptime: number;
  requests: RequestMetrics;
  database: DatabaseMetrics;
  redis: RedisMetrics;
  system: SystemMetrics;
}

interface RequestMetrics {
  total: number;
  errors: number;
  avgResponseTime: number;
}

interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    failed: number;
    avgResponseTime: number;
  };
}

interface RedisMetrics {
  connected: boolean;
  memory: string;
  commands: number;
}

interface SystemMetrics {
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  nodejs: {
    version: string;
  };
}

async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  try {
    const poolStats = connectionPool.getPoolStats();
    
    // Sum stats from all pools
    let totalQueries = 0;
    let failedQueries = 0;
    let totalResponseTime = 0;
    let totalConnections = 0;
    
    if (poolStats instanceof Map) {
      for (const [, stats] of poolStats) {
        totalQueries += stats.totalQueries;
        failedQueries += stats.failedQueries;
        totalResponseTime += stats.avgResponseTime * stats.totalQueries;
        totalConnections += stats.totalConnections;
      }
    }

    return {
      connections: {
        active: 0, // Would need actual connection tracking
        idle: 0,
        total: totalConnections,
      },
      queries: {
        total: totalQueries,
        failed: failedQueries,
        avgResponseTime: totalQueries > 0 ? totalResponseTime / totalQueries : 0,
      },
    };
  } catch (error) {
    return {
      connections: { active: 0, idle: 0, total: 0 },
      queries: { total: 0, failed: 0, avgResponseTime: 0 },
    };
  }
}

async function getRedisMetrics(): Promise<RedisMetrics> {
  if (!process.env.REDIS_URL) {
    return {
      connected: false,
      memory: '0B',
      commands: 0,
    };
  }

  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    
    const info = await redis.info();
    await redis.disconnect();
    
    const infoLines = info.split('\r\n');
    const memoryLine = infoLines.find(line => line.startsWith('used_memory_human:'));
    const commandsLine = infoLines.find(line => line.startsWith('total_commands_processed:'));
    
    return {
      connected: true,
      memory: memoryLine?.split(':')[1] || '0B',
      commands: parseInt(commandsLine?.split(':')[1] || '0'),
    };
  } catch (error) {
    return {
      connected: false,
      memory: '0B',
      commands: 0,
    };
  }
}

function getSystemMetrics(): SystemMetrics {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
      system: Math.round(cpuUsage.system / 1000),
    },
    nodejs: {
      version: process.version,
    },
  };
}

export async function GET(request: Request) {
  try {
    const [database, redis] = await Promise.all([
      getDatabaseMetrics(),
      getRedisMetrics(),
    ]);

    const system = getSystemMetrics();

    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      requests: {
        total: 0, // Would need middleware tracking
        errors: 0,
        avgResponseTime: 0,
      },
      database,
      redis,
      system,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Metrics endpoint failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
