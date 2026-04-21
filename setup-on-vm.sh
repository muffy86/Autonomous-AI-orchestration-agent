#!/bin/bash
# Setup Script - Run this INSIDE your GCP VM after SSH

set -e

echo "🚀 Starting Orchestration Setup..."

# Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential make

# Install pnpm
sudo npm install -g pnpm

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
cd Autonomous-AI-orchestration-agent
git checkout cursor/full-orchestration-mcp-environment-e9c0

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
cd mcp && pnpm install && cd ..
cd orchestration && pnpm install && cd ..
cd scripts && pnpm install && cd ..

# Configure environment
echo "⚙️ Configuring environment..."
cp .env.orchestration .env

# Generate secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env

# Start services (need to use newgrp to activate docker group)
echo "🐳 Starting Docker services..."
newgrp docker <<EONG
cd ~/Autonomous-AI-orchestration-agent
docker-compose -f docker-compose.orchestration.yml up -d
EONG

echo "⏳ Waiting for services to start..."
sleep 120

# Initialize database
echo "🗄️ Initializing database..."
pnpm db:migrate

# Get external IP
EXTERNAL_IP=$(curl -s ifconfig.me)

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Access your services:"
echo "  Application:  http://$EXTERNAL_IP:3000"
echo "  Grafana:      http://$EXTERNAL_IP:3001"
echo "  Prometheus:   http://$EXTERNAL_IP:9090"
echo ""
echo "To start development:"
echo "  cd Autonomous-AI-orchestration-agent"
echo "  pnpm dev"
