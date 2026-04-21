# MCP (Model Context Protocol) Setup Guide

## Overview

This AI Chatbot now includes a **full-featured autonomous MCP server** with:

- ✅ **Multi-Model Support** - OpenAI, Anthropic, Google Gemini, xAI Grok, Groq, OpenRouter, Together AI
- ✅ **Free Tier Models** - Google Gemini, Groq, OpenRouter (no API key cost)
- ✅ **Autonomous Tools** - Code execution, web search, file ops, git, database, notifications
- ✅ **Skills System** - Complex multi-step autonomous capabilities
- ✅ **Webhooks** - Real-time integrations (GitHub, Slack, Discord, custom)
- ✅ **Resource Packs** - Pre-configured bundles for different use cases
- ✅ **HTTP API** - REST API for programmatic access
- ✅ **Comprehensive Testing** - Full test suite included

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Keys (Optional for Free Tier)

Copy the MCP environment template:

```bash
cp .env.mcp.example .env.mcp
```

For **completely free** usage, get these API keys (no credit card required):

- **Google Gemini** (FREE): https://makersuite.google.com/app/apikey
- **Groq** (FREE): https://console.groq.com/keys  
- **OpenRouter** (FREE models): https://openrouter.ai/keys

Add to `.env.mcp`:

```bash
# Free Tier - No Credit Card Required
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
GROQ_API_KEY=your_groq_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

### 3. Start the MCP Server

**Option A: Standalone MCP Server**
```bash
pnpm mcp:server
```

**Option B: HTTP Server (for webhooks/API)**
```bash
pnpm mcp:http
```

**Option C: Both Next.js + MCP**
```bash
pnpm dev:mcp
```

### 4. Test the Installation

```bash
pnpm test:mcp
```

## Features

### 🤖 Available AI Models

#### Free Tier (No Cost)
- **Google Gemini 2.0 Flash** - Latest Gemini with multimodal
- **Google Gemini 1.5 Flash** - Fast, capable, 1M context
- **Groq Llama 3.3 70B** - Ultra-fast inference
- **Groq Mixtral 8x7B** - Fast mixture-of-experts
- **OpenRouter Gemini Flash** - Free via OpenRouter
- **OpenRouter Llama 3.2 3B** - Free Llama model
- **OpenRouter Mistral 7B** - Free Mistral model

#### Paid Tier (API Key Required)
- **GPT-4o** - OpenAI's most capable model
- **GPT-4o Mini** - Faster, cheaper GPT-4
- **Claude 3.5 Sonnet** - Anthropic's best model
- **Claude 3.5 Haiku** - Fast Claude model
- **Grok 2 Vision** - xAI's vision model
- **Grok 3 Mini** - Fast Grok with reasoning

### 🛠️ Available Tools

1. **execute_code** - Run Python, JavaScript, Bash, TypeScript
2. **web_search** - Search the web for information
3. **fetch_url** - Fetch content from URLs
4. **database_query** - Query databases
5. **file_operations** - Read, write, list, delete files
6. **git_operations** - Git commands (clone, commit, push, etc.)
7. **send_notification** - Send to Email, Slack, Discord, webhooks
8. **image_generation** - Generate AI images
9. **data_analysis** - Analyze data and generate insights
10. **schedule_task** - Schedule tasks for future execution

### 🎯 Available Skills

1. **code_analysis** - Analyze code quality, security, performance
2. **research** - Conduct comprehensive research
3. **content_generation** - Generate various types of content
4. **data_processing** - Process and transform data
5. **automation** - Automate multi-step tasks
6. **testing** - Generate and run tests
7. **documentation** - Generate comprehensive docs
8. **monitoring** - Monitor system metrics

### 🔗 Webhooks

- **GitHub** - Handle push, PR, issues events
- **Slack** - Commands and messages
- **Discord** - Bot integration
- **Custom API** - Generic webhook handler
- **Task Completion** - Autonomous task notifications
- **AI Response** - Model response tracking

## Resource Packs

Pre-configured bundles for different use cases:

### 1. Free Tier Pack
All free AI models and basic tools.

```bash
Models: Gemini, Groq Llama, Groq Mixtral
Cost: $0
```

### 2. Development Pack
Complete development tools and AI models.

```bash
Tools: code_analysis, testing, documentation, git
Skills: code_analysis, testing, documentation
Models: Claude 3.5 Sonnet (primary), GPT-4o (fallback)
```

### 3. Research Pack
Research and analysis tools.

```bash
Tools: web_search, fetch_url, data_analysis
Skills: research, data_processing
Models: Gemini 2.0 Flash (primary), GPT-4o Mini (fallback)
```

### 4. Automation Pack
Task automation and scheduling.

```bash
Tools: schedule_task, notifications, database
Skills: automation, monitoring
Webhooks: task_complete, api
```

### 5. Content Pack
Content generation and images.

```bash
Tools: image_generation
Skills: content_generation, documentation
Models: GPT-4o (text), Grok Image (images)
```

## API Endpoints

When running `pnpm mcp:http`, the following endpoints are available:

### Health Check
```bash
GET http://localhost:3001/health
```

### List Tools
```bash
GET http://localhost:3001/api/mcp/tools
```

### Execute Tool
```bash
POST http://localhost:3001/api/mcp/tools/web_search
Content-Type: application/json

