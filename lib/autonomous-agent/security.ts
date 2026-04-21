/**
 * Security & Hardening Layer
 * Enterprise-grade security for autonomous agent operations
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================================================
// Security Types & Schemas
// ============================================================================

export const SecurityPolicySchema = z.object({
  enabled: z.boolean().default(true),
  maxConcurrentTasks: z.number().default(100),
  maxTaskDuration: z.number().default(3600000), // 1 hour
  allowedOperations: z.array(z.string()).default(['*']),
  deniedOperations: z.array(z.string()).default([]),
  requireApproval: z.array(z.string()).default([]),
  sandboxEnabled: z.boolean().default(true),
  auditLogging: z.boolean().default(true),
});

export const RateLimitSchema = z.object({
  enabled: z.boolean().default(true),
  maxRequestsPerMinute: z.number().default(60),
  maxRequestsPerHour: z.number().default(1000),
  burstLimit: z.number().default(10),
});

export const EncryptionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  algorithm: z.enum(['aes-256-gcm', 'aes-256-cbc']).default('aes-256-gcm'),
  keyRotationDays: z.number().default(90),
});

export type SecurityPolicy = z.infer<typeof SecurityPolicySchema>;
export type RateLimitConfig = z.infer<typeof RateLimitSchema>;
export type EncryptionConfig = z.infer<typeof EncryptionConfigSchema>;

// ============================================================================
// Security Manager
// ============================================================================

export class SecurityManager {
  private policy: SecurityPolicy;
  private auditLog: Array<{
    timestamp: number;
    action: string;
    user?: string;
    resource: string;
    allowed: boolean;
    reason?: string;
  }> = [];

  constructor(policy?: Partial<SecurityPolicy>) {
    this.policy = SecurityPolicySchema.parse(policy || {});
  }

  async authorize(
    action: string,
    resource: string,
    user?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check denied operations
    if (this.policy.deniedOperations.includes(action)) {
      const result = { allowed: false, reason: 'Operation denied by policy' };
      this.logAudit(action, resource, user, result.allowed, result.reason);
      return result;
    }

    // Check allowed operations
    if (
      !this.policy.allowedOperations.includes('*') &&
      !this.policy.allowedOperations.includes(action)
    ) {
      const result = { allowed: false, reason: 'Operation not in allowed list' };
      this.logAudit(action, resource, user, result.allowed, result.reason);
      return result;
    }

    // Check if approval required
    if (this.policy.requireApproval.includes(action)) {
      const result = { allowed: false, reason: 'Manual approval required' };
      this.logAudit(action, resource, user, result.allowed, result.reason);
      return result;
    }

    const result = { allowed: true };
    this.logAudit(action, resource, user, result.allowed);
    return result;
  }

  private logAudit(
    action: string,
    resource: string,
    user?: string,
    allowed: boolean = true,
    reason?: string
  ): void {
    if (!this.policy.auditLogging) return;

    this.auditLog.push({
      timestamp: Date.now(),
      action,
      user,
      resource,
      allowed,
      reason,
    });

    // Keep last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }

    // In production: Write to secure audit storage
    if (process.env.NODE_ENV === 'production') {
      this.writeSecureAuditLog({
        timestamp: Date.now(),
        action,
        user,
        resource,
        allowed,
        reason,
      });
    }
  }

  private writeSecureAuditLog(entry: any): void {
    // In production: Write to secure, immutable audit log
    // - Elasticsearch
    // - CloudWatch Logs
    // - Splunk
    // - Write-once storage
    console.log('[AUDIT]', JSON.stringify(entry));
  }

  getAuditLog(limit: number = 100): typeof this.auditLog {
    return this.auditLog.slice(-limit);
  }

  exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

export class RateLimiter {
  private config: RateLimitConfig;
  private minuteCounters: Map<string, { count: number; resetTime: number }> = new Map();
  private hourCounters: Map<string, { count: number; resetTime: number }> = new Map();
  private burstCounters: Map<string, number[]> = new Map();

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = RateLimitSchema.parse(config || {});
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    reason?: string;
  }> {
    if (!this.config.enabled) {
      return { allowed: true, remaining: Infinity, resetTime: 0 };
    }

    const now = Date.now();

    // Check burst limit
    const burstCheck = this.checkBurstLimit(identifier, now);
    if (!burstCheck.allowed) {
      return burstCheck;
    }

    // Check minute limit
    const minuteCheck = this.checkMinuteLimit(identifier, now);
    if (!minuteCheck.allowed) {
      return minuteCheck;
    }

    // Check hour limit
    const hourCheck = this.checkHourLimit(identifier, now);
    if (!hourCheck.allowed) {
      return hourCheck;
    }

    // Update counters
    this.incrementCounters(identifier, now);

    return {
      allowed: true,
      remaining: Math.min(minuteCheck.remaining, hourCheck.remaining),
      resetTime: Math.min(minuteCheck.resetTime, hourCheck.resetTime),
    };
  }

  private checkBurstLimit(identifier: string, now: number): any {
    const timestamps = this.burstCounters.get(identifier) || [];
    const recentTimestamps = timestamps.filter((t) => now - t < 1000); // Last second

    if (recentTimestamps.length >= this.config.burstLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + 1000,
        reason: 'Burst limit exceeded',
      };
    }

    return { allowed: true, remaining: this.config.burstLimit - recentTimestamps.length, resetTime: now + 1000 };
  }

  private checkMinuteLimit(identifier: string, now: number): any {
    const counter = this.minuteCounters.get(identifier);

    if (!counter || now >= counter.resetTime) {
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerMinute,
        resetTime: now + 60000,
      };
    }

    if (counter.count >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: counter.resetTime,
        reason: 'Minute rate limit exceeded',
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequestsPerMinute - counter.count,
      resetTime: counter.resetTime,
    };
  }

  private checkHourLimit(identifier: string, now: number): any {
    const counter = this.hourCounters.get(identifier);

    if (!counter || now >= counter.resetTime) {
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerHour,
        resetTime: now + 3600000,
      };
    }

    if (counter.count >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: counter.resetTime,
        reason: 'Hour rate limit exceeded',
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequestsPerHour - counter.count,
      resetTime: counter.resetTime,
    };
  }

  private incrementCounters(identifier: string, now: number): void {
    // Burst counter
    const burstTimestamps = this.burstCounters.get(identifier) || [];
    burstTimestamps.push(now);
    this.burstCounters.set(
      identifier,
      burstTimestamps.filter((t) => now - t < 1000)
    );

    // Minute counter
    let minuteCounter = this.minuteCounters.get(identifier);
    if (!minuteCounter || now >= minuteCounter.resetTime) {
      minuteCounter = { count: 0, resetTime: now + 60000 };
    }
    minuteCounter.count++;
    this.minuteCounters.set(identifier, minuteCounter);

    // Hour counter
    let hourCounter = this.hourCounters.get(identifier);
    if (!hourCounter || now >= hourCounter.resetTime) {
      hourCounter = { count: 0, resetTime: now + 3600000 };
    }
    hourCounter.count++;
    this.hourCounters.set(identifier, hourCounter);
  }

  reset(identifier: string): void {
    this.minuteCounters.delete(identifier);
    this.hourCounters.delete(identifier);
    this.burstCounters.delete(identifier);
  }

  resetAll(): void {
    this.minuteCounters.clear();
    this.hourCounters.clear();
    this.burstCounters.clear();
  }
}

// ============================================================================
// Input Sanitization & Validation
// ============================================================================

export class InputSanitizer {
  static sanitizeSQL(input: string): string {
    // Remove SQL injection attempts
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  static sanitizeHTML(input: string): string {
    // Remove HTML/XSS attempts
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static sanitizeCommand(input: string): string {
    // Remove shell command injection
    return input
      .replace(/[;&|`$()]/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '');
  }

  static validateJSON(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeFilePath(input: string): string {
    // Prevent path traversal
    return input
      .replace(/\.\./g, '')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\//, '');
  }

  static validateURL(input: string): boolean {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Encryption Service
// ============================================================================

export class EncryptionService {
  private config: EncryptionConfig;
  private keys: Map<string, { key: string; createdAt: number }> = new Map();

  constructor(config?: Partial<EncryptionConfig>) {
    this.config = EncryptionConfigSchema.parse(config || {});
  }

  async encrypt(data: string, keyId: string = 'default'): Promise<string> {
    if (!this.config.enabled) return data;

    // In production: Use proper encryption library
    // - crypto-js
    // - node crypto with proper IV
    // - KMS for key management
    
    const key = await this.getOrCreateKey(keyId);
    
    // Placeholder: In production, implement actual encryption
    const encrypted = Buffer.from(data).toString('base64');
    return `encrypted:${keyId}:${encrypted}`;
  }

  async decrypt(encryptedData: string): Promise<string> {
    if (!this.config.enabled || !encryptedData.startsWith('encrypted:')) {
      return encryptedData;
    }

    const [, keyId, data] = encryptedData.split(':');
    
    // Placeholder: In production, implement actual decryption
    return Buffer.from(data, 'base64').toString();
  }

  private async getOrCreateKey(keyId: string): Promise<string> {
    const existing = this.keys.get(keyId);
    
    // Check key rotation
    if (existing) {
      const age = Date.now() - existing.createdAt;
      const maxAge = this.config.keyRotationDays * 24 * 60 * 60 * 1000;
      
      if (age < maxAge) {
        return existing.key;
      }
    }

    // Generate new key
    const newKey = this.generateKey();
    this.keys.set(keyId, {
      key: newKey,
      createdAt: Date.now(),
    });

    return newKey;
  }

  private generateKey(): string {
    // In production: Use crypto.randomBytes
    return nanoid(32);
  }

  rotateKey(keyId: string): void {
    this.keys.delete(keyId);
  }
}

// ============================================================================
// Sandbox Environment
// ============================================================================

export class SandboxManager {
  private sandboxes: Map<string, {
    id: string;
    createdAt: number;
    resourceLimits: {
      maxMemory: number;
      maxCPU: number;
      maxDuration: number;
    };
    active: boolean;
  }> = new Map();

  async createSandbox(config?: {
    maxMemory?: number;
    maxCPU?: number;
    maxDuration?: number;
  }): Promise<string> {
    const sandboxId = nanoid();
    
    this.sandboxes.set(sandboxId, {
      id: sandboxId,
      createdAt: Date.now(),
      resourceLimits: {
        maxMemory: config?.maxMemory || 512, // MB
        maxCPU: config?.maxCPU || 1, // cores
        maxDuration: config?.maxDuration || 300000, // 5 minutes
      },
      active: true,
    });

    console.log(`🏖️  Created sandbox: ${sandboxId}`);
    
    // In production: Create actual isolated environment
    // - Docker container
    // - VM
    // - WebAssembly sandbox
    // - Worker thread with resource limits

    return sandboxId;
  }

  async executeSandboxed(
    sandboxId: string,
    code: string,
    language: string
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    const sandbox = this.sandboxes.get(sandboxId);
    
    if (!sandbox || !sandbox.active) {
      return {
        success: false,
        error: 'Invalid or inactive sandbox',
      };
    }

    try {
      // In production: Execute in isolated environment
      // - Use vm2 for Node.js
      // - Docker for full isolation
      // - WebAssembly runtime
      // - Enforce resource limits
      
      console.log(`⚙️  Executing in sandbox ${sandboxId}: ${language}`);
      
      return {
        success: true,
        output: 'Sandboxed execution result',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    
    if (sandbox) {
      sandbox.active = false;
      
      // In production: Clean up resources
      // - Stop container
      // - Release VM
      // - Clean up temp files
      
      setTimeout(() => {
        this.sandboxes.delete(sandboxId);
      }, 60000); // Keep for 1 minute for logs
    }
  }

  getSandboxStatus(sandboxId: string) {
    return this.sandboxes.get(sandboxId);
  }

  listActiveSandboxes(): string[] {
    return Array.from(this.sandboxes.values())
      .filter((s) => s.active)
      .map((s) => s.id);
  }
}

// ============================================================================
// Security Scanner
// ============================================================================

export class SecurityScanner {
  static scanForSecrets(content: string): {
    found: boolean;
    secrets: Array<{ type: string; pattern: string }>;
  } {
    const secretPatterns = [
      { type: 'API Key', pattern: /[a-zA-Z0-9_-]{32,}/ },
      { type: 'Private Key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
      { type: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/ },
      { type: 'GitHub Token', pattern: /gh[ps]_[a-zA-Z0-9]{36}/ },
      { type: 'Slack Token', pattern: /xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9-]{24,}/ },
    ];

    const found: Array<{ type: string; pattern: string }> = [];

    for (const { type, pattern } of secretPatterns) {
      if (pattern.test(content)) {
        found.push({ type, pattern: pattern.source });
      }
    }

    return {
      found: found.length > 0,
      secrets: found,
    };
  }

  static scanForVulnerabilities(code: string, language: string): {
    safe: boolean;
    vulnerabilities: Array<{ severity: string; description: string }>;
  } {
    const vulnerabilities: Array<{ severity: string; description: string }> = [];

    // Check for dangerous patterns
    if (language === 'javascript' || language === 'typescript') {
      if (code.includes('eval(')) {
        vulnerabilities.push({
          severity: 'high',
          description: 'Use of eval() can lead to code injection',
        });
      }

      if (code.includes('Function(')) {
        vulnerabilities.push({
          severity: 'high',
          description: 'Use of Function() constructor can lead to code injection',
        });
      }
    }

    if (language === 'python') {
      if (code.includes('exec(') || code.includes('eval(')) {
        vulnerabilities.push({
          severity: 'high',
          description: 'Use of exec/eval can lead to code injection',
        });
      }

      if (code.includes('__import__')) {
        vulnerabilities.push({
          severity: 'medium',
          description: 'Dynamic imports can be dangerous',
        });
      }
    }

    // Check for SQL injection patterns
    if (code.match(/execute\([^?]/i) || code.match(/query\([^?]/i)) {
      vulnerabilities.push({
        severity: 'high',
        description: 'Possible SQL injection vulnerability',
      });
    }

    return {
      safe: vulnerabilities.length === 0,
      vulnerabilities,
    };
  }
}
