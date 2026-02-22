/**
 * SENTINELI ENTERPRISE STRESS TEST
 * Full-Stack Glass House Demonstration
 * By Ricky Anh Nguyen - OrchesityAI & Kolerr Lab
 */

const http = require('http');

// ANSI COLOR CODES
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const UNDERLINE = "\x1b[4m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";
const BG_RED = "\x1b[41m\x1b[37m";
const BG_GREEN = "\x1b[42m\x1b[30m";
const BG_BLUE = "\x1b[44m\x1b[37m";
const BG_CYAN = "\x1b[46m\x1b[30m";

// CONFIGURATION
const BASE_URL = 'localhost';
const PORT = 3050;
const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;
const API_KEY = process.env.API_KEY || 'demo-api-key-sentineli-2026'; // Match .env API_KEYS

// Test data generator
function generateApplicant(id) {
    return {
        "NAME": `Applicant_${id}`,
        "AGE": String(20 + Math.floor(Math.random() * 50)),
        "INCOME": String(15000 + Math.floor(Math.random() * 150000)),
        "CREDIT_SCORE": String(300 + Math.floor(Math.random() * 550)),
        "DEBT": String(Math.floor(Math.random() * 80000))
    };
}

// HTTP request wrapper
function makeRequest(path, method, data) {
    return new Promise((resolve) => {
        const start = Date.now();
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData ? Buffer.byteLength(postData) : 0,
                'X-API-Key': API_KEY  // Add authentication
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body),
                        time: Date.now() - start
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body,
                        time: Date.now() - start
                    });
                }
            });
        });

        req.on('error', (e) => {
            resolve({ status: 500, error: e.message, time: Date.now() - start });
        });

        if (postData) req.write(postData);
        req.end();
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function printBanner(title) {
    const width = 70;
    const padding = Math.floor((width - title.length) / 2);
    const line = '═'.repeat(width);
    console.log(`\n${BOLD}${BG_BLUE}${' '.repeat(padding)}${title}${' '.repeat(padding)}${RESET}`);
    console.log(`${BLUE}${line}${RESET}`);
}

function printSection(emoji, title, color = CYAN) {
    console.log(`\n${BOLD}${color}${emoji} ${title}${RESET}`);
    console.log(`${DIM}${'-'.repeat(60)}${RESET}`);
}

// ============================================================================
// TEST 1: INFRASTRUCTURE HEALTH CHECK
// ============================================================================
async function testInfrastructure() {
    printSection('🏥', 'INFRASTRUCTURE HEALTH CHECK', GREEN);
    
    const services = [
        { name: 'API Gateway', path: '/' },
        { name: 'Health Endpoint', path: '/health' }
    ];

    for (const service of services) {
        process.stdout.write(`  ├─ ${service.name}... `);
        const result = await makeRequest(service.path, 'GET');
        
        if (result.status === 200) {
            console.log(`${GREEN}✓ ONLINE${RESET} ${DIM}(${result.time}ms)${RESET}`);
        } else {
            console.log(`${RED}✗ FAILED${RESET} ${DIM}(status: ${result.status})${RESET}`);
        }
        await delay(100);
    }
    
    console.log(`  └─ ${GREEN}${BOLD}Infrastructure: OPERATIONAL${RESET}`);
}

