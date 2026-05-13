#!/bin/sh
set -eu

LOCKFILE_CHECKSUM="$(sha256sum package-lock.json | awk '{print $1}')"
INSTALLED_CHECKSUM="$(cat node_modules/.package-lock.sha 2>/dev/null || true)"

if [ "$LOCKFILE_CHECKSUM" != "$INSTALLED_CHECKSUM" ]; then
  echo "package-lock.json changed; refreshing frontend dependencies..."
  npm ci
  echo "$LOCKFILE_CHECKSUM" > node_modules/.package-lock.sha
fi

exec npm run dev -- --host 0.0.0.0
