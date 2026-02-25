/**
 * SENTINELI - Banking System Loader
 * Loads all COBOL banking modules for Impact Analysis & Knowledge Graph
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BRIDGE_URL = 'http://localhost:3000';
const COBOL_DIR = path.join(__dirname, '../src/cobol/bank');

// Banking modules with their dependencies
const BANKING_MODULES = [
    {
        name: 'ACCOUNT-MANAGEMENT',
        file: 'account_management.cob',
        dependencies: [],
        priority: 1
    },
    {
        name: 'TRANSACTION-PROCESSOR',
        file: 'transaction_processor.cob',
        dependencies: ['ACCOUNT-MANAGEMENT'],
        priority: 2
    },
    {
        name: 'FRAUD-DETECTION',
        file: 'fraud_detection.cob',
        dependencies: ['TRANSACTION-PROCESSOR', 'ACCOUNT-MANAGEMENT'],
        priority: 3
    },
    {
        name: 'PAYMENT-PROCESSING',
        file: 'payment_processing.cob',
        dependencies: ['TRANSACTION-PROCESSOR'],
        priority: 2
    },
    {
        name: 'CREDIT-SCORING',
        file: 'credit_scoring.cob',
        dependencies: ['ACCOUNT-MANAGEMENT'],
        priority: 2
    },
    {
        name: 'LOAN-APPROVAL',
        file: '../loan_approval.cob',
        dependencies: ['CREDIT-SCORING', 'ACCOUNT-MANAGEMENT'],
        priority: 3
    },
    {
        name: 'INTEREST-CALCULATOR',
        file: 'interest_calculator.cob',
        dependencies: ['ACCOUNT-MANAGEMENT'],
        priority: 2
    },
    {
        name: 'COMPLIANCE-REPORTING',
        file: 'compliance_reporting.cob',
        dependencies: ['TRANSACTION-PROCESSOR', 'ACCOUNT-MANAGEMENT'],
        priority: 3
    },
    {
        name: 'RISK-ASSESSMENT',
        file: 'risk_assessment.cob',
        dependencies: ['CREDIT-SCORING', 'FRAUD-DETECTION'],
        priority: 4
    },
    {
        name: 'PORTFOLIO-MANAGEMENT',
        file: 'portfolio_management.cob',
        dependencies: ['ACCOUNT-MANAGEMENT', 'RISK-ASSESSMENT'],
        priority: 4
    }
];

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

async function loadModule(module) {
    const filePath = path.join(COBOL_DIR, module.file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`${colors.red}   ✗ ${module.name} - File not found: ${filePath}${colors.reset}`);
        return { success: false, module: module.name };
    }

    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n').filter(l => l.trim().length > 0).length;

    try {
        const response = await axios.post(`${BRIDGE_URL}/api/analyze`, {
            program: module.name,
            code: code,
            metadata: {
                dependencies: module.dependencies,
                priority: module.priority,
                filePath: filePath,
                linesOfCode: lines
            }
        }, {
            timeout: 60000
        });

        const result = response.data;
        console.log(`${colors.green}   ✓ ${module.name.padEnd(25)} ${lines} LOC  |  Complexity: ${result.metadata?.cyclomatic_complexity || 'N/A'}  |  $${result.metadata?.cost?.toFixed(4) || '0'}${colors.reset}`);
        
        return { 
            success: true, 
            module: module.name,
            lines: lines,
            complexity: result.metadata?.cyclomatic_complexity || 0,
            cost: result.metadata?.cost || 0
        };
    } catch (error) {
        console.log(`${colors.red}   ✗ ${module.name} - ${error.message}${colors.reset}`);
        return { success: false, module: module.name, error: error.message };
    }
}

async function loadAllModules() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  SENTINELI - LOADING BANKING SYSTEM                           ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

    // Check Bridge health
    try {
        const health = await axios.get(`${BRIDGE_URL}/health`, { timeout: 3000 });
        console.log(`${colors.green}   Bridge Service: ONLINE${colors.reset}`);
        console.log(`${colors.green}   AI Status: ${health.data.ai?.toUpperCase() || 'CONFIGURED'}${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}   ERROR: Bridge service is offline!${colors.reset}`);
        console.log(`${colors.yellow}   Start with: cd src\\bridge && node server.js${colors.reset}\n`);
        process.exit(1);
    }

    console.log(`${colors.yellow}   Loading ${BANKING_MODULES.length} banking modules...${colors.reset}\n`);

    // Sort by priority
    const sorted = BANKING_MODULES.sort((a, b) => a.priority - b.priority);
    
    const results = [];
    let totalLines = 0;
    let totalCost = 0;
    let totalComplexity = 0;
    let successCount = 0;

    for (const module of sorted) {
        const result = await loadModule(module);
        results.push(result);
        
        if (result.success) {
            successCount++;
            totalLines += result.lines || 0;
            totalCost += result.cost || 0;
            totalComplexity += result.complexity || 0;
        }
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  LOADING COMPLETE                                              ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.green}   Modules Loaded:     ${successCount}/${BANKING_MODULES.length}${colors.reset}`);
    console.log(`${colors.green}   Total Lines:        ${totalLines.toLocaleString()}${colors.reset}`);
    console.log(`${colors.green}   Total Complexity:   ${totalComplexity}${colors.reset}`);
    console.log(`${colors.magenta}   Total Cost:         $${totalCost.toFixed(4)}${colors.reset}`);
    
    console.log(`\n${colors.yellow}   Next Steps:${colors.reset}`);
    console.log(`${colors.yellow}   1. Open Dashboard: http://localhost:3102${colors.reset}`);
    console.log(`${colors.yellow}   2. Click "KNOWLEDGE GRAPH" to visualize relationships${colors.reset}`);
    console.log(`${colors.yellow}   3. Click "IMPACT ANALYSIS" to see dependencies${colors.reset}\n`);

    // Get current metrics
    try {
        const metrics = await axios.get(`${BRIDGE_URL}/api/metrics`, { timeout: 3000 });
        console.log(`${colors.cyan}   Live System Metrics:${colors.reset}`);
        console.log(`${colors.cyan}   Total API Calls:    ${metrics.data.metrics.totalCalls}${colors.reset}`);
        console.log(`${colors.cyan}   Average Time:       ${metrics.data.metrics.averageProcessingTimeMs}ms${colors.reset}`);
        console.log(`${colors.cyan}   Total Spent:        $${metrics.data.metrics.totalCostUSD}${colors.reset}\n`);
    } catch (error) {
        // Metrics endpoint might not exist
    }

    return results;
}

// Execute
if (require.main === module) {
    loadAllModules()
        .then(() => {
            console.log(`${colors.green}   ✓ Banking system loaded and ready for analysis${colors.reset}\n`);
            process.exit(0);
        })
        .catch(error => {
            console.error(`${colors.red}   ✗ Error: ${error.message}${colors.reset}\n`);
            process.exit(1);
        });
}

module.exports = { loadAllModules, BANKING_MODULES };
