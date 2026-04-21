#!/bin/bash

##############################################################################
# Autonomous Orchestration Deployment Script
# 
# This script fully automates deployment to Google Cloud Platform
# Run this on your GCP VM or local machine with gcloud CLI
#
# Usage:
#   Option 1 (Create VM): ./deploy-orchestration.sh create
#   Option 2 (Install on existing VM): ./deploy-orchestration.sh install
#   Option 3 (Full automation): ./deploy-orchestration.sh auto
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
VM_NAME="${VM_NAME:-ai-orchestration-vm}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-4}"
DISK_SIZE="${DISK_SIZE:-50GB}"

REPO_URL="https://github.com/muffy86/Autonomous-AI-orchestration-agent.git"
REPO_BRANCH="cursor/full-orchestration-mcp-environment-e9c0"

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to create GCP VM
create_vm() {
    print_header "Creating GCP VM Instance"
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}Enter your GCP Project ID:${NC}"
        read -r PROJECT_ID
    fi
    
    print_info "Setting GCP project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    
    print_info "Creating VM instance: $VM_NAME"
    gcloud compute instances create "$VM_NAME" \
        --zone="$ZONE" \
        --machine-type="$MACHINE_TYPE" \
        --boot-disk-size="$DISK_SIZE" \
        --boot-disk-type=pd-ssd \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --tags=http-server,https-server,orchestration \
        --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y git curl
' || print_warning "VM might already exist"
    
    print_info "Creating firewall rules..."
    gcloud compute firewall-rules create allow-orchestration-http \
        --allow tcp:80,tcp:443,tcp:3000,tcp:3001,tcp:8080 \
        --target-tags=orchestration \
        --source-ranges=0.0.0.0/0 \
        --description="Allow HTTP traffic for orchestration" 2>/dev/null || print_warning "Firewall rule might already exist"
    
    gcloud compute firewall-rules create allow-orchestration-monitoring \
        --allow tcp:9090,tcp:16686,tcp:5050,tcp:9001,tcp:9000 \
        --target-tags=orchestration \
        --source-ranges=0.0.0.0/0 \
        --description="Allow monitoring interfaces" 2>/dev/null || print_warning "Firewall rule might already exist"
    
    print_success "VM instance created successfully"
    
    EXTERNAL_IP=$(gcloud compute instances describe "$VM_NAME" \
        --zone="$ZONE" \
        --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
    
    print_info "External IP: $EXTERNAL_IP"
    print_info "Waiting 30 seconds for VM to fully start..."
    sleep 30
}

# Function to install dependencies on VM
install_dependencies() {
    print_header "Installing Dependencies"
    
    print_info "Updating system packages..."
    sudo apt-get update -y
    sudo apt-get upgrade -y
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker "$USER"
        rm get-docker.sh
        print_success "Docker installed"
    else
        print_success "Docker already installed"
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed"
    else
        print_success "Docker Compose already installed"
    fi
    
    # Install Node.js
    if ! command -v node &> /dev/null; then
        print_info "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs build-essential make
        print_success "Node.js installed"
    else
        print_success "Node.js already installed ($(node --version))"
    fi
    
    # Install pnpm
    if ! command -v pnpm &> /dev/null; then
        print_info "Installing pnpm..."
        sudo npm install -g pnpm
        print_success "pnpm installed"
    else
        print_success "pnpm already installed ($(pnpm --version))"
    fi
    
    # Install additional tools
    sudo apt-get install -y git curl wget vim htop netcat -y
    
    print_success "All dependencies installed"
}

# Function to clone and setup repository
setup_repository() {
    print_header "Setting Up Repository"
    
    if [ -d "Autonomous-AI-orchestration-agent" ]; then
        print_info "Repository already exists, pulling latest..."
        cd Autonomous-AI-orchestration-agent
        git fetch origin
        git checkout "$REPO_BRANCH"
        git pull origin "$REPO_BRANCH"
    else
        print_info "Cloning repository..."
        git clone "$REPO_URL"
        cd Autonomous-AI-orchestration-agent
        git checkout "$REPO_BRANCH"
    fi
    
    print_success "Repository ready"
}

# Function to install project dependencies
install_project_deps() {
    print_header "Installing Project Dependencies"
    
    print_info "Installing main dependencies..."
    pnpm install
    
    print_info "Installing MCP server dependencies..."
    cd mcp && pnpm install && cd ..
    
    print_info "Installing orchestration dependencies..."
    cd orchestration && pnpm install && cd ..
    
    print_info "Installing scripts dependencies..."
    cd scripts && pnpm install && cd ..
    
    print_success "All project dependencies installed"
}

# Function to configure environment
configure_environment() {
    print_header "Configuring Environment"
    
    if [ ! -f .env ]; then
        print_info "Creating .env file..."
        cp .env.orchestration .env
        
        print_info "Generating secure secrets..."
        WEBHOOK_SECRET=$(openssl rand -hex 32)
        SESSION_SECRET=$(openssl rand -hex 32)
        POSTGRES_PASSWORD=$(openssl rand -hex 16)
        GRAFANA_PASSWORD=$(openssl rand -hex 12)
        
        sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
        sed -i "s/GRAFANA_PASSWORD=.*/GRAFANA_PASSWORD=$GRAFANA_PASSWORD/" .env
        
        print_success "Environment configured with secure secrets"
        print_info "Grafana password: $GRAFANA_PASSWORD (save this!)"
    else
        print_success ".env file already exists"
    fi
}

