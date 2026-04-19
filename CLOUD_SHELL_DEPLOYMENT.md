# Deploying to Google Cloud Shell

This guide explains how to deploy the autonomous orchestration environment to Google Cloud Shell.

## 🚀 Quick Deploy to Cloud Shell

### Method 1: Direct Clone and Setup

```bash
# 1. Clone the repository
git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
cd Autonomous-AI-orchestration-agent

# 2. Checkout the orchestration branch
git checkout cursor/full-orchestration-mcp-environment-e9c0

# 3. Install dependencies
pnpm setup:all

# 4. Configure environment
cp .env.orchestration .env
# Edit .env with your settings (optional for development)

# 5. Start the orchestration environment
make orchestration-start

# 6. Start development server
pnpm dev
```

### Method 2: Using the Cloud Shell Button

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/muffy86/Autonomous-AI-orchestration-agent.git&cloudshell_git_branch=cursor/full-orchestration-mcp-environment-e9c0)

## 📋 Prerequisites in Cloud Shell

Google Cloud Shell comes pre-installed with:
- ✅ Docker
- ✅ Git
- ✅ Node.js
- ✅ Basic development tools

You'll need to install:
```bash
# Install pnpm
npm install -g pnpm

# Verify installations
node --version
pnpm --version
docker --version
```

## 🔧 Cloud Shell Configuration

### 1. Increase Resources (Optional)

Cloud Shell has limited resources. To run the full stack, you may want to:

```bash
# Check current resources
free -h
df -h

# The full orchestration stack requires:
# - At least 8GB RAM
# - 10GB free disk space
```

If you need more resources, consider using a GCP VM instance instead of Cloud Shell.

### 2. Port Forwarding

Cloud Shell provides automatic port forwarding for:
- Port 3000 (Application)
- Ports 8080-8090 (Web preview)

To access other services:

```bash
# Enable Cloud Shell Web Preview
# Click "Web Preview" button in Cloud Shell
# Select "Preview on port 3000" for the app
# Or specify custom ports: 3001 (Grafana), 9090 (Prometheus), etc.
```

### 3. Minimal Setup (Recommended for Cloud Shell)

For Cloud Shell's limited resources, use a minimal configuration:

```bash
# Create a minimal docker-compose file
cat > docker-compose.minimal.yml << 'EOF'
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./:/app
      - /app/node_modules
    networks:
      - orchestration

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
    networks:
      - orchestration

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - orchestration

networks:
  orchestration:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
EOF

# Start minimal stack
docker-compose -f docker-compose.minimal.yml up -d
```

## 🌐 Accessing Services in Cloud Shell

### Using Web Preview

1. Click **Web Preview** button in Cloud Shell toolbar
2. Select **Preview on port 3000**
3. For other ports, select **Change port** and enter:
   - 3001 for Grafana
   - 9090 for Prometheus
   - 16686 for Jaeger

### Using Cloud Shell Proxy

```bash
# Cloud Shell creates URLs like:
# https://3000-YOUR_PROJECT_ID-dot-YOUR_REGION.cloudshell.dev

# Access different services by changing the port number:
# https://3001-... for Grafana
# https://9090-... for Prometheus
```

## 🔐 Security Considerations

### 1. Environment Variables

```bash
# Generate secure secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# Add to .env
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env
echo "SESSION_SECRET=$SESSION_SECRET" >> .env
```

### 2. Firewall Rules

Cloud Shell is protected by default. If deploying to a GCP VM:

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0

# Allow development ports (be careful in production!)
gcloud compute firewall-rules create allow-dev-ports \
  --allow tcp:3000,tcp:3001,tcp:9090 \
  --source-ranges YOUR_IP/32
```

### 3. Service Account Permissions

```bash
# If using GCP services, ensure proper permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/editor"
```

## 💾 Persistent Storage

Cloud Shell ephemeral disk is deleted after inactivity. To persist data:

### 1. Use Cloud Shell Home Directory

```bash
# Store important files in $HOME
cp .env $HOME/.env.backup
cp -r data $HOME/project-data
```

### 2. Use Google Cloud Storage

```bash
# Install gsutil (pre-installed in Cloud Shell)
# Create bucket
gsutil mb gs://YOUR_BUCKET_NAME

