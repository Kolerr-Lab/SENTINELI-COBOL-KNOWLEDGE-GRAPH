/**
 * DB2 SQL Analyzer (including embedded SQL in COBOL)
 * Extracts queries, table dependencies, and data access patterns
 */

async function analyze(code, program, options = {}) {
  const { openai, logger } = options;
  
  if (!openai) {
    throw new Error('OpenAI client required for DB2 analysis');
  }

  const prompt = `Analyze this DB2 SQL code (may include embedded SQL) and extract:
1. SQL operations (SELECT, INSERT, UPDATE, DELETE)
2. Table and column dependencies
3. Join logic and relationships
4. Index usage and optimization opportunities
5. Transaction boundaries

DB2 Source:
${code}

Return JSON with this exact schema:
{
  "business_rules": ["Query retrieves customer data", "Join between CUSTOMER and ACCOUNT tables"],
  "decision_tree": { 
    "root": "SQL Query Flow",
    "branches": [
      { "condition": "WHERE clause", "action": "Filter rows", "branches": [] }
    ]
  },
  "propagator_network": { 
    "dataflows": [
      { "source": "CUSTOMER.ID", "target": "ACCOUNT.CUSTOMER_ID", "operation": "JOIN" },
      { "source": "TABLE.COLUMN", "target": "RESULT_SET", "operation": "SELECT" }
    ]
  },
  "complexity_metrics": {
    "cyclomatic_complexity": number,
    "logic_depth": number,
    "variable_count": number,
    "decision_points": number
  },
  "dependencies": {
    "called_programs": [],
    "copybooks": [],
    "files": [],
    "databases": ["CUSTOMER", "ACCOUNT", "V_CUSTOMER_SUMMARY"]
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a DB2 database expert specializing in mainframe SQL analysis.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const analysisText = response.choices[0].message.content;
    const analysis = JSON.parse(analysisText);
    
    const duration = Date.now() - startTime;
    const tokens = response.usage;
    const costUSD = (tokens.prompt_tokens * 0.0000025) + (tokens.completion_tokens * 0.00001);

    if (logger) {
      logger.info({ program, fileType: 'DB2', tokens: tokens.total_tokens, cost: costUSD, duration }, 'DB2 analysis completed');
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
    if (logger) logger.error({ error: error.message, program }, 'DB2 analysis failed');
    throw error;
  }
}

module.exports = { analyze };
