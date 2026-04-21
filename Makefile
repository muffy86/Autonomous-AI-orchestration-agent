.PHONY: help install dev build test lint format clean docker-up docker-down docker-restart orchestration-start orchestration-stop db-migrate db-studio deploy-preview deploy-prod

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(BLUE)Available commands:$(NC)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Development
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@pnpm install
	@cd mcp && pnpm install
	@cd orchestration && pnpm install
	@cd scripts && pnpm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	@pnpm dev

build: ## Build the application
	@echo "$(BLUE)Building application...$(NC)"
	@pnpm build
	@echo "$(GREEN)✓ Build complete$(NC)"

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@pnpm test:all

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	@pnpm test:unit

test-e2e: ## Run E2E tests only
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@pnpm test

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@pnpm test:unit:coverage

# Code Quality
lint: ## Run linter
	@echo "$(BLUE)Linting code...$(NC)"
	@pnpm lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	@pnpm lint:fix
	@echo "$(GREEN)✓ Linting issues fixed$(NC)"

format: ## Format code
	@echo "$(BLUE)Formatting code...$(NC)"
	@pnpm format
	@echo "$(GREEN)✓ Code formatted$(NC)"

security: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	@pnpm security:check
	@echo "$(GREEN)✓ Security audit complete$(NC)"

# Docker
docker-up: ## Start all Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose -f docker-compose.orchestration.yml up -d
	@echo "$(GREEN)✓ Docker services started$(NC)"
	@make docker-status

docker-down: ## Stop all Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@docker-compose -f docker-compose.orchestration.yml down
	@echo "$(GREEN)✓ Docker services stopped$(NC)"

docker-restart: ## Restart all Docker services
	@echo "$(BLUE)Restarting Docker services...$(NC)"
	@docker-compose -f docker-compose.orchestration.yml restart
	@echo "$(GREEN)✓ Docker services restarted$(NC)"

docker-status: ## Show Docker services status
	@echo "$(BLUE)Docker services status:$(NC)"
	@docker-compose -f docker-compose.orchestration.yml ps

docker-logs: ## Show Docker logs
	@docker-compose -f docker-compose.orchestration.yml logs -f

docker-clean: ## Clean Docker volumes and images
	@echo "$(BLUE)Cleaning Docker volumes and images...$(NC)"
	@docker-compose -f docker-compose.orchestration.yml down -v
	@docker system prune -f
	@echo "$(GREEN)✓ Docker cleaned$(NC)"

# Orchestration
orchestration-start: ## Start orchestration environment
	@echo "$(BLUE)Starting orchestration environment...$(NC)"
	@tsx scripts/orchestration-cli.ts env start -d
	@echo "$(GREEN)✓ Orchestration started$(NC)"
	@echo "$(BLUE)Services available at:$(NC)"
	@echo "  • App: http://localhost:3000"
	@echo "  • Grafana: http://localhost:3001"
	@echo "  • Prometheus: http://localhost:9090"
	@echo "  • Jaeger: http://localhost:16686"
	@echo "  • pgAdmin: http://localhost:5050"

orchestration-stop: ## Stop orchestration environment
	@echo "$(BLUE)Stopping orchestration environment...$(NC)"
	@tsx scripts/orchestration-cli.ts env stop
	@echo "$(GREEN)✓ Orchestration stopped$(NC)"

mcp-start: ## Start MCP server
	@echo "$(BLUE)Starting MCP server...$(NC)"
	@cd mcp && pnpm dev

webhook-start: ## Start webhook handler
	@echo "$(BLUE)Starting webhook handler...$(NC)"
	@cd orchestration && pnpm webhook

# Database
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@pnpm db:migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

db-studio: ## Open database studio
	@echo "$(BLUE)Opening database studio...$(NC)"
	@pnpm db:studio

db-push: ## Push database schema
	@echo "$(BLUE)Pushing database schema...$(NC)"
	@pnpm db:push

db-generate: ## Generate database migrations
	@echo "$(BLUE)Generating database migrations...$(NC)"
	@pnpm db:generate

db-backup: ## Backup database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p backups
	@docker-compose -f docker-compose.orchestration.yml exec -T postgres pg_dump -U postgres chatbot > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✓ Database backed up$(NC)"

# Deployment
deploy-preview: ## Deploy preview environment
	@echo "$(BLUE)Deploying preview...$(NC)"
	@vercel deploy --yes
	@echo "$(GREEN)✓ Preview deployed$(NC)"

deploy-prod: ## Deploy to production
	@echo "$(BLUE)Deploying to production...$(NC)"
	@vercel deploy --prod
	@echo "$(GREEN)✓ Deployed to production$(NC)"

# Utilities
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@rm -rf .next
	@rm -rf dist
	@rm -rf coverage
	@rm -rf node_modules/.cache
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

reset: clean ## Reset project (clean + reinstall)
	@echo "$(BLUE)Resetting project...$(NC)"
	@rm -rf node_modules
	@rm -rf mcp/node_modules
	@rm -rf orchestration/node_modules
	@rm -rf scripts/node_modules
	@make install
	@echo "$(GREEN)✓ Project reset$(NC)"

# Monitoring
monitor-metrics: ## Open Prometheus metrics
	@echo "$(BLUE)Opening Prometheus...$(NC)"
	@open http://localhost:9090 || xdg-open http://localhost:9090 || echo "Visit: http://localhost:9090"

monitor-dashboard: ## Open Grafana dashboard
	@echo "$(BLUE)Opening Grafana...$(NC)"
	@open http://localhost:3001 || xdg-open http://localhost:3001 || echo "Visit: http://localhost:3001"

monitor-traces: ## Open Jaeger traces
	@echo "$(BLUE)Opening Jaeger...$(NC)"
	@open http://localhost:16686 || xdg-open http://localhost:16686 || echo "Visit: http://localhost:16686"

# Setup
setup: install db-migrate ## Complete project setup
	@echo "$(GREEN)✓ Project setup complete!$(NC)"
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Copy .env.orchestration to .env and configure"
	@echo "  2. Run 'make orchestration-start' to start services"
	@echo "  3. Run 'make dev' to start development server"

# Quick commands
all: lint test build ## Run lint, test, and build

ci: lint test-unit security build ## Run CI pipeline locally

.DEFAULT_GOAL := help
