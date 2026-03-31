#!/usr/bin/env bash
set -euo pipefail

DB_SERVICE="msm-sis-db"
DB_NAME="opensis"
DB_USER="root"
DB_PASSWORD="opensis"

if [[ $# -ne 1 ]]; then
  echo "Usage: ./restore.sh path/to/backup.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Dropping and recreating database: $DB_NAME"
docker compose exec -T "$DB_SERVICE" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\`;"

echo "Restoring backup from: $BACKUP_FILE"
cat "$BACKUP_FILE" | docker compose exec -T "$DB_SERVICE" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"

echo "Restore complete."
