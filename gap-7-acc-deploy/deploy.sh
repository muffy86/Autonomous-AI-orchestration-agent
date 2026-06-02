#!/bin/bash
# Gap 7: Deploy AI Command Center to Vercel
# One-command deploy from local file to permanent URL

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/deploy"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "[+] AI Command Center Deploy Script"
echo "[+] Source: $REPO_ROOT/ai-command-center.html"
echo ""

# Check source file exists
SOURCE_FILE="$REPO_ROOT/ai-command-center.html"
if [ ! -f "$SOURCE_FILE" ]; then
    SOURCE_FILE="${1:-}"
    if [ ! -f "$SOURCE_FILE" ]; then
        echo -e "${RED}[!] Error: ai-command-center.html not found${NC}"
        echo "Usage: $0 [path/to/ai-command-center.html]"
        exit 1
    fi
fi

echo -e "${GREEN}[+] Source: $SOURCE_FILE${NC}"

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}[!] Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check for Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}[!] VERCEL_TOKEN not set.${NC}"
    echo "    Set with: export VERCEL_TOKEN=your_token"
    echo "    Or login interactively (press Enter to continue)"
    read -r
fi

# Prepare deploy directory
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy files
cp "$SOURCE_FILE" "$DEPLOY_DIR/ai-command-center.html"
cp "$SCRIPT_DIR/vercel.json" "$DEPLOY_DIR/"

# Create package.json for Vercel
cat > "$DEPLOY_DIR/package.json" << 'EOF'
{
  "name": "ai-command-center",
  "version": "1.0.0",
  "private": true
}
EOF

echo "[+] Deploy directory prepared"
echo "[+] Files:"
ls -la "$DEPLOY_DIR"

# Deploy to Vercel
echo ""
echo -e "${GREEN}[+] Deploying to Vercel...${NC}"
cd "$DEPLOY_DIR"

if [ -n "$VERCEL_TOKEN" ]; then
    # Deploy with token (non-interactive)
    vercel --token "$VERCEL_TOKEN" --yes --prod 2>&1 | tee deploy.log
else
    # Interactive deploy
    vercel --yes --prod 2>&1 | tee deploy.log
fi

# Extract and display URL
if grep -q " Production " deploy.log; then
    URL=$(grep " Production " deploy.log | awk '{print $2}')
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  DEPLOYED: $URL${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Add to ECHO Nexus bot response:"
    echo "/start command returns this link"
    
    # Save to file for reference
    echo "$URL" > "$SCRIPT_DIR/LAST_DEPLOY_URL.txt"
    
    # Optionally save to memory
    if [ -f "$REPO_ROOT/gap-3-memory/memory-sync.py" ]; then
        python3 "$REPO_ROOT/gap-3-memory/memory-sync.py" add \
            --type "deployment" \
            --content "ACC deployed to $URL"
    fi
    
    echo ""
    echo "Config for other agents:"
    echo "  ACC_URL=$URL"
    
else
    echo -e "${RED}[!] Deploy may have failed. Check deploy.log${NC}"
    cat deploy.log
    exit 1
fi

# Cleanup
rm -rf "$DEPLOY_DIR"
echo "[+] Cleanup complete"
