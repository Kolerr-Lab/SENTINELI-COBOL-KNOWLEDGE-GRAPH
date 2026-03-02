/**
 * COBOL Analyzer - Extracts business logic, decision trees, and complexity metrics
 * Uses GPT-4o for intelligent analysis + Z3 for formal verification
 */

const mipsEstimator = require('./mips_estimator');

/**
 * Extract database tables and SQL operations from EXEC SQL statements
 * @param {string} code - COBOL source code
 * @returns {Array<string>} - Array of table names and database operations
 */
function extractSQLDependencies(code) {
  const databases = new Set();
  const lines = code.split('\n');
  let inExecSQL = false;
  let sqlBlock = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect start of EXEC SQL block
    if (line.includes('EXEC SQL') || line.includes('EXEC-SQL')) {
      inExecSQL = true;
      sqlBlock = line;
    }
    // Continue collecting SQL block
    else if (inExecSQL) {
      sqlBlock += ' ' + line;
      
      // Check for end of SQL block
      if (line.includes('END-EXEC') || line.includes('END EXEC')) {
        inExecSQL = false;
        
        // Extract table names from SQL statements
        const tableMatches = [
          // FROM clause
          ...sqlBlock.matchAll(/FROM\s+([A-Z0-9_]+)/gi),
          // INTO clause  
          ...sqlBlock.matchAll(/INTO\s+([A-Z0-9_]+)/gi),
          // UPDATE
          ...sqlBlock.matchAll(/UPDATE\s+([A-Z0-9_]+)/gi),
          // INSERT INTO
          ...sqlBlock.matchAll(/INSERT\s+INTO\s+([A-Z0-9_]+)/gi),
          // DELETE FROM
          ...sqlBlock.matchAll(/DELETE\s+FROM\s+([A-Z0-9_]+)/gi),
          // JOIN
          ...sqlBlock.matchAll(/JOIN\s+([A-Z0-9_]+)/gi)
        ];
        
        tableMatches.forEach(match => {
          if (match[1] && match[1].length > 0) {
            databases.add(match[1]);
          }
        });
        
        sqlBlock = '';
      }
    }
  }
  
  return Array.from(databases);
}

/**
 * Extract CICS LINK/XCTL program calls (static detection)
 * Pattern: EXEC CICS LINK PROGRAM('programName') END-EXEC
 * Pattern: EXEC CICS XCTL PROGRAM('programName') END-EXEC
 * @param {string} code - COBOL source code
 * @returns {array} - Array of called program names
 */
function extractCICSPrograms(code) {
  const programs = new Set();
  
  // Pattern: EXEC CICS LINK|XCTL PROGRAM('name') or PROGRAM("name")
  const cicsPattern = /EXEC\s+CICS\s+(LINK|XCTL)\s+PROGRAM\s*\(\s*['"]([^'"]+)['"]\s*\)/gi;
  
  let match;
  while ((match = cicsPattern.exec(code)) !== null) {
    const programName = match[2].trim();
    if (programName) {
      programs.add(programName);
    }
  }
  
  return Array.from(programs);
}

/**
 * Analyze COBOL source code
 * @param {string} code - COBOL source code
 * @param {string} program - Program name
 * @param {object} options - { openai, logger }
 * @returns {Promise<object>} - Analysis result matching standard schema
 */
async function analyze(code, program, options = {}) {
  const { openai, logger } = options;
  
  if (!openai) {
    throw new Error('OpenAI client required for COBOL analysis');
  }

  const prompt = `Analyze this COBOL program and extract:
1. Business rules (as plain English statements)
2. Decision tree (conditional logic flow with nested branches)
3. Propagator network (data flow relationships)
4. Complexity metrics (cyclomatic complexity, logic depth, decision points)
5. External dependencies (CALL statements, copybooks, file I/O, embedded SQL)

COBOL Source:
${code}

Return JSON with this exact schema:
{
  "business_rules": ["rule1", "rule2", ...],
  "decision_tree": { 
    "root": "condition", 
    "branches": [
      { "condition": "...", "action": "...", "branches": [...] }
    ] 
  },
  "propagator_network": { 
    "dataflows": [
      { "source": "var1", "target": "var2", "operation": "MOVE/COMPUTE/etc" }
    ]
  },
  "complexity_metrics": {
    "cyclomatic_complexity": number,
    "logic_depth": number,
    "variable_count": number,
    "decision_points": number
  },
  "dependencies": {
    "called_programs": ["PROG1", "PROG2"],
    "copybooks": ["COPYBOOK1"],
    "files": ["FILE1"],
    "databases": ["DB1", "TABLE1"] // Extract from EXEC SQL statements
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a COBOL expert specializing in legacy mainframe system analysis.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const analysisText = response.choices[0].message.content;
    const analysis = JSON.parse(analysisText);
    
    const duration = Date.now() - startTime;
    const tokens = response.usage;
    
    // Calculate cost (GPT-4o pricing: $2.50/1M input, $10/1M output)
    const costUSD = (tokens.prompt_tokens * 0.0000025) + (tokens.completion_tokens * 0.00001);

    if (logger) {
      logger.info({
        program,
        fileType: 'COBOL',
        tokens: tokens.total_tokens,
        cost: costUSD,
        duration
      }, 'COBOL analysis completed');
    }

    // Perform static MIPS estimation
    const mipsEstimation = mipsEstimator.estimateMIPS(code);
    
    // Perform static SQL dependency detection (fallback if GPT-4o misses it)
    const staticSQLDeps = extractSQLDependencies(code);
    
    // Perform static CICS LINK/XCTL program call detection
    const staticCICSPrograms = extractCICSPrograms(code);
    
    // Merge static SQL detection with GPT-4o results
    if (!analysis.dependencies) {
      analysis.dependencies = {};
    }
    if (!analysis.dependencies.databases) {
      analysis.dependencies.databases = [];
    }
    if (!analysis.dependencies.called_programs) {
      analysis.dependencies.called_programs = [];
    }
    
    // Merge and deduplicate databases
    const allDatabases = [...new Set([...analysis.dependencies.databases, ...staticSQLDeps])];
    analysis.dependencies.databases = allDatabases;
    
    // Merge and deduplicate called programs (CALL + EXEC CICS LINK/XCTL)
    const allCalledPrograms = [...new Set([...analysis.dependencies.called_programs, ...staticCICSPrograms])];
    analysis.dependencies.called_programs = allCalledPrograms;
    
    if (logger) {
      logger.info({
        program,
        mips_score: mipsEstimation.mips_score,
        estimated_mips: mipsEstimation.estimated_mips,
        monthly_cost: mipsEstimation.estimated_cost.monthly_usd,
        sql_tables_detected: allDatabases.length,
        called_programs_detected: allCalledPrograms.length,
        cics_calls_detected: staticCICSPrograms.length
      }, 'MIPS estimation, SQL detection, and CICS program calls completed');
    }

    return {
      ...analysis,
      mips_estimation: mipsEstimation,
      metadata: {
        model: 'gpt-4o',
        input_tokens: tokens.prompt_tokens,
        output_tokens: tokens.completion_tokens,
        tokens_used: tokens.total_tokens,
        cost_usd: costUSD,
        duration_ms: duration
      }
    };
  } catch (error) {
    if (logger) {
      logger.error({ error: error.message, program }, 'COBOL analysis failed');
    }
    throw error;
  }
}

module.exports = { analyze };
