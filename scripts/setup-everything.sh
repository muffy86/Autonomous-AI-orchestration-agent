#!/bin/bash
#
# COMPLETE AUTOMATED SETUP SCRIPT
# This script sets up EVERYTHING you need - no technical knowledge required!
#

set -e

# Colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🤖 AI CHATBOT - COMPLETE AUTOMATED SETUP                ║
║                                                            ║
║   This will set up everything automatically!               ║
║   Just sit back and relax...                               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

sleep 2

# Function to print step headers
print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Step 1: Check system requirements
print_step "Step 1/8: Checking Your System..."

echo "Checking for required tools..."
command -v node >/dev/null 2>&1 || { echo -e "${YELLOW}Installing Node.js...${NC}"; }
command -v pnpm >/dev/null 2>&1 || { 
    echo -e "${YELLOW}Installing pnpm...${NC}"; 
    npm install -g pnpm
}

echo -e "${GREEN}✅ System check complete!${NC}"

# Step 2: Install dependencies
print_step "Step 2/8: Installing All Required Packages..."

echo "This may take a few minutes..."
pnpm install

echo -e "${GREEN}✅ All packages installed!${NC}"

# Step 3: Setup database
print_step "Step 3/8: Setting Up Database..."

# Check if PostgreSQL is running
if ! sudo service postgresql status >/dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    sudo service postgresql start
fi

# Create database and user if they don't exist
sudo -u postgres psql -c "CREATE DATABASE ai_chatbot;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER chatbot_user WITH PASSWORD 'chatbot_password';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_chatbot TO chatbot_user;" 2>/dev/null
sudo -u postgres psql -d ai_chatbot -c "GRANT ALL ON SCHEMA public TO chatbot_user;" 2>/dev/null

echo -e "${GREEN}✅ Database ready!${NC}"

# Step 4: Setup Redis
print_step "Step 4/8: Setting Up Redis Cache..."

if ! sudo service redis-server status >/dev/null 2>&1; then
    echo "Starting Redis..."
    sudo service redis-server start
fi

echo -e "${GREEN}✅ Redis ready!${NC}"

# Step 5: Create environment configuration
print_step "Step 5/8: Creating Configuration Files..."

if [ ! -f .env.local ]; then
    echo "Generating secure configuration..."
    
    AUTH_SECRET=$(openssl rand -base64 32)
    
    cat > .env.local << EOL
# Authentication
AUTH_SECRET=${AUTH_SECRET}

# Database
POSTGRES_URL=postgresql://chatbot_user:chatbot_password@localhost:5432/ai_chatbot

# Redis
REDIS_URL=redis://localhost:6379

# AI API Keys
OPENAI_API_KEY=\${Open_ai}
XAI_API_KEY=your_xai_api_key_here

# Vercel Blob Storage (optional)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Environment
NODE_ENV=development
EOL

    echo -e "${GREEN}✅ Configuration file created!${NC}"
else
    echo -e "${YELLOW}Configuration file already exists, skipping...${NC}"
fi

# Step 6: Run database migrations
print_step "Step 6/8: Setting Up Database Tables..."

pnpm db:migrate

echo -e "${GREEN}✅ Database tables created!${NC}"

# Step 7: Run verification
print_step "Step 7/8: Verifying Everything Works..."

node scripts/verify-connections.js

# Step 8: Create first backup
print_step "Step 8/8: Creating Initial Backup..."

mkdir -p backups
./scripts/backup-database.sh

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ✅ SETUP COMPLETE! EVERYTHING IS READY!                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}What to do next:${NC}"
echo ""
echo "1. Start the application:"
echo -e "   ${YELLOW}pnpm dev${NC}"
echo ""
echo "2. Open your browser to:"
echo -e "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "3. Check system health anytime:"
echo -e "   ${YELLOW}pnpm verify:connections${NC}"
echo ""
echo "4. Create a backup:"
echo -e "   ${YELLOW}./scripts/backup-database.sh${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
