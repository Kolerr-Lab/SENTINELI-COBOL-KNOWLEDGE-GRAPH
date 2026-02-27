/**
 * MIPS Estimator Test
 * Demonstrates MIPS usage estimation for mainframe COBOL
 */

const mipsEstimator = require('../src/bridge/analyzers/mips_estimator');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

console.log(`\n${c.bright}${c.cyan}╔═══════════════════════════════════════════════════════════════╗${c.reset}`);
console.log(`${c.bright}${c.cyan}║          MAINFRAME MIPS USAGE ESTIMATION TEST               ║${c.reset}`);
console.log(`${c.bright}${c.cyan}╚═══════════════════════════════════════════════════════════════╝${c.reset}\n`);

// Sample COBOL code for testing
const sampleCOBOL = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. LOAN-APPROVAL.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  LOAN-AMOUNT         PIC 9(10)V99.
       01  CREDIT-SCORE        PIC 999.
       01  APPROVAL-STATUS     PIC X(10).
       
       PROCEDURE DIVISION.
       MAIN-LOGIC.
           ACCEPT LOAN-AMOUNT.
           ACCEPT CREDIT-SCORE.
           
           PERFORM VALIDATE-CREDIT.
           PERFORM CHECK-AMOUNT.
           PERFORM UPDATE-DATABASE.
           
           DISPLAY APPROVAL-STATUS.
           STOP RUN.
       
       VALIDATE-CREDIT.
           IF CREDIT-SCORE < 600
               MOVE 'REJECTED' TO APPROVAL-STATUS
           ELSE IF CREDIT-SCORE < 700
               MOVE 'REVIEW' TO APPROVAL-STATUS
           ELSE
               MOVE 'APPROVED' TO APPROVAL-STATUS
           END-IF.
       
       CHECK-AMOUNT.
           IF LOAN-AMOUNT > 1000000
               MOVE 'REVIEW' TO APPROVAL-STATUS
           END-IF.
       
       UPDATE-DATABASE.
           EXEC SQL
               INSERT INTO LOAN_APPLICATIONS
               VALUES (:LOAN-AMOUNT, :CREDIT-SCORE, :APPROVAL-STATUS)
           END-EXEC.
           
           EXEC SQL COMMIT END-EXEC.
`;

console.log(`${c.green}📄 Sample COBOL Program: ${c.bright}LOAN-APPROVAL${c.reset}\n`);
console.log(`${c.gray}${'─'.repeat(70)}${c.reset}\n`);

// Run MIPS estimation
const result = mipsEstimator.estimateMIPS(sampleCOBOL);

console.log(`${c.bright}${c.magenta}⚡ MIPS ESTIMATION RESULTS:${c.reset}\n`);
console.log(`${c.cyan}  MIPS Score:${c.reset}           ${c.bright}${result.mips_score}${c.reset} instruction units`);
console.log(`${c.cyan}  Loop Multiplier:${c.reset}      ${c.bright}${result.loop_multiplier}x${c.reset}`);
console.log(`${c.cyan}  Estimated MIPS:${c.reset}       ${c.bright}${result.estimated_mips}${c.reset} MIPS`);
console.log(`${c.cyan}  Confidence:${c.reset}           ${c.bright}${result.confidence}${c.reset}\n`);

console.log(`${c.bright}${c.yellow}💰 MAINFRAME COST ESTIMATION:${c.reset}\n`);
console.log(`${c.yellow}  Monthly Cost:${c.reset}        ${c.bright}$${result.estimated_cost.monthly_usd.toLocaleString()}${c.reset} USD/month`);
console.log(`${c.yellow}  Annual Cost:${c.reset}         ${c.bright}$${result.estimated_cost.annual_usd.toLocaleString()}${c.reset} USD/year`);
console.log(`${c.gray}  Pricing Model:${c.reset}       ${result.estimated_cost.pricing_model}\n`);

// Show expensive operations
console.log(`${c.bright}${c.red}🔥 TOP EXPENSIVE OPERATIONS:${c.reset}\n`);
const sorted = Object.entries(result.breakdown)
  .sort((a, b) => b[1].cost - a[1].cost)
  .slice(0, 5);

sorted.forEach(([stmt, data], idx) => {
  const bar = '█'.repeat(Math.min(data.cost / 10, 50));
  console.log(`  ${idx + 1}. ${c.bright}${stmt.padEnd(20)}${c.reset} ${c.green}${bar}${c.reset} ${data.cost} units (${data.count}x)`);
});

console.log(`\n${c.gray}${'─'.repeat(70)}${c.reset}\n`);

console.log(`${c.bright}${c.cyan}📊 STATEMENT ANALYSIS:${c.reset}\n`);
const stmtEntries = Object.entries(result.statement_counts).filter(([k]) => !k.startsWith('_LOOP_'));
console.log(`  Total Unique Statements: ${c.bright}${stmtEntries.length}${c.reset}`);
console.log(`  Total Statement Count:   ${c.bright}${stmtEntries.reduce((sum, [, count]) => sum + count, 0)}${c.reset}\n`);

// Show statement breakdown
stmtEntries.slice(0, 10).forEach(([stmt, count]) => {
  console.log(`  ${stmt.padEnd(25)} ${c.gray}×${count}${c.reset}`);
});

console.log(`\n${c.gray}${'─'.repeat(70)}${c.reset}\n`);

console.log(`${c.bright}${c.magenta}📌 NOTES:${c.reset}\n`);
result.notes.forEach(note => {
  console.log(`  ${c.gray}•${c.reset} ${note}`);
});

// Test with real banking COBOL if available
console.log(`\n\n${c.bright}${c.cyan}🏦 REAL BANKING COBOL TEST:${c.reset}\n`);
const bankingCobolPath = path.join(__dirname, '../src/cobol/bank/risk_assessment.cob');

if (fs.existsSync(bankingCobolPath)) {
  const bankingCode = fs.readFileSync(bankingCobolPath, 'utf-8');
  const bankingResult = mipsEstimator.estimateMIPS(bankingCode);
  
  console.log(`${c.green}📄 File: ${c.bright}risk_assessment.cob${c.reset}`);
  console.log(`${c.cyan}  MIPS Score:${c.reset}        ${c.bright}${bankingResult.mips_score.toLocaleString()}${c.reset} instruction units`);
  console.log(`${c.cyan}  Estimated MIPS:${c.reset}    ${c.bright}${bankingResult.estimated_mips}${c.reset} MIPS`);
  console.log(`${c.yellow}  Monthly Cost:${c.reset}     ${c.bright}$${bankingResult.estimated_cost.monthly_usd.toLocaleString()}${c.reset} USD/month`);
  console.log(`${c.yellow}  Annual Cost:${c.reset}      ${c.bright}$${bankingResult.estimated_cost.annual_usd.toLocaleString()}${c.reset} USD/year`);
  console.log(`${c.cyan}  Confidence:${c.reset}        ${c.bright}${bankingResult.confidence}${c.reset}\n`);
  
  // Show top 5 expensive operations
  const bankingSorted = Object.entries(bankingResult.breakdown)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 5);
  
  console.log(`${c.red}  Top Expensive Operations:${c.reset}`);
  bankingSorted.forEach(([stmt, data], idx) => {
    console.log(`    ${idx + 1}. ${stmt.padEnd(20)} ${data.cost.toLocaleString()} units (${data.count}× @ ${data.weight} each)`);
  });
} else {
  console.log(`${c.gray}  ⚠️  Banking COBOL file not found${c.reset}`);
}

console.log(`\n${c.bright}${c.green}✅ MIPS ESTIMATION TEST COMPLETE${c.reset}\n`);