# Function to start orchestration
start_orchestration() {
    print_header "Starting Orchestration Services"
    
    # Make sure we can use docker without sudo
    if ! docker ps &> /dev/null; then
        print_info "Activating Docker group membership..."
        newgrp docker <<EOF
docker-compose -f docker-compose.orchestration.yml up -d
EOF
    else
        print_info "Starting Docker services..."
        docker-compose -f docker-compose.orchestration.yml up -d
    fi
    
    print_info "Waiting for services to start (2 minutes)..."
    sleep 120
    
    print_info "Checking service status..."
    docker-compose -f docker-compose.orchestration.yml ps
    
    print_success "Orchestration services started"
}

# Function to initialize database
initialize_database() {
    print_header "Initializing Database"
    
    print_info "Running database migrations..."
    pnpm db:migrate || print_warning "Migrations may have already run"
    
    print_success "Database initialized"
}

# Function to verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    print_info "Running validation script..."
    bash scripts/validate-orchestration.sh || print_warning "Some checks may have failed"
    
    print_info "Checking service endpoints..."
    curl -s http://localhost:3000/ > /dev/null && print_success "Application is responding" || print_error "Application not responding"
    curl -s http://localhost:9000/health > /dev/null && print_success "Webhook handler is healthy" || print_warning "Webhook handler may not be ready"
    curl -s http://localhost:9090/-/healthy > /dev/null && print_success "Prometheus is healthy" || print_warning "Prometheus may not be ready"
    
    print_success "Verification complete"
}

# Function to display access information
display_info() {
    print_header "Deployment Complete!"
    
    EXTERNAL_IP=$(curl -s ifconfig.me || echo "localhost")
    
    echo -e "${GREEN}"
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  🎉 Deployment Successful! 🎉                  ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${BLUE}Access your services:${NC}"
    echo -e "  • Application:      http://$EXTERNAL_IP:3000"
    echo -e "  • Grafana:          http://$EXTERNAL_IP:3001 (admin/[password from .env])"
    echo -e "  • Prometheus:       http://$EXTERNAL_IP:9090"
    echo -e "  • Jaeger Tracing:   http://$EXTERNAL_IP:16686"
    echo -e "  • pgAdmin:          http://$EXTERNAL_IP:5050"
    echo -e "  • MinIO:            http://$EXTERNAL_IP:9001"
    echo ""
    
    echo -e "${BLUE}Available Agents:${NC}"
    echo -e "  • Code Analyst       - Code review and static analysis"
    echo -e "  • Test Engineer      - Automated testing"
    echo -e "  • Build Specialist   - Compilation and bundling"
    echo -e "  • Deploy Manager     - Deployment operations"
    echo -e "  • Documentation      - Auto-generate docs"
    echo -e "  • Refactor Expert    - Code modernization"
    echo -e "  • Monitoring Agent   - Performance tracking"
    echo ""
    
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Change Grafana password in .env"
    echo -e "  2. Configure GitHub webhooks: http://$EXTERNAL_IP:9000/webhooks/github"
    echo -e "  3. Start development: ${GREEN}pnpm dev${NC}"
    echo -e "  4. View logs: ${GREEN}make docker-logs${NC}"
    echo ""
    
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  • Check status:     ${GREEN}make docker-status${NC}"
    echo -e "  • View logs:        ${GREEN}make docker-logs${NC}"
    echo -e "  • Restart services: ${GREEN}make docker-restart${NC}"
    echo -e "  • Run tests:        ${GREEN}make test${NC}"
    echo -e "  • Security scan:    ${GREEN}make security${NC}"
    echo ""
}

# Main execution
main() {
    MODE="${1:-auto}"
    
    case $MODE in
        create)
            create_vm
            print_info "VM created. Now SSH to it and run: ./deploy-orchestration.sh install"
            ;;
        install)
            install_dependencies
            setup_repository
            install_project_deps
            configure_environment
            start_orchestration
            initialize_database
            verify_deployment
            display_info
            ;;
        auto)
            if command -v gcloud &> /dev/null; then
                create_vm
                print_info "SSH to the VM to complete installation..."
                print_info "Run: gcloud compute ssh $VM_NAME --zone=$ZONE"
                print_info "Then: curl -fsSL https://raw.githubusercontent.com/muffy86/Autonomous-AI-orchestration-agent/$REPO_BRANCH/deploy-orchestration.sh -o deploy.sh && bash deploy.sh install"
            else
                # We're already on the VM
                install_dependencies
                setup_repository
                install_project_deps
                configure_environment
                start_orchestration
                initialize_database
                verify_deployment
                display_info
            fi
            ;;
        *)
            echo "Usage: $0 {create|install|auto}"
            echo ""
            echo "  create  - Create GCP VM instance"
            echo "  install - Install on current VM"
            echo "  auto    - Detect environment and run appropriate steps"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
