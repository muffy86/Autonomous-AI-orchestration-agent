/**
 * Environment variable validation and management
 * Validates required environment variables on startup
 */

import { z } from 'zod';

/**
 * Schema for environment variables
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Authentication
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Database
  POSTGRES_URL: z.string().url('POSTGRES_URL must be a valid URL'),
  POSTGRES_READ_REPLICA_URL: z.string().url().optional(),
  
  // Storage (optional)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  
  // Caching (optional)
  REDIS_URL: z.string().url().optional(),
  
  // Monitoring (optional)
  VERCEL_URL: z.string().optional(),
  
  // API Keys (optional - depends on AI provider)
  XAI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 */
let validatedEnv: Env | null = null;

/**
 * Validate environment variables
 * Call this on application startup
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    
    // In production, throw error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
    
    // In development, warn but continue
    console.warn('⚠️  Continuing with invalid environment (development mode)');
    return process.env as Env;
  }

  validatedEnv = result.data;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
  }

  return validatedEnv;
}

/**
 * Get validated environment variables
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

/**
 * Check if a specific environment variable is set
 */
export function hasEnvVar(key: keyof Env): boolean {
  const env = getEnv();
  return env[key] !== undefined && env[key] !== null && env[key] !== '';
}

/**
 * Get environment variable with type safety
 */
export function getEnvVar<K extends keyof Env>(
  key: K,
  fallback?: Env[K],
): Env[K] {
  const env = getEnv();
  return env[key] ?? fallback ?? ('' as Env[K]);
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}
