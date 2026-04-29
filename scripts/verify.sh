#!/usr/bin/env bash
#
# Local verify — run before any push to production.
#
# Steps:
#   1. typecheck the worker
#   2. typecheck the frontend + vite build
#   3. typecheck the autonomous content engine
#   4. dry-run the content engine (writes to marketing/automation/output/preview/)
#
# Each step's failure aborts. Don't deploy a red verify.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
heading() { echo; color "1;36" "── $1 ──"; }

heading "1/4  Worker typecheck"
(
  cd cloudflare/worker
  if [ ! -d node_modules ]; then npm ci --silent; fi
  npx tsc --noEmit
)
color "32" "  ✓ worker tsc clean"

heading "2/4  Frontend typecheck + build"
(
  cd frontend
  if [ ! -d node_modules ]; then npm ci --silent; fi
  npx tsc --noEmit
  npm run build > /tmp/heirloom-vite-build.log 2>&1 || {
    cat /tmp/heirloom-vite-build.log
    exit 1
  }
)
color "32" "  ✓ frontend tsc + vite build clean"

heading "3/4  Marketing automation typecheck"
(
  cd marketing/automation
  if [ ! -d node_modules ]; then npm install --no-audit --no-fund --silent; fi
  npm run typecheck
)
color "32" "  ✓ automation tsc clean"

heading "4/4  Marketing automation preview run"
(
  cd marketing/automation
  ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
  if [ -z "$ANTHROPIC_API_KEY" ]; then
    color "33" "  ⚠ ANTHROPIC_API_KEY not set — skipping live preview run."
    color "33" "    Set it to exercise the daily content engine end-to-end."
  else
    npm run preview
    color "32" "  ✓ content engine preview wrote to marketing/automation/output/"
  fi
)

echo
color "1;32" "✓ verify complete — safe to push"
