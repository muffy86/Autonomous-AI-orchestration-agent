# 🚀 Quick Start: Autonomous Orchestration Environment

This guide will get you up and running with the full autonomous orchestration environment in minutes.

## ⚡ Express Setup (5 Minutes)

### 1. Install Dependencies

```bash
# Install all dependencies (main project + orchestration components)
pnpm setup:all
```

### 2. Configure Environment

```bash
# Copy orchestration environment template
cp .env.orchestration .env

# Edit .env with your configuration (optional for local dev)
# The defaults work out of the box for local development
```

### 3. Start Orchestration

Choose one of these methods:

**Option A: Using Make (Recommended)**
```bash
make orchestration-start
```

**Option B: Using npm scripts**
```bash
pnpm orchestration:start
```

**Option C: Using the CLI**
```bash
pnpm orchestration env start -d
```

### 4. Verify Installation

```bash
# Check all services are running
pnpm orchestration env status

# Or with Make
make docker-status
```

### 5. Access Services

Open these URLs in your browser:

- **Application**: http://localhost:3000
- **Grafana** (Monitoring): http://localhost:3001 (admin/admin)
- **Prometheus** (Metrics): http://localhost:9090
- **Jaeger** (Tracing): http://localhost:16686
- **pgAdmin** (Database): http://localhost:5050
- **MinIO** (Storage): http://localhost:9001

## 🎯 What You Get

Your environment now includes:

### Core Services
- ✅ PostgreSQL database with pgAdmin UI
- ✅ Redis cache for sessions and data
- ✅ Nginx reverse proxy

### AI & Orchestration
- ✅ MCP (Model Context Protocol) server
- ✅ 7 specialized autonomous agents
- ✅ Webhook handler for CI/CD automation
- ✅ Workflow orchestration engine

### Monitoring & Observability
- ✅ Prometheus for metrics collection
- ✅ Grafana for visualization
- ✅ Loki for log aggregation
- ✅ Promtail for log shipping
- ✅ Jaeger for distributed tracing

### Developer Tools
- ✅ SonarQube for code quality
- ✅ Vault for secrets management
- ✅ MinIO for S3-compatible storage
- ✅ Mailhog for email testing

## 🛠️ Development Workflow

### Start Development Server

```bash
# Start the Next.js development server
pnpm dev
```

### Run Tests

```bash
# All tests
make test

# Unit tests only
make test-unit

# E2E tests only
make test-e2e

# With coverage
make test-coverage
```

### Code Quality

```bash
# Lint code
make lint

# Auto-fix linting issues
make lint-fix

# Format code
make format

# Security audit
make security
```

### Database Operations

```bash
# Run migrations
make db-migrate

# Open database studio
make db-studio

# Backup database
make db-backup
```

## 🤖 Using the Orchestration

### CLI Commands

The orchestration CLI provides easy access to all features:

```bash
# View all available commands
pnpm orchestration --help

# Environment management
pnpm orchestration env start    # Start all services
pnpm orchestration env stop     # Stop all services
pnpm orchestration env status   # Check status
pnpm orchestration env logs     # View logs

# Agent management
pnpm orchestration agent list   # List all agents
pnpm orchestration agent status # Get agent status

# Workflow management
pnpm orchestration workflow list # List workflows
pnpm orchestration workflow run ci-pipeline # Run a workflow

# Development tools
pnpm orchestration dev setup    # Setup environment
pnpm orchestration dev test     # Run tests
pnpm orchestration dev lint     # Lint code

# Monitoring
pnpm orchestration monitor dashboard # Open Grafana
pnpm orchestration monitor metrics   # Open Prometheus
pnpm orchestration monitor traces    # Open Jaeger
```

### Available Agents

Your environment includes these specialized agents:

1. **Code Analyst** - Code review, static analysis, security scanning
2. **Test Engineer** - Unit, integration, and E2E testing
3. **Build Specialist** - Compilation, bundling, optimization
4. **Deploy Manager** - Deployment and operations
5. **Documentation Writer** - API docs, README, changelog
6. **Refactor Expert** - Code cleanup and modernization
7. **Monitoring Agent** - Log analysis, performance tracking

### Automated Workflows

The system includes pre-configured workflows:

- **CI Pipeline**: lint → test → build → deploy
- **PR Review**: code review → security scan → E2E tests
- **Security Audit**: dependency scan → code analysis → vulnerability check
- **Performance Check**: build analysis → bundle size → lighthouse

## 📊 Monitoring Your Application

### Grafana Dashboards

1. Open http://localhost:3001
2. Login with `admin` / `admin`
3. Navigate to Dashboards
4. Pre-configured dashboards available for:
   - Application metrics
   - Database performance
   - System resources
   - Error tracking

### Prometheus Queries

Access Prometheus at http://localhost:9090

Example queries:
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Distributed Tracing

1. Open Jaeger at http://localhost:16686
2. Select service from dropdown
3. Click "Find Traces"
4. Analyze request flows and bottlenecks

## 🔌 MCP Server Usage

The MCP (Model Context Protocol) server provides AI models with tools to interact with your codebase.

### Start MCP Server

```bash
# Development mode
pnpm mcp:dev

# Or via CLI
pnpm orchestration mcp start
```

### Available MCP Tools

