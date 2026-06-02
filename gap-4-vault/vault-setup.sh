#!/bin/bash
# Gap 4: Unified Secret Vault Setup
# Zero-trust solo-operator vault - Infisical primary, pass fallback
# Run: ./vault-setup.sh

set -euo pipefail

VAULT_DIR="$HOME/.vault"
INFISICAL_DIR="$VAULT_DIR/infisical"
PASS_DIR="$VAULT_DIR/pass"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"

echo "[+] Initializing secret vault infrastructure..."

# Create vault structure
mkdir -p "$INFISICAL_DIR" "$PASS_DIR" "$REPO_ROOT/.secrets"

# Check if Docker is available for Infisical (one justified use)
if command -v docker &> /dev/null; then
    echo "[+] Docker detected - setting up Infisical (self-hosted)..."
    
    # Infisical standalone Docker setup
    cat > "$INFISICAL_DIR/docker-compose.yml" << 'EOF'
version: '3.8'
services:
  infisical:
    image: infisical/infisical:latest
    container_name: infisical-vault
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DB_CONNECTION_URI=${DB_CONNECTION_URI:-sqlite://./infisical.db}
      - REDIS_URL=${REDIS_URL:-redis://redis:6379}
      - SITE_URL=${SITE_URL:-http://localhost:8080}
      - TELEMETRY_ENABLED=false
    volumes:
      - ./data:/data
    depends_on:
      - redis
    networks:
      - vault-net

  redis:
    image: redis:7-alpine
    container_name: infisical-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - vault-net

volumes:
  redis-data:

networks:
  vault-net:
    driver: bridge
EOF

    # Infisical CLI wrapper
    cat > "$INFISICAL_DIR/infisical-run.sh" << 'EOF'
#!/bin/bash
# Infisical run wrapper - injects secrets and executes commands
# Usage: ./infisical-run.sh <command>

INFISICAL_TOKEN="${INFISICAL_TOKEN:-}"
INFISICAL_API_URL="${INFISICAL_API_URL:-http://localhost:8080}"

if [ -z "$INFISICAL_TOKEN" ]; then
    echo "[!] INFISICAL_TOKEN not set. Check ~/.vault/infisical/.env"
    exit 1
fi

# Export all secrets from Infisical project
eval $(curl -s -H "Authorization: Bearer $INFISICAL_TOKEN" \
    "$INFISICAL_API_URL/api/v3/secrets?workspaceId=$INFISICAL_WORKSPACE_ID&environment=dev" | \
    jq -r '.secrets[] | "export \(.secretKey)=\(.secretValue)"')

exec "$@"
EOF

    chmod +x "$INFISICAL_DIR/infisical-run.sh"
    
    echo "[+] Infisical Docker compose created."
    echo "[ ] Run: cd $INFISICAL_DIR && docker-compose up -d"
    echo "[ ] Then: docker exec -it infisical-vault infisical login"
    
else
    echo "[!] Docker not available - falling back to GPG + pass"
fi

# GPG + pass fallback (always set up as backup)
echo "[+] Setting up GPG + pass fallback..."

if ! command -v gpg &> /dev/null; then
    echo "[!] GPG not installed. Install: sudo apt-get install gnupg pass"
    exit 1
fi

if ! command -v pass &> /dev/null; then
    echo "[!] pass not installed. Install: sudo apt-get install pass"
    exit 1
fi

# Generate GPG key if none exists
if ! gpg --list-secret-keys --with-colons | grep -q "^sec"; then
    echo "[+] Generating GPG key for vault..."
    
    cat > "$PASS_DIR/gpg-gen-key.txt" << 'EOF'
%echo Generating vault key
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: Sovereign Vault
Name-Comment: Zero-trust solo-operator
Name-Email: vault@localhost
Expire-Date: 0
%no-protection
%commit
%echo done
EOF

    gpg --batch --gen-key "$PASS_DIR/gpg-gen-key.txt"
    rm "$PASS_DIR/gpg-gen-key.txt"
    
    GPG_ID=$(gpg --list-secret-keys --with-colons | grep '^fpr' | head -1 | cut -d: -f10)
    echo "[+] GPG Key created: $GPG_ID"
else
    GPG_ID=$(gpg --list-secret-keys --with-colons | grep '^fpr' | head -1 | cut -d: -f10)
    echo "[+] Using existing GPG key: $GPG_ID"
fi

# Initialize pass store
export PASSWORD_STORE_DIR="$PASS_DIR/store"
if [ ! -d "$PASSWORD_STORE_DIR" ]; then
    pass init "$GPG_ID"
    echo "[+] Pass store initialized at $PASSWORD_STORE_DIR"
fi

# Helper scripts
cat > "$VAULT_DIR/vault-add.sh" << EOF
#!/bin/bash
# Add secret to vault
# Usage: vault-add.sh <service> <key> <value>

SERVICE="\$1"
KEY="\$2"
VALUE="\$3"
export PASSWORD_STORE_DIR="$PASS_DIR/store"

echo "\$VALUE" | pass insert -e "sovereign/\$SERVICE/\$KEY"
echo "[+] Stored: sovereign/\$SERVICE/\$KEY"
EOF

cat > "$VAULT_DIR/vault-get.sh" << EOF
#!/bin/bash
# Get secret from vault
# Usage: vault-get.sh <service> <key>

SERVICE="\$1"
KEY="\$2"
export PASSWORD_STORE_DIR="$PASS_DIR/store"

pass "sovereign/\$SERVICE/\$KEY"
EOF

cat > "$VAULT_DIR/vault-run.sh" << 'EOF'
#!/bin/bash
# Run command with secrets injected from pass
# Usage: vault-run.sh <command>

export PASSWORD_STORE_DIR="$HOME/.vault/pass/store"

# Export all secrets as environment variables
for secret in $(pass ls 2>/dev/null | grep -E "^\s+├─|└─" | sed 's/^[├└]─..//' | sed 's/\s.*$//'); do
    key=$(echo "$secret" | tr '/' '_' | tr '[:lower:]' '[:upper:]')
    value=$(pass "$secret" 2>/dev/null)
    export "${key}=${value}"
done

exec "$@"
EOF

chmod +x "$VAULT_DIR/vault-add.sh" "$VAULT_DIR/vault-get.sh" "$VAULT_DIR/vault-run.sh"

# Environment loader for repos
cat > "$REPO_ROOT/.secrets/.env.template" << 'EOF'
# Copy to .env and fill in values, or use vault
# These values will be injected by vault-run.sh

# AI Providers
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=

# Infrastructure
GCP_SERVICE_ACCOUNT_KEY=
VERCEL_TOKEN=
AKASH_API_KEY=
TAILSCALE_AUTH_KEY=

# Services
GITHUB_TOKEN=
NOTION_TOKEN=
LINEAR_API_KEY=
TELEGRAM_BOT_TOKEN=

# Database
DATABASE_URL=
REDIS_URL=

# Infisical (if using)
INFISICAL_TOKEN=
INFISICAL_WORKSPACE_ID=
INFISICAL_API_URL=http://localhost:8080
EOF

# .envrc for direnv integration
cat > "$REPO_ROOT/.envrc" << EOF
# Auto-load secrets from pass if direnv is installed
export PASSWORD_STORE_DIR="\$HOME/.vault/pass/store"

# Source secrets if pass is available
if command -v pass &> /dev/null && [ -d "\$PASSWORD_STORE_DIR" ]; then
    for secret in \$(pass ls 2>/dev/null | grep -E "^\s+├─|└─" | sed 's/^[├└]─..//' | sed 's/\s.*\$//'); do
        key=\$(echo "\$secret" | tr '/' '_' | tr '[:lower:]' '[:upper:]')
        value=\$(pass "\$secret" 2>/dev/null)
        export "\${key}=\${value}"
    done
fi
EOF

echo ""
echo "=== VAULT SETUP COMPLETE ==="
echo "Primary: Infisical (Docker) - http://localhost:8080"
echo "Fallback: GPG + pass - $PASS_DIR"
echo ""
echo "Quick commands:"
echo "  Add secret:  ~/.vault/vault-add.sh github token ghp_xxx"
echo "  Get secret:  ~/.vault/vault-get.sh github token"
echo "  Run w/ env:  ~/.vault/vault-run.sh <command>"
echo "  With direnv: cd repo && direnv allow"
echo ""
echo "Next: Add your OpenRouter key: ~/.vault/vault-add.sh ai openrouter sk-or-xxx"
