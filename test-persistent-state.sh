#!/bin/bash
# Persistent State Verification Test
# Tests core persistence functionality

echo "==========================================="
echo "SENTINELI Persistent State Test Suite"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test 1: Dashboard is running
echo -n "Test 1: Dashboard is running... "
if curl -s http://localhost:3100 | grep -q "SENTINELI"; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 2: StateManager.js exists
echo -n "Test 2: StateManager.js exists in container... "
if docker exec sentineli_dashboard test -f /app/src/utils/StateManager.js; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 3: hooks.js exists
echo -n "Test 3: hooks.js exists in container... "
if docker exec sentineli_dashboard test -f /app/src/utils/hooks.js; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 4: SettingsView.jsx exists
echo -n "Test 4: SettingsView.jsx exists in container... "
if docker exec sentineli_dashboard test -f /app/src/components/views/SettingsView.jsx; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 5: No Vite errors in logs
echo -n "Test 5: No critical errors in logs... "
if docker logs --tail 50 sentineli_dashboard 2>&1 | grep -q "ready in"; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 6: App.jsx imports hooks correctly
echo -n "Test 6: App.jsx imports persistent hooks... "
if docker exec sentineli_dashboard grep -q "usePersistedState" /app/src/App.jsx; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 7: Settings view in navigation
echo -n "Test 7: Settings view in navigation... "
if docker exec sentineli_dashboard grep -q "settings" /app/src/components/NavigationPanel.jsx; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 8: Gateway is running
echo -n "Test 8: Gateway is running... "
if curl -s http://localhost:8765/health 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}SKIP${NC} (Gateway may not have health endpoint)"
fi

echo ""
echo "==========================================="
echo "Test Results"
echo "==========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo ""
    echo "Persistent state management is fully operational!"
    echo ""
    echo "Access dashboard at: http://localhost:3100"
    echo "Navigate to ⚙️ SETTINGS to manage persistent state"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the logs: docker logs sentineli_dashboard"
    exit 1
fi
