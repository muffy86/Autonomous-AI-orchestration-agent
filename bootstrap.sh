#!/bin/bash
# bootstrap.sh - Sovereign AI OS boot protocol
# Run this once to initialize full stack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[bootstrap] Sovereign AI OS Boot Sequence"
echo "=========================================="

# 1. Python check
echo "[bootstrap] Checking Python 3.11+..."
python3 --version || { echo "Error: Python 3.11+ required"; exit 1; }

# 2. Install deps
echo "[bootstrap] Installing Python dependencies..."
pip install -q -r requirements.txt

# 3. Directory structure
echo "[bootstrap] Creating directory structure..."
mkdir -p ~/.echo-nexus
mkdir -p ~/.agent-handoffs
mkdir -p ~/.orchestrator/queue ~/.orchestrator/dlq
mkdir -p ~/mind-weaver/research
mkdir -p ~/.infisical-vault

# 4. .env template
echo "[bootstrap] Checking environment..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Sovereign AI OS - Environment Variables

# OpenRouter (Primary)
OPENROUTER_API_KEY=

# ECHO Nexus Telegram Bot
ECHO_NEXUS_BOT_TOKEN=
ECHO_NEXUS_USERS=  # Comma-separated allowed user IDs

# GitHub (for memory sync)
GITHUB_TOKEN=
GITHUB_MEMORY_REPO=

# Notion (for memory sync)
NOTION_TOKEN=
NOTION_MEMORY_DB=

# Orchestrator
ORCH_SECRET=change-me-for-production

# Vercel (for ACC deploy)
VERCEL_TOKEN=
VERCEL_TEAM=

# Infisical Vault (optional - auto-generated)
# See ~/.infisical-vault/.env after vault-setup.sh
EOF
    echo "[bootstrap] Created .env template - Fill in your keys"
fi

# 5. Make scripts executable
echo "[bootstrap] chmod +x scripts..."
chmod +x *.py *.sh 2>/dev/null || true

# 6. Link CLI tools
echo "[bootstrap] Installing CLI aliases..."
mkdir -p ~/.local/bin

# Create symlinks for CLI tools
ln -sf "$SCRIPT_DIR/echo-nexus-cli.py" ~/.local/bin/echo-nexus
ln -sf "$SCRIPT_DIR/wsl2-watcher.py" ~/.local/bin/echowatch
ln -sf "$SCRIPT_DIR/skill-registry.py" ~/.local/bin/skill-registry
ln -sf "$SCRIPT_DIR/memory-sync.py" ~/.local/bin/memory-sync
ln -sf "$SCRIPT_DIR/handoff-write.py" ~/.local/bin/handoff-write
ln -sf "$SCRIPT_DIR/orchestrator-api.py" ~/.local/bin/orchestrator

# Add to PATH if needed
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo "[bootstrap] Added ~/.local/bin to PATH (reload shell or run: source ~/.bashrc)"
fi

# 7. Check vault status
echo "[bootstrap] Checking Infisical vault..."
if [ ! -f ~/.infisical-vault/.env ]; then
    echo "[bootstrap] Vault not set up yet. Run: bash vault-setup.sh"
else
    echo "[bootstrap] ✓ Vault configured"
fi

# 8. Health check
echo ""
echo "[bootstrap] Health Check:"
echo "  Python: $(python3 --version)"
echo "  FastAPI: $(python3 -c 'import fastapi; print(fastapi.__version)')"
echo "  Skills: $(python3 skill-registry.py --auto-load | wc -w) auto-load skills"
echo ""

echo "[bootstrap] ✓ Boot complete"
echo ""
echo "Next steps:"
echo "  1. Fill in .env with your API keys"
echo "  2. Run: bash vault-setup.sh  (if not done)"
echo "  3. Start ECHO Nexus: python echo-nexus-bot.py"
echo "  4. Start Orchestrator: python orchestrator-api.py"
echo "  5. Start Watcher: echowatch --daemon"
echo ""
echo "CLI Commands:"
echo "  echo-nexus --list      # View pending tasks"
echo "  skill-registry -l      # List all skills"
echo "  memory-sync --sync     # Sync memories"
echo "  orchestrator --add-route source:event_type:target_url"
echo "  deploy-acc.py          # Deploy ACC to Vercel"