# Backup data
gsutil -m rsync -r ./data gs://YOUR_BUCKET_NAME/data

# Restore data
gsutil -m rsync -r gs://YOUR_BUCKET_NAME/data ./data
```

### 3. Use Persistent Disk

```bash
# Create and attach persistent disk to GCP VM
gcloud compute disks create orchestration-disk \
  --size=50GB \
  --zone=YOUR_ZONE

gcloud compute instances attach-disk YOUR_VM_NAME \
  --disk=orchestration-disk \
  --zone=YOUR_ZONE
```

## 🚀 Deployment to GCP VM (Production)

For production deployment, use a GCP Compute Engine VM:

### 1. Create VM Instance

```bash
# Create a VM with enough resources
gcloud compute instances create orchestration-vm \
  --machine-type=e2-standard-4 \
  --boot-disk-size=50GB \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --zone=us-central1-a \
  --tags=http-server,https-server
```

### 2. SSH to VM

```bash
gcloud compute ssh orchestration-vm --zone=us-central1-a
```

### 3. Setup on VM

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js and pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Clone and setup
git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
cd Autonomous-AI-orchestration-agent
git checkout cursor/full-orchestration-mcp-environment-e9c0
pnpm setup:all

# Start services
make orchestration-start
```

### 4. Configure DNS (Optional)

```bash
# Get VM external IP
gcloud compute instances describe orchestration-vm \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Point your domain to this IP
# Update DNS A records at your domain registrar
```

### 5. Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring in Cloud Shell

### Resource Monitoring

```bash
# Monitor Docker containers
docker stats

# Check disk usage
df -h

# Check memory
free -h

# Monitor logs
docker-compose -f docker-compose.orchestration.yml logs -f
```

### Cloud Monitoring Integration

```bash
# Install Cloud Monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# Configure monitoring
# Metrics will appear in Cloud Console > Monitoring
```

## 🔄 CI/CD with Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Install dependencies
  - name: 'node:20'
    entrypoint: npm
    args: ['install', '-g', 'pnpm']
  
  - name: 'node:20'
    entrypoint: pnpm
    args: ['install']
  
  # Run tests
  - name: 'node:20'
    entrypoint: pnpm
    args: ['test:unit']
  
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/orchestration:$COMMIT_SHA', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/orchestration:$COMMIT_SHA']

images:
  - 'gcr.io/$PROJECT_ID/orchestration:$COMMIT_SHA'
```

Trigger builds:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## 🐛 Troubleshooting

### Out of Memory

```bash
# Reduce services in docker-compose.yml
# Comment out non-essential services like SonarQube, Jaeger

# Or use the minimal configuration
docker-compose -f docker-compose.minimal.yml up -d
```

### Disk Space Issues

```bash
# Clean Docker
docker system prune -a

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Port Conflicts

```bash
# Check what's using ports
sudo netstat -tulpn | grep LISTEN

# Kill process on port
sudo kill $(sudo lsof -t -i:3000)
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

## 📚 Additional Resources

- [Google Cloud Shell Documentation](https://cloud.google.com/shell/docs)
- [GCP Compute Engine](https://cloud.google.com/compute/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Project Documentation](./ORCHESTRATION.md)

## 💡 Tips for Cloud Shell

1. **Keep sessions active**: Cloud Shell times out after 20 minutes of inactivity
2. **Use tmux**: Keep processes running even when disconnected
3. **Backup regularly**: Use `gsutil` to backup to Cloud Storage
4. **Monitor resources**: Cloud Shell has limits, use `docker stats` to monitor
5. **Use Web Preview**: Easy access to running services

## 🎯 Recommended Cloud Shell Workflow

```bash
# 1. Clone and setup (one time)
git clone <repo>
cd <repo>
pnpm setup:all

# 2. Start minimal stack
docker-compose -f docker-compose.minimal.yml up -d

# 3. Start development
pnpm dev

# 4. Access via Web Preview
# Click "Web Preview" → "Preview on port 3000"

# 5. Make changes and test
# 6. Commit and push when ready

# 7. For full orchestration (use GCP VM instead)
```

---

**Note**: For production deployments with the full orchestration stack, we recommend using a GCP Compute Engine VM with at least 8GB RAM and 50GB disk space. Cloud Shell is best for development and testing with the minimal configuration.
