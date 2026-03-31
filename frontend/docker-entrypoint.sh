#!/bin/sh
set -eu

cat > /app/public/config.js <<EOF
window.APP_CONFIG = {
  API_BASE_URL: "${API_BASE_URL}"
  OPENSIS_BASE_URL
};
EOF

exec npm run dev -- --host 0.0.0.0