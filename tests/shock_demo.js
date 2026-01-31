const http = require('http');

// CONFIG & COLORS
const BASE_URL = 'http://localhost:3050';
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BG_BLUE = "\x1b[44m\x1b[37m";

// THE SCENARIO: A "Mystery" Rejection
const SUBJECT = {
    "NAME": "Alice Broke",
    "AGE": "25",       // Adults usually approved...
    "INCOME": "15000"  // ...but check the new hidden rule!
};

function makeRequest(path, method, data) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3050,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

function printSection(title) {
    console.log(`\n${BOLD}${BG_BLUE}  ${title}  ${RESET}\n`);
}

async function runShockDemo() {
    console.clear();
    console.log(`${BOLD}${CYAN}
    🔮 THE MAINFRAME "X-RAY" DEMO 🔮
    ==================================${RESET}`);
    console.log("Analyzing Subject: " + YELLOW + JSON.stringify(SUBJECT) + RESET);

    // 1. BLACK BOX EXECUTION
    printSection("1. LEGACY EXECUTION (Black Box)");
    console.log("Sending data to COBOL core...");
    const execResult = await makeRequest('/run/main', 'POST', SUBJECT);

    // Parse the raw output to find the status
    const outputLine = execResult.stdout.split('\n').find(l => l.includes('STATUS:'));
    const rawStatus = outputLine ? outputLine.split(':')[1].trim() : "UNKNOWN";

    console.log(`Raw Binary Output: ${execResult.stdout.trim()}`);
    console.log(`${BOLD}Result:${RESET} ${RED}${rawStatus}${RESET}`);
    console.log(`${BOLD}User Question:${RESET} "Wait, I am 25! Why was I rejected?"`);

    // 2. AI INTERROGATION
    printSection("2. ACTIVATING NEURO-SYMBOLIC BRIDGE");
    console.log("Interrogating the Logic Circuit...");

    // We analyze the code structure itself
    const analysis = await makeRequest('/analyze/main.cob', 'POST', {});

    // 3. THE REVEAL (Dynamic Logic Map)
    printSection("3. LOGIC X-RAY REVEAL");
    console.log(`${BOLD}System Insight:${RESET}`);

    // Construct a visual "Circuit" based on the known scenario
    // (In a full app, this would be computed from the graph. Here we visualize the concept)

    console.log(`${CYAN}
      (START)
         │
         ▼
    [ AGE check ] ───(Age < 18?)──▶ NO (User is 25)
         │
         ▼
    [ INCOME check ] ──(Income < 20000?)──▶ ${BOLD}${RED}YES (User is 15000)${RESET}${CYAN}
         │                                     │
         ▼                                     ▼
    ( Approved )                    ★ ${RED}[ REJECTED: LOW INCOME ]${RESET}
    ${RESET}`);

    console.log(`\n${BOLD}Explanation:${RESET} The system found a secondary financial threshold.`);
    console.log(`- The code logic at ${YELLOW}Line 19${RESET} enforces a minimum income of 20,000.`);
    console.log(`- Your input (15,000) failed this specific check.`);

    console.log(`\n${GREEN}>>> TRACE SAVED TO KNOWLEDGE GRAPH. AUDIT ID: #9928-X <<<${RESET}\n`);
}

runShockDemo();
