/**
 * Database Analytics and Monitoring System
 * Provides comprehensive database performance monitoring and analytics
 */

import 'server-only';

import { sql } from 'drizzle-orm';
import { db } from './optimizations';

export interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  connections: {
    active: number;
    idle: number;
    total: number;
    maxConnections: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    cacheHitRatio: number;
    indexHitRatio: number;
  };
  storage: {
    totalSize: string;
    availableSpace: string;
    largestTables: Array<{ table: string; size: string }>;
  };
  issues: Array<{
    severity: 'warning' | 'critical';
    message: string;
    recommendation: string;
  }>;
}

export interface QueryAnalytics {
  totalQueries: number;
  avgQueryTime: number;
  slowestQueries: Array<{
    query: string;
    avgTime: number;
    calls: number;
    totalTime: number;
  }>;
  queryDistribution: {
    select: number;
    insert: number;
    update: number;
    delete: number;
  };
  tableAccess: Array<{
    table: string;
    reads: number;
    writes: number;
    size: string;
  }>;
}

export interface IndexAnalytics {
  totalIndexes: number;
  unusedIndexes: Array<{
    table: string;
    index: string;
    size: string;
  }>;
  missingIndexes: Array<{
    table: string;
    columns: string[];
    reason: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  indexEfficiency: Array<{
    table: string;
    index: string;
    hitRatio: number;
    size: string;
  }>;
}

export class DatabaseAnalytics {
  private static instance: DatabaseAnalytics;
  private metricsHistory: Array<{ timestamp: Date; metrics: any }> = [];

  static getInstance(): DatabaseAnalytics {
    if (!DatabaseAnalytics.instance) {
      DatabaseAnalytics.instance = new DatabaseAnalytics();
    }
    return DatabaseAnalytics.instance;
  }

  async getDatabaseHealth(): Promise<DatabaseHealth> {
    try {
      const [uptimeResult, connectionStats, performanceStats, storageStats] =
        await Promise.all([
          this.getUptime(),
          this.getConnectionStats(),
          this.getPerformanceStats(),
          this.getStorageStats(),
        ]);

      const issues = this.analyzeIssues({
        connections: connectionStats,
        performance: performanceStats,
        storage: storageStats,
      });

      const status = this.determineHealthStatus(issues);

      return {
        status,
        uptime: uptimeResult,
        connections: connectionStats,
        performance: performanceStats,
        storage: storageStats,
        issues,
      };
    } catch (error) {
      return {
        status: 'critical',
        uptime: 0,
        connections: { active: 0, idle: 0, total: 0, maxConnections: 0 },
        performance: {
          avgQueryTime: 0,
          slowQueries: 0,
          cacheHitRatio: 0,
          indexHitRatio: 0,
        },
        storage: {
          totalSize: '0 MB',
          availableSpace: '0 MB',
          largestTables: [],
        },
        issues: [
          {
            severity: 'critical',
            message: 'Database connection failed',
            recommendation: 'Check database connectivity and credentials',
          },
        ],
      };
    }
  }

  async getQueryAnalytics(): Promise<QueryAnalytics> {
    try {
      const [queryStats, slowQueries, queryDistribution, tableAccess] =
        await Promise.all([
          this.getQueryStats(),
          this.getSlowQueries(),
          this.getQueryDistribution(),
          this.getTableAccess(),
        ]);

      return {
        totalQueries: queryStats.totalQueries,
        avgQueryTime: queryStats.avgQueryTime,
        slowestQueries: slowQueries,
        queryDistribution,
        tableAccess,
      };
    } catch (error) {
      console.error('Failed to get query analytics:', error);
      return {
        totalQueries: 0,
        avgQueryTime: 0,
        slowestQueries: [],
        queryDistribution: { select: 0, insert: 0, update: 0, delete: 0 },
        tableAccess: [],
      };
    }
  }