{
  "query": "latest AI news",
  "max_results": 10
}
```

### List Skills
```bash
GET http://localhost:3001/api/skills
```

### Execute Skill
```bash
POST http://localhost:3001/api/skills/code_analysis/execute
Content-Type: application/json

{
  "code": "function example() { return true; }",
  "language": "javascript"
}
```

### Trigger Webhook
```bash
POST http://localhost:3001/api/webhooks/github
Content-Type: application/json

{
  "event": "push",
  "repository": { "name": "my-repo" },
  "commits": []
}
```

### List Providers
```bash
GET http://localhost:3001/api/providers
```

## Example Prompts

### Code Analysis
```
Analyze this Python code for security issues and performance:

def process_data(user_input):
    result = eval(user_input)
    return result
```

### Web Research
```
Research the latest developments in AI model context protocols 
and summarize the key features of MCP.
```

### Content Generation
```
Generate a professional blog post about autonomous AI agents, 
800 words, technical tone.
```

### Data Processing
```
Process this CSV data and calculate average, median, and identify outliers:
[CSV data here]
```

### Automation
```
Create a workflow that:
1. Monitors a GitHub repo for new issues
2. Analyzes the issue content
3. Suggests labels and assignees
4. Posts a summary to Slack
```

## Docker Support

### Build and Run
```bash
# Build
docker build -t ai-chatbot-mcp .

# Run with MCP
docker run -p 3000:3000 -p 3001:3001 \
  -e GOOGLE_GENERATIVE_AI_API_KEY=your_key \
  ai-chatbot-mcp
```

### Docker Compose
```bash
# Start all services (Next.js, MCP, Postgres, Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

See `.env.mcp.example` for all available configuration options.

### Required for Free Tier
```bash
GOOGLE_GENERATIVE_AI_API_KEY=    # FREE - Get from Google AI Studio
GROQ_API_KEY=                     # FREE - Get from Groq Console
OPENROUTER_API_KEY=               # FREE - Get from OpenRouter
```

### Optional (Paid Services)
```bash
OPENAI_API_KEY=                   # OpenAI GPT models
ANTHROPIC_API_KEY=                # Anthropic Claude models
XAI_API_KEY=                      # xAI Grok models
TOGETHER_API_KEY=                 # Together AI models
```

### Webhooks
```bash
GITHUB_WEBHOOK_SECRET=
SLACK_WEBHOOK_URL=
SLACK_BOT_TOKEN=
DISCORD_WEBHOOK_URL=
```

## Testing

### Run All MCP Tests
```bash
pnpm test:mcp
```

### Test Individual Components
```bash
# Test tools
pnpm tsx lib/mcp/test/runner.ts

# Test providers
node -e "import('./lib/mcp/providers').then(m => console.log(m.modelProviders.listProviders()))"

# Test webhooks
curl -X POST http://localhost:3001/api/webhooks/api \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Troubleshooting

### No Models Available
- Check API keys in `.env.mcp`
- Free tier: Only need Google, Groq, or OpenRouter keys
- Run `pnpm test:mcp` to see configured providers

### Webhook Not Triggering
- Ensure MCP HTTP server is running: `pnpm mcp:http`
- Check webhook is enabled in `lib/mcp/webhooks/index.ts`
- Verify endpoint: `http://localhost:3001/api/webhooks/{hookId}`

### Skill Execution Fails
- Check required parameters in skill definition
- Verify dependencies are installed
- Review error in test output: `pnpm test:mcp`

## Architecture

```
lib/mcp/
├── server/         # MCP server implementation
│   ├── index.ts    # Main server class
│   ├── cli.ts      # CLI entry point
│   └── http.ts     # HTTP server entry point
├── providers/      # Multi-model AI providers
├── tools/          # Autonomous tools
├── skills/         # Complex capabilities
├── webhooks/       # Real-time integrations
├── resources/      # MCP resources
├── config/         # Configuration & resource packs
└── test/           # Comprehensive tests
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT - See [LICENSE](LICENSE)
