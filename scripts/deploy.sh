#!/usr/bin/env bash
# Server-side deploy script — invoked over SSH from GitHub Actions.
#
# Assumes:
#   - repo checked out at /home/customs-saas
#   - .env.production present on the server (never in git)
#   - customs-saas.service exists in systemd
#
# Idempotent: safe to run repeatedly. Exits non-zero on any failure so the
# GitHub Actions job fails loudly rather than silently leaving a bad state.

set -euo pipefail

APP_DIR="/home/customs-saas"
SERVICE="customs-saas.service"
HEALTHCHECK_URL="https://aduanasync.com.br/login"

cd "$APP_DIR"

echo "▶  git fetch + reset origin/main"
git fetch --prune origin
git reset --hard origin/main
git clean -fd -e '.env*' -e '.storage-prod' -e 'node_modules'

echo "▶  npm install (usaria npm ci se tivéssemos package-lock.json)"
# --loglevel=http garante output constante durante ~4min de download,
# o que também mantém o pipe SSH vivo (double-safety com ServerAliveInterval).
npm install --legacy-peer-deps --no-audit --no-fund --loglevel=http

echo "▶  drizzle-kit migrate (idempotent, safe if no new migrations)"
npx drizzle-kit migrate

echo "▶  next build"
npx next build

echo "▶  systemctl restart $SERVICE"
systemctl restart "$SERVICE"

echo "▶  waiting 4s for service to come up..."
sleep 4

echo "▶  health check: $HEALTHCHECK_URL"
code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTHCHECK_URL")
if [ "$code" != "200" ]; then
  echo "✗  health check failed (HTTP $code)"
  systemctl status "$SERVICE" --no-pager | tail -20 || true
  exit 1
fi

echo "✓  deploy OK ($HEALTHCHECK_URL → $code)"
