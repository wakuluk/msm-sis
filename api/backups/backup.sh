#!/usr/bin/env bash
set -euo pipefail

DB_SERVICE="db"
DB_NAME="opensis"
DB_USER="root"
DB_PASSWORD="opensis"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
OUTPUT_FILE="${DB_NAME}_${TIMESTAMP}.sql"

echo "Creating backup: $OUTPUT_FILE"
docker compose exec -T "$DB_SERVICE" mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$OUTPUT_FILE"

echo "Backup complete: $OUTPUT_FILE"
