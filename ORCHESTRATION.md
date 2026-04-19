# Autonomous Orchestration Environment

This document describes the comprehensive autonomous orchestration environment setup for the AI Chatbot project, including MCP (Model Context Protocol) servers, agent coordination, webhooks, monitoring, and development tools.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Components](#components)
- [Quick Start](#quick-start)
- [MCP Server](#mcp-server)
- [Agent Orchestration](#agent-orchestration)
- [Webhook Infrastructure](#webhook-infrastructure)
- [Monitoring & Observability](#monitoring--observability)
- [Development Tools](#development-tools)
- [CLI Reference](#cli-reference)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

The orchestration environment consists of multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                  (Next.js AI Chatbot)                        │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│                  Orchestration Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent        │  │ Workflow     │  │ Webhook      │      │
│  │ Coordinator  │  │ Engine       │  │ Handler      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│                      MCP Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tools        │  │ Resources    │  │ Prompts      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────┐  ┌──────┐  ┌──────────┐  ┌──────────┐           │
│  │ DB   │  │ Cache│  │ Metrics  │  │ Logging  │           │
│  └──────┘  └──────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🧩 Components

### 1. MCP (Model Context Protocol) Server

Located in `./mcp/`

The MCP server provides a standardized interface for AI models to interact with the development environment. It includes:

**Tools:**
- `execute_command` - Run shell commands
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents
- `analyze_code` - Code quality analysis
- `run_tests` - Execute test suites
- `git_status` - Git repository status
- `deploy_preview` - Deploy preview environments

**Resources:**
- Package configuration
- Project documentation
- Environment variables
- Code artifacts

**Prompts:**
- Code review templates
- Bug fix assistance
- Feature implementation guides
- Refactoring suggestions

### 2. Agent Orchestrator

Located in `./orchestration/agent-orchestrator.ts`

Manages multiple specialized AI agents:

- **Code Analyst** - Code review, static analysis, security scanning
- **Test Engineer** - Unit, integration, and E2E testing
- **Build Specialist** - Compilation, bundling, optimization
- **Deploy Manager** - Deployment and operations
- **Documentation Writer** - API docs, README, changelog
- **Refactor Expert** - Code cleanup and modernization
- **Monitoring Agent** - Log analysis, performance tracking

### 3. Webhook Handler

Located in `./orchestration/webhook-handler.ts`

Handles webhooks from:
- GitHub (push, PR, issues, workflow runs)
- GitLab (merge requests, pipelines)
- Vercel (deployments)
- Custom integrations

### 4. Monitoring Stack

Full observability with:

- **Prometheus** - Metrics collection (`:9090`)
- **Grafana** - Visualization (`:3001`)
- **Loki** - Log aggregation (`:3100`)
- **Promtail** - Log shipping
- **Jaeger** - Distributed tracing (`:16686`)

### 5. Supporting Services

- **PostgreSQL** - Primary database (`:5432`)
- **Redis** - Cache and session store (`:6379`)
- **Nginx** - Reverse proxy (`:80`, `:443`)
- **pgAdmin** - Database management (`:5050`)
- **MinIO** - S3-compatible object storage (`:9001`)
- **SonarQube** - Code quality analysis (`:9900`)
- **Vault** - Secrets management (`:8200`)
- **Mailhog** - Email testing (`:8025`)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- pnpm 9+
- Git

### Installation

1. **Install the orchestration CLI:**

```bash
cd scripts
pnpm install
chmod +x orchestration-cli.ts
```

2. **Add CLI to your PATH (optional):**

```bash
echo 'alias orchestration="tsx scripts/orchestration-cli.ts"' >> ~/.bashrc
source ~/.bashrc
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the orchestration environment:**

```bash
# Using CLI
orchestration env start -d

# Or using Docker Compose directly
docker-compose -f docker-compose.orchestration.yml up -d
```

5. **Verify services are running:**

```bash
orchestration env status
```

### First Steps

1. **Access the dashboards:**
   - Application: http://localhost:3000
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090
   - Jaeger: http://localhost:16686
   - pgAdmin: http://localhost:5050

2. **Initialize the database:**

```bash
orchestration db migrate
```

3. **Start development:**

```bash
pnpm dev
```

## 🔌 MCP Server

### Starting the MCP Server

```bash
cd mcp
pnpm install
pnpm dev
```

### Using MCP Tools

Tools can be called via the MCP protocol:

```typescript
// Example: Execute a command
{
  "tool": "execute_command",
  "arguments": {
    "command": "npm test",
    "workingDir": "/workspace"
  }
}

// Example: Analyze code
{
  "tool": "analyze_code",
  "arguments": {
    "path": "app/components"
  }
}
```

### Extending MCP

Add new tools in `mcp/server.ts`:

```typescript
const tools: Tool[] = [
  // ... existing tools
  {
    name: "my_custom_tool",
    description: "Description of what this tool does",
    inputSchema: z.object({
      param: z.string().describe("Parameter description"),
    }),
    handler: async (input) => {
      // Implementation
      return { result: "data" };
    },
  },
];
```

## 🤖 Agent Orchestration

### Submitting Tasks

```typescript
import { AgentOrchestrator } from "./orchestration/agent-orchestrator";

const orchestrator = new AgentOrchestrator();

// Submit a code review task
const taskId = await orchestrator.submitTask("code-review", {
  files: ["app/components/chat.tsx"],
});

// Check task status
const task = orchestrator.getTaskStatus(taskId);
```

### Creating Workflows

```typescript
// Define a CI pipeline workflow
await orchestrator.createWorkflow("ci-pipeline", [
  {
    id: "lint",
    name: "Lint Code",
    agent: "code-analyst",
    action: "static-analysis",
    input: { files: ["**/*.ts", "**/*.tsx"] },
  },
  {
    id: "test",
    name: "Run Tests",
    agent: "test-engineer",
    action: "unit-tests",
    input: {},
  },
  {
    id: "build",
    name: "Build",
    agent: "build-specialist",
    action: "compile",
    input: {},
  },
  {
    id: "deploy",
    name: "Deploy Preview",
    agent: "deploy-manager",
    action: "preview-deploy",
    input: {},
    condition: (ctx) => ctx.test?.passed === true,
  },
]);
```

### Agent Events

Listen to orchestration events:

```typescript
orchestrator.on("task:started", ({ task, agent }) => {
  console.log(`Task ${task.id} started by ${agent.name}`);
});

orchestrator.on("task:completed", ({ task, result }) => {
  console.log(`Task ${task.id} completed:`, result);
});

orchestrator.on("workflow:completed", (workflow) => {
  console.log(`Workflow ${workflow.name} completed`);
});
```

## 🪝 Webhook Infrastructure

### Starting the Webhook Handler

```bash
cd orchestration
WEBHOOK_SECRET=your-secret PORT=9000 pnpm webhook
```

### Configuring GitHub Webhooks

1. Go to your repository settings
2. Navigate to Webhooks
3. Add a new webhook:
   - URL: `https://your-domain.com/webhooks/github`
   - Content type: `application/json`
   - Secret: Your webhook secret
   - Events: Push, Pull Request, Issues, Workflow runs

### Webhook Endpoints

- `/webhooks/github` - GitHub webhooks
- `/webhooks/gitlab` - GitLab webhooks
- `/webhooks/vercel` - Vercel deployment webhooks
- `/webhooks/custom/:id` - Custom webhooks
- `/status/agents` - Agent status
- `/status/tasks/:taskId` - Task status

### Automated Workflows

Webhooks automatically trigger workflows:

**On Push:**
1. Lint code
2. Run tests
3. Build project
4. Deploy preview (if tests pass)

**On Pull Request:**
1. Code review
2. Security scan
3. Run E2E tests

## 📊 Monitoring & Observability

### Prometheus Metrics

Access at http://localhost:9090

Common queries:
```promql
# HTTP request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Grafana Dashboards

Access at http://localhost:3001

Pre-configured dashboards for:
- Application metrics
- Database performance
- System resources
- Error tracking
- User activity

### Loki Logs

Query logs in Grafana using LogQL:

```logql
# All application logs
{job="app"}

# Error logs only
{job="app"} |= "error"

# Slow requests
{job="app"} | json | duration > 1000
```

### Jaeger Tracing

Access at http://localhost:16686

View distributed traces to:
- Identify bottlenecks
- Debug complex requests
- Analyze service dependencies

## 🛠️ Development Tools

### VS Code Extensions

Install recommended extensions:

```bash
code --install-extension biomejs.biome
code --install-extension eamodio.gitlens
code --install-extension github.copilot
code --install-extension ms-azuretools.vscode-docker
```

### Code Quality

```bash
# Lint
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm tsc --noEmit
```

### Testing

```bash
# Unit tests
pnpm test:unit

# E2E tests
pnpm test

# All tests
pnpm test:all

# Coverage
pnpm test:unit:coverage
```

### Security

```bash
# Security audit
pnpm security:check

# Dependency audit
pnpm security:deps

# Full security scan
pnpm security:audit
```

## 📝 CLI Reference

### Environment Commands

```bash
orchestration env start [-d]      # Start all services
orchestration env stop            # Stop all services
orchestration env restart         # Restart services
orchestration env status          # Check service status
orchestration env logs [-f] [-s service]  # View logs
```

### MCP Commands

```bash
orchestration mcp start           # Start MCP server
orchestration mcp test            # Test MCP connection
```

### Agent Commands

```bash
orchestration agent list          # List all agents
orchestration agent status        # Get agent status
```

### Workflow Commands

```bash
orchestration workflow create <name> [-f file]  # Create workflow
orchestration workflow run <name>               # Run workflow
orchestration workflow list                      # List workflows
```

### Development Commands

```bash
orchestration dev setup           # Setup dev environment
orchestration dev test [-u|-e]    # Run tests
orchestration dev lint [--fix]    # Run linter
orchestration dev format          # Format code
```

### Monitoring Commands

```bash
orchestration monitor metrics     # Open Prometheus
orchestration monitor dashboard   # Open Grafana
orchestration monitor logs        # View logs
orchestration monitor traces      # Open Jaeger
```

### Security Commands

```bash
orchestration security scan       # Run security scan
orchestration security audit      # Audit dependencies
```

### Database Commands

```bash
orchestration db migrate          # Run migrations
orchestration db studio           # Open DB studio
orchestration db backup           # Backup database
```

### Deployment Commands

```bash
orchestration deploy preview      # Deploy preview
orchestration deploy production   # Deploy to production
```

## ⚙️ Configuration

### Environment Variables

Required variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/chatbot
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379

# Webhooks
WEBHOOK_SECRET=your_webhook_secret

# Monitoring
GRAFANA_PASSWORD=admin_password

# Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Security
VAULT_ROOT_TOKEN=vault_token

# Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### Docker Compose Override

Create `docker-compose.override.yml` for local customization:

```yaml
version: '3.9'

services:
  app:
    environment:
      - DEBUG=true
    volumes:
      - ./custom-data:/data
```

## 🔧 Troubleshooting

### Services Won't Start

```bash
# Check Docker status
docker ps -a

# View service logs
orchestration env logs -f -s app

# Restart specific service
docker-compose -f docker-compose.orchestration.yml restart app
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.orchestration.yml ps postgres

# Test connection
docker-compose -f docker-compose.orchestration.yml exec postgres psql -U postgres

# Reset database
orchestration db migrate
```

### Port Conflicts

If ports are already in use, modify `docker-compose.orchestration.yml`:

```yaml
services:
  grafana:
    ports:
      - "3002:3000"  # Changed from 3001
```

### MCP Server Not Responding

```bash
# Check MCP server logs
cd mcp
pnpm dev

# Rebuild MCP server
cd mcp
pnpm build
```

### Webhook Events Not Triggering

1. Check webhook handler logs
2. Verify webhook secret matches
3. Test webhook endpoint: `curl http://localhost:9000/health`
4. Check GitHub/GitLab webhook delivery logs

## 📚 Additional Resources

- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Prometheus Documentation](https://prometheus.io/docs)
- [Grafana Documentation](https://grafana.com/docs)
- [Docker Compose Reference](https://docs.docker.com/compose)

## 🤝 Contributing

When adding new orchestration features:

1. Create feature branch: `git checkout -b feature/your-feature`
2. Add tests for new functionality
3. Update this documentation
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details
