/**
 * MIPS Usage Estimator for Mainframe COBOL
 * 
 * Estimates MIPS (Million Instructions Per Second) consumption based on
 * static analysis of COBOL statements. Uses weighted instruction costs
 * derived from IBM z/OS performance characteristics.
 * 
 * Reference: IBM z/OS Performance characteristics suggest:
 * - Simple operations (MOVE, ADD): ~1-2 CPU cycles
 * - Medium operations (READ, WRITE): ~50-200 cycles (I/O bound)
 * - Heavy operations (EXEC SQL): ~500-5000 cycles (DB overhead)
 * 
 * By Ricky Anh Nguyen | OrchesityAI & Kolerr Lab | 2026
 */

// MIPS weight assignments (relative cost units)
const MIPS_WEIGHTS = {
  // === LOW COST: Simple CPU operations (1-5 units) ===
  'MOVE': 1,
  'SET': 1,
  'INITIALIZE': 2,
  'ACCEPT': 1,
  'DISPLAY': 2,
  'STOP': 1,
  'EXIT': 1,
  'GOBACK': 1,
  'CONTINUE': 0.5,
  
  // === MEDIUM-LOW: Arithmetic & Logic (2-10 units) ===
  'ADD': 2,
  'SUBTRACT': 2,
  'MULTIPLY': 3,
  'DIVIDE': 5,
  'COMPUTE': 4,
  'EVALUATE': 3,
  'IF': 2,
  'PERFORM': 3,
  'GO TO': 1,
  'STRING': 5,
  'UNSTRING': 6,
  'INSPECT': 4,
  
  // === MEDIUM: File I/O (50-100 units) ===
  'READ': 50,
  'WRITE': 60,
  'REWRITE': 70,
  'DELETE': 65,
  'START': 40,
  'OPEN': 30,
  'CLOSE': 20,
  
  // === HIGH: Database operations (100-500 units) ===
  'EXEC SQL': 250,      // Generic SQL
  'EXEC SQL SELECT': 200,
  'EXEC SQL INSERT': 300,
  'EXEC SQL UPDATE': 350,
  'EXEC SQL DELETE': 280,
  'EXEC SQL COMMIT': 150,
  'EXEC SQL ROLLBACK': 140,
  'EXEC SQL OPEN': 100,
  'EXEC SQL FETCH': 180,
  'EXEC SQL CLOSE': 80,
  
  // === VERY HIGH: CICS & External calls (200-1000 units) ===
  'EXEC CICS': 300,
  'EXEC CICS READ': 350,
  'EXEC CICS WRITE': 400,
  'EXEC CICS SEND': 250,
  'EXEC CICS RECEIVE': 250,
  'CALL': 150,          // Dynamic call overhead
  'CALL STATIC': 50,    // Static call (if identifiable)
  
  // === SPECIAL: VSAM operations (80-150 units) ===
  'VSAM READ': 80,
  'VSAM WRITE': 100,
  'VSAM DELETE': 90,
  'VSAM START': 60,
  
  // === SORT operations (very expensive) ===
  'SORT': 5000,         // Can be extremely expensive
  'MERGE': 3000,
};

// Loop multiplier heuristics
const LOOP_MULTIPLIERS = {
  'PERFORM UNTIL': 100,     // Assume avg 100 iterations
  'PERFORM VARYING': 50,    // Assume avg 50 iterations
  'PERFORM TIMES': 1,       // Will be multiplied by actual number
};

/**
 * Parse COBOL source and extract statement counts
 * @param {string} code - COBOL source code
 * @returns {object} - Statement frequency map
 */
function parseStatements(code) {
  const statements = {};
  const lines = code.split('\n');
  
  for (let line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.length === 0 || trimmed.startsWith('//')) {
      continue;
    }
    
    // Remove line numbers (columns 1-6 in classic COBOL)
    let codeLine = line.substring(6).trim().toUpperCase();
    
    // EXEC SQL detection (multi-line)
    if (codeLine.includes('EXEC SQL')) {
      const sqlType = extractSQLType(codeLine);
      statements[sqlType] = (statements[sqlType] || 0) + 1;
      continue;
    }
    
    // EXEC CICS detection
    if (codeLine.includes('EXEC CICS')) {
      const cicsType = extractCICSType(codeLine);
      statements[cicsType] = (statements[cicsType] || 0) + 1;
      continue;
    }
    
    // Standard COBOL verbs
    for (let verb of Object.keys(MIPS_WEIGHTS)) {
      const verbPattern = new RegExp(`\\b${verb.replace(' ', '\\s+')}\\b`, 'i');
      if (verbPattern.test(codeLine)) {
        statements[verb] = (statements[verb] || 0) + 1;
      }
    }
    
    // Loop detection for multipliers
    if (codeLine.includes('PERFORM') && codeLine.includes('UNTIL')) {
      statements['_LOOP_UNTIL'] = (statements['_LOOP_UNTIL'] || 0) + 1;
    }
    if (codeLine.includes('PERFORM') && codeLine.includes('VARYING')) {
      statements['_LOOP_VARYING'] = (statements['_LOOP_VARYING'] || 0) + 1;
    }
    
    // PERFORM n TIMES
    const timesMatch = codeLine.match(/PERFORM.*?(\d+)\s+TIMES/i);
    if (timesMatch) {
      statements['_LOOP_TIMES'] = (statements['_LOOP_TIMES'] || 0) + parseInt(timesMatch[1]);
    }
  }
  
  return statements;
}

