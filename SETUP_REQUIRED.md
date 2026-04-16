# 🔧 Required Setup Configuration

## Current Status
✅ Code is ready and committed
✅ Database schema updated
✅ Telegram integration implemented
❌ Environment variables needed
❌ Database not configured
❌ Bot tokens not found

---

## 📋 What You Need to Provide

### 1. Database Configuration (REQUIRED)

You need a PostgreSQL database URL. Options:

**Option A: Use Vercel Postgres (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Select your project or create one
3. Go to Storage > Create Database > Postgres
4. Copy the `POSTGRES_URL` connection string
5. Add to your environment

**Option B: Use Neon (Free Tier Available)**
1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Add to your environment

**Option C: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Then use: postgresql://user:password@localhost:5432/database_name
```

### 2. Telegram Bot Tokens (REQUIRED)

You have these bots that need tokens:
- wyatte (@wyatt_fun_bot)
- Adam (@Adam_Ant1_bot)
- muffs-auto-bot (@muffs_auto_bot)
- AshleyRose12 (@AshleyRose12_bot)
- Ashley Rose (@AshleyRose1_bot)
- GravityClaw (@DotTe1_bot)
- auto_bot (@Owen12123_bot)
- BotTMore<3 (@BotTMorebot)
- Amber Rose (@muffyo_bot)
- Muffs_bot_telegram (@Muffs_telegram_bot)

**How to get tokens:**
1. Open Telegram, message [@BotFather](https://t.me/BotFather)
2. Send `/mybots`
3. Select each bot
4. Click "API Token"
5. Copy the token (format: `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 3. AI API Key (REQUIRED)

The chatbot needs an AI provider. Default is xAI:

1. Go to [console.x.ai](https://console.x.ai)
2. Create account / login
3. Generate API key
4. Add to environment

**Alternative: Use OpenAI instead**
- I see you have `Open_ai` secret configured
- Can use that instead of xAI

### 4. Optional but Recommended

- `BLOB_READ_WRITE_TOKEN` - For file storage (Vercel Blob)
- `REDIS_URL` - For resumable streams and caching
- `AUTH_SECRET` - For user authentication (generate with: `openssl rand -base64 32`)

---

## 🚀 Setup Methods

### Method 1: Cursor Dashboard (Easiest for Cloud Agents)

1. Go to Cursor Settings > Cloud Agents > Secrets
2. Add these secrets:
   ```
   POSTGRES_URL=postgresql://...
   TELEGRAM_BOT_TOKENS=token1,token2,token3
   XAI_API_KEY=xai-...
   AUTH_SECRET=(generate random)
   ```

### Method 2: Vercel Deployment

1. Fork/deploy this repo to Vercel
2. In Vercel dashboard: Settings > Environment Variables
3. Add all required variables
4. Vercel will auto-add POSTGRES_URL if you use Vercel Postgres
5. Deploy

### Method 3: Local Development

1. Create `.env` file in project root:
   ```bash
   # Copy from .env.example
   cp .env.example .env
   ```

2. Edit `.env` and add your values:
   ```bash
   POSTGRES_URL=postgresql://user:pass@host:5432/db
   TELEGRAM_BOT_TOKENS=token1,token2,token3
   XAI_API_KEY=xai-your-key-here
   AUTH_SECRET=your-random-secret
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   REDIS_URL=redis://...
   ```

3. Run migration:
   ```bash
   pnpm db:migrate
   ```

4. Start dev server:
   ```bash
   pnpm dev
   ```

5. Set up webhooks (will need ngrok for local):
   ```bash
   # In another terminal
   ngrok http 3000
   
   # Then run setup script with ngrok URL
   node scripts/setup-telegram-webhooks.js https://your-ngrok-url.ngrok.io
   ```

---

## 📝 Quick Start Template

Here's a template `.env` file you can use:

```bash
# === REQUIRED ===

# Database (get from Vercel Postgres or Neon)
POSTGRES_URL=postgresql://username:password@host:5432/database

# Telegram Bot Tokens (comma-separated, no spaces)
TELEGRAM_BOT_TOKENS=123456789:ABC...,987654321:XYZ...

# AI Provider (xAI or OpenAI)
XAI_API_KEY=xai-your-key
# OR
# OPENAI_API_KEY=sk-...

# Authentication Secret (generate: openssl rand -base64 32)
AUTH_SECRET=your-random-32-char-secret


# === OPTIONAL ===

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Caching & Resumable Streams
REDIS_URL=redis://default:password@host:6379
```

---

## 🎯 What Happens After Configuration

Once you provide the required environment variables, I can:

1. ✅ Run database migrations
2. ✅ Set up all 10 bot webhooks automatically
3. ✅ Test each bot
4. ✅ Verify AI integration works
5. ✅ Deploy to production (if using Vercel)

---

## 🔒 Security Notes

- **Never commit** your `.env` file (already in `.gitignore`)
- **Use secrets management** for production (Cursor Dashboard, Vercel Env Vars)
- **Rotate keys** if they're ever exposed
- **Bot tokens are sensitive** - treat them like passwords

---

## 💡 Need Help?

If you're stuck:
1. Check if you have access to @BotFather on Telegram
2. Verify you have database access
3. Make sure you have an AI API key
4. Review the full setup guide: [TELEGRAM_BOT_SETUP.md](TELEGRAM_BOT_SETUP.md)

**What I need from you to proceed:**
- Your database URL
- Your bot tokens (or access to retrieve them)
- Confirmation that you have an AI API key configured

Once you provide these, I'll complete the entire setup automatically.
