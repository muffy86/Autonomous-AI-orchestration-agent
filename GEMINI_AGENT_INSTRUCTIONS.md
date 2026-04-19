# Instructions for Gemini Code Assist / AI Agents

## 🤖 Agent Context: What This Project Is

You are helping deploy a **comprehensive autonomous AI orchestration environment** for a Next.js AI Chatbot application. This is a production-grade, self-managing development platform with:

- **MCP (Model Context Protocol) Server** - 8 AI tools for code interaction
- **7 Autonomous Agents** - Code analyst, test engineer, build specialist, deploy manager, documentation writer, refactor expert, monitoring agent
- **Full Observability Stack** - Prometheus, Grafana, Loki, Jaeger for monitoring/logging/tracing
- **15 Docker Services** - PostgreSQL, Redis, Nginx, MinIO, Vault, SonarQube, Mailhog, etc.
- **Webhook Infrastructure** - Automated CI/CD triggers for GitHub/GitLab/Vercel
- **Expert Dev Tools** - 50+ VS Code extensions, CLI tools, Makefile automation

## 🎯 Your Mission

Deploy this entire orchestration environment to Google Cloud Platform (GCP) so the user has a fully functioning, production-ready development platform running in the cloud.

## 📋 What Needs to Be Done

### Phase 1: GCP Infrastructure Provisioning
1. Create a GCP Compute Engine VM with sufficient resources
2. Configure firewall rules for web access
3. Set up persistent storage
4. Configure networking

### Phase 2: VM Setup
1. Install Docker and Docker Compose
2. Install Node.js 20+ and pnpm
3. Clone the GitHub repository
4. Checkout the orchestration branch

### Phase 3: Application Deployment
1. Install all dependencies
2. Configure environment variables
3. Start Docker orchestration stack
4. Initialize database
5. Start the application

### Phase 4: Verification
1. Check all services are running
2. Verify ports are accessible
3. Test the application
4. Configure monitoring

## 🔑 Key Information

**Repository**: https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
**Branch**: cursor/full-orchestration-mcp-environment-e9c0

