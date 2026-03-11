#!/bin/bash
#
# Automated Database Backup Script
# This runs automatically and saves backups to a safe location
#

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ai_chatbot_backup_${TIMESTAMP}.sql"
MAX_BACKUPS=${MAX_BACKUPS:-7}  # Keep last 7 backups

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Starting Database Backup${NC}"
echo "================================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Extract database connection details from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$POSTGRES_URL" ]; then
    echo -e "${RED}❌ Error: POSTGRES_URL not found in .env.local${NC}"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}📦 Creating backup: ${BACKUP_FILE}${NC}"

if pg_dump "$POSTGRES_URL" > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    # Compress the backup
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo "   File: ${BACKUP_FILE}"
    echo "   Size: ${BACKUP_SIZE}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Clean up old backups (keep only last MAX_BACKUPS)
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last ${MAX_BACKUPS})${NC}"
cd "$BACKUP_DIR"
ls -t ai_chatbot_backup_*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
REMAINING=$(ls -1 ai_chatbot_backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Cleanup complete. ${REMAINING} backups remaining.${NC}"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo -e "${YELLOW}☁️  Uploading to cloud storage...${NC}"
# aws s3 cp "${BACKUP_FILE}" "s3://your-bucket/backups/"
# gcloud storage cp "${BACKUP_FILE}" "gs://your-bucket/backups/"

echo "================================================"
echo -e "${GREEN}✅ Backup process completed successfully!${NC}"
echo ""
echo "To restore this backup, run:"
echo "  gunzip -c ${BACKUP_DIR}/${BACKUP_FILE} | psql \$POSTGRES_URL"
