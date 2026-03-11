# 🚀 One-Click Deployment Guide

**Deploy your AI Chatbot to the internet in minutes!**

---

## 📋 Before You Start

You'll need:
1. A GitHub account (free)
2. One of these deployment platforms (all have free tiers):
   - Vercel (Recommended - easiest)
   - Railway
   - Render
   - AWS/Google Cloud (advanced)

---

## Method 1: Vercel (Recommended)

**Why Vercel?** 
- ✅ Easiest to use
- ✅ Automatic deployments
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Free tier available

### Step-by-Step:

1. **Push your code to GitHub** (if not already there)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" and use your GitHub account

3. **Import Your Project**
   - Click "New Project"
   - Select your repository
   - Click "Import"

4. **Configure Environment Variables**
   
   Click "Environment Variables" and add these:

   | Name | Value | Where to Get It |
   |------|-------|-----------------|
   | `AUTH_SECRET` | (from your `.env.local`) | Already in your file |
   | `POSTGRES_URL` | (click "Create Database" → PostgreSQL) | Vercel creates this |
   | `REDIS_URL` | (click "Create Database" → Redis) | Vercel creates this |
   | `OPENAI_API_KEY` or `XAI_API_KEY` | Your API key | [OpenAI](https://platform.openai.com) or [xAI](https://console.x.ai) |
   | `BLOB_READ_WRITE_TOKEN` | Auto-created | Vercel creates this |

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site is live! 🎉

6. **Run Migrations**
   
   After first deployment:
   ```bash
   vercel env pull
   pnpm db:migrate
   ```

**Your site is now live at:** `https://your-project.vercel.app`

---

## Method 2: Railway

**Why Railway?**
- ✅ Simple deployment
- ✅ Built-in database
- ✅ Pay as you go

### Step-by-Step:

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Click "New" → "Database" → "Redis"

4. **Set Environment Variables**
   
   Railway auto-sets `DATABASE_URL` and `REDIS_URL`, but you need to add:
   - `AUTH_SECRET`
   - `OPENAI_API_KEY` or `XAI_API_KEY`

5. **Deploy**
   - Railway automatically deploys
   - Get your URL from the dashboard

---

## Method 3: Docker (Any Platform)

**Use this for:** AWS, Google Cloud, DigitalOcean, your own server

### Step-by-Step:

1. **Build Docker Image**
   ```bash
   docker build -t ai-chatbot .
   ```

2. **Test Locally**
   ```bash
   docker-compose up
   ```
   
   Visit: http://localhost:3000

3. **Deploy to Cloud**
   
   **For AWS ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag ai-chatbot:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ai-chatbot:latest
   
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ai-chatbot:latest
   ```

   **For Google Cloud Run:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/ai-chatbot
   gcloud run deploy ai-chatbot --image gcr.io/PROJECT_ID/ai-chatbot --platform managed
   ```

---

## Environment Variables Explained

Copy these from your `.env.local`:

```bash
# Required
AUTH_SECRET=your-secret-here
POSTGRES_URL=your-database-url
REDIS_URL=your-redis-url
OPENAI_API_KEY=your-api-key  # OR XAI_API_KEY

# Optional (for file uploads)
BLOB_READ_WRITE_TOKEN=your-blob-token

# Platform will set these automatically
NODE_ENV=production
NEXTAUTH_URL=your-deployed-url
```

---

## Getting API Keys

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up/Login
3. Click "API Keys" → "Create new secret key"
4. Copy and save it (you won't see it again!)

### xAI API Key
1. Go to [console.x.ai](https://console.x.ai)
2. Sign up/Login
3. Create API key
4. Copy and save it

---

## Automated Deployments

### Set Up Auto-Deploy

Your GitHub Actions already handle this!

**When you push to GitHub:**
- ✅ Tests run automatically
- ✅ Code is checked for errors
- ✅ Security scans run
- ✅ If all pass → Auto-deploy!

**Branches:**
- `develop` → Deploys to staging
- `main` → Deploys to production

Just push your code:
```bash
git push origin main
```

And GitHub Actions does the rest!

---

## Post-Deployment Checklist

After deploying, verify everything works:

### 1. Check Health
Visit: `https://your-site.com/api/health`

Should show:
```json
{
  "status": "healthy",
  ...
}
```

### 2. Check Metrics
Visit: `https://your-site.com/api/metrics`

### 3. Test the Chat
- Go to your site
- Create an account
- Send a message
- Verify AI responds

### 4. Set Up Monitoring

Add these to your calendar:
- **Weekly:** Check `/api/health`
- **Weekly:** Run database backup
- **Monthly:** Review `/api/metrics`

---

## Scaling & Performance

### Free Tier Limits

**Vercel:**
- 100GB bandwidth/month
- Serverless function limits
- Free database (with limits)

**Railway:**
- $5 free credit/month
- Pay for what you use

### When to Upgrade

Upgrade when you see:
- ⚠️ More than 10,000 visitors/month
- ⚠️ Database slowdowns
- ⚠️ "Quota exceeded" errors

---

## Custom Domain

### Add Your Own Domain

**On Vercel:**
1. Go to Project Settings
2. Click "Domains"
3. Add your domain
4. Update DNS (Vercel shows you how)

**On Railway:**
1. Go to Project Settings
2. Click "Domains"
3. Add custom domain
4. Update DNS records

---

## Troubleshooting Deployment

### Build Failed

**Check the logs:**
- Vercel: Project → Deployments → Click failed deployment
- Railway: Dashboard → Logs

**Common fixes:**
```bash
# Update dependencies
pnpm install

# Check TypeScript errors
pnpm exec tsc --noEmit

# Run tests locally
pnpm test:all
```

### Database Connection Failed

**Fix:**
1. Check `POSTGRES_URL` is set correctly
2. Verify database is running
3. Check connection string format:
   ```
   postgresql://user:password@host:port/database
   ```

### Site is Slow

**Quick fixes:**
1. Check `/api/metrics` for performance data
2. Enable caching (already configured!)
3. Upgrade database tier
4. Add Redis (if not using)

---

## Security Checklist

Before going live:

- [ ] Change `AUTH_SECRET` to a strong random value
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Set up backups (see below)
- [ ] Review security headers (already configured)
- [ ] Test authentication
- [ ] Enable rate limiting (already enabled)

---

## Automated Backups

### Vercel/Railway

Both platforms offer automatic backups:

**Vercel Postgres:**
- Automatic daily backups (paid plans)
- Point-in-time recovery

**Railway Postgres:**
- Automatic backups available
- Configure in dashboard

### Manual Backups

Schedule this to run weekly:
```bash
# On your local machine
vercel env pull
pnpm db:backup
```

Or use a scheduled GitHub Action (already included!).

---

## Monitoring & Alerts

### Set Up Uptime Monitoring

**Free options:**
- [UptimeRobot](https://uptimerobot.com) - Free, monitors every 5 minutes
- [Healthchecks.io](https://healthchecks.io) - Free, simple
- [Better Uptime](https://betteruptime.com) - Free tier available

**What to monitor:**
- Main site: `https://your-site.com`
- Health check: `https://your-site.com/api/health`

---

## Cost Estimates

### Typical Monthly Costs (Starter)

**Vercel (Recommended):**
- Free tier: $0
- Pro: $20/month (for production apps)

**Railway:**
- ~$5-15/month (pay as you go)

**OpenAI API:**
- ~$5-20/month (depends on usage)
- GPT-3.5-turbo: Very cheap
- GPT-4: More expensive

**Total: $0-50/month** for a starter production app

---

## Quick Command Reference

```bash
# Deploy to Vercel
vercel

# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables
vercel env pull

# Run migrations on production
vercel env pull && pnpm db:migrate

# Create backup
pnpm db:backup

# Check health
curl https://your-site.com/api/health
```

---

## Need Help?

### Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Our Workflows:** `.github/workflows/`

### Common Issues

**"Environment variables not set"**
- Go to platform dashboard
- Add variables from `.env.example`

**"Database migration failed"**
```bash
vercel env pull
pnpm db:migrate
```

**"Build takes too long"**
- Check logs for errors
- Ensure dependencies are in `package.json`

---

## Success Checklist

You're done when:

- ✅ Site loads at your URL
- ✅ `/api/health` shows "healthy"
- ✅ Can create account and login
- ✅ Can send/receive chat messages
- ✅ Automatic deployments work
- ✅ Backups are scheduled

**Congratulations! Your AI Chatbot is live! 🎉**
