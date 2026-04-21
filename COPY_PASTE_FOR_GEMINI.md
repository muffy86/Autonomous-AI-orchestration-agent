# 📋 Copy/Paste Instructions for Gemini Code Assist

## 🎯 What You're Deploying

An **autonomous AI orchestration environment** with 15 microservices, 7 AI agents, full monitoring stack, and automated CI/CD. Everything runs in Docker on Google Cloud Platform.

---

## 🚀 Option 1: One-Command Deployment (Easiest)

### Step 1: On Your Local Machine (with gcloud CLI)

Copy and paste this:

```bash
# Set your GCP project ID
export GCP_PROJECT_ID="your-project-id-here"

# Create VM and get deployment script
curl -fsSL https://raw.githubusercontent.com/muffy86/Autonomous-AI-orchestration-agent/cursor/full-orchestration-mcp-environment-e9c0/deploy-orchestration.sh -o deploy.sh

chmod +x deploy.sh

# Create the VM
./deploy.sh create
```

### Step 2: SSH to the New VM

The script will output the SSH command. Run it, then paste:

```bash
# Download and run installation
curl -fsSL https://raw.githubusercontent.com/muffy86/Autonomous-AI-orchestration-agent/cursor/full-orchestration-mcp-environment-e9c0/deploy-orchestration.sh -o deploy.sh

chmod +x deploy.sh

./deploy.sh install
```

### Step 3: Access Your Services

Visit the URLs shown at the end (replace `YOUR_IP` with your VM's external IP):
- http://YOUR_IP:3000 - Main app
- http://YOUR_IP:3001 - Grafana
- http://YOUR_IP:9090 - Prometheus

---

## 🚀 Option 2: Google Cloud Shell (No GCP Setup Needed)

### Click This Button:

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/muffy86/Autonomous-AI-orchestration-agent.git&cloudshell_git_branch=cursor/full-orchestration-mcp-environment-e9c0)

### Then Paste These Commands:

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install
cd mcp && pnpm install && cd ..
cd orchestration && pnpm install && cd ..
cd scripts && pnpm install && cd ..

# Configure environment
cp .env.orchestration .env

# Start minimal stack (Cloud Shell has limited resources)
cat > docker-compose.minimal.yml << 'EOF'
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: chatbot
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
volumes:
  postgres-data:
EOF

docker-compose -f docker-compose.minimal.yml up -d

# Initialize database
pnpm db:migrate

# Start app
pnpm dev
```

### Access via Web Preview:
1. Click **Web Preview** button
2. Select **Preview on port 3000**

---

## 🚀 Option 3: For Gemini Agent (Full Automation)

### Copy This Entire Prompt to Gemini:

```
Deploy the autonomous AI orchestration environment to GCP.

Repository: https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
Branch: cursor/full-orchestration-mcp-environment-e9c0

Execute these steps:

1. Create GCP VM:
   - Name: ai-orchestration-vm
   - Machine: e2-standard-4 (4 vCPUs, 16GB RAM)
   - Disk: 50GB SSD
   - OS: Ubuntu 22.04 LTS
   - Zone: us-central1-a
   - Tags: http-server, https-server, orchestration

2. Create firewall rules:
   - allow-orchestration-http: tcp:80,443,3000,3001
   - allow-orchestration-monitoring: tcp:9090,16686,5050,9001

3. SSH to VM and run:
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install pnpm
   sudo npm install -g pnpm
   
   # Clone repo
   git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
   cd Autonomous-AI-orchestration-agent
   git checkout cursor/full-orchestration-mcp-environment-e9c0
   
   # Install all dependencies
   pnpm install
   cd mcp && pnpm install && cd ..
   cd orchestration && pnpm install && cd ..
   cd scripts && pnpm install && cd ..
   
   # Configure
   cp .env.orchestration .env
   
   # Start services
   docker-compose -f docker-compose.orchestration.yml up -d
   
   # Initialize database
   pnpm db:migrate

4. Verify deployment:
   - Check services: docker-compose -f docker-compose.orchestration.yml ps
   - Test app: curl http://localhost:3000
   - Get external IP: curl ifconfig.me

5. Provide access URLs:
   http://EXTERNAL_IP:3000 (app)
   http://EXTERNAL_IP:3001 (Grafana)
   http://EXTERNAL_IP:9090 (Prometheus)

Execute these commands and report back with the external IP and service status.
```

---

## 🎯 For Environment Setup Agents

### If Using cursor.com/onboard:

```
Set up a complete autonomous AI orchestration environment with:

1. Base Image Requirements:
   - Ubuntu 22.04 LTS
   - Docker and Docker Compose
   - Node.js 20+
   - pnpm package manager
   - Build tools (make, gcc, g++)

2. Repository Setup:
   git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
   cd Autonomous-AI-orchestration-agent
   git checkout cursor/full-orchestration-mcp-environment-e9c0

3. Install Commands:
   pnpm install
   cd mcp && pnpm install && cd ..
   cd orchestration && pnpm install && cd ..
   cd scripts && pnpm install && cd ..

4. Environment Configuration:
   cp .env.orchestration .env
   Generate secure secrets for WEBHOOK_SECRET, SESSION_SECRET, POSTGRES_PASSWORD

5. Services to Start:
   docker-compose -f docker-compose.orchestration.yml up -d
   pnpm db:migrate

6. Verification:
   All 15 Docker services running
   Application accessible on port 3000
   Monitoring on ports 3001 (Grafana), 9090 (Prometheus)

7. VS Code Extensions:
   Install all recommended extensions from .vscode/extensions.recommended.json
```

---

## 📝 What You'll Get

After running any of these options:

✅ **15 Running Services**:
- PostgreSQL (database)
- Redis (cache)
- Prometheus (metrics)
- Grafana (dashboards)
- Loki (logs)
- Jaeger (tracing)
- Nginx (proxy)
- MinIO (storage)
- Vault (secrets)
- SonarQube (code quality)
- pgAdmin (DB UI)
- Mailhog (email testing)
- MCP Server (AI tools)
- Webhook Handler (CI/CD)
- Main Application

✅ **7 Autonomous Agents**:
- Code Analyst
- Test Engineer
- Build Specialist
- Deploy Manager
- Documentation Writer
- Refactor Expert
- Monitoring Agent

✅ **Development Tools**:
- CLI with 30+ commands
- Makefile automation
- VS Code integration
- Git hooks
- Testing framework

---

## 🆘 If Something Goes Wrong

```bash
# Check what's running
docker ps

# View logs
docker-compose -f docker-compose.orchestration.yml logs

# Restart everything
docker-compose -f docker-compose.orchestration.yml restart

# Clean start
docker-compose -f docker-compose.orchestration.yml down
docker-compose -f docker-compose.orchestration.yml up -d
```

---

## ✅ Verification

Run this to verify everything works:

```bash
bash scripts/validate-orchestration.sh
```

You should see:
- ✓ All prerequisites installed
- ✓ All files present
- ✓ Services running
- ✓ Ports accessible

---

## 🎓 Next Steps After Deployment

1. **Change default passwords** in `.env`
2. **Configure GitHub webhooks** (see ORCHESTRATION.md)
3. **Explore Grafana dashboards** at port 3001
4. **Run the CLI**: `pnpm orchestration --help`
5. **Start development**: `pnpm dev`

---

**That's it!** Choose any option above and you'll have a fully functional autonomous AI orchestration environment in minutes.
