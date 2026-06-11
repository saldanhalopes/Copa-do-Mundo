#!/bin/sh
set -euo pipefail

PORT="${PORT:-3001}"
HOST="${HEALTHCHECK_HOST:-localhost}"

curl -sf "http://${HOST}:${PORT}/health" > /dev/null 2>&1 || exit 1
