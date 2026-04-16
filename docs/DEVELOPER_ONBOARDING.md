# Developer Onboarding Guide

Welcome to the AI Chatbot project! This guide will help you get up and running quickly.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Prerequisites

### Required Tools

- **Node.js**: v20 or higher
- **pnpm**: v9.12.3 (recommended package manager)
- **Git**: Latest version
- **PostgreSQL**: v14 or higher (or Docker)

### Recommended Tools

- **VS Code**: With extensions:
  - ESLint
  - Biome
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
- **Docker Desktop**: For local database
- **Postman** or **Thunder Client**: For API testing

### Accounts Needed

- GitHub account (for contributing)
- Vercel account (for deployment, optional)
- Database provider account (Neon, Supabase, or local PostgreSQL)

## Getting Started

###  1. Clone the Repository

```bash
git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
cd Autonomous-AI-orchestration-agent
```

### 2. Install Dependencies

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your values
```

**Required Environment Variables:**

```env
# Database
POSTGRES_URL="postgresql://user:password@localhost:5432/ai_chatbot"

# Authentication
AUTH_SECRET="your-secret-key-minimum-32-characters-long"

# AI Provider (xAI/OpenAI/etc)
XAI_API_KEY="your-xai-api-key"

# Optional: Read replica for scaling
POSTGRES_READ_REPLICA_URL="postgresql://..."

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"
```

### 4. Set Up Database

**Option A: Using Docker (Recommended for Development)**

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name ai-chatbot-postgres \
  -e POSTGRES_DB=ai_chatbot \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14

# Your POSTGRES_URL will be:
# postgresql://postgres:postgres@localhost:5432/ai_chatbot
```

**Option B: Using Cloud Provider**

- **Neon**: https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

### 5. Run Database Migrations

```bash
pnpm db:migrate
```

Expected output:
```
⏳ Running migrations...
✅ Migrations completed successfully in 1234ms
📊 Applied 7 migration(s)
```

### 6. Start Development Server

```bash
pnpm dev
```

Your app should now be running at http://localhost:3000! 🎉

## Development Workflow

### Day-to-Day Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes

# 4. Run tests
pnpm test:all

# 5. Lint your code
pnpm lint:fix

# 6. Commit your changes
git add .
git commit -m "feat: add your feature"

# 7. Push to GitHub
git push origin feature/your-feature-name

# 8. Create a Pull Request on GitHub
```

### Before Committing

Always run these commands:

```bash
# Fix linting issues
pnpm lint:fix

# Run all tests
pnpm test:all

# Build to catch errors
pnpm build
```

### Git Commit Messages

Follow conventional commits:

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi-colons, etc.
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

## Project Structure

```
ai-chatbot/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (chat)/              # Chat interface
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # UI primitives
│   └── ...                  # Feature components
├── lib/                     # Shared utilities
│   ├── ai/                  # AI-related code
│   ├── db/                  # Database code
│   └── ...                  # Other utilities
├── __tests__/               # Tests
│   ├── integration/         # Integration tests
│   └── ...                  # Unit tests
├── docs/                    # Documentation
├── public/                  # Static assets
└── .github/                 # GitHub configuration
```

### Key Directories

**`app/`** - Next.js pages and API routes
- Uses App Router (not Pages Router)
- Server Components by default
- API routes in `app/api/`

**`components/`** - Reusable React components
- `ui/` - shadcn/ui components
- Feature-specific components at root

**`lib/`** - Business logic and utilities
- `ai/` - AI models, prompts, context management
- `db/` - Database queries, migrations, optimizations
- `security.ts` - Security utilities

**`__tests__/`** - Test files
- Mirror the structure of source files
- Integration tests in `integration/`

## Key Concepts

### 1. React Server Components (RSC)

Components are Server Components by default:

```typescript
// app/page.tsx - Server Component (default)
export default async function Page() {
  const data = await fetchData(); // Can use async/await!
  return <div>{data}</div>;
}
```

Use Client Components when needed:

```typescript
// components/client-component.tsx
'use client'; // Required for client-side interactivity

import { useState } from 'react';

export function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 2. Database with Drizzle ORM

```typescript
import { db } from '@/lib/db/optimizations';
import { chat, message } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Query with caching
const chats = await getCachedChats(userId);

// Direct query
const messages = await db
  .select()
  .from(message)
  .where(eq(message.chatId, chatId));
```

### 3. AI Integration

