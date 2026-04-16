# Migration Guide: v3.0.23 → v3.0.24

## Overview

Version 3.0.24 introduces important code quality improvements, including a breaking change to the rate limiting API. This guide will help you migrate your code smoothly.

## Breaking Changes

### ⚠️ RateLimiter API Change

The `RateLimiter` class has been converted to a functional API for better tree-shaking and testing.

#### What Changed?

**Before (v3.0.23):**
```typescript
import { RateLimiter } from '@/lib/security';

// Checking rate limit
const result = RateLimiter.check('user-id', 'endpoint', config);

// Cleanup
RateLimiter.cleanup();
```

**After (v3.0.24):**
```typescript
import { checkRateLimit, cleanupRateLimiter } from '@/lib/security';

// Checking rate limit
const result = checkRateLimit('user-id', 'endpoint', config);

// Cleanup
cleanupRateLimiter();
```

#### Who is Affected?

You are affected if you:
- Use `RateLimiter.check()` in your code
- Use `RateLimiter.cleanup()` in your code
- Import `RateLimiter` from `@/lib/security`

#### Migration Steps

##### Step 1: Find All Usages

Search your codebase for:
```bash
# Using ripgrep
rg "RateLimiter\." --type ts --type tsx

# Using grep
grep -r "RateLimiter\." --include="*.ts" --include="*.tsx"

# Using your IDE
# Search for: RateLimiter.
```

##### Step 2: Update Imports

```typescript
// ❌ Remove this
import { RateLimiter } from '@/lib/security';

// ✅ Add this
import { checkRateLimit, cleanupRateLimiter } from '@/lib/security';
```

##### Step 3: Update Function Calls

Replace all instances:

```typescript
// ❌ Old code
const result = RateLimiter.check(clientIP, 'api', config);
if (!result.allowed) {
  // handle rate limit
}

// ✅ New code
const result = checkRateLimit(clientIP, 'api', config);
if (!result.allowed) {
  // handle rate limit
}
```

```typescript
// ❌ Old code
RateLimiter.cleanup();

// ✅ New code
cleanupRateLimiter();
```

##### Step 4: Verify Tests

If you have tests that use `RateLimiter`, update them:

```typescript
// ❌ Old test
import { RateLimiter } from '@/lib/security';

describe('Rate Limiting', () => {
  beforeEach(() => {
    RateLimiter.cleanup();
  });

  it('should limit requests', () => {
    const result = RateLimiter.check('test-ip', 'test', { max: 1, windowMs: 1000 });
    expect(result.allowed).toBe(true);
  });
});

// ✅ New test
import { checkRateLimit, cleanupRateLimiter } from '@/lib/security';

describe('Rate Limiting', () => {
  beforeEach(() => {
    cleanupRateLimiter();
  });

  it('should limit requests', () => {
    const result = checkRateLimit('test-ip', 'test', { max: 1, windowMs: 1000 });
    expect(result.allowed).toBe(true);
  });
});
```

#### API Compatibility

The function signatures are **100% compatible**. Only the calling syntax changes.

**Parameters** (unchanged):
```typescript
checkRateLimit(
  identifier: string,  // User/IP identifier
  endpoint: string,    // Endpoint name
  config: {
    windowMs: number,  // Time window in ms
    max: number,       // Max requests
  }
)
```

**Return Value** (unchanged):
```typescript
{
  allowed: boolean;    // Whether request is allowed
  remaining: number;   // Remaining requests
  resetTime: number;   // When limit resets (timestamp)
}
```

#### Automated Migration Script

Use this script to automate the migration:

```bash
#!/bin/bash
# migrate-rate-limiter.sh

# Find and replace RateLimiter.check
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -exec sed -i 's/RateLimiter\.check/checkRateLimit/g' {} +

# Find and replace RateLimiter.cleanup
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -exec sed -i 's/RateLimiter\.cleanup/cleanupRateLimiter/g' {} +

echo "✅ Automated replacement complete!"
echo "⚠️  Please update imports manually"
echo "⚠️  Please verify changes before committing"
```

**Usage:**
```bash
chmod +x migrate-rate-limiter.sh
./migrate-rate-limiter.sh
```

**⚠️ Important:** Always review automated changes before committing!

#### Manual Migration Checklist

- [ ] Update all imports of `RateLimiter`
- [ ] Replace `RateLimiter.check` with `checkRateLimit`
- [ ] Replace `RateLimiter.cleanup` with `cleanupRateLimiter`
- [ ] Update tests that use `RateLimiter`
- [ ] Run `pnpm test:all` to verify
- [ ] Run `pnpm lint` to check for issues
- [ ] Build the application to catch any missed usages
- [ ] Test rate limiting functionality manually

## Non-Breaking Changes

### Enhanced Error Handling

Database migration now provides more helpful error messages. No code changes required.

**Before:**
```
❌ Migration failed
Error: POSTGRES_URL is not defined
```

