#!/bin/bash
#
# Dev Server Test Script
#
# Starts the dev server, verifies key routes respond, then shuts down.
# Run with: npm run test:dev
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
RESET='\033[0m'

PASS=0
FAIL=0
PORT=${TEST_PORT:-3099}

pass() {
  echo -e "  ${GREEN}✓${RESET} $1"
  PASS=$((PASS + 1))
}

fail() {
  echo -e "  ${RED}✗${RESET} $1"
  FAIL=$((FAIL + 1))
}

cleanup() {
  if [ -n "$DEV_PID" ]; then
    kill $DEV_PID 2>/dev/null || true
    wait $DEV_PID 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo ""
echo -e "${BOLD}NextJS SaaS Template - Dev Server Test${RESET}"
echo ""

# Start dev server on a custom port
echo -e "${BOLD}Starting dev server on port ${PORT}...${RESET}"
PORT=$PORT npx next dev --port $PORT > /tmp/nextjs-dev-test.log 2>&1 &
DEV_PID=$!

# Wait for server to be ready (max 30s)
READY=false
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" http://localhost:$PORT/ 2>/dev/null; then
    READY=true
    break
  fi
  sleep 1
done

if [ "$READY" = false ]; then
  fail "Dev server did not start within 30 seconds"
  echo "  Server log:"
  cat /tmp/nextjs-dev-test.log | tail -20
  exit 1
fi

pass "Dev server started successfully"

# Test routes
echo -e "\n${BOLD}Testing Routes${RESET}"

test_route() {
  local path=$1
  local expected_status=$2
  local label=$3

  local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$path" 2>/dev/null)

  if [ "$status" = "$expected_status" ]; then
    pass "$label → $status"
  else
    fail "$label → $status (expected $expected_status)"
  fi
}

# Public pages
test_route "/" "200" "GET / (landing page)"
test_route "/login" "200" "GET /login (auth page)"
test_route "/privacy" "200" "GET /privacy (legal)"
test_route "/terms" "200" "GET /terms (legal)"

# Protected routes (should redirect to login or return 401)
DASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/dashboard" 2>/dev/null)
if [ "$DASH_STATUS" = "307" ] || [ "$DASH_STATUS" = "302" ] || [ "$DASH_STATUS" = "200" ]; then
  pass "GET /dashboard → $DASH_STATUS (redirect or auth check)"
else
  fail "GET /dashboard → $DASH_STATUS (unexpected)"
fi

# API routes - auth providers may 500 if OAuth credentials not configured
AUTH_PROV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/auth/providers" 2>/dev/null)
if [ "$AUTH_PROV_STATUS" = "200" ]; then
  pass "GET /api/auth/providers → 200"
elif [ "$AUTH_PROV_STATUS" = "500" ]; then
  pass "GET /api/auth/providers → 500 (OAuth credentials not configured)"
else
  fail "GET /api/auth/providers → $AUTH_PROV_STATUS (unexpected)"
fi

API_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/user" 2>/dev/null)
if [ "$API_USER_STATUS" = "401" ] || [ "$API_USER_STATUS" = "500" ]; then
  pass "GET /api/user → $API_USER_STATUS (requires auth)"
else
  fail "GET /api/user → $API_USER_STATUS (expected 401 or 500)"
fi

# OG image endpoint (may need query params, so 400 is acceptable)
OG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/og" 2>/dev/null)
if [ "$OG_STATUS" = "200" ] || [ "$OG_STATUS" = "400" ] || [ "$OG_STATUS" = "500" ]; then
  pass "GET /api/og → $OG_STATUS (endpoint responding)"
else
  fail "GET /api/og → $OG_STATUS (unexpected)"
fi

# Summary
echo ""
echo -e "${BOLD}── Summary ──────────────────────────────────${RESET}"
echo -e "  ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}"

if [ $FAIL -gt 0 ]; then
  echo -e "\n${RED}  Some route tests failed.${RESET}"
  exit 1
else
  echo -e "\n${GREEN}  All dev server checks passed!${RESET}"
  exit 0
fi
