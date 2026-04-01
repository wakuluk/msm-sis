#!/usr/bin/env bash
set -euo pipefail

DB_SERVICE="${DB_SERVICE:-msm-sis-db}"
DB_NAME="${DB_NAME:-msmsisdb}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-msmsisdb}"
SEED_FILE="${SEED_FILE:-$(cd "$(dirname "$0")" && pwd)/test_seed.sql}"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE"
  exit 1
fi

echo "Loading seed data from: $SEED_FILE"
echo "Target database: $DB_NAME on docker service $DB_SERVICE"

docker compose exec -T "$DB_SERVICE" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SEED_FILE"

echo "Seed load complete."
