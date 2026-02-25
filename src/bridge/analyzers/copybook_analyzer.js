/**
 * COBOL Copybook Analyzer
 * Extracts data structure definitions, field layouts, and redefines
 */

async function analyze(code, program, options = {}) {
  const { openai, logger } = options;
  
  if (!openai) {
    throw new Error('OpenAI client required for Copybook analysis');
  }

  const prompt = `Analyze this COBOL copybook and extract:
1. Data structure hierarchy
2. Field definitions (PIC clauses, types, sizes)
3. REDEFINES logic (alternate layouts)
4. OCCURS clauses (arrays/tables)
5. Usage by programs (if known)

Copybook Source:
${code}

Return JSON with this exact schema:
{
  "business_rules": ["Defines customer record structure with 01 level", "REDEFINES provides alternate layout"],
  "decision_tree": { 
    "root": "Record Layout",
    "branches": [
      { "condition": "REDEFINES clause", "action": "Alternate view", "branches": [] }
    ]
  },
  "propagator_network": { 
    "dataflows": [
      { "source": "01-LEVEL", "target": "05-FIELD", "operation": "HIERARCHY" },
      { "source": "FIELD", "target": "REDEFINES-FIELD", "operation": "OVERLAY" }
    ]
  },
  "complexity_metrics": {
    "cyclomatic_complexity": 1,
    "logic_depth": number,
    "variable_count": number,
    "decision_points": 0
  },
  "dependencies": {
    "called_programs": [],
    "copybooks": [],
    "files": [],
    "databases": []
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a COBOL copybook expert specializing in data structure analysis.' },
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
      logger.info({ program, fileType: 'COPYBOOK', tokens: tokens.total_tokens, cost: costUSD, duration }, 'Copybook analysis completed');
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
    if (logger) logger.error({ error: error.message, program }, 'Copybook analysis failed');
    throw error;
  }
}

module.exports = { analyze };
