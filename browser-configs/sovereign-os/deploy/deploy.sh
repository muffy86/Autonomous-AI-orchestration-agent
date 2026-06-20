#!/bin/bash

# Sovereign OS Deployment Script
# Automated deployment to various environments

set -e

VERSION="2.1.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v deno &> /dev/null; then
        log_error "Deno is not installed. Please install from https://deno.land"
        exit 1
    fi
    
    log_info "✓ Deno installed: $(deno --version | head -1)"
    
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found. Docker deployment will not be available."
    else
        log_info "✓ Docker installed: $(docker --version)"
    fi
}

# Install Ollama
install_ollama() {
    log_info "Installing Ollama..."
    
    if command -v ollama &> /dev/null; then
        log_info "✓ Ollama already installed"
        return
    fi
    
    curl -fsSL https://ollama.com/install.sh | sh
    
    log_info "✓ Ollama installed"
}

# Pull LLM models
pull_models() {
    log_info "Pulling LLM models..."
    
    if ! command -v ollama &> /dev/null; then
        log_warn "Ollama not installed. Skipping model pull."
        return
    fi
    
    # Start Ollama service
    ollama serve &
    OLLAMA_PID=$!
    sleep 3
    
    # Pull models
    log_info "Pulling llama3.1:8b..."
    ollama pull llama3.1:8b
    
    log_info "Pulling llama3.1:70b..."
    ollama pull llama3.1:70b || log_warn "Failed to pull 70b model (requires ~40GB)"
    
    # Stop Ollama service
    kill $OLLAMA_PID 2>/dev/null || true
    
    log_info "✓ Models pulled"
}

# Development deployment
deploy_dev() {
    log_info "Starting development server..."
    
    cd "$PROJECT_ROOT"
    
    # Start Ollama if not running
    if ! pgrep -x "ollama" > /dev/null; then
        log_info "Starting Ollama..."
        ollama serve &
        sleep 2
    fi
    
    # Start server
    deno run --allow-all --watch server.ts
}

# Production deployment
deploy_prod() {
    log_info "Building for production..."
    
    cd "$PROJECT_ROOT"
    
    # Compile binary
    deno compile --allow-all --output sovereign-os server.ts
    
    log_info "✓ Binary compiled: ./sovereign-os"
    
    # Create systemd service
    if command -v systemctl &> /dev/null; then
        create_systemd_service
    fi
    
    log_info "Starting production server..."
    ./sovereign-os
}

# Docker deployment
deploy_docker() {
    log_info "Deploying with Docker..."
    
    cd "$PROJECT_ROOT/../.."
    
    # Build image
    docker build -f Dockerfile.sovereign-os -t sovereign-os:$VERSION .
    
    # Run container
    docker run -d \
        --name sovereign-os \
        -p 8000:8000 \
        -p 11434:11434 \
        -v sovereign-data:/app/data \
        sovereign-os:$VERSION
    
    log_info "✓ Docker container started"
    log_info "  Access at http://localhost:8000"
}

# Docker Compose deployment
deploy_compose() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT/../.."
    
    docker-compose -f docker-compose.sovereign-os.yml up -d
    
    log_info "✓ Services started"
    log_info "  Sovereign OS: http://localhost:8000"
    log_info "  Ollama: http://localhost:11434"
}

# Kubernetes deployment
deploy_k8s() {
    log_info "Deploying to Kubernetes..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install Kubernetes CLI."
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Apply manifests
    kubectl apply -f deploy/kubernetes/
    
    log_info "✓ Deployed to Kubernetes"
    log_info "  Check status: kubectl get pods -n sovereign-os"
}

# Create systemd service
create_systemd_service() {
    log_info "Creating systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/sovereign-os.service"
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Sovereign Browser OS
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$PROJECT_ROOT/sovereign-os
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable sovereign-os
    
    log_info "✓ Systemd service created"
    log_info "  Start: sudo systemctl start sovereign-os"
    log_info "  Status: sudo systemctl status sovereign-os"
    log_info "  Logs: sudo journalctl -u sovereign-os -f"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    MAX_RETRIES=30
    RETRY=0
    
    while [ $RETRY -lt $MAX_RETRIES ]; do
        if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
            log_info "✓ Service is healthy"
            return 0
        fi
        
        RETRY=$((RETRY + 1))
        sleep 1
    done
    
    log_error "Service failed health check"
    return 1
}

# Show usage
show_usage() {
    cat <<EOF
Sovereign OS Deployment Script v$VERSION

Usage: $0 [command] [options]

Commands:
    dev             Start development server
    prod            Build and deploy to production
    docker          Deploy with Docker
    compose         Deploy with Docker Compose
    k8s             Deploy to Kubernetes
    install         Install prerequisites (Ollama, models)
    health          Check service health
    stop            Stop all services
    clean           Clean up containers and data

Options:
    --skip-models   Skip pulling LLM models
    --help          Show this help message

Examples:
    $0 dev                    # Start dev server
    $0 prod                   # Deploy to production
    $0 docker                 # Deploy with Docker
    $0 install                # Install prerequisites
    $0 health                 # Health check

EOF
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    
    # Stop Docker containers
    docker stop sovereign-os 2>/dev/null || true
    
    # Stop Docker Compose
    cd "$PROJECT_ROOT/../.." && docker-compose -f docker-compose.sovereign-os.yml down 2>/dev/null || true
    
    # Stop systemd service
    sudo systemctl stop sovereign-os 2>/dev/null || true
    
    # Stop Ollama
    pkill -f "ollama serve" 2>/dev/null || true
    
    log_info "✓ Services stopped"
}

# Clean up
clean_up() {
    log_info "Cleaning up..."
    
    stop_services
    
    # Remove Docker containers
    docker rm -f sovereign-os 2>/dev/null || true
    
    # Remove Docker images
    docker rmi sovereign-os:$VERSION 2>/dev/null || true
    
    # Remove volumes (ask for confirmation)
    read -p "Remove data volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume rm sovereign-data 2>/dev/null || true
        log_info "✓ Data volumes removed"
    fi
    
    log_info "✓ Cleanup complete"
}

# Main
main() {
    case "$1" in
        dev)
            check_prerequisites
            deploy_dev
            ;;
        prod)
            check_prerequisites
            deploy_prod
            ;;
        docker)
            check_prerequisites
            deploy_docker
            health_check
            ;;
        compose)
            check_prerequisites
            deploy_compose
            health_check
            ;;
        k8s)
            check_prerequisites
            deploy_k8s
            ;;
        install)
            check_prerequisites
            install_ollama
            if [[ "$2" != "--skip-models" ]]; then
                pull_models
            fi
            ;;
        health)
            health_check
            ;;
        stop)
            stop_services
            ;;
        clean)
            clean_up
            ;;
        --help|help|"")
            show_usage
            ;;
        *)
            log_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
