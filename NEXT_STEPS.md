# 🚀 NEXT STEPS - Complete Execution Instructions

This guide provides **complete, step-by-step instructions** for testing and deploying your AI chatbot with the new GitHub and web integration capabilities on **your local machine**.

---

## 📋 Table of Contents
1. [Prerequisites Check](#prerequisites-check)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Testing the Integrations](#testing-the-integrations)
5. [Deployment Options](#deployment-options)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites Check

Before starting, verify you have these installed on your machine:

```bash
# Check Node.js (need v18+)
node --version

# Check pnpm (recommended) or npm
pnpm --version

# Check git
git --version
```

**If missing:**
- Node.js: Download from https://nodejs.org/ (get v20 LTS)
- pnpm: `npm install -g pnpm`
- git: Download from https://git-scm.com/

---

## 🏗️ Local Development Setup

### Step 1: Pull the Latest Changes

```bash
# Navigate to your project directory
cd /path/to/Autonomous-AI-orchestration-agent

# Checkout the feature branch with new integrations
git checkout cursor/add-github-web-integrations-5398

# Pull latest changes
git pull origin cursor/add-github-web-integrations-5398

# Install dependencies
pnpm install
```

### Step 2: Verify Installation

```bash
# Should show ~1179 packages installed
ls node_modules | wc -l

# Verify new tools exist
ls lib/ai/tools/github-integration.ts
ls lib/ai/tools/web-fetch.ts
```

---

## 🔑 Environment Configuration

### Step 3: Create Your Environment File

```bash
# Copy example environment file
cp .env.example .env.local

# Open in your text editor
nano .env.local
# or
code .env.local
# or
vim .env.local
```

### Step 4: Configure Required Variables

Fill in the following **required** variables in `.env.local`:

#### 1. AUTH_SECRET (Required)
```bash
# Generate a secure secret
AUTH_SECRET=$(openssl rand -base64 32)
# or visit: https://generate-secret.vercel.app/32
```

#### 2. XAI_API_KEY (Required for AI chat)
```bash
# Get your key:
# 1. Go to https://console.x.ai/
# 2. Sign up or log in
# 3. Navigate to API Keys: https://console.x.ai/team/default/api-keys
# 4. Click "Create API Key"
# 5. Copy the key

XAI_API_KEY=xai-abc123yourkey456
```

#### 3. POSTGRES_URL (Required for chat history)

**Option A: Quick Local PostgreSQL**
```bash
# Install PostgreSQL locally
# macOS:
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb chatbot_dev

# Set URL
POSTGRES_URL=postgresql://localhost:5432/chatbot_dev
```

**Option B: Use Neon (Cloud, Free Tier)**
```bash
# 1. Go to https://neon.tech/
# 2. Sign up (free)
# 3. Create a new project
# 4. Copy the connection string from dashboard
# 5. Paste it:

POSTGRES_URL=postgresql://user:pass@ep-example.us-east-2.aws.neon.tech/dbname?sslmode=require
```

#### 4. BLOB_READ_WRITE_TOKEN (Optional - for file uploads)
```bash
# Skip for local testing, or get from:
# 1. https://vercel.com/dashboard
# 2. Storage → Blob → Create Store
# 3. Copy token

BLOB_READ_WRITE_TOKEN=vercel_blob_rw_abc123
```

#### 5. REDIS_URL (Optional - for resumable streams)
```bash
# Option A: Skip for basic testing
# Option B: Local Redis
brew install redis
brew services start redis
REDIS_URL=redis://localhost:6379

# Option C: Upstash (free tier)
# https://console.upstash.com/redis
REDIS_URL=redis://default:password@us1-example.upstash.io:12345
```

#### 6. GITHUB_TOKEN (Optional - for enhanced GitHub integration)
```bash
# Without token: 60 GitHub API requests/hour
# With token: 5000 requests/hour

# Get token:
# 1. Go to https://github.com/settings/tokens
# 2. Click "Generate new token (classic)"
# 3. Select scopes: public_repo
# 4. Generate and copy

GITHUB_TOKEN=ghp_abc123yourtoken456
```

### Step 5: Complete .env.local Example

Here's a complete `.env.local` for local development:

```bash
# Required
AUTH_SECRET=your_generated_secret_here_32_characters_long
XAI_API_KEY=xai-your-actual-key-from-console-x-ai
POSTGRES_URL=postgresql://localhost:5432/chatbot_dev

# Optional but recommended
GITHUB_TOKEN=ghp_your_github_token_here
REDIS_URL=redis://localhost:6379
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token

# Optional - only if you want to use different providers
# OPENAI_API_KEY=sk-your-openai-key
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Step 6: Initialize Database

```bash
# Run database migrations
pnpm db:migrate

# Verify database is set up
pnpm db:studio
# This opens Drizzle Studio at http://localhost:4983
# You should see tables: User, Chat, Message, Document, Vote, Suggestion
```

---

## 🧪 Testing the Integrations

### Step 7: Start Development Server

```bash
# Start the Next.js dev server
pnpm dev

# You should see:
# ▲ Next.js 15.3.0
# - Local:        http://localhost:3000
# - Environments: .env.local
```

### Step 8: Test in Browser

1. **Open http://localhost:3000**

2. **Register/Login:**
   - Click "Login"
   - Register a new account or login

3. **Test Basic Chat:**
   - Type: "Hello! Can you help me?"
   - Verify AI responds

### Step 9: Test GitHub Integration

**Test 1: Search Repositories**
```
Ask: "Find the most popular React libraries on GitHub"
```
Expected: List of popular React repos with stars, descriptions

**Test 2: Get Repository Details**
```
Ask: "Tell me about the facebook/react repository"
```
Expected: Repo details, stars, forks, description, languages

**Test 3: Read File Contents**
```
Ask: "Get the README from vercel/next.js"
```
Expected: Full README content from the Next.js repository

**Test 4: List Issues**
```
Ask: "Show me recent open issues in microsoft/vscode"
```
Expected: List of current open issues with titles and links

### Step 10: Test Web Integration

**Test 1: Web Fetch**
```
Ask: "Get the content from https://example.com"
```
Expected: Page content, title, and metadata

**Test 2: Web Search**
```
Ask: "Search the web for Next.js 15 new features"
```
Expected: Search results with titles, URLs, and snippets

**Test 3: Combined Query**
```
Ask: "Search for React hooks tutorials and get content from the first result"
```
Expected: Search results followed by fetched content

### Step 11: Run Automated Tests

```bash
# Run all unit tests (should show 178 passed)
pnpm test:unit

# Run specific integration tests
pnpm test:unit -- __tests__/ai/tools/integrations.test.ts

# Run all tests including E2E
pnpm test:all
```

**Expected output:**
```
Test Suites: 11 passed, 11 total
Tests:       178 passed, 178 total
```

---

## 🚀 Deployment Options

### Option 1: Merge and Deploy to Main (Recommended)

```bash
# After testing locally, merge the PR on GitHub
# Then deploy to Vercel:

# 1. Push to main (after PR merge)
git checkout main
git pull origin main

# 2. Deploy to Vercel
npx vercel --prod

# 3. Set environment variables in Vercel Dashboard:
# - Go to https://vercel.com/dashboard
# - Select your project
# - Settings → Environment Variables
# - Add all variables from .env.local
```

### Option 2: Docker Deployment (Local/Server)

```bash
# Build Docker image
docker build -t ai-chatbot .

# Run with environment variables
docker run -p 3000:3000 \
  -e AUTH_SECRET="your-secret" \
  -e XAI_API_KEY="your-xai-key" \
  -e POSTGRES_URL="your-db-url" \
  -e GITHUB_TOKEN="your-github-token" \
  ai-chatbot

# Access at http://localhost:3000
```

### Option 3: Docker Compose (Full Stack)

```bash
# Uses docker-compose.yml in the repo
docker-compose up -d

# Access:
# - App: http://localhost:3000
# - Database: localhost:5432
# - Redis: localhost:6379
```

---

## 🔍 Troubleshooting

### Issue: "AUTH_SECRET is not set"
**Solution:**
```bash
# Generate new secret
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

### Issue: "Database connection failed"
**Solution:**
```bash
# Test connection
psql $POSTGRES_URL

# Or check if PostgreSQL is running
brew services list | grep postgresql
```

### Issue: "XAI_API_KEY invalid"
**Solution:**
1. Check key at https://console.x.ai/team/default/api-keys
2. Ensure you have credits loaded
3. Verify key is copied correctly (no extra spaces)

### Issue: "GitHub rate limit exceeded"
**Solution:**
```bash
# Add GITHUB_TOKEN to .env.local
# This increases limit from 60 to 5000/hour
GITHUB_TOKEN=ghp_your_token_here
```

### Issue: "Module not found" errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

---

## 📊 Monitoring Your Setup

### Check Application Health

```bash
# View server logs
pnpm dev

# Run linter
pnpm lint

# Check security
pnpm security:check

# Analyze bundle size
pnpm analyze:bundle
```

### Database Management

```bash
# Open database studio
pnpm db:studio

# Generate new migration
pnpm db:generate

# Check database schema
pnpm db:check
```

---

## 🎯 What You Can Do Now

With everything set up, you can:

✅ **Chat with AI** using Grok models
✅ **Search GitHub** repositories, issues, PRs
✅ **Read code** from any public GitHub repo
✅ **Fetch web content** from any URL
✅ **Search the web** using DuckDuckGo
✅ **Create documents** with code artifacts
✅ **Get weather data** for any location
✅ **Save chat history** in PostgreSQL
✅ **Upload files** (if Blob storage configured)

---

## 📚 Next Learning Steps

1. **Explore the Documentation:**
   - `docs/AI_TOOLS.md` - Complete tool reference
   - `examples/AI_TOOLS_EXAMPLES.md` - Usage examples
   - `DEPLOYMENT.md` - Production deployment guide

2. **Customize Your Chatbot:**
   - Add more tools in `lib/ai/tools/`
   - Modify system prompt in `lib/ai/prompts.ts`
   - Customize UI in `components/`

3. **Scale Your Application:**
   - Set up production database (Neon/Supabase)
   - Configure Redis for resumable streams
   - Enable Vercel Blob for file uploads
   - Add monitoring (Sentry, LogRocket)

---

## 🆘 Need Help?

- **Documentation:** Check `docs/` folder
- **Examples:** See `examples/AI_TOOLS_EXAMPLES.md`
- **Issues:** Check existing GitHub issues
- **API Docs:** 
  - xAI: https://docs.x.ai/
  - GitHub API: https://docs.github.com/en/rest
  - Vercel AI SDK: https://sdk.vercel.ai/docs

---

## ✨ Summary Checklist

Use this to track your progress:

- [ ] Prerequisites installed (Node.js, pnpm, git)
- [ ] Repository cloned and dependencies installed
- [ ] `.env.local` created with all required variables
- [ ] Database initialized (`pnpm db:migrate`)
- [ ] Development server running (`pnpm dev`)
- [ ] Successfully logged in at http://localhost:3000
- [ ] Tested basic AI chat
- [ ] Tested GitHub integration (search repos, get files)
- [ ] Tested web integration (fetch URLs, web search)
- [ ] All unit tests passing (`pnpm test:unit`)
- [ ] Ready for production deployment

---

**🎉 Congratulations!** Once all items are checked, your AI chatbot is fully operational with GitHub and web integration capabilities!

For production deployment, proceed to **Deployment Options** section above or consult `DEPLOYMENT.md`.