**Required Resources**:
- VM: e2-standard-4 (4 vCPUs, 16GB RAM) minimum
- Disk: 50GB SSD
- OS: Ubuntu 22.04 LTS
- Region: us-central1-a (or user's preferred region)

**Services & Ports**:
- 3000: Main Application
- 3001: Grafana (monitoring dashboards)
- 5432: PostgreSQL (database)
- 6379: Redis (cache)
- 9090: Prometheus (metrics)
- 3100: Loki (logs)
- 16686: Jaeger (tracing)
- 5050: pgAdmin (database UI)
- 9001: MinIO (object storage)
- 9000: Webhook handler
- 9900: SonarQube (code quality)
- 8200: Vault (secrets)
- 8025: Mailhog (email testing)
- 80/443: Nginx (reverse proxy)

## 📝 Complete Deployment Instructions

### Step 1: Create GCP Resources

```bash
# Set variables (user should customize these)
export PROJECT_ID="your-gcp-project-id"
export VM_NAME="ai-orchestration-vm"
export REGION="us-central1"
export ZONE="us-central1-a"
export MACHINE_TYPE="e2-standard-4"
export DISK_SIZE="50GB"

# Set the project
gcloud config set project $PROJECT_ID

# Create the VM instance
gcloud compute instances create $VM_NAME \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE \
  --boot-disk-size=$DISK_SIZE \
  --boot-disk-type=pd-ssd \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server,https-server,orchestration \
  --metadata=startup-script='#!/bin/bash
    apt-get update
    apt-get install -y git curl
  '

# Create firewall rules
gcloud compute firewall-rules create allow-orchestration-http \
  --allow tcp:80,tcp:443,tcp:3000,tcp:3001 \
  --target-tags=orchestration \
  --source-ranges=0.0.0.0/0 \
  --description="Allow HTTP traffic for orchestration services"

gcloud compute firewall-rules create allow-orchestration-monitoring \
  --allow tcp:9090,tcp:16686,tcp:5050 \
  --target-tags=orchestration \
  --source-ranges=0.0.0.0/0 \
  --description="Allow monitoring and admin interfaces"

# Reserve a static IP (optional)
gcloud compute addresses create $VM_NAME-ip --region=$REGION

# Get the external IP
gcloud compute instances describe $VM_NAME \
  --zone=$ZONE \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Step 2: SSH to VM and Install Dependencies

```bash
# SSH to the VM
gcloud compute ssh $VM_NAME --zone=$ZONE

# Once connected to VM, run these commands:

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install make and build tools
sudo apt-get install -y build-essential make

# Log out and back in for Docker group to take effect
exit
```

### Step 3: Clone and Setup Project

```bash
# SSH back to VM
gcloud compute ssh $VM_NAME --zone=$ZONE

# Clone the repository
git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
cd Autonomous-AI-orchestration-agent

# Checkout the orchestration branch
git checkout cursor/full-orchestration-mcp-environment-e9c0

# Install all dependencies
pnpm install
cd mcp && pnpm install && cd ..
cd orchestration && pnpm install && cd ..
cd scripts && pnpm install && cd ..

# Or use the shortcut
pnpm setup:all
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.orchestration .env

# Generate secure secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Update .env file with secrets
sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env

# Set to production mode
sed -i "s/NODE_ENV=.*/NODE_ENV=production/" .env
```

### Step 5: Start Orchestration Environment

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.orchestration.yml up -d

# Or use Make
make orchestration-start

# Wait for services to be ready (about 2-3 minutes)
sleep 120

# Check service status
docker-compose -f docker-compose.orchestration.yml ps

# View logs
docker-compose -f docker-compose.orchestration.yml logs -f
```

### Step 6: Initialize Database

```bash
# Run database migrations
pnpm db:migrate

# Verify database is working
docker-compose -f docker-compose.orchestration.yml exec postgres psql -U postgres -c "\l"
```

### Step 7: Start the Application

```bash
# Build the application
pnpm build

# Start the application (in production mode)
pnpm start

# Or for development
pnpm dev
```

### Step 8: Verify Deployment

```bash
# Run validation script
bash scripts/validate-orchestration.sh

# Check all services are healthy
curl http://localhost:3000/
curl http://localhost:9000/health
curl http://localhost:9090/-/healthy
curl http://localhost:3100/ready

# Get external IP to access services
echo "Access your application at: http://$(curl -s ifconfig.me):3000"
```

### Step 9: Configure Nginx (Optional - for production)

```bash
# Install Nginx on the host (separate from Docker Nginx)
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config for reverse proxy
sudo tee /etc/nginx/sites-available/orchestration << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
    }

    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host $host;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/orchestration /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (if you have a domain)
# sudo certbot --nginx -d your-domain.com
```

### Step 10: Setup Monitoring Access

```bash
# Get the external IP
EXTERNAL_IP=$(curl -s ifconfig.me)

echo "==================================="
echo "🎉 Deployment Complete!"
echo "==================================="
echo ""
echo "Access your services:"
echo "- Application: http://$EXTERNAL_IP:3000"
echo "- Grafana: http://$EXTERNAL_IP:3001 (admin/admin)"
echo "- Prometheus: http://$EXTERNAL_IP:9090"
echo "- Jaeger: http://$EXTERNAL_IP:16686"
echo "- pgAdmin: http://$EXTERNAL_IP:5050"
echo "- MinIO: http://$EXTERNAL_IP:9001"
echo ""
echo "Next steps:"
echo "1. Change Grafana password"
echo "2. Configure your domain (optional)"
echo "3. Setup SSL with Let's Encrypt"
echo "4. Configure GitHub webhooks"
echo "==================================="
```

## 🤖 Agent Automation Script

Here's a **single script** that does everything. Save this and run it:

```bash
#!/bin/bash
# Complete Orchestration Deployment Script for GCP
# This script automates the entire deployment process

set -e

echo "🚀 Starting Autonomous Orchestration Deployment..."

# Step 1: Check if we're on the VM or need to create one
if [ ! -f /etc/os-release ] || ! grep -q "Ubuntu" /etc/os-release; then
    echo "❌ This script must be run on Ubuntu 22.04 LTS"
    echo "Please create a GCP VM first with:"
    echo "gcloud compute instances create ai-orchestration-vm --machine-type=e2-standard-4 --zone=us-central1-a ..."
    exit 1
fi

# Step 2: Install Docker
echo "📦 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Step 3: Install Node.js and pnpm
echo "📦 Installing Node.js and pnpm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs build-essential make
fi

if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
fi

# Step 4: Clone repository
echo "📥 Cloning repository..."
if [ ! -d "Autonomous-AI-orchestration-agent" ]; then
    git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
fi

cd Autonomous-AI-orchestration-agent
git fetch origin
git checkout cursor/full-orchestration-mcp-environment-e9c0

# Step 5: Install dependencies
echo "📦 Installing dependencies..."
pnpm setup:all

# Step 6: Configure environment
echo "⚙️  Configuring environment..."
cp .env.orchestration .env

# Generate secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Update .env
sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env

# Step 7: Start orchestration
echo "🚀 Starting orchestration services..."
make orchestration-start

# Wait for services
echo "⏳ Waiting for services to start (2 minutes)..."
sleep 120

# Step 8: Initialize database
echo "🗄️  Initializing database..."
pnpm db:migrate

# Step 9: Verify deployment
echo "✅ Verifying deployment..."
bash scripts/validate-orchestration.sh || true

# Step 10: Display access information
EXTERNAL_IP=$(curl -s ifconfig.me)

echo ""
echo "==================================="
echo "🎉 Deployment Complete!"
echo "==================================="
echo ""
echo "Access your services:"
echo "- Application: http://$EXTERNAL_IP:3000"
echo "- Grafana: http://$EXTERNAL_IP:3001 (admin/admin)"
echo "- Prometheus: http://$EXTERNAL_IP:9090"
echo "- Jaeger: http://$EXTERNAL_IP:16686"
echo ""
echo "Environment details saved to .env"
echo ""
echo "To start development:"
echo "  cd Autonomous-AI-orchestration-agent"
echo "  pnpm dev"
echo ""
echo "==================================="
```

## 🎯 For Gemini Code Assist Agent

### Prompt to Give Gemini:

```
I need you to deploy an autonomous AI orchestration environment to Google Cloud Platform. 

Context:
- Repository: https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
- Branch: cursor/full-orchestration-mcp-environment-e9c0
- This is a Next.js AI chatbot with 15 microservices, monitoring stack, and autonomous agents

Tasks:
1. Create a GCP VM (e2-standard-4, Ubuntu 22.04, 50GB disk) in us-central1-a
2. Configure firewall rules for ports: 80, 443, 3000, 3001, 9090, 16686, 5050
3. SSH to the VM and install: Docker, Docker Compose, Node.js 20, pnpm
4. Clone the repository and checkout the branch
5. Run: pnpm setup:all
6. Copy .env.orchestration to .env and generate secure secrets
7. Start services: make orchestration-start
8. Initialize database: pnpm db:migrate
9. Verify all services are running

Provide me with the exact gcloud CLI commands to execute each step.
```

## 📋 Checklist for Agents

- [ ] GCP project is set and active
- [ ] VM instance created with correct specs
- [ ] Firewall rules configured
- [ ] Docker installed and running
- [ ] Node.js 20+ and pnpm installed
- [ ] Repository cloned and on correct branch
- [ ] All dependencies installed (main + mcp + orchestration + scripts)
- [ ] Environment variables configured with secure secrets
- [ ] Docker Compose services started
- [ ] Database initialized with migrations
- [ ] Application accessible on external IP
- [ ] All 15 services running and healthy
- [ ] Monitoring dashboards accessible

## 🔧 Troubleshooting for Agents

If deployment fails:

1. **Check Docker**: `sudo systemctl status docker`
2. **Check logs**: `docker-compose -f docker-compose.orchestration.yml logs`
3. **Check resources**: `free -h` and `df -h`
4. **Restart services**: `make docker-restart`
5. **Check ports**: `sudo netstat -tulpn | grep LISTEN`

## 💾 State Persistence

Important directories to backup:
- `/home/user/Autonomous-AI-orchestration-agent` - Main application
- Docker volumes (handled by Docker Compose)
- `.env` file with secrets

## 🎓 Success Criteria

The deployment is successful when:
1. All 15 Docker containers are running
2. Application responds on port 3000
3. Grafana accessible on port 3001
4. Database migrations completed
5. No errors in `docker-compose ps`
6. Validation script passes

---

**Ready to deploy!** Copy these instructions to Gemini Code Assist or use the automation script above.