```typescript
import { ModelManager } from '@/lib/ai/enhanced-models';
import { PromptOptimizer } from '@/lib/ai/prompt-optimizer';

// Get AI model
const modelManager = new ModelManager();
const model = modelManager.getModel('grok-2-1212');

// Optimize prompts
const optimizer = new PromptOptimizer();
const optimized = optimizer.optimizePrompt('Tell me about AI', 'general');
```

### 4. Security Best Practices

```typescript
import { sanitizeHtml, checkRateLimit } from '@/lib/security';

// Always sanitize user input
const safeHtml = sanitizeHtml(userInput);

// Apply rate limiting
const rateLimit = checkRateLimit(ip, 'api/chat', {
  windowMs: 60000,
  max: 10,
});

if (!rateLimit.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## Common Tasks

### Adding a New API Route

```typescript
// app/api/your-route/route.ts
import { NextRequest } from 'next/server';
import { sanitizeHtml, checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.ip || 'unknown';
  const rateLimit = checkRateLimit(ip, 'your-route', {
    windowMs: 60000,
    max: 10,
  });

  if (!rateLimit.allowed) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Parse and validate input
  const body = await request.json();
  const safeData = sanitizeHtml(body.content);

  // Your logic here
  const result = await doSomething(safeData);

  return Response.json(result);
}
```

### Adding a New Database Table

1. **Define schema in `lib/db/schema.ts`:**

```typescript
export const yourTable = pgTable('your_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull(),
});
```

2. **Generate migration:**

```bash
pnpm db:generate
```

3. **Run migration:**

```bash
pnpm db:migrate
```

### Adding a New Test

```typescript
// __tests__/your-feature.test.ts
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '@/lib/your-module';

describe('YourFeature', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => yourFunction('')).toThrow();
  });
});
```

**Run tests:**

```bash
# All tests
pnpm test:all

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# Watch mode
pnpm test:unit:watch
```

### Adding a New Component

```typescript
// components/your-component.tsx
import { cn } from '@/lib/utils';

interface YourComponentProps {
  className?: string;
  title: string;
}

export function YourComponent({ className, title }: YourComponentProps) {
  return (
    <div className={cn('p-4 bg-white rounded-lg', className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
```

## Troubleshooting

### Database Connection Issues

**Error**: `POSTGRES_URL is not defined`

**Solution**:
```bash
# Check .env.local exists
ls -la .env.local

# Verify POSTGRES_URL is set
cat .env.local | grep POSTGRES_URL

# If missing, add it:
echo 'POSTGRES_URL="postgresql://user:pass@localhost:5432/db"' >> .env.local
```

### Build Errors

**Error**: `Module not found`

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### Test Failures

**Error**: Tests fail after changes

**Solution**:
```bash
# Run tests in watch mode to debug
pnpm test:unit:watch

# Check for missing mocks
# Update test snapshots if needed
pnpm test:unit -- -u
```

### Linting Errors

**Error**: Linting fails

**Solution**:
```bash
# Auto-fix most issues
pnpm lint:fix

# Check specific files
pnpm exec biome lint path/to/file.ts

# Format code
pnpm format
```

## Resources

### Documentation

- [API Reference](API_REFERENCE.md)
- [Code Quality Guide](CODE_QUALITY_IMPROVEMENTS.md)
- [Performance Guide](PERFORMANCE_OPTIMIZATION.md)
- [Security Guide](SECURITY_AUDIT.md)
- [Migration Guide](MIGRATION_GUIDE_v3.0.24.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Getting Help

1. **Check Documentation** - Start with this guide and linked docs
2. **Search Issues** - https://github.com/muffy86/Autonomous-AI-orchestration-agent/issues
3. **Ask the Team** - Create an issue or discussion
4. **Code Review** - Request help in your PR

## Next Steps

Now that you're set up, here are some suggested first tasks:

1. **Explore the Codebase**
   - Read through `app/` directory
   - Check out `lib/` utilities
   - Review test files

2. **Make a Small Change**
   - Fix a typo
   - Add a comment
   - Improve documentation

3. **Run All Quality Checks**
   ```bash
   pnpm lint:fix
   pnpm test:all
   pnpm build
   ```

4. **Create Your First PR**
   - Follow the workflow above
   - Ask for review
   - Iterate based on feedback

## Welcome to the Team! 🎉

You're all set! If you have any questions, don't hesitate to:
- Create an issue
- Ask in discussions
- Reach out to the maintainers

Happy coding! 🚀

---

**Last Updated**: 2024-11-10  
**Version**: 3.0.24
