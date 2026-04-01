#!/bin/bash
#
# Full Test Suite Runner
#
# Runs all test scripts in sequence:
#   1. Setup configuration tests (env, config, db, redis, services)
#   2. Build tests (tsc, lint, next build)
#   3. Dev server tests (routes, responses)
#
# Run with: npm run test:all
#

set -e

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OVERALL_PASS=true

run_test() {
  local name=$1
  local cmd=$2

  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}  Running: $name${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

  if eval "$cmd"; then
    echo -e "\n${GREEN}${BOLD}  ✓ $name PASSED${RESET}"
  else
    echo -e "\n${RED}${BOLD}  ✗ $name FAILED${RESET}"
    OVERALL_PASS=false
  fi
}

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║   NextJS SaaS Template - Full Test Suite     ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

run_test "Setup Configuration" "npx tsx $SCRIPT_DIR/test-setup.ts"
run_test "Build & Lint" "bash $SCRIPT_DIR/test-build.sh"
run_test "Dev Server Routes" "bash $SCRIPT_DIR/test-dev.sh"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
if [ "$OVERALL_PASS" = true ]; then
  echo -e "${GREEN}${BOLD}  ALL TEST SUITES PASSED${RESET}"
  echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
  exit 0
else
  echo -e "${RED}${BOLD}  SOME TEST SUITES FAILED${RESET}"
  echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
  exit 1
fi
