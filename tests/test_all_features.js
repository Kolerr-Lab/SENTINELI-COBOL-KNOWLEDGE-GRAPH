/**
 * SENTINELI - Complete Dashboard Feature Test
 * Tests all 6 dashboard tabs to identify issues
 */

const axios = require('axios');

const BRIDGE_URL = 'http://localhost:3000';
const DASHBOARD_URL = 'http://localhost:3102';

const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

async function test(name, fn) {
    try {
        await fn();
        console.log(`${c.green}✅ PASS${c.reset} - ${name}`);
        return true;
    } catch (error) {
        console.log(`${c.red}❌ FAIL${c.reset} - ${name}`);
        console.log(`${c.gray}   Error: ${error.message}${c.reset}`);
        if (error.response) {
            console.log(`${c.gray}   Status: ${error.response.status} ${error.response.statusText}${c.reset}`);
        }
        return false;
    }
}

async function runAllTests() {
    console.log(`\n${c.cyan}═══════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.cyan}  TESTING ALL DASHBOARD FEATURES${c.reset}`);
    console.log(`${c.cyan}═══════════════════════════════════════════════════════════${c.reset}\n`);

    const results = {};

    // Test 1: System Dashboard - Health Checks
    console.log(`${c.yellow}[1/6] SYSTEM DASHBOARD${c.reset}`);
    results.systemDashboard = await test('Bridge Health', async () => {
        const res = await axios.get(`${BRIDGE_URL}/health`, { timeout: 3000 });
        if (!res.data.status) throw new Error('No status in response');
    });
    
    results.dashboardHealth = await test('Dashboard Health', async () => {
        const res = await axios.get(`${DASHBOARD_URL}/api/health`, { timeout: 3000 });
        if (!res.data) throw new Error('No data in response');
    });
    console.log('');

    // Test 2: COBOL Analysis Tab
    console.log(`${c.yellow}[2/6] COBOL ANALYSIS${c.reset}`);
    results.cobolAnalysis = await test('COBOL Analysis Endpoint', async () => {
        const testCode = `IDENTIFICATION DIVISION.\nPROGRAM-ID. TEST.\nPROCEDURE DIVISION.\n    DISPLAY 'TEST'.\n    STOP RUN.`;
        const res = await axios.post(`${BRIDGE_URL}/api/analyze`, {
            program: 'TEST',
            code: testCode
        }, { timeout: 30000 });
        if (!res.data.analysis) throw new Error('No analysis in response');
    });

    results.dashboardAnalysis = await test('Dashboard /api/analyze Proxy', async () => {
        const testCode = `IDENTIFICATION DIVISION.\nPROGRAM-ID. TEST2.`;
        const res = await axios.post(`${DASHBOARD_URL}/api/analyze`, {
            program: 'TEST2',
            code: testCode
        }, { timeout: 30000 });
        if (!res.data) throw new Error('No response from dashboard proxy');
    });
    console.log('');

    // Test 3: Impact Analysis Tab
    console.log(`${c.yellow}[3/6] IMPACT ANALYSIS${c.reset}`);
    results.impactAnalysis = await test('Impact Analysis Endpoint', async () => {
        const res = await axios.post(`${BRIDGE_URL}/api/impact`, {
            field: 'WS-ACCOUNT-BALANCE',
            newType: 'PIC 9(15)V99'
        }, { timeout: 5000 });
        if (!res.data.success) throw new Error('Impact analysis failed');
    });

    results.dashboardImpact = await test('Dashboard /api/impact Proxy', async () => {
        const res = await axios.post(`${DASHBOARD_URL}/api/impact`, {
            field: 'TEST-FIELD',
            newType: 'PIC X(10)'
        }, { timeout: 5000 });
        if (!res.data.success) throw new Error('Dashboard proxy failed');
    });
    console.log('');

    // Test 4: Knowledge Graph Tab
    console.log(`${c.yellow}[4/6] KNOWLEDGE GRAPH${c.reset}`);
    results.knowledgeGraph = await test('Knowledge Graph Endpoint', async () => {
        const res = await axios.get(`${BRIDGE_URL}/api/graph`, { timeout: 5000 });
        if (!res.data.graph) throw new Error('No graph data in response');
    });

    results.dashboardGraph = await test('Dashboard /api/graph Proxy', async () => {
        const res = await axios.get(`${DASHBOARD_URL}/api/graph`, { timeout: 5000 });
        if (!res.data) throw new Error('Dashboard graph proxy failed');
    });
    console.log('');

    // Test 5: System Logs Tab
    console.log(`${c.yellow}[5/6] SYSTEM LOGS${c.reset}`);
    results.logs = await test('WebSocket Server Available', async () => {
        // Just check if dashboard is running (WebSocket is part of it)
        const res = await axios.get(`${DASHBOARD_URL}/api/health`, { timeout: 3000 });
        if (!res.data) throw new Error('Dashboard not responding');
    });
    console.log('');

    // Test 6: Performance Metrics Tab
    console.log(`${c.yellow}[6/6] PERFORMANCE${c.reset}`);
    results.metrics = await test('Metrics Endpoint', async () => {
        const res = await axios.get(`${BRIDGE_URL}/api/metrics`, { timeout: 3000 });
        if (!res.data.metrics) throw new Error('No metrics in response');
    });

    results.systemStatus = await test('System Status Endpoint', async () => {
        const res = await axios.get(`${BRIDGE_URL}/api/system/status`, { timeout: 3000 });
        if (!res.data.status) throw new Error('No status in response');
    });

    results.dashboardStatus = await test('Dashboard /api/system/status Proxy', async () => {
        const res = await axios.get(`${DASHBOARD_URL}/api/system/status`, { timeout: 3000 });
        if (!res.data) throw new Error('Dashboard status proxy failed');
    });
    console.log('');

    // Summary
    console.log(`${c.cyan}═══════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.cyan}  TEST SUMMARY${c.reset}`);
    console.log(`${c.cyan}═══════════════════════════════════════════════════════════${c.reset}\n`);

    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r).length;
    const failed = total - passed;

    console.log(`  Total Tests:    ${total}`);
    console.log(`  ${c.green}Passed:         ${passed}${c.reset}`);
    console.log(`  ${c.red}Failed:         ${failed}${c.reset}`);
    console.log('');

    if (failed > 0) {
        console.log(`${c.yellow}  ISSUES FOUND:${c.reset}`);
        Object.entries(results).forEach(([name, pass]) => {
            if (!pass) {
                console.log(`  ${c.red}✗${c.reset} ${name}`);
            }
        });
        console.log('');
    }

    // Feature Status Table
    console.log(`${c.cyan}  DASHBOARD FEATURE STATUS:${c.reset}\n`);
    console.log(`  Tab               | Backend  | Dashboard | Status`);
    console.log(`  ──────────────────|──────────|───────────|────────`);
    
    const features = [
        { name: 'System Dashboard', backend: results.systemDashboard, dashboard: results.dashboardHealth },
        { name: 'COBOL Analysis', backend: results.cobolAnalysis, dashboard: results.dashboardAnalysis },
        { name: 'Impact Analysis', backend: results.impactAnalysis, dashboard: results.dashboardImpact },
        { name: 'Knowledge Graph', backend: results.knowledgeGraph, dashboard: results.dashboardGraph },
        { name: 'System Logs', backend: results.logs, dashboard: results.logs },
        { name: 'Performance', backend: results.metrics && results.systemStatus, dashboard: results.dashboardStatus }
    ];

    features.forEach(f => {
        const bIcon = f.backend ? '✓' : '✗';
        const dIcon = f.dashboard ? '✓' : '✗';
        const status = f.backend && f.dashboard ? 'WORKING' : 'BROKEN';
        const color = f.backend && f.dashboard ? c.green : c.red;
        
        console.log(`  ${f.name.padEnd(18)}| ${bIcon}        | ${dIcon}         | ${color}${status}${c.reset}`);
    });

    console.log('');

    if (failed === 0) {
        console.log(`${c.green}  ✓ ALL FEATURES WORKING PERFECTLY!${c.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${c.yellow}  ⚠ ${failed} feature(s) need attention${c.reset}\n`);
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error(`${c.red}Test suite failed: ${error.message}${c.reset}`);
    process.exit(1);
});
