<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="CONTRIBUTING.md"><strong>Contributing</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication
- **AI Tools & Integrations**
  - **GitHub Integration** - Search repos, fetch issues/PRs, read code files, explore commits
  - **Web Fetch** - Extract content from any web page with metadata parsing
  - **Web Search** - Search the web using DuckDuckGo (no API key required)
  - **Weather Data** - Real-time weather information via Open-Meteo
  - **Document Management** - Create and update rich documents with artifacts

## Model Providers

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## AI Tools & Capabilities

The chatbot comes with powerful built-in tools that connect to external data sources:

### GitHub Integration
Access GitHub data directly from the chat:
- **Search repositories** by keywords, language, or topics
- **Fetch repository details** including stars, forks, and metadata
- **Browse issues and pull requests** with full details
- **Read file contents** from any public repository
- **Explore commits** and repository history
- **Get user profiles** and their repositories

**Setup:** Add your `GITHUB_TOKEN` to environment variables for higher rate limits and private repository access. Works without a token for public repositories.

### Web Integration
Fetch and analyze content from the web:
- **Web Search** - Search the web using DuckDuckGo (no API key required)
- **Web Fetch** - Extract content, text, and metadata from any URL
- **JSON API support** - Fetch and parse JSON data from APIs
- **Metadata extraction** - Automatically parse title, description, and Open Graph data

### Other Tools
- **Weather** - Real-time weather forecasts via Open-Meteo API
- **Documents** - Create and update rich documents with code, charts, and artifacts
- **Suggestions** - AI-powered response suggestions for better conversations

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

### 🚀 Quick Start (5 minutes)

See **[QUICK_START.md](QUICK_START.md)** for the fastest path to get running on your local machine.

### 📖 Complete Setup Guide

For detailed setup instructions, environment configuration, and deployment options, see **[NEXT_STEPS.md](NEXT_STEPS.md)**.

### Basic Setup

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot.

**Minimum Required Variables:**
```bash
AUTH_SECRET=     # Generate: openssl rand -base64 32
XAI_API_KEY=     # Get from: https://console.x.ai/
POSTGRES_URL=    # Local PostgreSQL or Neon: https://neon.tech
```

**Optional but Recommended:**
```bash
GITHUB_TOKEN=    # For enhanced GitHub integration (60 → 5000 req/hour)
REDIS_URL=       # For resumable streams
BLOB_READ_WRITE_TOKEN=  # For file uploads
```

**Quick Commands:**
```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).

> **Note:** For production deployment with Vercel, use:
> 1. `npm i -g vercel`
> 2. `vercel link`
> 3. `vercel env pull`

## 📚 Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Deployment Guide](DEPLOYMENT.md)** - Comprehensive deployment instructions
- **[Security Policy](SECURITY.md)** - Security guidelines and vulnerability reporting
- **[Branch Protection Setup](.github/BRANCH_PROTECTION.md)** - GitHub branch protection configuration
- **[AI Tools Guide](docs/AI_TOOLS.md)** - Complete guide to available AI tools and integrations

## 🚀 Features & Workflows

This repository includes comprehensive GitHub Actions workflows:

- **🤖 Dependabot Auto-merge** - Automatically merges dependency updates when tests pass
- **🔒 Security Scanning** - CodeQL analysis and vulnerability detection
- **🏗️ Build & Deploy** - Automated build and deployment pipeline
- **🧪 Testing** - Unit, integration, and E2E test automation
- **📊 Performance** - Lighthouse CI for performance monitoring
- **🐳 Docker** - Container builds with security scanning
- **📦 Release** - Automated release management

## 🛡️ Security

- Automated dependency updates via Dependabot
- Security vulnerability scanning with CodeQL
- Container image vulnerability scanning with Trivy
- Comprehensive security headers and best practices
- Rate limiting and input validation

## 🧪 Testing

```bash
# Run all tests
pnpm test:all

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test

# With coverage
pnpm test:unit:coverage
```

## 🐳 Docker Support

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or build and run manually
docker build -t ai-chatbot .
docker run -p 3000:3000 ai-chatbot
```

## 📊 Monitoring & Performance

- Lighthouse CI for performance testing
- Automated performance regression detection
- Coverage reporting and tracking
- Build and deployment monitoring

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

## 🔒 Security

For security vulnerabilities, please see our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
