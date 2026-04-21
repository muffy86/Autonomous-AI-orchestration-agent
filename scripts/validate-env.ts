#!/usr/bin/env tsx

/**
 * Environment Validation Script
 * 
 * Checks that all required environment variables are set
 * and validates their format.
 */

import { config } from 'dotenv'
import { z } from 'zod'

// Load environment variables
config()

const envSchema = z.object({
  // Required
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  XAI_API_KEY: z.string().min(1, 'XAI_API_KEY is required'),
  POSTGRES_URL: z.string().url('POSTGRES_URL must be a valid URL').or(
    z.string().regex(/^postgresql:\/\//, 'POSTGRES_URL must start with postgresql://')
  ),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),
  
  // Optional
  REDIS_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

type EnvConfig = z.infer<typeof envSchema>

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function validateEnvironment(): boolean {
  log('\n🔍 Validating Environment Configuration...\n', 'cyan')
  
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const parsed = envSchema.safeParse(process.env)
    
    if (!parsed.success) {
      parsed.error.errors.forEach(err => {
        const field = err.path.join('.')
        errors.push(`❌ ${field}: ${err.message}`)
      })
    }
    
    // Check optional but recommended variables
    if (!process.env.REDIS_URL) {
      warnings.push('⚠️  REDIS_URL not set (optional, but recommended for rate limiting)')
    }
    
    // Display results
    if (errors.length > 0) {
      log('Required Variables Missing or Invalid:', 'red')
      errors.forEach(err => log(`  ${err}`, 'red'))
      log('\n', 'reset')
    }
    
    if (warnings.length > 0) {
      log('Warnings:', 'yellow')
      warnings.forEach(warn => log(`  ${warn}`, 'yellow'))
      log('\n', 'reset')
    }
    
    if (errors.length === 0) {
      log('✅ All required environment variables are configured!', 'green')
      
      if (warnings.length === 0) {
        log('✅ All optional variables are configured!', 'green')
      }
      
      log('\n📋 Configuration Summary:', 'blue')
      log(`  AUTH_SECRET: ${process.env.AUTH_SECRET ? '✅ Set' : '❌ Missing'}`, 'reset')
      log(`  XAI_API_KEY: ${process.env.XAI_API_KEY ? '✅ Set' : '❌ Missing'}`, 'reset')
      log(`  POSTGRES_URL: ${process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing'}`, 'reset')
      log(`  BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? '✅ Set' : '❌ Missing'}`, 'reset')
      log(`  REDIS_URL: ${process.env.REDIS_URL ? '✅ Set' : '⚠️  Not set (optional)'}`, 'reset')
      
      log('\n✨ Environment is ready!', 'green')
      log('\nNext steps:', 'cyan')
      log('  1. Run migrations: pnpm db:migrate', 'reset')
      log('  2. Start development: pnpm dev', 'reset')
      log('  3. Run tests: pnpm test:unit\n', 'reset')
      
      return true
    }
    
    log('❌ Environment validation failed!', 'red')
    log('\nPlease fix the errors above and try again.', 'reset')
    log('See SETUP.md for detailed configuration instructions.\n', 'cyan')
    
    return false
    
  } catch (error) {
    log(`\n❌ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red')
    return false
  }
}

// Run validation
const isValid = validateEnvironment()
process.exit(isValid ? 0 : 1)