**After:**
```
❌ Migration failed: Missing database configuration

POSTGRES_URL environment variable is not defined.

📝 To fix this issue:
1. Create a .env.local file in your project root
2. Add your database URL:
   POSTGRES_URL="postgresql://user:password@host:port/database"
...
```

### New Integration Tests

15 new integration tests have been added. No action required.

**Run them:**
```bash
pnpm test:integration
```

### Improved Null Safety

Non-null assertions (`!`) have been replaced with proper null checks throughout the codebase. This improves type safety but doesn't affect the API.

## New Features

### Code Coverage Reporting

New Jest configuration for better coverage reports:

```bash
# Run tests with coverage
pnpm test:unit:coverage

# View HTML report
open coverage/index.html
```

### GitHub Actions Workflows

Two new workflows have been added:

1. **Code Coverage** (`.github/workflows/code-coverage.yml`)
   - Runs on all pushes and PRs
   - Uploads coverage to Codecov
   - Comments coverage on PRs

2. **Quality Gates** (`.github/workflows/quality-gates.yml`)
   - Linting
   - Type checking
   - Tests
   - Build verification
   - Security audit

No action required - they run automatically.

## Updated Documentation

New documentation files:

- `docs/CODE_QUALITY_IMPROVEMENTS.md` - Details all quality improvements
- `docs/SECURITY_AUDIT.md` - Security audit results
- `docs/PERFORMANCE_OPTIMIZATION.md` - Performance guidelines
- `docs/API_REFERENCE.md` - Complete API documentation
- `CHANGELOG.md` - Version history

## Verification

After migration, verify everything works:

### 1. Run Tests

```bash
# All tests
pnpm test:all

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration
```

**Expected:** All 183 tests should pass

### 2. Run Linter

```bash
pnpm lint
```

**Expected:** No warnings or errors

### 3. Type Check

```bash
pnpm exec tsc --noEmit
```

**Expected:** No type errors

### 4. Build Application

```bash
# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Build
pnpm build
```

**Expected:** Successful build

### 5. Test Rate Limiting

```bash
# Start dev server
pnpm dev

# Test rate limit (in another terminal)
for i in {1..15}; do
  curl http://localhost:3000/api/test
  echo ""
done
```

**Expected:** Some requests should be rate limited

## Rollback Plan

If you encounter issues, you can rollback:

### Option 1: Git Revert

```bash
# Revert to v3.0.23
git checkout v3.0.23

# Install dependencies
pnpm install
```

### Option 2: Keep Old Code Temporarily

Create a compatibility layer:

```typescript
// lib/security-compat.ts
import { checkRateLimit, cleanupRateLimiter } from './security';

/**
 * @deprecated Use checkRateLimit instead
 */
export class RateLimiter {
  static check = checkRateLimit;
  static cleanup = cleanupRateLimiter;
}
```

Then import from compatibility layer:
```typescript
import { RateLimiter } from '@/lib/security-compat';
```

**⚠️ Warning:** This is a temporary solution. Plan to migrate properly.

## Timeline

**Recommended Migration Schedule:**

- **Week 1**: Assess impact, plan migration
- **Week 2**: Perform migration in development
- **Week 3**: Test thoroughly, deploy to staging
- **Week 4**: Deploy to production, monitor

## Support

### Getting Help

1. **Check Documentation**
   - `docs/API_REFERENCE.md`
   - `docs/CODE_QUALITY_IMPROVEMENTS.md`

2. **Search Issues**
   - [GitHub Issues](https://github.com/muffy86/Autonomous-AI-orchestration-agent/issues)

3. **Ask for Help**
   - Create a new issue
   - Tag as `migration` or `question`

### Common Issues

#### Issue: "Cannot find name 'checkRateLimit'"

**Solution:** Update your imports:
```typescript
import { checkRateLimit } from '@/lib/security';
```

#### Issue: Tests failing after migration

**Solution:** Update test imports and cleanup calls:
```typescript
import { checkRateLimit, cleanupRateLimiter } from '@/lib/security';

beforeEach(() => {
  cleanupRateLimiter();
});
```

#### Issue: TypeScript errors

**Solution:** Run type check to see all errors:
```bash
pnpm exec tsc --noEmit
```

Then fix imports and usages.

## Changelog Summary

### Added
- Integration test suite (15 tests)
- Enhanced database migration error handling
- Code coverage workflows
- Quality gates CI/CD
- Comprehensive documentation

### Changed
- **BREAKING**: `RateLimiter` class → functional API
- Improved React hook dependencies
- Enhanced null safety
- Better error messages

### Fixed
- All ESLint warnings
- All Biome lint warnings
- Potential runtime errors from missing env vars
- Stale closure bugs in auth flows

## Questions?

If you have questions about this migration:

1. Review this guide thoroughly
2. Check the API documentation
3. Search existing issues
4. Create a new issue if needed

---

**Migration Guide Version**: 1.0  
**Last Updated**: 2024-11-10  
**Applies to**: v3.0.23 → v3.0.24
