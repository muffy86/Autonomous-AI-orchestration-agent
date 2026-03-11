#!/bin/bash
#
# Database Restore Script
# Use this to restore from a backup file
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📥 Database Restore Utility${NC}"
echo "================================================"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh ./backups/ai_chatbot_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/ai_chatbot_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$POSTGRES_URL" ]; then
    echo -e "${RED}❌ Error: POSTGRES_URL not found in .env.local${NC}"
    exit 1
fi

# Confirm restoration
echo -e "${YELLOW}⚠️  WARNING: This will overwrite your current database!${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

# Create a safety backup of current database
echo -e "${YELLOW}📦 Creating safety backup of current database...${NC}"
SAFETY_BACKUP="./backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump "$POSTGRES_URL" | gzip > "$SAFETY_BACKUP"
echo -e "${GREEN}✅ Safety backup created: ${SAFETY_BACKUP}${NC}"

# Restore the backup
echo -e "${YELLOW}📥 Restoring database from backup...${NC}"

if gunzip -c "$BACKUP_FILE" | psql "$POSTGRES_URL"; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    echo ""
    echo "Your database has been restored from:"
    echo "  ${BACKUP_FILE}"
    echo ""
    echo "A safety backup was created at:"
    echo "  ${SAFETY_BACKUP}"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    echo "Your database was not modified."
    echo "Safety backup is available at: ${SAFETY_BACKUP}"
    exit 1
fi

echo "================================================"
