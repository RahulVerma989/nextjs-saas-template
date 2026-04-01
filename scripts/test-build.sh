#!/bin/bash
#
# Build & Lint Test Script
#
# Tests that the project compiles, type-checks, and passes linting.
# Run with: npm run test:build
#

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
RESET='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() {
  echo -e "  ${GREEN}✓${RESET} $1"
  PASS=$((PASS + 1))
}

fail() {
  echo -e "  ${RED}✗${RESET} $1"
  FAIL=$((FAIL + 1))
}

warn() {
  echo -e "  ${YELLOW}!${RESET} $1"
  WARN=$((WARN + 1))
}

echo ""
echo -e "${BOLD}NextJS SaaS Template - Build Test Suite${RESET}"
echo ""

# ── 1. TypeScript type checking ──────────────────────────────────
echo -e "${BOLD}1. TypeScript Type Check${RESET}"
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" 2>/dev/null || true)
TSC_ERROR_COUNT=$(echo "$TSC_ERROR_COUNT" | tr -d '[:space:]')
TSC_FILE_COUNT=$(echo "$TSC_OUTPUT" | grep "error TS" | sed 's/(.*//' | sed 's/:[0-9]*.*//' | sort -u | wc -l | tr -d ' ')

if [ "$TSC_ERROR_COUNT" = "0" ] || [ -z "$TSC_ERROR_COUNT" ]; then
  pass "TypeScript type check passed (no errors)"
else
  fail "TypeScript has ${TSC_ERROR_COUNT} errors across ${TSC_FILE_COUNT} files"
  # Show summary of affected files (deduplicated)
  echo "$TSC_OUTPUT" | grep "error TS" | sed 's/(.*//; s/: error.*//' | sort -u | head -15 | while read -r line; do
    echo -e "      ${RED}│${RESET} $line"
  done
  UNIQUE_FILES=$(echo "$TSC_OUTPUT" | grep "error TS" | sed 's/(.*//; s/: error.*//' | sort -u | wc -l | tr -d ' ')
  if [ "$UNIQUE_FILES" -gt 15 ]; then
    echo -e "      ${RED}│${RESET} ... and $((UNIQUE_FILES - 15)) more files"
  fi
fi

# ── 2. ESLint ────────────────────────────────────────────────────
echo -e "\n${BOLD}2. ESLint${RESET}"
LINT_OUTPUT=$(npm run lint 2>&1) || true
LINT_EXIT=$?

# Count actual error/warning lines (not the summary line)
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -E "^\s+[0-9]+:[0-9]+\s+error\s" | wc -l | tr -d ' ')
LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -E "^\s+[0-9]+:[0-9]+\s+warning\s" | wc -l | tr -d ' ')
LINT_ERROR_FILES=$(echo "$LINT_OUTPUT" | grep -B1 -E "^\s+[0-9]+:[0-9]+\s+error\s" | grep "^/" | sort -u | wc -l | tr -d ' ')

if [ "$LINT_ERRORS" = "0" ] && [ "$LINT_WARNINGS" = "0" ]; then
  pass "ESLint passed (no issues)"
elif [ "$LINT_ERRORS" = "0" ]; then
  warn "ESLint passed with ${LINT_WARNINGS} warnings"
else
  fail "ESLint has ${LINT_ERRORS} errors and ${LINT_WARNINGS} warnings in ${LINT_ERROR_FILES} files"
  # Show the error lines
  echo "$LINT_OUTPUT" | grep -E "^\s+[0-9]+:[0-9]+\s+error\s" | head -10 | while read -r line; do
    echo -e "      ${RED}│${RESET} $line"
  done
  if [ "$LINT_ERRORS" -gt 10 ]; then
    echo -e "      ${RED}│${RESET} ... and $((LINT_ERRORS - 10)) more errors"
  fi
fi

# ── 3. Next.js production build ──────────────────────────────────
echo -e "\n${BOLD}3. Production Build (webpack)${RESET}"
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ "$BUILD_EXIT" = "0" ]; then
  pass "Production build succeeded"
  # Show route summary
  echo "$BUILD_OUTPUT" | grep -E "^[├└○ƒ]" | tail -5 | while read -r line; do
    echo -e "      $line"
  done
else
  fail "Production build failed"
  # Show the error
  echo "$BUILD_OUTPUT" | grep -A2 "Error\|error\|Failed" | head -10 | while read -r line; do
    echo -e "      ${RED}│${RESET} $line"
  done
fi

# ── 4. Build output verification ─────────────────────────────────
echo -e "\n${BOLD}4. Build Output${RESET}"
if [ -d ".next" ]; then
  pass ".next directory created"
else
  fail ".next directory missing"
fi

if [ -d ".next/standalone" ]; then
  pass "Standalone output generated"
else
  fail "Standalone output missing (check next.config.ts output: 'standalone')"
fi

if [ -d ".next/static" ]; then
  pass "Static assets generated"
else
  fail "Static assets missing"
fi

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Summary ──────────────────────────────────${RESET}"
echo -e "  ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}  ${YELLOW}${WARN} warnings${RESET}"

if [ $FAIL -gt 0 ]; then
  echo -e "\n${RED}  ${FAIL} check(s) failed. Review the errors above.${RESET}"
  exit 1
else
  echo -e "\n${GREEN}  All build checks passed!${RESET}"
  exit 0
fi
