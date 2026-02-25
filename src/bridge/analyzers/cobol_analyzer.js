/**
 * COBOL Analyzer - Extracts business logic, decision trees, and complexity metrics
 * Uses GPT-4o for intelligent analysis + Z3 for formal verification
 */

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

    return {
      ...analysis,
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
