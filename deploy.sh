#!/bin/bash

# Sovereign System Core - Production Deployment Script
# Complete deployment orchestration for Rust backend + React frontend

set -e

echo "🚀 Sovereign System Core Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}[1/5]${NC} Checking prerequisites..."
if ! command -v cargo &> /dev/null; then
    echo -e "${YELLOW}⚠️  Cargo not found. Please install Rust from https://rustup.rs${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites verified"
echo ""

# Build Rust backend
echo -e "${BLUE}[2/5]${NC} Building Rust backend (release mode)..."
cargo build --release
echo -e "${GREEN}✓${NC} Backend compiled: ./target/release/sovereign-daemon"
echo ""

# Install frontend dependencies
echo -e "${BLUE}[3/5]${NC} Installing frontend dependencies..."
cd ui
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi
cd ..
echo ""

# Kill any existing processes
echo -e "${BLUE}[4/5]${NC} Cleaning up existing processes..."
pkill -f sovereign-daemon 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Start both servers
echo -e "${BLUE}[5/5]${NC} Starting Sovereign System Core..."
echo ""

# Start backend
echo -e "${GREEN}▶${NC} Starting Rust backend daemon (port 8000)..."
nohup ./target/release/sovereign-daemon > backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Verify backend started
if ! curl -s http://localhost:8000/api/state > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend failed to start. Check backend.log${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend running (PID: $BACKEND_PID)"

# Start frontend
echo -e "${GREEN}▶${NC} Starting React frontend (port 3001)..."
cd ui
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Sovereign System Core is operational!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "📡 Backend API:     http://localhost:8000"
echo "🌐 Frontend UI:     http://localhost:3001"
echo "📊 SSE Stream:      http://localhost:8000/api/stream"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop:"
echo "  pkill -f sovereign-daemon"
echo "  pkill -f vite"
echo ""
echo "🚀 Access the Control Matrix at: http://localhost:3001"