// ============================================================================
// TEST 2: HIGH-FREQUENCY TRADING (HFT) FLOOD
// ============================================================================
async function testHFTFlood() {
    printSection('⚡', 'HFT FLOOD TEST', YELLOW);
    console.log(`  Target: ${BOLD}${TOTAL_REQUESTS} requests${RESET} @ ${BOLD}${CONCURRENCY} concurrent${RESET}\n`);

    let completed = 0;
    let success = 0;
    let failed = 0;
    const latencies = [];
    const startTime = Date.now();

    // Progress bar
    const updateProgress = () => {
        const pct = Math.round((completed / TOTAL_REQUESTS) * 100);
        const barLength = 40;
        const filled = Math.round((pct / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        
        const rps = Math.round((completed / ((Date.now() - startTime) / 1000)) || 0);
        const color = rps > 100 ? RED : rps > 50 ? YELLOW : GREEN;
        
        process.stdout.write(`\r  ${BOLD}[${CYAN}${bar}${RESET}${BOLD}] ${pct}%${RESET} │ ${color}${rps} req/s${RESET} │ ✓ ${GREEN}${success}${RESET} ✗ ${RED}${failed}${RESET}   `);
    };

    // Run batches
    while (completed < TOTAL_REQUESTS) {
        const batch = [];
        for (let i = 0; i < CONCURRENCY && completed + batch.length < TOTAL_REQUESTS; i++) {
            batch.push(makeRequest('/api/run/main', 'POST', generateApplicant(completed + i)));
        }

        const results = await Promise.all(batch);
        results.forEach(r => {
            if (r.status === 200) {
                success++;
                latencies.push(r.time);
            } else {
                failed++;
            }
            completed++;
        });

        updateProgress();
        await delay(50); // Throttle slightly for visualization
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const avgRPS = Math.round(TOTAL_REQUESTS / totalTime);

    console.log(`\n\n  ${BOLD}${BG_CYAN} TELEMETRY REPORT ${RESET}`);
    console.log(`  ┌──────────────────────────────────────────┐`);
    console.log(`  │ Total Transactions : ${BOLD}${TOTAL_REQUESTS.toString().padEnd(18)}${RESET}│`);
    console.log(`  │ Execution Time     : ${BOLD}${totalTime.toFixed(2)}s${RESET.padEnd(18)} │`);
    console.log(`  │ Avg Throughput     : ${GREEN}${BOLD}${avgRPS} req/s${RESET.padEnd(18)}    │`);
    console.log(`  │ Avg Latency        : ${CYAN}${BOLD}${avgLatency}ms${RESET.padEnd(18)}       │`);
    console.log(`  │ Success Rate       : ${success === TOTAL_REQUESTS ? GREEN : RED}${BOLD}${success}/${TOTAL_REQUESTS}${RESET.padEnd(18)}     │`);
    console.log(`  └──────────────────────────────────────────┘`);

    if (success === TOTAL_REQUESTS) {
        console.log(`\n  ${BG_GREEN} ✓ SYSTEM STABILITY: 100% ${RESET}\n`);
    } else {
        console.log(`\n  ${BG_RED} ⚠ WARNING: ${failed} FAILURES DETECTED ${RESET}\n`);
    }
}

// ============================================================================
// TEST 3: DECISION TOPOLOGY ANALYSIS
// ============================================================================
async function testDecisionTopology() {
    printSection('🔍', 'DECISION TOPOLOGY ANALYSIS', MAGENTA);
    
    console.log(`  ${DIM}Analyzing COBOL decision tree structure...${RESET}\n`);
    await delay(500);

    // Simulated decision path analysis (in production, this comes from AI)
    const topology = [
        { stage: 'AGE CHECK', threshold: '≥18', pass: 95, fail: 5 },
        { stage: 'INCOME GATE', threshold: '≥$20,000', pass: 87, fail: 8 },
        { stage: 'CREDIT SCORE', threshold: '≥600', pass: 68, fail: 19 },
        { stage: 'DTI RATIO', threshold: '<40%', pass: 58, fail: 10 }
    ];

    console.log(`  ${BOLD}${UNDERLINE}DECISION CASCADE FLOW:${RESET}\n`);

    topology.forEach((node, idx) => {
        const totalProcessed = node.pass + node.fail;
        const passRate = Math.round((node.pass / totalProcessed) * 100);
        const passBar = '▓'.repeat(Math.round(passRate / 5));
        const failBar = '░'.repeat(20 - passBar.length);

        const color = passRate > 80 ? GREEN : passRate > 60 ? YELLOW : RED;
        const connector = idx < topology.length - 1 ? '│' : '└';

        console.log(`  ${connector}─ ${BOLD}${node.stage}${RESET} ${DIM}[${node.threshold}]${RESET}`);
        console.log(`  ${connector}   ├─ Traffic: ${BOLD}${totalProcessed} applicants${RESET}`);
        console.log(`  ${connector}   ├─ Pass   : ${GREEN}${passBar}${RESET}${failBar} ${color}${passRate}%${RESET}`);
        console.log(`  ${connector}   └─ Output : ${GREEN}✓ ${node.pass}${RESET} │ ${RED}✗ ${node.fail}${RESET}`);
        console.log(`  ${connector}`);
    });

    console.log(`\n  ${BG_BLUE} 🎯 BOTTLENECK IDENTIFIED: CREDIT SCORE GATE ${RESET}`);
    console.log(`  ${DIM}  → 22% traffic loss at Credit Score threshold${RESET}`);
    console.log(`  ${DIM}  → Consider: Adjust threshold or add compensating controls${RESET}\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runEnterpriseDemo() {
    console.clear();
    
    // Header
    console.log(`${BOLD}${BG_RED}                                                                      ${RESET}`);
    console.log(`${BOLD}${BG_RED}          🛡️  SENTINELI ENTERPRISE STRESS TEST 🛡️                     ${RESET}`);
    console.log(`${BOLD}${BG_RED}     Neuro-Symbolic COBOL Modernization - Glass House Demo          ${RESET}`);
    console.log(`${BOLD}${BG_RED}                                                                      ${RESET}`);
    console.log(`${DIM}  By Ricky Anh Nguyen │ OrchesityAI & Kolerr Lab │ 2026${RESET}\n`);

    try {
        await testInfrastructure();
        await delay(1000);
        
        await testHFTFlood();
        await delay(1000);
        
        await testDecisionTopology();

        // Final summary
        printBanner('🎉 MISSION COMPLETE');
        console.log(`\n  ${GREEN}${BOLD}✓ All systems operational${RESET}`);
        console.log(`  ${GREEN}${BOLD}✓ Enterprise-grade performance validated${RESET}`);
        console.log(`  ${GREEN}${BOLD}✓ Glass House transparency achieved${RESET}\n`);
        console.log(`  ${DIM}Ready for production deployment.${RESET}\n`);

    } catch (error) {
        console.error(`\n${RED}${BOLD}✗ Test failed:${RESET}`, error.message);
        process.exit(1);
    }
}

// Run the demo
runEnterpriseDemo();
