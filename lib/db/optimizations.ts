/**
 * Database Optimization System
 * Provides query optimization, caching, indexing, and performance monitoring
 */

import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { chat, message, user, document, vote, stream } from './schema';
import type { Chat, DBMessage, User, Document } from './schema';

// Enhanced database configuration
const dbConfig = {
  // Connection pooling
  max: 20, // Maximum connections in pool
  idle_timeout: 20, // Idle timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds

  // Query optimization
  prepare: true, // Use prepared statements
  transform: {
    undefined: null, // Transform undefined to null
  },

  // Performance monitoring
  debug: process.env.NODE_ENV === 'development',
  onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
};

// Enhanced database client with optimizations
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  throw new Error('POSTGRES_URL environment variable is not set');
}
const client = postgres(postgresUrl, dbConfig);
const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
});

// Query cache for frequently accessed data
class QueryCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

const queryCache = new QueryCache();

// Performance monitoring
class DatabaseMetrics {
  private queryTimes: number[] = [];
  private queryCount = 0;
  private errorCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordQuery(duration: number): void {
    this.queryTimes.push(duration);
    this.queryCount++;

    // Keep only last 1000 query times
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getMetrics() {
    const avgQueryTime =
      this.queryTimes.length > 0
        ? this.queryTimes.reduce((sum, time) => sum + time, 0) /
          this.queryTimes.length
        : 0;

    const p95QueryTime =
      this.queryTimes.length > 0
        ? this.queryTimes.sort((a, b) => a - b)[
            Math.floor(this.queryTimes.length * 0.95)
          ]
        : 0;

    const cacheHitRate =
      this.cacheHits + this.cacheMisses > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0;

    return {
      queryCount: this.queryCount,
      errorCount: this.errorCount,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      p95QueryTime: Math.round(p95QueryTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      cacheStats: queryCache.getStats(),
    };
  }

  reset(): void {
    this.queryTimes = [];
    this.queryCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

const dbMetrics = new DatabaseMetrics();

// Query wrapper with caching and metrics
async function executeQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey?: string,
  cacheTTL?: number,
): Promise<T> {
  const startTime = Date.now();

  try {
    // Check cache first
    if (cacheKey) {
      const cached = queryCache.get(cacheKey);
      if (cached !== null) {
        dbMetrics.recordCacheHit();
        return cached;
      }
      dbMetrics.recordCacheMiss();
    }

    // Execute query
    const result = await queryFn();

    // Cache result if cache key provided
    if (cacheKey) {
      queryCache.set(cacheKey, result, cacheTTL);
    }

    // Record metrics
    const duration = Date.now() - startTime;
    dbMetrics.recordQuery(duration);

    return result;
  } catch (error) {
    dbMetrics.recordError();
    throw error;
  }
}

// Optimized query functions
export const optimizedQueries = {
  // User queries with caching
  async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;

    return executeQuery(
      async () => {
        const users = await db
          .select()
          .from(user)
          .where(eq(user.email, email))
          .limit(1);
        return users[0] || null;
      },
      cacheKey,
      10 * 60 * 1000, // 10 minutes cache
    );
  },

  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `user:id:${id}`;

    return executeQuery(
      async () => {
        const users = await db
          .select()
          .from(user)
          .where(eq(user.id, id))
          .limit(1);
        return users[0] || null;
      },
      cacheKey,
      10 * 60 * 1000, // 10 minutes cache
    );
  },

  // Chat queries with optimized joins and caching
  async getChatWithMessageCount(
    chatId: string,
  ): Promise<(Chat & { messageCount: number }) | null> {
    const cacheKey = `chat:with-count:${chatId}`;

    return executeQuery(
      async () => {
        const result = await db
          .select({
            id: chat.id,
            createdAt: chat.createdAt,
            title: chat.title,
            userId: chat.userId,
            visibility: chat.visibility,
            messageCount: count(message.id),
          })
          .from(chat)
          .leftJoin(message, eq(chat.id, message.chatId))
          .where(eq(chat.id, chatId))
          .groupBy(
            chat.id,
            chat.createdAt,
            chat.title,
            chat.userId,
            chat.visibility,
          )
          .limit(1);

        return result[0] || null;
      },
      cacheKey,
      2 * 60 * 1000, // 2 minutes cache
    );
  },

  async getRecentChatsByUserId(userId: string, limit = 10): Promise<Chat[]> {
    const cacheKey = `chats:recent:${userId}:${limit}`;

    return executeQuery(
      async () => {
        return await db
          .select()
          .from(chat)
          .where(eq(chat.userId, userId))
          .orderBy(desc(chat.createdAt))
          .limit(limit);
      },
      cacheKey,
      1 * 60 * 1000, // 1 minute cache
    );
  },

  // Message queries with pagination optimization
  async getMessagesByChatIdPaginated(
    chatId: string,
    limit = 50,
    offset = 0,
  ): Promise<DBMessage[]> {
    const cacheKey = `messages:${chatId}:${limit}:${offset}`;

    return executeQuery(
      async () => {
        return await db
          .select()
          .from(message)
          .where(eq(message.chatId, chatId))
          .orderBy(asc(message.createdAt))
          .limit(limit)
          .offset(offset);
      },
      cacheKey,
      30 * 1000, // 30 seconds cache
    );
  },

  async getLatestMessagesByChatId(
    chatId: string,
    limit = 10,
  ): Promise<DBMessage[]> {
    const cacheKey = `messages:latest:${chatId}:${limit}`;

    return executeQuery(
      async () => {
        return await db
          .select()
          .from(message)
          .where(eq(message.chatId, chatId))
          .orderBy(desc(message.createdAt))
          .limit(limit);
      },
      cacheKey,
      30 * 1000, // 30 seconds cache
    );
  },

  // Document queries with full-text search optimization
  async searchDocuments(
    userId: string,
    searchTerm: string,
    limit = 20,
  ): Promise<Document[]> {
    return executeQuery(async () => {
      return await db
        .select()
        .from(document)
        .where(
          and(
            eq(document.userId, userId),
            sql`to_tsvector('english', ${document.title} || ' ' || coalesce(${document.content}, '')) @@ plainto_tsquery('english', ${searchTerm})`,
          ),
        )
        .orderBy(desc(document.createdAt))
        .limit(limit);
    });
  },

  // Aggregation queries with caching
  async getUserStats(userId: string): Promise<{
    chatCount: number;
    messageCount: number;
    documentCount: number;
    totalVotes: number;
  }> {
    const cacheKey = `user:stats:${userId}`;

    return executeQuery(
      async () => {
        const [chatStats] = await db
          .select({ count: count() })
          .from(chat)
          .where(eq(chat.userId, userId));

        const [messageStats] = await db
          .select({ count: count() })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(eq(chat.userId, userId));

        const [documentStats] = await db
          .select({ count: count() })
          .from(document)
          .where(eq(document.userId, userId));

        const [voteStats] = await db
          .select({ count: count() })
          .from(vote)
          .innerJoin(chat, eq(vote.chatId, chat.id))
          .where(eq(chat.userId, userId));

        return {
          chatCount: chatStats.count,
          messageCount: messageStats.count,
          documentCount: documentStats.count,
          totalVotes: voteStats.count,
        };
      },
      cacheKey,
      5 * 60 * 1000, // 5 minutes cache
    );
  },

  // Batch operations for better performance
  async batchCreateMessages(
    messages: Array<{
      chatId: string;
      role: string;
      parts: any;
      attachments: any;
      createdAt: Date;
    }>,
  ): Promise<void> {
    return executeQuery(async () => {
      await db.insert(message).values(messages);

      // Invalidate related caches
      const chatIds = [...new Set(messages.map((m) => m.chatId))];
      chatIds.forEach((chatId) => {
        queryCache.invalidate(`messages:${chatId}`);
        queryCache.invalidate(`chat:with-count:${chatId}`);
      });
    });
  },

  async batchDeleteMessages(messageIds: string[]): Promise<void> {
    return executeQuery(async () => {
      // Get chat IDs before deletion for cache invalidation
      const messagesToDelete = await db
        .select({ chatId: message.chatId })
        .from(message)
        .where(sql`${message.id} = ANY(${messageIds})`);

      await db.delete(message).where(sql`${message.id} = ANY(${messageIds})`);

      // Invalidate related caches
      const chatIds = [...new Set(messagesToDelete.map((m) => m.chatId))];
      chatIds.forEach((chatId) => {
        queryCache.invalidate(`messages:${chatId}`);
        queryCache.invalidate(`chat:with-count:${chatId}`);
      });
    });
  },
};

// Database maintenance functions
export const dbMaintenance = {
  // Analyze query performance
  async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{ query: string; avg_time: number; calls: number }>;
    indexUsage: Array<{ table: string; index: string; usage: number }>;
    tableStats: Array<{ table: string; size: string; rows: number }>;
  }> {
    return executeQuery(async () => {
      // Get slow queries
      const slowQueries = await db.execute(sql`
          SELECT query, mean_time as avg_time, calls
          FROM pg_stat_statements
          WHERE mean_time > 100
          ORDER BY mean_time DESC
          LIMIT 10
        `);

      // Get index usage
      const indexUsage = await db.execute(sql`
          SELECT 
            schemaname || '.' || tablename as table,
            indexname as index,
            idx_scan as usage
          FROM pg_stat_user_indexes
          ORDER BY idx_scan DESC
          LIMIT 20
        `);

      // Get table statistics
      const tableStats = await db.execute(sql`
          SELECT 
            schemaname || '.' || tablename as table,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            n_tup_ins + n_tup_upd + n_tup_del as rows
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);

      return {
        slowQueries: slowQueriesas any[],
        indexUsage: indexUsageas any[],
        tableStats: tableStatsas any[],
      };
    });
  },

  // Create recommended indexes
  async createRecommendedIndexes(): Promise<string[]> {
    const indexQueries = [
      // Chat queries optimization
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_user_created 
       ON "Chat" (userId, createdAt DESC)`,

      // Message queries optimization
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_created 
       ON "Message_v2" (chatId, createdAt ASC)`,

      // Document search optimization
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_user_created 
       ON "Document" (userId, createdAt DESC)`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_search 
       ON "Document" USING gin(to_tsvector('english', title || ' ' || coalesce(content, '')))`,

      // Vote queries optimization
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_chat_message 
       ON "Vote_v2" (chatId, messageId)`,

      // Stream queries optimization
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_chat_created 
       ON "Stream" (chatId, createdAt DESC)`,
    ];

    const createdIndexes: string[] = [];

    for (const indexQuery of indexQueries) {
      try {
        await db.execute(sql.raw(indexQuery));
        createdIndexes.push(indexQuery);
      } catch (error) {
        console.warn(`Failed to create index: ${indexQuery}`, error);
      }
    }

    return createdIndexes;
  },

  // Vacuum and analyze tables
  async optimizeTables(): Promise<void> {
    const tables = [
      'User',
      'Chat',
      'Message_v2',
      'Document',
      'Vote_v2',
      'Stream',
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`VACUUM ANALYZE "${table}"`));
      } catch (error) {
        console.warn(`Failed to optimize table ${table}:`, error);
      }
    }
  },

  // Clean up old data
  async cleanupOldData(daysToKeep = 90): Promise<{
    deletedMessages: number;
    deletedStreams: number;
    deletedVotes: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return executeQuery(async () => {
      // Delete old messages
      const deletedMessages = await db
        .delete(message)
        .where(sql`${message.createdAt} < ${cutoffDate}`)
        .returning({ id: message.id });

      // Delete old streams
      const deletedStreams = await db
        .delete(stream)
        .where(sql`${stream.createdAt} < ${cutoffDate}`)
        .returning({ id: stream.id });

      // Delete orphaned votes
      const deletedVotes = await db
        .delete(vote)
        .where(sql`
            NOT EXISTS (
              SELECT 1 FROM "Message_v2" m 
              WHERE m.id = ${vote.messageId}
            )
          `)
        .returning({ chatId: vote.chatId });

      // Clear related caches
      queryCache.clear();

      return {
        deletedMessages: deletedMessages.length,
        deletedStreams: deletedStreams.length,
        deletedVotes: deletedVotes.length,
      };
    });
  },
};

// Connection pool monitoring
export const connectionPool = {
  getStats(): {
    totalConnections: number;
    idleConnections: number;
    activeConnections: number;
  } {
    // Note: postgres.js doesn't expose detailed pool stats
    // This is a placeholder for monitoring integration
    return {
      totalConnections: dbConfig.max,
      idleConnections: 0,
      activeConnections: 0,
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  },
};

// Export enhanced database instance and utilities
export { db, queryCache, dbMetrics };

// Cache invalidation helpers
export const cacheInvalidation = {
  invalidateUser(userId: string): void {
    queryCache.invalidate(`user:${userId}`);
    queryCache.invalidate(`chats:recent:${userId}`);
    queryCache.invalidate(`user:stats:${userId}`);
  },

  invalidateChat(chatId: string): void {
    queryCache.invalidate(`chat:${chatId}`);
    queryCache.invalidate(`messages:${chatId}`);
  },

  invalidateMessage(chatId: string): void {
    queryCache.invalidate(`messages:${chatId}`);
    queryCache.invalidate(`chat:with-count:${chatId}`);
  },

  invalidateAll(): void {
    queryCache.clear();
  },
};
