#!/bin/bash
# vault-setup.sh - One-command Infisical deploy in WSL2
# Hardened, conflict-free, solo-operator zero-trust vault

set -euo pipefail

VAULT_DIR="$HOME/.infisical-vault"
COMPOSE_FILE="$VAULT_DIR/docker-compose.yml"
ENV_FILE="$VAULT_DIR/.env"

echo "[vault-setup] Deploying Infisical in $VAULT_DIR"

mkdir -p "$VAULT_DIR"

# Generate crypto-strong secrets
ENCRYPTION_KEY=$(openssl rand -hex 32)
AUTH_SECRET=$(openssl rand -hex 32)
MONGO_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)

# Write compose
cat > "$COMPOSE_FILE" << 'EOF'
version: "3"
services:
  mongo:
    image: mongo:7
    container_name: vault-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo-data:/data/db
    networks:
      - vault-net

  redis:
    image: redis:7-alpine
    container_name: vault-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - vault-net

  infisical:
    image: infisical/infisical:latest-postgres
    container_name: vault-core
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - AUTH_SECRET=${AUTH_SECRET}
      - MONGO_URI=mongodb://root:${MONGO_PASSWORD}@mongo:27017/infisical?authSource=admin
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - mongo
      - redis
    networks:
      - vault-net

volumes:
  mongo-data:
  redis-data:

networks:
  vault-net:
    driver: bridge
EOF

# Write env
cat > "$ENV_FILE" << EOF
ENCRYPTION_KEY=$ENCRYPTION_KEY
AUTH_SECRET=$AUTH_SECRET
MONGO_PASSWORD=$MONGO_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
EOF

chmod 600 "$ENV_FILE"

cd "$VAULT_DIR"
docker-compose up -d

echo "[vault-setup] ✓ Infisical live at http://localhost:8080"
echo "[vault-setup] Create org + project, then:"
echo "  infisical login --domain http://localhost:8080"
echo "  infisical init"
echo ""
echo "[vault-setup] To inject secrets in any repo:"
echo "  infisical run -- npm start"
echo "  infisical run -- python script.py"
echo ""
echo "[vault-setup] Backup .env to your password manager:"
cat "$ENV_FILE"