  async getIndexAnalytics(): Promise<IndexAnalytics> {
    try {
      const [indexCount, unusedIndexes, missingIndexes, indexEfficiency] =
        await Promise.all([
          this.getIndexCount(),
          this.getUnusedIndexes(),
          this.detectMissingIndexes(),
          this.getIndexEfficiency(),
        ]);

      return {
        totalIndexes: indexCount,
        unusedIndexes,
        missingIndexes,
        indexEfficiency,
      };
    } catch (error) {
      console.error('Failed to get index analytics:', error);
      return {
        totalIndexes: 0,
        unusedIndexes: [],
        missingIndexes: [],
        indexEfficiency: [],
      };
    }
  }

  private async getUptime(): Promise<number> {
    const result = await db.execute(sql`
      SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
    `);
    return result.rows[0]?.uptime || 0;
  }

  private async getConnectionStats(): Promise<DatabaseHealth['connections']> {
    const result = await db.execute(sql`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) as total,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    const stats = result.rows[0] || {};
    return {
      active: stats.active || 0,
      idle: stats.idle || 0,
      total: stats.total || 0,
      maxConnections: stats.max_connections || 100,
    };
  }

  private async getPerformanceStats(): Promise<DatabaseHealth['performance']> {
    try {
      // Try to get pg_stat_statements data
      const queryStatsResult = await db.execute(sql`
        SELECT 
          avg(mean_time) as avg_query_time,
          count(*) FILTER (WHERE mean_time > 1000) as slow_queries
        FROM pg_stat_statements
      `);

      const cacheStatsResult = await db.execute(sql`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio,
          sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)) * 100 as index_hit_ratio
        FROM pg_statio_user_tables
      `);

      const queryStats = queryStatsResult.rows[0] || {};
      const cacheStats = cacheStatsResult.rows[0] || {};

      return {
        avgQueryTime: queryStats.avg_query_time || 0,
        slowQueries: queryStats.slow_queries || 0,
        cacheHitRatio: cacheStats.cache_hit_ratio || 0,
        indexHitRatio: cacheStats.index_hit_ratio || 0,
      };
    } catch (error) {
      // Fallback if pg_stat_statements is not available
      return {
        avgQueryTime: 0,
        slowQueries: 0,
        cacheHitRatio: 0,
        indexHitRatio: 0,
      };
    }
  }

  private async getStorageStats(): Promise<DatabaseHealth['storage']> {
    const [sizeResult, tablesResult] = await Promise.all([
      db.execute(sql`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as total_size,
          pg_size_pretty(pg_database_size(current_database()) * 0.8) as available_space
      `),
      db.execute(sql`
        SELECT 
          schemaname || '.' || tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `),
    ]);

    const sizeStats = sizeResult.rows[0] || {};
    const largestTables = tablesResult.rows.map((row: any) => ({
      table: row.table_name,
      size: row.size,
    }));

    return {
      totalSize: sizeStats.total_size || '0 MB',
      availableSpace: sizeStats.available_space || '0 MB',
      largestTables,
    };
  }

  private async getQueryStats(): Promise<{
    totalQueries: number;
    avgQueryTime: number;
  }> {
    try {
      const result = await db.execute(sql`
        SELECT 
          sum(calls) as total_queries,
          avg(mean_time) as avg_query_time
        FROM pg_stat_statements
      `);

      const stats = result.rows[0] || {};
      return {
        totalQueries: stats.total_queries || 0,
        avgQueryTime: stats.avg_query_time || 0,
      };
    } catch (error) {
      return { totalQueries: 0, avgQueryTime: 0 };
    }
  }

  private async getSlowQueries(): Promise<QueryAnalytics['slowestQueries']> {
    try {
      const result = await db.execute(sql`
        SELECT 
          query,
          mean_time as avg_time,
          calls,
          total_time
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `);

      return result.rows.map((row: any) => ({
        query: `${row.query.substring(0, 100)}...`,
        avgTime: row.avg_time,
        calls: row.calls,
        totalTime: row.total_time,
      }));
    } catch (error) {
      return [];
    }
  }

  private async getQueryDistribution(): Promise<
    QueryAnalytics['queryDistribution']
  > {
    try {
      const result = await db.execute(sql`
        SELECT 
          sum(calls) FILTER (WHERE query ILIKE 'SELECT%') as select_count,
          sum(calls) FILTER (WHERE query ILIKE 'INSERT%') as insert_count,
          sum(calls) FILTER (WHERE query ILIKE 'UPDATE%') as update_count,
          sum(calls) FILTER (WHERE query ILIKE 'DELETE%') as delete_count
        FROM pg_stat_statements
      `);

      const stats = result.rows[0] || {};
      return {
        select: stats.select_count || 0,
        insert: stats.insert_count || 0,
        update: stats.update_count || 0,
        delete: stats.delete_count || 0,
      };
    } catch (error) {
      return { select: 0, insert: 0, update: 0, delete: 0 };
    }
  }

  private async getTableAccess(): Promise<QueryAnalytics['tableAccess']> {
    const result = await db.execute(sql`
      SELECT 
        schemaname || '.' || tablename as table_name,
        seq_scan + idx_scan as reads,
        n_tup_ins + n_tup_upd + n_tup_del as writes,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_stat_user_tables
      ORDER BY (seq_scan + idx_scan) DESC
      LIMIT 20
    `);

    return result.rows.map((row: any) => ({
      table: row.table_name,
      reads: row.reads || 0,
      writes: row.writes || 0,
      size: row.size,
    }));
  }

  private async getIndexCount(): Promise<number> {
    const result = await db.execute(sql`
      SELECT count(*) as index_count
      FROM pg_stat_user_indexes
    `);
    return result.rows[0]?.index_count || 0;
  }

  private async getUnusedIndexes(): Promise<IndexAnalytics['unusedIndexes']> {
    const result = await db.execute(sql`
      SELECT 
        schemaname || '.' || tablename as table_name,
        indexname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      ORDER BY pg_relation_size(indexrelid) DESC
    `);

    return result.rows.map((row: any) => ({
      table: row.table_name,
      index: row.index_name,
      size: row.size,
    }));
  }

  private async detectMissingIndexes(): Promise<
    IndexAnalytics['missingIndexes']
  > {
    // This is a simplified detection - in practice, you'd analyze query patterns
    const suggestions = [
      {
        table: 'Chat',
        columns: ['userId', 'createdAt'],
        reason: 'Frequent filtering by user and ordering by creation date',
        impact: 'high' as const,
      },
      {
        table: 'Message_v2',
        columns: ['chatId', 'createdAt'],
        reason: 'Message retrieval by chat with temporal ordering',
        impact: 'high' as const,
      },
      {
        table: 'Document',
        columns: ['userId', 'kind'],
        reason: 'Document filtering by user and type',
        impact: 'medium' as const,
      },
    ];

    // Check if these indexes already exist
    const existingIndexes = await db.execute(sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);

    const existingIndexNames = new Set(
      existingIndexes.rows.map(
        (row: any) => `${row.tablename}_${row.indexname}`,
      ),
    );

    return suggestions.filter((suggestion) => {
      const indexKey = `${suggestion.table}_${suggestion.columns.join('_')}`;
      return !existingIndexNames.has(indexKey);
    });
  }

  private async getIndexEfficiency(): Promise<
    IndexAnalytics['indexEfficiency']
  > {
    const result = await db.execute(sql`
      SELECT 
        schemaname || '.' || tablename as table_name,
        indexname as index_name,
        CASE 
          WHEN idx_scan = 0 THEN 0
          ELSE (idx_scan::float / (idx_scan + seq_scan)) * 100
        END as hit_ratio,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      JOIN pg_stat_user_tables USING (schemaname, tablename)
      ORDER BY hit_ratio DESC
      LIMIT 20
    `);

    return result.rows.map((row: any) => ({
      table: row.table_name,
      index: row.index_name,
      hitRatio: row.hit_ratio || 0,
      size: row.size,
    }));
  }

  private analyzeIssues(stats: {
    connections: DatabaseHealth['connections'];
    performance: DatabaseHealth['performance'];
    storage: DatabaseHealth['storage'];
  }): DatabaseHealth['issues'] {
    const issues: DatabaseHealth['issues'] = [];

    // Connection issues
    const connectionUsage =
      stats.connections.active / stats.connections.maxConnections;
    if (connectionUsage > 0.8) {
      issues.push({
        severity: 'critical',
        message: `High connection usage: ${Math.round(connectionUsage * 100)}%`,
        recommendation:
          'Consider increasing max_connections or implementing connection pooling',
      });
    } else if (connectionUsage > 0.6) {
      issues.push({
        severity: 'warning',
        message: `Moderate connection usage: ${Math.round(connectionUsage * 100)}%`,
        recommendation: 'Monitor connection usage and consider optimization',
      });
    }

    // Performance issues
    if (stats.performance.avgQueryTime > 1000) {
      issues.push({
        severity: 'critical',
        message: `High average query time: ${stats.performance.avgQueryTime.toFixed(2)}ms`,
        recommendation: 'Optimize slow queries and consider adding indexes',
      });
    } else if (stats.performance.avgQueryTime > 500) {
      issues.push({
        severity: 'warning',
        message: `Elevated query time: ${stats.performance.avgQueryTime.toFixed(2)}ms`,
        recommendation:
          'Review query performance and optimization opportunities',
      });
    }

    if (stats.performance.cacheHitRatio < 90) {
      issues.push({
        severity: 'warning',
        message: `Low cache hit ratio: ${stats.performance.cacheHitRatio.toFixed(1)}%`,
        recommendation:
          'Consider increasing shared_buffers or optimizing queries',
      });
    }

    if (stats.performance.slowQueries > 10) {
      issues.push({
        severity: 'warning',
        message: `${stats.performance.slowQueries} slow queries detected`,
        recommendation: 'Review and optimize slow-running queries',
      });
    }

    return issues;
  }

  private determineHealthStatus(
    issues: DatabaseHealth['issues'],
  ): DatabaseHealth['status'] {
    if (issues.some((issue) => issue.severity === 'critical')) {
      return 'critical';
    }
    if (issues.some((issue) => issue.severity === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }

  async recordMetrics(): Promise<void> {
    try {
      const [health, queryAnalytics, indexAnalytics] = await Promise.all([
        this.getDatabaseHealth(),
        this.getQueryAnalytics(),
        this.getIndexAnalytics(),
      ]);

      this.metricsHistory.push({
        timestamp: new Date(),
        metrics: {
          health,
          queryAnalytics,
          indexAnalytics,
        },
      });

      // Keep only last 24 hours of metrics
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metricsHistory = this.metricsHistory.filter(
        (entry) => entry.timestamp > oneDayAgo,
      );
    } catch (error) {
      console.error('Failed to record database metrics:', error);
    }
  }

  getMetricsHistory(): Array<{ timestamp: Date; metrics: any }> {
    return this.metricsHistory;
  }

  async generateReport(): Promise<{
    summary: string;
    recommendations: string[];
    criticalIssues: string[];
    performanceScore: number;
  }> {
    const [health, queryAnalytics, indexAnalytics] = await Promise.all([
      this.getDatabaseHealth(),
      this.getQueryAnalytics(),
      this.getIndexAnalytics(),
    ]);

    const criticalIssues = health.issues
      .filter((issue) => issue.severity === 'critical')
      .map((issue) => issue.message);

    const recommendations = [
      ...health.issues.map((issue) => issue.recommendation),
      ...indexAnalytics.missingIndexes.map(
        (index) =>
          `Consider adding index on ${index.table}(${index.columns.join(', ')})`,
      ),
    ];

    // Calculate performance score (0-100)
    let score = 100;
    score -= health.issues.filter((i) => i.severity === 'critical').length * 30;
    score -= health.issues.filter((i) => i.severity === 'warning').length * 10;
    score -= Math.max(0, (health.performance.avgQueryTime - 100) / 10);
    score = Math.max(0, Math.min(100, score));

    const summary = `Database health: ${health.status.toUpperCase()}. 
      ${health.connections.active}/${health.connections.maxConnections} connections active. 
      Average query time: ${health.performance.avgQueryTime.toFixed(2)}ms. 
      Cache hit ratio: ${health.performance.cacheHitRatio.toFixed(1)}%.`;

    return {
      summary,
      recommendations: [...new Set(recommendations)],
      criticalIssues,
      performanceScore: Math.round(score),
    };
  }
}

// Export singleton instance
export const dbAnalytics = DatabaseAnalytics.getInstance();
