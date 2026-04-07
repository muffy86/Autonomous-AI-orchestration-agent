# API Reference

## Overview

This document provides comprehensive API documentation for the AI Chatbot application, including security utilities, AI features, database operations, and utility functions.

## Table of Contents

- [Security API](#security-api)
- [AI Models API](#ai-models-api)
- [Prompt Optimization API](#prompt-optimization-api)
- [Context Management API](#context-management-api)
- [Database API](#database-api)
- [Utility Functions](#utility-functions)
- [Error Handling](#error-handling)

---

## Security API

### `lib/security.ts`

#### sanitizeHtml(html: string): string

Sanitizes HTML content to prevent XSS attacks.

**Parameters:**
- `html` (string): The HTML string to sanitize

**Returns:**
- `string`: Sanitized HTML safe for rendering

**Example:**
```typescript
import { sanitizeHtml } from '@/lib/security';

const userInput = '<script>alert("xss")</script><p>Safe content</p>';
const safe = sanitizeHtml(userInput);
// Result: '<p>Safe content</p>'
```

---

#### sanitizeText(text: string): string

Sanitizes text content by removing all HTML tags.

**Parameters:**
- `text` (string): The text to sanitize

**Returns:**
- `string`: Text with all HTML tags removed

**Example:**
```typescript
import { sanitizeText } from '@/lib/security';

const unsafeText = '<b>Bold</b> text';
const safe = sanitizeText(unsafeText);
// Result: 'Bold text'
```

---

#### generateSecureToken(): string

Generates a cryptographically secure random token.

**Returns:**
- `string`: A secure random token

**Example:**
```typescript
import { generateSecureToken } from '@/lib/security';

const token = generateSecureToken();
// Result: 'a1b2c3d4e5f6...' (32+ characters)
```

---

#### checkRateLimit(identifier, endpoint, config): RateLimitResult

Checks if a request should be rate limited.

**Parameters:**
- `identifier` (string): Unique identifier (usually IP address)
- `endpoint` (string): API endpoint name
- `config` (object):
  - `windowMs` (number): Time window in milliseconds
  - `max` (number): Maximum requests allowed in window

**Returns:**
- `RateLimitResult`:
  - `allowed` (boolean): Whether request is allowed
  - `remaining` (number): Remaining requests in window
  - `resetTime` (number): Timestamp when limit resets

**Example:**
```typescript
import { checkRateLimit } from '@/lib/security';

const result = checkRateLimit('192.168.1.1', 'chat', {
  windowMs: 60000, // 1 minute
  max: 10,         // 10 requests
});

if (!result.allowed) {
  return Response.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

---

#### validateAndSanitize(data, schema): ValidationResult

Validates and sanitizes data against a Zod schema.

**Parameters:**
- `data` (unknown): Data to validate
- `schema` (ZodSchema): Zod validation schema

**Returns:**
- `ValidationResult`:
  - `success` (boolean): Whether validation succeeded
  - `data` (T | undefined): Validated data if successful
  - `error` (ZodError | undefined): Validation errors if failed

**Example:**
```typescript
import { validateAndSanitize, securitySchemas } from '@/lib/security';

const result = validateAndSanitize(
  { content: 'Hello world' },
  securitySchemas.chatMessage
);

if (result.success) {
  console.log(result.data.content); // 'Hello world'
} else {
  console.error(result.error);
}
```

---

## AI Models API

### `lib/ai/enhanced-models.ts`

#### ModelManager

**Constructor:**
```typescript
const modelManager = new ModelManager();
```

**Methods:**

##### getAllModels(): EnhancedChatModel[]

Returns all available AI models.

```typescript
const models = modelManager.getAllModels();
// Returns array of model configurations
```

##### getModel(modelId: string): EnhancedChatModel | undefined

Gets a specific model by ID.

```typescript
const model = modelManager.getModel('grok-2-1212');
if (model) {
  console.log(model.name); // 'Grok 2'
  console.log(model.capabilities); // { textGeneration: true, ... }
}
```

##### checkRateLimit(modelId: string, tokens: number): RateLimitCheck

Checks if model usage is within rate limits.

```typescript
const check = modelManager.checkRateLimit('grok-2-1212', 1000);

if (!check.allowed) {
  console.log(`Rate limit exceeded. Resets at ${check.resetTime}`);
}
```

**Type Definitions:**

```typescript
interface EnhancedChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  version: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  limits: ModelLimits;
  isAvailable: boolean;
  isRecommended: boolean;
  category: 'general' | 'coding' | 'reasoning' | 'creative' | 'analysis';
  tags: string[];
  releaseDate: string;
}

interface ModelCapabilities {
  textGeneration: boolean;
  codeGeneration: boolean;
  reasoning: boolean;
  vision: boolean;
  functionCalling: boolean;
  streaming: boolean;
  contextLength: number;
  maxTokens: number;
  multimodal: boolean;
  languages: string[];
  specialties: string[];
}
```

---

## Prompt Optimization API

### `lib/ai/prompt-optimizer.ts`

#### PromptOptimizer

**Constructor:**
```typescript
const optimizer = new PromptOptimizer();
```

**Methods:**

##### analyzePrompt(prompt: string): PromptAnalysis

Analyzes prompt quality across multiple dimensions.

```typescript
const analysis = optimizer.analyzePrompt('Tell me about AI');

console.log(analysis.overall);      // 0.28 (28%)
console.log(analysis.clarity);      // 0.5
console.log(analysis.specificity);  // 0.3
console.log(analysis.issues);       // Array of improvement suggestions
```

##### optimizePrompt(prompt: string, category?: string): OptimizationResult

Optimizes a prompt with suggestions for improvement.

```typescript
const result = optimizer.optimizePrompt('write code', 'code');

console.log(result.original);       // 'write code'
console.log(result.optimized);      // Improved version
console.log(result.improvements);   // Array of changes made
console.log(result.score.improvement); // 0.22 (22% improvement)
```

**Type Definitions:**

```typescript
interface PromptAnalysis {
  clarity: number;        // 0-1 score
  specificity: number;    // 0-1 score
  structure: number;      // 0-1 score
  context: number;        // 0-1 score
  examples: number;       // 0-1 score
  overall: number;        // 0-1 overall score
  issues: PromptIssue[];
  strengths: string[];
  weaknesses: string[];
}

interface OptimizationResult {
  original: string;
  optimized: string;
  improvements: Improvement[];
  score: {
    original: number;
    optimized: number;
    improvement: number;
  };
  reasoning: string;
}
```

---

## Context Management API

### `lib/ai/context-manager.ts`

#### ConversationContextManager

**Constructor:**
```typescript
const contextManager = new ConversationContextManager();
```

**Methods:**

##### optimizeContext(messages: Message[], options?: ContextOptions): OptimizedContext

Optimizes conversation context for AI model consumption.

```typescript
const messages = [
  { role: 'user', content: 'What is TypeScript?' },
  { role: 'assistant', content: 'TypeScript is...' },
];

const context = contextManager.optimizeContext(messages, {
  maxTokens: 1000,
});

console.log(context.messages);    // Optimized messages
console.log(context.metadata);    // Context metadata
```

**Type Definitions:**

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ContextOptions {
  maxTokens?: number;
  includeSystemPrompt?: boolean;
  preserveCodeBlocks?: boolean;
}

interface OptimizedContext {
  messages: Message[];
  metadata: {
    originalTokens: number;
    optimizedTokens: number;
    compressionRatio: number;
    entities: string[];
    topics: string[];
  };
}
```

---

## Database API

### `lib/db/optimizations.ts`

#### Query Caching Functions

##### getCachedChats(userId: string, options?: CacheOptions): Promise<Chat[]>

Retrieves user chats with caching.

```typescript
const chats = await getCachedChats('user-123', {
  ttl: 5 * 60 * 1000, // 5 minutes
});
```

##### getCachedMessages(chatId: string, options?: CacheOptions): Promise<DBMessage[]>

Retrieves chat messages with caching.

```typescript
const messages = await getCachedMessages('chat-456', {
  ttl: 2 * 60 * 1000, // 2 minutes
});
```

##### invalidateCache(key: string): void

Invalidates a specific cache entry.

```typescript
invalidateCache('chats:user-123');
```

##### clearCache(): void

Clears all cached data.

```typescript
clearCache();
```

#### Batch Operations

##### batchInsertMessages(messages: NewMessage[], options?: BatchOptions): Promise<void>

Inserts multiple messages in batches for better performance.

```typescript
await batchInsertMessages(messages, {
  batchSize: 100,
  concurrency: 5,
});
```

**Type Definitions:**

```typescript
interface CacheOptions {
  ttl?: number;      // Time-to-live in milliseconds
  force?: boolean;   // Force cache refresh
}

interface BatchOptions {
  batchSize?: number;    // Items per batch (default: 50)
  concurrency?: number;  // Parallel batches (default: 3)
}
```

---

### `lib/db/analytics.ts`

#### Database Health Monitoring

##### getDBHealth(): Promise<HealthReport>

Gets comprehensive database health metrics.

```typescript
const health = await getDBHealth();

console.log(health.isHealthy);      // true/false
console.log(health.slowQueries);    // Slow query list
console.log(health.indexUsage);     // Index statistics
console.log(health.recommendations); // Optimization suggestions
```

---

## Utility Functions

### `lib/utils.ts`

#### cn(...inputs: ClassValue[]): string

Combines class names intelligently.

```typescript
import { cn } from '@/lib/utils';

const className = cn(
  'base-class',
  'additional-class',
  condition && 'conditional-class',
  {
    'active': isActive,
    'disabled': isDisabled,
  }
);
```

#### getLocalStorage(key: string): any

Safely retrieves data from localStorage.

```typescript
import { getLocalStorage } from '@/lib/utils';

const theme = getLocalStorage('theme') || 'light';
```

---

## Error Handling

### `lib/errors.ts`

#### AppError

Base class for application errors.

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  );
}
```

#### Error Types

```typescript
// Validation errors (400)
throw new AppError('Invalid input', 400, {
  field: 'email',
  error: 'Invalid format',
});

// Authentication errors (401)
throw new AppError('Unauthorized', 401);

// Not found errors (404)
throw new AppError('Resource not found', 404, {
  resource: 'chat',
  id: chatId,
});

// Server errors (500)
throw new AppError('Internal server error', 500);
```

#### formatErrorResponse(error: Error): ErrorResponse

Formats error for API response.

```typescript
try {
  // ... operation
} catch (error) {
  const formatted = formatErrorResponse(error);
  return Response.json(formatted, {
    status: formatted.statusCode,
  });
}
```

---

## Rate Limit Configuration

### Default Rate Limits

```typescript
export const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 attempts
  },
  chat: {
    windowMs: 60 * 1000,       // 1 minute
    max: 30,                   // 30 messages
  },
  upload: {
    windowMs: 60 * 1000,       // 1 minute
    max: 10,                   // 10 uploads
  },
  api: {
    windowMs: 60 * 1000,       // 1 minute
    max: 100,                  // 100 requests
  },
};
```

---

## Environment Variables

### Required

```bash
POSTGRES_URL="postgresql://user:password@host:port/database"
AUTH_SECRET="your-secret-key-min-32-chars"
```

### Optional

```bash
# Database
POSTGRES_READ_REPLICA_URL="postgresql://..." # Read replica for scaling

# Redis (for caching)
REDIS_URL="redis://..." # Optional Redis cache

# Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="..." # Vercel Analytics
```

---

## Best Practices

### 1. Always Sanitize User Input

```typescript
import { sanitizeHtml, sanitizeText } from '@/lib/security';

// For HTML content
const safeHtml = sanitizeHtml(userInput);

// For plain text
const safeText = sanitizeText(userInput);
```

### 2. Use Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/security';

const result = checkRateLimit(clientIP, endpoint, config);
if (!result.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### 3. Handle Errors Properly

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  const formatted = formatErrorResponse(error);
  return Response.json(formatted, {
    status: formatted.statusCode,
  });
}
```

### 4. Use Caching for Performance

```typescript
// Cache expensive database queries
const data = await getCachedChats(userId, {
  ttl: 5 * 60 * 1000, // 5 minutes
});
```

### 5. Validate Input with Zod

```typescript
import { z } from 'zod';
import { validateAndSanitize } from '@/lib/security';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(1).max(1000),
});

const result = validateAndSanitize(data, schema);
if (!result.success) {
  return Response.json(
    { error: 'Validation failed', details: result.error },
    { status: 400 }
  );
}
```

---

## Support & Resources

- [GitHub Repository](https://github.com/muffy86/Autonomous-AI-orchestration-agent)
- [Contributing Guide](../CONTRIBUTING.md)
- [Security Policy](../SECURITY.md)
- [Deployment Guide](../DEPLOYMENT.md)

---

**Last Updated**: 2024-11-10  
**Version**: 3.0.24
