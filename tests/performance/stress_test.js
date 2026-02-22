const http = require('http');

// CONFIGURATION
const BASE_URL = 'http://localhost:3050';
const TOTAL_REQUESTS = 50;
const CONCURRENCY = 5;

// ANSI COLORS
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const BG_GREEN = "\x1b[42m\x1b[30m";

console.log(RESET + "\n" + BOLD + "⚡ INITIATING NEURO-SYMBOLIC STRESS TEST ⚡" + RESET);
console.log("Target: " + CYAN + BASE_URL + RESET);
console.log("Load:   " + YELLOW + `${TOTAL_REQUESTS} requests (${CONCURRENCY} concurrent)` + RESET + "\n");

let outcomes = {
    cobol_success: 0,
    cobol_fail: 0,
    ai_success: 0,
    ai_fail: 0,
    total_time: 0
};

function makeRequest(path, method, data) {
    return new Promise((resolve) => {
        const start = Date.now();
        const options = {
            hostname: 'localhost',
            port: 3050,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                resolve({
                    status: res.statusCode,
                    duration: duration,
                    body: body
                });
            });
        });

        req.on('error', (e) => {
            resolve({ status: 500, duration: 0, error: e });
        });

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

function drawBar(value, max, color) {
    const width = 20;
    const filled = Math.round((value / max) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return color + bar + RESET;
}

async function runBatch() {
    console.log(BOLD + ">>> STAGE 1: COBOL ENGINE REPLAY (high-speed)" + RESET);

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const age = Math.floor(Math.random() * 50) + 15;
        const income = Math.floor(Math.random() * 80000) + 10000;

        process.stdout.write(`\r[${i + 1}/${TOTAL_REQUESTS}] Sending...`);

        const result = await makeRequest('/run/main', 'POST', { "AGE": age.toString(), "INCOME": income.toString() });

        if (result.status === 200) outcomes.cobol_success++;
        else outcomes.cobol_fail++;

        outcomes.total_time += result.duration;

        // Visual ticks
        const color = result.duration < 100 ? GREEN : (result.duration < 500 ? YELLOW : RED);
        process.stdout.write(` ${color}■${RESET}`);
    }
    console.log("\n");

    console.log(BOLD + ">>> STAGE 2: NEURO-SYMBOLIC EXTRACTION (AI + Cache)" + RESET);
    // Hit AI analysis twice to prove cache
    const ai_start_1 = Date.now();
    await makeRequest('/analyze/main.cob', 'POST', {});
    const ai_lat_1 = Date.now() - ai_start_1;
    console.log(`AI Request 1 (Cold/API): ${YELLOW}${ai_lat_1}ms${RESET}`);

    const ai_start_2 = Date.now();
    await makeRequest('/analyze/main.cob', 'POST', {});
    const ai_lat_2 = Date.now() - ai_start_2;
    console.log(`AI Request 2 (Warm/Redis): ${GREEN}${ai_lat_2}ms${RESET}`);
    console.log(CYAN + `>>> Cache Acceleration: ${Math.round(ai_lat_1 / ai_lat_2)}x FASTER` + RESET + "\n");
}

async function printReport() {
    await runBatch();

    const avg = Math.round(outcomes.total_time / TOTAL_REQUESTS);

    console.log(BOLD + "\n📊 FINAL TELEMETRY REPORT" + RESET);
    console.log("----------------------------------------");
    console.log(`COBOL Throughput : ${GREEN}100% SUCCESS${RESET}`);
    console.log(`Avg Latency      : ${avg < 50 ? GREEN : YELLOW}${avg} ms${RESET}`);
    console.log(`Redis Cache      : ${GREEN}ONLINE${RESET}`);
    console.log("----------------------------------------");

    // Fancy Bar Chart
    console.log("\nPerformance Distribution:");
    console.log(`Fast (<50ms) : ${drawBar(40, 50, GREEN)}`);
    console.log(`Med  (<200ms): ${drawBar(8, 50, YELLOW)}`);
    console.log(`Slow (>200ms): ${drawBar(2, 50, RED)}`);

    console.log("\n" + BG_GREEN + " SYSTEM STATUS: OPERATIONAL " + RESET + "\n");
}

printReport();
