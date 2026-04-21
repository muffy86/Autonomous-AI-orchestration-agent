# 🚀 Quick Start Guide - MCP Full Stack Autonomous AI

Get up and running with the complete autonomous MCP setup in 5 minutes!

## ⚡ Super Quick Start (Free Tier)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Get Free API Keys (No Credit Card!)

Visit these links and create free accounts:

1. **Google Gemini** (Best free option): https://makersuite.google.com/app/apikey
2. **Groq** (Ultra-fast, free): https://console.groq.com/keys
3. **OpenRouter** (Multiple free models): https://openrouter.ai/keys

### 3. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
cp .env.mcp.example .env.mcp
```

Add your free API keys to `.env.mcp`:
```bash
# Free Tier - No Cost!
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
GROQ_API_KEY=your_groq_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

### 4. Test the Setup
```bash
pnpm test:mcp
```

You should see:
```
✓ Tools: All tools registered
✓ Resources: All resources registered
✓ Providers: List all providers
✓ Free models available: Gemini, Groq Llama, etc.
```

### 5. Start the Server
```bash
# Option A: Just the web app
pnpm dev

# Option B: Web app + MCP server
pnpm dev:mcp

# Option C: MCP HTTP server only
pnpm mcp:http
```

### 6. Try It Out!

Visit http://localhost:3000 and try these prompts:

```
List all available AI models and show me which ones are free.
```

```
Use the web search tool to find the latest AI news.
```

```
Analyze this code for security issues:
function login(user, pass) {
  db.query("SELECT * FROM users WHERE user='" + user + "'");
}
```

## 🎯 What You Get (Out of the Box)

### Free AI Models
- ✅ Google Gemini 2.0 Flash (Latest, multimodal)
- ✅ Google Gemini 1.5 Flash (1M context)
- ✅ Groq Llama 3.3 70B (Ultra-fast)
- ✅ Groq Mixtral 8x7B (Fast MoE)
- ✅ OpenRouter free models (Multiple options)

### 10 Autonomous Tools
1. Execute code (Python, JS, Bash)
2. Web search
3. Fetch URLs
4. Database queries
5. File operations
6. Git operations
7. Send notifications
8. Generate images
9. Analyze data
10. Schedule tasks

### 8 Skills (Complex Capabilities)
1. Code analysis
2. Research assistant
3. Content generation
4. Data processing
5. Task automation
6. Test generation
7. Documentation
8. System monitoring

### Webhooks
- GitHub integration
- Slack bot
- Discord bot
- Custom API webhooks

## 📊 Verify Everything Works

### Test Individual Components

```bash
# Test providers
pnpm tsx -e "import('./lib/mcp/providers').then(m => console.log(m.modelProviders.getFreeModels()))"

# Test tools
pnpm tsx -e "import('./lib/mcp/tools').then(m => console.log(m.listTools()))"

# Test skills
pnpm tsx -e "import('./lib/mcp/skills').then(m => console.log(m.skillsManager.listSkills()))"
```

### Test HTTP API

Start the server:
```bash
pnpm mcp:http
```

Test endpoints:
```bash
# Health check
curl http://localhost:3001/health

# List tools
curl http://localhost:3001/api/mcp/tools

# List providers
curl http://localhost:3001/api/providers

# Execute a tool
curl -X POST http://localhost:3001/api/mcp/tools/web_search \
  -H "Content-Type: application/json" \
  -d '{"query": "AI news", "max_results": 5}'
```

## 🐳 Docker Quick Start

```bash
# Start everything with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

The app will be available at:
- Web app: http://localhost:3000
- MCP API: http://localhost:3001

## 📚 Next Steps

1. **Read the full docs**: See [MCP_SETUP.md](MCP_SETUP.md)
2. **Try example prompts**: See [MCP_PROMPTS.md](MCP_PROMPTS.md)
3. **Configure webhooks**: Add Slack/Discord/GitHub webhooks
4. **Add more providers**: Get OpenAI, Anthropic keys for more models
5. **Build custom skills**: Extend the skills system

## 🔧 Troubleshooting

### "No AI providers configured"
- Check your `.env.mcp` file has API keys
- At minimum, add Google Gemini key (it's free!)
- Run `pnpm test:mcp` to verify

### "Module not found" errors
```bash
pnpm install
```

### Tests failing
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Try again
pnpm test:mcp
```

### MCP server won't start
```bash
# Check port 3001 is free
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Restart
pnpm mcp:http
```

## 💡 Tips

1. **Start with free tier**: Google Gemini and Groq are excellent and completely free
2. **Use the right model**: Fast queries → Groq, Complex tasks → Gemini/Claude
3. **Test tools first**: Run `pnpm test:mcp` before building complex workflows
4. **Check logs**: Use `docker-compose logs -f` to debug issues
5. **Read examples**: The [MCP_PROMPTS.md](MCP_PROMPTS.md) has dozens of ready-to-use prompts

## 🎉 You're Ready!

You now have a fully autonomous AI system with:
- Multiple AI models (free tier available)
- 10 autonomous tools
- 8 complex skills
- Webhook integrations
- Full API access
- Comprehensive testing

Start building! 🚀
