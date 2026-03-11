/**
 * Health Check Endpoint
 * Provides comprehensive system health information for monitoring
 */

import { NextResponse } from 'next/server';
import { connectionPool } from '@/lib/db/connection-pool';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    api: ServiceHealth;
  };
  system: SystemHealth;
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

interface SystemHealth {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    const systemHealth = connectionPool.getSystemHealth();
    const responseTime = Date.now() - start;

    return {
      status: systemHealth.status === 'healthy' ? 'up' : 
              systemHealth.status === 'degraded' ? 'degraded' : 'down',
      responseTime,
      details: {
        primaryPool: systemHealth.primaryPool,
        availablePools: systemHealth.availablePools,
        unhealthyPools: systemHealth.unhealthyPools,
        totalConnections: systemHealth.totalConnections,
        avgResponseTime: systemHealth.avgResponseTime,
      },
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  
  if (!process.env.REDIS_URL) {
    return {
      status: 'down',
      responseTime: 0,
      message: 'Redis URL not configured',
    };
  }

  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    
    const pong = await redis.ping();
    const info = await redis.info();
    await redis.disconnect();
    
    const responseTime = Date.now() - start;

    // Parse Redis info for useful metrics
    const infoLines = info.split('\r\n');
    const memoryLine = infoLines.find(line => line.startsWith('used_memory_human:'));
    const connectionsLine = infoLines.find(line => line.startsWith('connected_clients:'));
    
    return {
      status: pong === 'PONG' ? 'up' : 'degraded',
      responseTime,
      details: {
        memory: memoryLine?.split(':')[1] || 'unknown',
        connections: connectionsLine?.split(':')[1] || 'unknown',
      },
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis check failed',
    };
  }
}

function checkAPI(): ServiceHealth {
  return {
    status: 'up',
    responseTime: 0,
    details: {
      version: process.env.npm_package_version || '3.0.23',
      environment: process.env.NODE_ENV || 'development',
    },
  };
}

function getSystemHealth(): SystemHealth {
  const usage = process.memoryUsage();
  
  return {
    memory: {
      used: Math.round(usage.heapUsed / 1024 / 1024),
      total: Math.round(usage.heapTotal / 1024 / 1024),
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    },
    cpu: {
      usage: Math.round(process.cpuUsage().user / 1000000), // Convert to ms
    },
  };
}

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Run health checks in parallel
    const [database, redis, api] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkAPI()),
    ]);

    const system = getSystemHealth();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const services = { database, redis, api };
    const serviceStatuses = Object.values(services).map(s => s.status);
    
    if (serviceStatuses.includes('down')) {
      status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      status = 'degraded';
    }

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '3.0.23',
      services,
      system,
    };

    // Set appropriate HTTP status code
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
