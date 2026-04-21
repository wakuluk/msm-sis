#!/usr/bin/env bash
set -euo pipefail

DB_SERVICE="${DB_SERVICE:-msm-sis-db}"
DB_NAME="${DB_NAME:-msmsisdb}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-msmsisdb}"
SEED_FILE="${SEED_FILE:-$(cd "$(dirname "$0")" && pwd)/test_seed.sql}"
COURSE_SEED_FILE="${COURSE_SEED_FILE:-$(cd "$(dirname "$0")" && pwd)/test_seed_courses.sql}"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE"
  exit 1
fi

if [[ -n "$COURSE_SEED_FILE" && ! -f "$COURSE_SEED_FILE" ]]; then
  echo "Course seed file not found: $COURSE_SEED_FILE"
  exit 1
fi

echo "Loading base seed data from: $SEED_FILE"
echo "Target database: $DB_NAME on docker service $DB_SERVICE"

docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" "$DB_SERVICE" \
  psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$SEED_FILE"

if [[ -n "$COURSE_SEED_FILE" ]]; then
  echo "Loading course seed data from: $COURSE_SEED_FILE"
  docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" "$DB_SERVICE" \
    psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$COURSE_SEED_FILE"
fi

echo "Seed load complete."
