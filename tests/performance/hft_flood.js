const http = require('http');

// CONFIG
const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50; // Batch size to optimize local Node network stack

// ANSI COLORS
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BG_RED = "\x1b[41m\x1b[37m";

function makeRequest(data) {
    return new Promise((resolve) => {
        const start = Date.now();
        const req = http.request({
            hostname: 'localhost',
            port: 3050,
            path: '/run/main',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, time: Date.now() - start }));
        });
        req.on('error', (e) => resolve({ status: 500, time: 0 }));
        req.write(JSON.stringify(data));
        req.end();
    });
}

const generateUser = (i) => ({
    "NAME": `User${i}`,
    "AGE": (18 + Math.floor(Math.random() * 60)).toString(),
    "INCOME": (15000 + Math.floor(Math.random() * 100000)).toString(),
    "CREDIT_SCORE": (500 + Math.floor(Math.random() * 350)).toString(),
    "DEBT": (Math.floor(Math.random() * 50000)).toString()
});

async function runHFT() {
    console.clear();
    console.log(`${BOLD}${BG_RED}  ⚡ THE ORCHESITY NEURAL-CORE: HFT FLOOD (${TOTAL_REQUESTS} TX)  ${RESET}\n`);

    let completed = 0;
    let success = 0;
    let failed = 0;
    const startTime = Date.now();
    let batchTimes = [];

    // Helper to run a batch
    const runBatch = async (batchSize) => {
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
            if (completed + i >= TOTAL_REQUESTS) break;
            promises.push(makeRequest(generateUser(completed + i)));
        }
        const results = await Promise.all(promises);
        results.forEach(r => {
            if (r.status === 200) success++;
            else failed++;
            completed++;
        });
        return results;
    }

    // MAIN LOOP
    process.stdout.write(CYAN + "Initializing Reactor Core..." + RESET + "\n");

    while (completed < TOTAL_REQUESTS) {
        const batchStart = Date.now();
        await runBatch(CONCURRENCY);
        const batchDuration = Date.now() - batchStart;

        // Calculate Speed
        const batchRPS = Math.round((CONCURRENCY / batchDuration) * 1000);
        batchTimes.push(batchRPS);

        // Visual Tachometer
        const progress = Math.round((completed / TOTAL_REQUESTS) * 40);
        const bar = '█'.repeat(progress) + '░'.repeat(40 - progress);

        // Color based on speed
        let speedColor = GREEN;
        if (batchRPS > 100) speedColor = RED + BOLD;
        else if (batchRPS > 50) speedColor = YELLOW;

        process.stdout.write(`\r${BOLD}[${bar}] ${Math.round((completed / TOTAL_REQUESTS) * 100)}% | SPEED: ${speedColor}${batchRPS} Req/Sec${RESET}   `);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const avgRPS = Math.round(TOTAL_REQUESTS / totalTime);

    console.log("\n\n" + BOLD + "📊 MISSION REPORT" + RESET);
    console.log(`-----------------------------`);
    console.log(`Total Transactions : ${TOTAL_REQUESTS}`);
    console.log(`Execution Time     : ${totalTime.toFixed(2)}s`);
    console.log(`Throughput (Avg)   : ${GREEN}${avgRPS} Req/Sec${RESET}`);
    console.log(`Peak Throughput    : ${RED}${Math.max(...batchTimes)} Req/Sec${RESET}`);
    console.log(`Success Rate       : ${success === TOTAL_REQUESTS ? GREEN : RED}${success}/${TOTAL_REQUESTS}${RESET}`);
    console.log(`-----------------------------`);

    if (success === TOTAL_REQUESTS) {
        console.log(`${BOLD}${GREEN}✔ SYSTEM STABILITY CONFIRMED: 100%${RESET}\n`);
    } else {
        console.log(`${BOLD}${RED}⚠ WARNING: SYSTEM STRESS DETECTED${RESET}\n`);
    }
}

runHFT();
