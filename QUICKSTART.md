# Quick Start Guide

Get up and running with the AI Chatbot in 5 minutes.

## Prerequisites Installed ✅
- Node.js v22.22.2
- pnpm 9.12.3
- All dependencies installed (1,179 packages)
- Playwright browsers ready

## Step 1: Configure Environment Variables

Edit the `.env` file and add your API keys:

```bash
# Required: Get from https://console.x.ai/
XAI_API_KEY=your_xai_key_here

# Required: Get from https://vercel.com/docs/storage/vercel-blob
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Required: Database connection string
POSTGRES_URL=postgresql://user:password@host:port/database

# Optional: Redis for rate limiting
REDIS_URL=redis://default:password@host:port
```

### Quick Setup Options:

#### Option A: Using Vercel (Recommended)
1. Create a Vercel account
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull`
4. All keys will be automatically configured ✨

#### Option B: Local Development
1. Set up local Postgres:
   ```bash
   docker-compose up -d
   ```
   This creates a local database at: `postgresql://postgres:postgres@localhost:5432/chatbot`

2. Get xAI API key from https://console.x.ai/

3. For blob storage, create a Vercel account or use local filesystem (modify code)

#### Option C: Use Cloud Agent Secrets
If you're using Cursor Cloud Agents:
1. Go to https://cursor.com/settings
2. Navigate to Cloud Agents > Secrets
3. Add your secrets there (they'll be available as environment variables)

## Step 2: Initialize Database

```bash
pnpm db:migrate
```

This will create all necessary database tables.

## Step 3: Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 🚀

## Common Tasks

### Run Tests
```bash
pnpm test:unit        # Quick unit tests
pnpm test             # Full E2E tests
```

### Check Code Quality
```bash
pnpm lint             # Check for issues
pnpm lint:fix         # Auto-fix issues
pnpm format           # Format code
```

### Database Management
```bash
pnpm db:studio        # Visual database browser
pnpm db:generate      # Create new migration
pnpm db:push          # Push schema changes
```

### Build for Production
```bash
pnpm build
pnpm start
```

## Project Structure Overview

```
app/
  ├── (auth)/              # Authentication pages
  ├── (chat)/              # Chat interface
  └── api/                 # API routes

components/
  ├── ui/                  # shadcn/ui components
  └── custom-*             # Custom components

lib/
  ├── db/                  # Database schema & migrations
  ├── ai/                  # AI SDK configuration
  └── auth/                # Authentication config
```

## Troubleshooting

### Can't connect to database?
- Check `POSTGRES_URL` is correct
- Verify database is running: `docker-compose ps`
- Try restarting: `docker-compose restart`

### Build fails?
```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

### Tests failing?
- Check environment variables
- Ensure database is running
- Try: `pnpm exec playwright install`

### Port 3000 in use?
```bash
# Use different port
PORT=3001 pnpm dev

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

## What's Next?

1. **Customize the AI model** - Edit `lib/ai/models.ts`
2. **Add new features** - Check `CONTRIBUTING.md`
3. **Deploy to Vercel** - Click deploy button in README
4. **Set up CI/CD** - GitHub Actions already configured
5. **Read the docs** - See `SETUP.md` for details

## Resources

- 📖 [Full Setup Guide](SETUP.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🔒 [Security Policy](SECURITY.md)
- 🎯 [Cursor Rules](.cursorrules)

## Quick Command Reference

| Task | Command |
|------|---------|
| Start dev server | `pnpm dev` |
| Build production | `pnpm build` |
| Run tests | `pnpm test:unit` |
| Lint code | `pnpm lint` |
| Format code | `pnpm format` |
| Database GUI | `pnpm db:studio` |
| Run migrations | `pnpm db:migrate` |
| Check security | `pnpm security:check` |
| Analyze bundle | `pnpm analyze:bundle` |

---

**Need help?** Check the full [SETUP.md](SETUP.md) guide or open an issue.
