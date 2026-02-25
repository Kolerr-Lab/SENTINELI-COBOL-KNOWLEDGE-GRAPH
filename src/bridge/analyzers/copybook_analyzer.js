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

Return JSON with this schema:
{
  "business_rules": ["Defines customer record structure", ...],
  "decision_tree": { "redefines": [...], "conditions": [...] },
  "propagator_network": { "fields": [...], "hierarchy": [...] },
  "complexity_metrics": {
    "cyclomatic_complexity": 1,
    "field_count": number,
    "hierarchy_depth": number,
    "total_bytes": number
  },
  "dependencies": {
    "used_by_programs": [],
    "nested_copybooks": [],
    "pic_types": ["X", "9", "S9", "COMP-3"]
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