/**
 * Extract SQL operation type
 */
function extractSQLType(line) {
  if (line.includes('SELECT')) return 'EXEC SQL SELECT';
  if (line.includes('INSERT')) return 'EXEC SQL INSERT';
  if (line.includes('UPDATE')) return 'EXEC SQL UPDATE';
  if (line.includes('DELETE')) return 'EXEC SQL DELETE';
  if (line.includes('COMMIT')) return 'EXEC SQL COMMIT';
  if (line.includes('ROLLBACK')) return 'EXEC SQL ROLLBACK';
  if (line.includes('OPEN')) return 'EXEC SQL OPEN';
  if (line.includes('FETCH')) return 'EXEC SQL FETCH';
  if (line.includes('CLOSE')) return 'EXEC SQL CLOSE';
  return 'EXEC SQL';
}

/**
 * Extract CICS operation type
 */
function extractCICSType(line) {
  if (line.includes('READ')) return 'EXEC CICS READ';
  if (line.includes('WRITE')) return 'EXEC CICS WRITE';
  if (line.includes('SEND')) return 'EXEC CICS SEND';
  if (line.includes('RECEIVE')) return 'EXEC CICS RECEIVE';
  return 'EXEC CICS';
}

/**
 * Calculate MIPS score from statement counts
 * @param {object} statements - Statement frequency map
 * @returns {object} - MIPS estimation breakdown
 */
function calculateMIPS(statements) {
  let totalScore = 0;
  const breakdown = {};
  
  // Calculate base instruction costs
  for (let [stmt, count] of Object.entries(statements)) {
    if (stmt.startsWith('_LOOP_')) continue; // Handle loops separately
    
    const weight = MIPS_WEIGHTS[stmt] || 0;
    const cost = weight * count;
    
    if (cost > 0) {
      totalScore += cost;
      breakdown[stmt] = { count, weight, cost };
    }
  }
  
  // Apply loop multipliers
  let loopMultiplier = 1;
  if (statements['_LOOP_UNTIL']) {
    loopMultiplier += statements['_LOOP_UNTIL'] * 100;
  }
  if (statements['_LOOP_VARYING']) {
    loopMultiplier += statements['_LOOP_VARYING'] * 50;
  }
  if (statements['_LOOP_TIMES']) {
    loopMultiplier += statements['_LOOP_TIMES'];
  }
  
  // Estimate actual MIPS (very rough approximation)
  // Assumption: 1 million z/OS instructions ≈ 1 MIPS at 1Hz
  // Modern z/OS runs at ~5GHz, so we normalize
  const estimatedMIPS = (totalScore * loopMultiplier) / 1000000;
  
  // Estimate monthly cost (IBM MIPS pricing: ~$3000-$5000/MIPS/month)
  const avgMIPSCost = 4000; // Conservative estimate
  const monthlyCost = estimatedMIPS * avgMIPSCost;
  const annualCost = monthlyCost * 12;
  
  return {
    mips_score: Math.round(totalScore),
    loop_multiplier: loopMultiplier,
    estimated_mips: parseFloat(estimatedMIPS.toFixed(6)),
    estimated_cost: {
      monthly_usd: parseFloat(monthlyCost.toFixed(2)),
      annual_usd: parseFloat(annualCost.toFixed(2)),
      pricing_model: '$4,000/MIPS/month (industry average)'
    },
    breakdown,
    confidence: estimatedMIPS < 0.001 ? 'LOW' : estimatedMIPS < 0.1 ? 'MEDIUM' : 'HIGH',
    notes: [
      'MIPS estimation based on static analysis (no runtime profiling)',
      'Actual costs vary by IBM z/OS configuration and workload',
      'Loop iterations use heuristic averages',
      'I/O and SQL operations are most expensive'
    ]
  };
}

/**
 * Main entry point: Estimate MIPS for COBOL code
 * @param {string} code - COBOL source code
 * @returns {object} - MIPS estimation with breakdown
 */
function estimateMIPS(code) {
  const statements = parseStatements(code);
  const mipsData = calculateMIPS(statements);
  
  return {
    ...mipsData,
    statement_counts: statements
  };
}

module.exports = {
  estimateMIPS,
  MIPS_WEIGHTS,
  parseStatements,
  calculateMIPS
};
