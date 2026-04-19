# ⚡ Quick Start - 5 Minutes to Running Chatbot

For a single user on a local machine - fastest path to get your AI chatbot running with GitHub and web integrations.

## 🎯 Absolute Minimum Requirements

1. **Node.js 18+** installed
2. **xAI API Key** (free credits available)
3. **5 minutes** of your time

## 🚀 Lightning Fast Setup

### Step 1: Clone & Install (1 minute)
```bash
git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
cd Autonomous-AI-orchestration-agent
git checkout cursor/add-github-web-integrations-5398
pnpm install
```

### Step 2: Minimal Environment Setup (2 minutes)
```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Required
AUTH_SECRET=$(openssl rand -base64 32)
XAI_API_KEY=your-key-here
POSTGRES_URL=postgresql://localhost:5432/chatbot_dev

# Optional for GitHub integration
GITHUB_TOKEN=your-github-token
EOF
```

**Get your XAI_API_KEY:**
1. Visit https://console.x.ai/team/default/api-keys
2. Sign up and get free credits
3. Create API key
4. Replace `your-key-here` in `.env.local`

**Optional - Get GITHUB_TOKEN:**
1. Visit https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `public_repo`
4. Replace `your-github-token` in `.env.local`

### Step 3: Setup Database (1 minute)

**Option A: Local PostgreSQL (if installed)**
```bash
createdb chatbot_dev
pnpm db:migrate
```

**Option B: Use Neon (cloud, free, no install)**
```bash
# 1. Go to https://neon.tech and sign up (30 sec)
# 2. Create project, copy connection string
# 3. Replace POSTGRES_URL in .env.local
pnpm db:migrate
```

### Step 4: Start Server (30 seconds)
```bash
pnpm dev
```

### Step 5: Test It! (30 seconds)
1. Open http://localhost:3000
2. Register an account
3. Try: "Find popular Python projects on GitHub"
4. Try: "Search the web for Next.js tutorials"
5. Try: "Get the README from facebook/react"

## ✅ You're Done!

Your AI chatbot is now running with:
- ✅ GitHub integration (search repos, read code, view issues)
- ✅ Web scraping (fetch any URL)
- ✅ Web search (DuckDuckGo)
- ✅ Weather data
- ✅ Document creation
- ✅ Full chat history

## 🎓 What to Do Next?

**Learn More:**
- Read `NEXT_STEPS.md` for complete deployment guide
- Check `docs/AI_TOOLS.md` for all tool capabilities
- See `examples/AI_TOOLS_EXAMPLES.md` for usage examples

**Customize:**
- Modify tools in `lib/ai/tools/`
- Change UI in `components/`
- Add your own integrations

**Deploy:**
- See `DEPLOYMENT.md` for Vercel, Docker, AWS options
- Merge PR #43 to deploy to production

## 🆘 Common Issues

**"XAI_API_KEY invalid"**
- Check you have credits at https://console.x.ai/
- Verify key is copied correctly

**"Database connection failed"**
- Use Neon instead: https://neon.tech (free, instant setup)
- Or install PostgreSQL locally

**"Port 3000 in use"**
```bash
lsof -ti:3000 | xargs kill -9
pnpm dev
```

## 💡 Pro Tips

1. **Skip Redis** - Not needed for basic usage
2. **Skip Blob Storage** - Not needed unless uploading files
3. **GitHub Token Optional** - Works without it (60 req/hour)
4. **Use Neon** - Easiest database option (no local install)

---

**Time to working chatbot:** ~5 minutes
**Cost:** $0 (free tiers for everything)
**Difficulty:** Easy

Ready for production? See `NEXT_STEPS.md` and `DEPLOYMENT.md`!
