/**
 * VSAM File Definition Analyzer
 * Extracts file structure, access patterns, and key definitions
 */

async function analyze(code, program, options = {}) {
  const { openai, logger } = options;
  
  if (!openai) {
    throw new Error('OpenAI client required for VSAM analysis');
  }

  const prompt = `Analyze this VSAM file definition and extract:
1. File organization (KSDS, ESDS, RRDS, LDS)
2. Key definitions (primary, alternate)
3. Record layout and structure
4. Access patterns and performance characteristics

VSAM Definition:
${code}

Return JSON with this schema:
{
  "business_rules": ["KSDS with primary key on customer ID", ...],
  "decision_tree": { "access_methods": [...] },
  "propagator_network": { "keys": [...], "records": [...] },
  "complexity_metrics": {
    "cyclomatic_complexity": 1,
    "key_count": number,
    "record_length": number,
    "field_count": number
  },
  "dependencies": {
    "cluster_name": "string",
    "catalog": "string",
    "data_component": "string",
    "index_component": "string"
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a mainframe VSAM expert specializing in file structure analysis.' },
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
      logger.info({ program, fileType: 'VSAM', tokens: tokens.total_tokens, cost: costUSD, duration }, 'VSAM analysis completed');
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
    if (logger) logger.error({ error: error.message, program }, 'VSAM analysis failed');
    throw error;
  }
}

module.exports = { analyze };
