/**
 * Resilience & Fault Tolerance Layer
 * Circuit breakers, retries, fallbacks, and recovery mechanisms
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================================================
// Resilience Types & Schemas
// ============================================================================

export const CircuitBreakerConfigSchema = z.object({
  failureThreshold: z.number().default(5),
  successThreshold: z.number().default(2),
  timeout: z.number().default(60000), // 1 minute
  halfOpenRequests: z.number().default(3),
});

export const RetryConfigSchema = z.object({
  maxAttempts: z.number().default(3),
  initialDelay: z.number().default(1000),
  maxDelay: z.number().default(30000),
  backoffMultiplier: z.number().default(2),
  jitter: z.boolean().default(true),
});

export const FallbackConfigSchema = z.object({
  enabled: z.boolean().default(true),
  fallbackValue: z.any().optional(),
  fallbackFunction: z.any().optional(),
});

export type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;
export type RetryConfig = z.infer<typeof RetryConfigSchema>;
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;

// ============================================================================
// Circuit Breaker
// ============================================================================

enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private halfOpenAttempts = 0;
  private nextAttemptTime = 0;
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rejectedRequests: 0,
    stateChanges: 0,
  };

  constructor(
    private name: string,
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.config = CircuitBreakerConfigSchema.parse(config || {});
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        this.metrics.rejectedRequests++;
        throw new Error(
          `Circuit breaker ${this.name} is OPEN. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`
        );
      }
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    if (
      this.state === CircuitState.HALF_OPEN &&
      this.halfOpenAttempts >= this.config.halfOpenRequests
    ) {
      this.metrics.rejectedRequests++;
      throw new Error(
        `Circuit breaker ${this.name} is HALF_OPEN and at capacity`
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.metrics.successfulRequests++;
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      this.halfOpenAttempts++;

      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private onFailure(): void {
    this.metrics.failedRequests++;
    this.failures++;
    this.successes = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.metrics.stateChanges++;

    console.log(
      `⚡ Circuit breaker ${this.name}: ${oldState} → ${newState}`
    );

    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.timeout;
      this.halfOpenAttempts = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
      this.halfOpenAttempts = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts = 0;
      this.successes = 0;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentState: this.state,
      failures: this.failures,
      successes: this.successes,
      successRate:
        this.metrics.totalRequests > 0
          ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
          : 0,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.nextAttemptTime = 0;
  }
}

// ============================================================================
// Retry Manager
// ============================================================================

export class RetryManager {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = RetryConfigSchema.parse(config || {});
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          console.log(
            `✓ ${operationName} succeeded on attempt ${attempt + 1}`
          );
        }
        
        return result;
      } catch (error) {
        attempt++;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt >= this.config.maxAttempts) {
          console.error(
            `✗ ${operationName} failed after ${this.config.maxAttempts} attempts`
          );
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.log(
          `⟳ ${operationName} failed (attempt ${attempt}/${this.config.maxAttempts}), retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    let delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
      this.config.maxDelay
    );

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Fallback Manager
// ============================================================================

export class FallbackManager {
  private fallbacks: Map<string, FallbackConfig> = new Map();

  registerFallback(operationId: string, config: FallbackConfig): void {
    this.fallbacks.set(operationId, config);
  }

  async executeWithFallback<T>(
    operationId: string,
    primaryOperation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    const config = this.fallbacks.get(operationId);

    try {
      return await primaryOperation();
    } catch (error) {
      console.warn(
        `⚠️  Primary operation ${operationId} failed, attempting fallback...`
      );

      if (fallbackOperation) {
        try {
          return await fallbackOperation();
        } catch (fallbackError) {
          console.error(`✗ Fallback operation also failed for ${operationId}`);
          throw fallbackError;
        }
      }

      if (config?.enabled) {
        if (config.fallbackFunction) {
          return await config.fallbackFunction();
        }
        if (config.fallbackValue !== undefined) {
          return config.fallbackValue as T;
        }
      }

      throw error;
    }
  }
}

// ============================================================================
// Health Check System
// ============================================================================

export interface HealthCheck {
  name: string;
  check: () => Promise<{ healthy: boolean; details?: any }>;
  critical: boolean;
  timeout: number;
}

export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private lastResults: Map<string, {
    healthy: boolean;
    timestamp: number;
    duration: number;
    details?: any;
  }> = new Map();

  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  async runHealthChecks(): Promise<{
    healthy: boolean;
    checks: Record<string, any>;
  }> {
    const results: Record<string, any> = {};
    let overallHealthy = true;

    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, check]) => {
        const startTime = Date.now();
        
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
          );

          const result = await Promise.race([
            check.check(),
            timeoutPromise,
          ]) as { healthy: boolean; details?: any };

          const duration = Date.now() - startTime;

          this.lastResults.set(name, {
            healthy: result.healthy,
            timestamp: Date.now(),
            duration,
            details: result.details,
          });

          results[name] = {
            healthy: result.healthy,
            duration,
            critical: check.critical,
            details: result.details,
          };

          if (check.critical && !result.healthy) {
            overallHealthy = false;
          }
        } catch (error) {
          const duration = Date.now() - startTime;

          results[name] = {
            healthy: false,
            duration,
            critical: check.critical,
            error: error instanceof Error ? error.message : String(error),
          };

          if (check.critical) {
            overallHealthy = false;
          }
        }
      }
    );

    await Promise.all(checkPromises);

    return {
      healthy: overallHealthy,
      checks: results,
    };
  }

  getLastResults() {
    return Object.fromEntries(this.lastResults);
  }
}

// ============================================================================
// Bulkhead Pattern (Resource Isolation)
// ============================================================================

export class Bulkhead {
  private semaphore: number;
  private queue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private metrics = {
    acquired: 0,
    released: 0,
    rejected: 0,
    queueSize: 0,
  };

  constructor(
    private maxConcurrent: number,
    private maxQueue: number = 100
  ) {
    this.semaphore = maxConcurrent;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();

    try {
      return await operation();
    } finally {
      this.release();
    }
  }

  private async acquire(): Promise<void> {
    if (this.semaphore > 0) {
      this.semaphore--;
      this.metrics.acquired++;
      return;
    }

    if (this.queue.length >= this.maxQueue) {
      this.metrics.rejected++;
      throw new Error('Bulkhead queue is full');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.metrics.queueSize = this.queue.length;
    });
  }

  private release(): void {
    const next = this.queue.shift();
    this.metrics.queueSize = this.queue.length;

    if (next) {
      next.resolve(undefined);
      this.metrics.acquired++;
    } else {
      this.semaphore++;
    }

    this.metrics.released++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      available: this.semaphore,
      active: this.maxConcurrent - this.semaphore,
      queueSize: this.queue.length,
    };
  }
}

// ============================================================================
// Chaos Engineering (Testing Resilience)
// ============================================================================

export class ChaosMonkey {
  private enabled = false;
  private failureRate = 0.1; // 10% failure rate
  private latencyMin = 0;
  private latencyMax = 1000;

  constructor(
    enabled: boolean = false,
    failureRate: number = 0.1
  ) {
    this.enabled = enabled;
    this.failureRate = failureRate;
  }

  async maybeInjectFailure(): Promise<void> {
    if (!this.enabled) return;

    // Random failure
    if (Math.random() < this.failureRate) {
      const failures = [
        'Network timeout',
        'Service unavailable',
        'Rate limit exceeded',
        'Internal server error',
        'Connection refused',
      ];

      const randomFailure = failures[Math.floor(Math.random() * failures.length)];
      console.log(`🐵 Chaos Monkey: Injecting failure - ${randomFailure}`);
      throw new Error(randomFailure);
    }

    // Random latency
    if (Math.random() < 0.3) {
      const latency = Math.floor(
        Math.random() * (this.latencyMax - this.latencyMin) + this.latencyMin
      );
      console.log(`🐵 Chaos Monkey: Injecting ${latency}ms latency`);
      await new Promise((resolve) => setTimeout(resolve, latency));
    }
  }

  enable(failureRate: number = 0.1): void {
    this.enabled = true;
    this.failureRate = failureRate;
    console.log(`🐵 Chaos Monkey enabled (${failureRate * 100}% failure rate)`);
  }

  disable(): void {
    this.enabled = false;
    console.log('🐵 Chaos Monkey disabled');
  }

  setLatencyRange(min: number, max: number): void {
    this.latencyMin = min;
    this.latencyMax = max;
  }
}

// ============================================================================
// Dead Letter Queue
// ============================================================================

export class DeadLetterQueue<T> {
  private queue: Array<{
    id: string;
    item: T;
    error: string;
    timestamp: number;
    attempts: number;
  }> = [];
  private maxSize = 1000;

  add(item: T, error: string, attempts: number = 0): void {
    this.queue.push({
      id: nanoid(),
      item,
      error,
      timestamp: Date.now(),
      attempts,
    });

    // Maintain size limit
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }

    console.log(`💀 Added item to dead letter queue (size: ${this.queue.length})`);
  }

  getAll(): typeof this.queue {
    return [...this.queue];
  }

  getById(id: string) {
    return this.queue.find((item) => item.id === id);
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }
}
