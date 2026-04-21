#!/bin/bash

# Orchestration Environment Validation Script
# Tests all components and verifies the setup is working correctly

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
fail_count=0
skip_count=0

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((success_count++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((fail_count++))
}

print_skip() {
    echo -e "${YELLOW}⊘${NC} $1"
    ((skip_count++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        print_success "$1 exists"
        return 0
    else
        print_error "$1 not found"
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        print_success "$1 directory exists"
        return 0
    else
        print_error "$1 directory not found"
        return 1
    fi
}

check_port() {
    if command -v nc &> /dev/null; then
        if nc -z localhost "$1" 2>/dev/null; then
            print_success "Port $1 is accessible"
            return 0
        else
            print_skip "Port $1 is not accessible (service may not be running)"
            return 1
        fi
    else
        print_skip "netcat not available, skipping port check for $1"
        return 2
    fi
}

print_header "🔍 Orchestration Environment Validation"

# 1. Check Prerequisites
print_header "1. Checking Prerequisites"

check_command "node"
check_command "pnpm"
check_command "docker"
check_command "docker-compose"
check_command "git"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js version: $NODE_VERSION"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_info "pnpm version: $PNPM_VERSION"
fi

# 2. Check Project Structure
print_header "2. Checking Project Structure"

check_directory "mcp"
check_directory "orchestration"
check_directory "scripts"
check_directory "monitoring"
check_directory ".github/workflows"

check_file "mcp/server.ts"
check_file "mcp/package.json"
check_file "orchestration/agent-orchestrator.ts"
check_file "orchestration/webhook-handler.ts"
check_file "scripts/orchestration-cli.ts"
check_file "docker-compose.orchestration.yml"
check_file "Makefile"
check_file ".env.orchestration"
check_file "ORCHESTRATION.md"
check_file "QUICKSTART_ORCHESTRATION.md"

# 3. Check Configuration Files
print_header "3. Checking Configuration Files"

check_file "monitoring/prometheus.yml"
check_file "monitoring/loki-config.yml"
check_file "monitoring/promtail-config.yml"
check_file "monitoring/grafana/datasources/datasources.yml"
check_file ".vscode/settings.json"
check_file ".vscode/extensions.recommended.json"
check_file ".github/workflows/orchestration-ci.yml"

# 4. Check Dependencies
print_header "4. Checking Dependencies"

if [ -d "node_modules" ]; then
    print_success "Main project dependencies installed"
else
    print_error "Main project dependencies not installed (run: pnpm install)"
fi

if [ -d "mcp/node_modules" ]; then
    print_success "MCP server dependencies installed"
else
    print_error "MCP server dependencies not installed (run: cd mcp && pnpm install)"
fi

if [ -d "orchestration/node_modules" ]; then
    print_success "Orchestration dependencies installed"
else
    print_error "Orchestration dependencies not installed (run: cd orchestration && pnpm install)"
fi

# 5. Check Docker Services (if running)
print_header "5. Checking Docker Services"

if docker ps &> /dev/null; then
    print_success "Docker daemon is running"
    
    # Check if orchestration stack is running
    if docker-compose -f docker-compose.orchestration.yml ps | grep -q "Up"; then
        print_info "Some orchestration services are running"
        
        # Check individual services
        services=("postgres" "redis" "prometheus" "grafana" "loki" "jaeger")
        for service in "${services[@]}"; do
            if docker-compose -f docker-compose.orchestration.yml ps "$service" 2>/dev/null | grep -q "Up"; then
                print_success "$service container is running"
            else
                print_skip "$service container is not running"
            fi
        done
    else
        print_skip "Orchestration services are not running (start with: make orchestration-start)"
    fi
else
    print_skip "Docker daemon is not running"
fi

# 6. Check Network Accessibility
print_header "6. Checking Network Accessibility"

ports=(
    "3000:Application"
    "3001:Grafana"
    "5432:PostgreSQL"
    "6379:Redis"
    "9090:Prometheus"
    "3100:Loki"
    "16686:Jaeger"
)

for port_info in "${ports[@]}"; do
    IFS=':' read -r port name <<< "$port_info"
    check_port "$port"
done

# 7. Validate TypeScript Configuration
print_header "7. Validating TypeScript Configuration"

if [ -f "mcp/tsconfig.json" ]; then
    if grep -q '"module": "ESNext"' mcp/tsconfig.json; then
        print_success "MCP TypeScript config is valid"
    else
        print_error "MCP TypeScript config may be invalid"
    fi
fi

if [ -f "orchestration/tsconfig.json" ]; then
    if grep -q '"module": "ESNext"' orchestration/tsconfig.json; then
        print_success "Orchestration TypeScript config is valid"
    else
        print_error "Orchestration TypeScript config may be invalid"
    fi
fi

# 8. Check Git Configuration
print_header "8. Checking Git Configuration"

if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Git repository initialized"
    
    current_branch=$(git branch --show-current)
    print_info "Current branch: $current_branch"
    
    if git status --porcelain | grep -q "^"; then
        print_info "There are uncommitted changes"
    else
        print_success "Working directory is clean"
    fi
else
    print_error "Not a git repository"
fi

# 9. Check Makefile Targets
print_header "9. Checking Makefile"

if [ -f "Makefile" ]; then
    targets=("help" "install" "dev" "test" "lint" "orchestration-start" "db-migrate")
    for target in "${targets[@]}"; do
        if grep -q "^$target:" Makefile; then
            print_success "Makefile target '$target' exists"
        else
            print_error "Makefile target '$target' not found"
        fi
    done
fi

# 10. Check Package Scripts
print_header "10. Checking Package Scripts"

if [ -f "package.json" ]; then
    scripts=("dev" "build" "test" "lint" "orchestration" "orchestration:start" "mcp:dev" "webhook:dev")
    for script in "${scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            print_success "npm script '$script' exists"
        else
            print_error "npm script '$script' not found"
        fi
    done
fi

# Summary
print_header "📊 Validation Summary"

total=$((success_count + fail_count + skip_count))
echo -e "${GREEN}✓ Passed: $success_count${NC}"
echo -e "${RED}✗ Failed: $fail_count${NC}"
echo -e "${YELLOW}⊘ Skipped: $skip_count${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Total: $total${NC}"

# Recommendations
print_header "💡 Recommendations"

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}\n"
    echo "Your orchestration environment is properly configured."
    echo ""
    echo "Next steps:"
    echo "  1. Start the orchestration environment:"
    echo "     ${BLUE}make orchestration-start${NC}"
    echo ""
    echo "  2. Start development server:"
    echo "     ${BLUE}pnpm dev${NC}"
    echo ""
    echo "  3. Access services:"
    echo "     - App: http://localhost:3000"
    echo "     - Grafana: http://localhost:3001"
    echo "     - Prometheus: http://localhost:9090"
else
    echo -e "${YELLOW}⚠ Some checks failed. Please review the errors above.${NC}\n"
    
    if [ ! -d "node_modules" ]; then
        echo "• Install dependencies: ${BLUE}pnpm setup:all${NC}"
    fi
    
    if [ ! -d "mcp/node_modules" ] || [ ! -d "orchestration/node_modules" ]; then
        echo "• Install orchestration dependencies: ${BLUE}pnpm setup:all${NC}"
    fi
    
    if ! docker ps &> /dev/null; then
        echo "• Start Docker daemon"
    fi
fi

echo ""

# Exit with error if there are failures
if [ $fail_count -gt 0 ]; then
    exit 1
else
    exit 0
fi
