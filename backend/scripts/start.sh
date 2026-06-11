#!/bin/sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

if [ -f .env ]; then
  echo "[start] Loading .env"
  export $(grep -v '^\s*#' .env | grep -v '^\s*$' | xargs)
fi

DATA_DIR="${DATABASE_URL:-./data/copa.db}"
DATA_DIR="$(dirname "$DATA_DIR")"
if [ ! -d "$DATA_DIR" ]; then
  echo "[start] Creating data directory: $DATA_DIR"
  mkdir -p "$DATA_DIR"
fi

# Run migrations if the script exists
if [ -f src/db/migrate.js ]; then
  echo "[start] Running database migrations"
  node src/db/migrate.js
fi

echo "[start] Starting server on port ${PORT:-3001}"
exec node src/server.js
