#!/bin/sh
# Starts the app in its container. A new database gets its tables and built-in roles first, and an
# existing one gets any migrations added since. Both steps are safe to repeat on every start.
set -e

if [ "${MIGRATE_ON_START:-true}" = "true" ]; then
  echo "Applying database migrations..."
  node ./migrate/node_modules/prisma/build/index.js migrate deploy --schema=./prisma
  echo "Setting up roles and permissions..."
  node ./scripts/rbac.js
fi

exec node server.js