- `execute_command` - Run shell commands
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents
- `analyze_code` - Analyze code quality
- `run_tests` - Execute test suites
- `git_status` - Check git status
- `deploy_preview` - Deploy preview environment

## 🪝 Webhook Integration

### Setup GitHub Webhooks

1. Go to your repository settings on GitHub
2. Navigate to Webhooks → Add webhook
3. Configure:
   - **URL**: `https://your-domain.com/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Your `WEBHOOK_SECRET` from `.env`
   - **Events**: Select individual events or "Send me everything"

4. Save webhook

### Automated Actions

Webhooks trigger these automated workflows:

**On Push:**
- Lint changed files
- Run relevant tests
- Build project
- Deploy preview (if tests pass)

**On Pull Request:**
- Automated code review
- Security vulnerability scan
- Run E2E tests
- Comment with results

**On Workflow Failure:**
- Analyze logs
- Suggest fixes
- Create issue with diagnostic info

## 🔒 Security Best Practices

### 1. Change Default Passwords

```bash
# In .env, update these:
GRAFANA_PASSWORD=secure_password_here
POSTGRES_PASSWORD=secure_password_here
WEBHOOK_SECRET=random_string_here
```

### 2. Use Vault for Secrets

```bash
# Access Vault at http://localhost:8200
# Store sensitive credentials there
# Reference them in your application
```

### 3. Regular Security Scans

```bash
# Run security audit
make security

# Or via CLI
pnpm orchestration security scan
```

## 🐳 Docker Management

### View Service Logs

```bash
# All services
make docker-logs

# Specific service
docker-compose -f docker-compose.orchestration.yml logs -f app
```

### Restart Services

```bash
# All services
make docker-restart

# Specific service
docker-compose -f docker-compose.orchestration.yml restart postgres
```

### Clean Up

```bash
# Stop and remove containers
make docker-down

# Remove volumes and clean up
make docker-clean
```

## 🎨 VS Code Integration

### Install Recommended Extensions

1. Open the project in VS Code
2. When prompted, click "Install All" for recommended extensions
3. Or manually: `Ctrl+Shift+P` → "Extensions: Show Recommended Extensions"

### Key Extensions Installed

- **Biome** - Fast linting and formatting
- **ESLint** - JavaScript linting
- **GitLens** - Enhanced Git capabilities
- **Docker** - Container management
- **Copilot** - AI pair programming
- **Thunder Client** - API testing
- **Todo Tree** - Task tracking
- **Error Lens** - Inline error display

## 🧪 Testing the Setup

### Health Checks

```bash
# Check all services are healthy
curl http://localhost:9000/health  # Webhook handler
curl http://localhost:3000/        # Application
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3100/ready   # Loki
```

### Run Sample Workflow

```bash
# Create and run a test workflow
pnpm orchestration workflow create test-workflow
pnpm orchestration workflow run test-workflow
```

### Submit a Test Task

```bash
# List available agents
pnpm orchestration agent list

# Submit a code review task
# (This would be done programmatically in real usage)
```

## 📚 Next Steps

1. **Explore the Documentation**
   - Read [ORCHESTRATION.md](./ORCHESTRATION.md) for detailed docs
   - Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines

2. **Customize Your Setup**
   - Add custom agents in `orchestration/agent-orchestrator.ts`
   - Create custom workflows
   - Add MCP tools in `mcp/server.ts`

3. **Configure Monitoring**
   - Create custom Grafana dashboards
   - Set up alerting rules in Prometheus
   - Configure log parsing in Loki

4. **Integrate with Your Tools**
   - Connect to your CI/CD pipeline
   - Set up webhooks for your services
   - Configure deployment targets

## 🆘 Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker ps

# View error logs
make docker-logs

# Restart specific service
docker-compose -f docker-compose.orchestration.yml restart <service-name>
```

### Port Conflicts

If ports are already in use, edit `docker-compose.orchestration.yml` and change the port mappings:

```yaml
services:
  grafana:
    ports:
      - "3002:3000"  # Changed from 3001
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.orchestration.yml ps postgres

# Connect to database
docker-compose -f docker-compose.orchestration.yml exec postgres psql -U postgres

# Reset database
make db-migrate
```

### MCP Server Issues

```bash
# Rebuild MCP server
cd mcp
pnpm install
pnpm build

# Check logs
pnpm dev
```

## 💡 Tips & Tricks

### Use Make for Common Tasks

```bash
make help          # See all available commands
make all           # Run lint, test, and build
make ci            # Run full CI pipeline locally
make setup         # Complete project setup
```

### Monitor Resource Usage

```bash
# Check Docker resource usage
docker stats

# View specific service resources
docker stats webhook-handler
```

### Quick Database Access

```bash
# Open pgAdmin in browser
open http://localhost:5050

# Or connect via CLI
docker-compose -f docker-compose.orchestration.yml exec postgres psql -U postgres chatbot
```

## 🎓 Learning Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Getting Help

- Check [ORCHESTRATION.md](./ORCHESTRATION.md) for detailed documentation
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Open an issue on GitHub for bugs or feature requests
- Join our community discussions

---

**Ready to build?** 🚀

Start developing with:
```bash
pnpm dev
```

Your autonomous orchestration environment is now ready!
