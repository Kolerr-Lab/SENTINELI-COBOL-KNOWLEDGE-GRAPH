/**
 * JCL (Job Control Language) Analyzer
 * Extracts job flow, exec statements, DD statements, and dependencies
 */

async function analyze(code, program, options = {}) {
  const { openai, logger } = options;
  
  if (!openai) {
    throw new Error('OpenAI client required for JCL analysis');
  }

  const prompt = `Analyze this JCL (Job Control Language) and extract:
1. Job flow (step sequence and dependencies)
2. Program execution calls (EXEC PGM=...)
3. Dataset dependencies (DD statements)
4. Conditional logic (IF/THEN/ELSE, COND with nested branches)
5. Complexity metrics

JCL Source:
${code}

Return JSON with this exact schema:
{
  "business_rules": ["Step X executes COBOL program Y", ...],
  "decision_tree": { 
    "root": "Job Flow",
    "branches": [
      { "step": "STEP01", "condition": "RC=0", "action": "EXEC PGM", "branches": [...] }
    ]
  },
  "propagator_network": { 
    "dataflows": [
      { "source": "DATASET1", "target": "PROG1", "operation": "INPUT" },
      { "source": "PROG1", "target": "DATASET2", "operation": "OUTPUT" }
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
    "copybooks": [],
    "files": ["DATASET1", "DATASET2"],
    "databases": []
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a mainframe JCL expert specializing in job control analysis.' },
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
      logger.info({ program, fileType: 'JCL', tokens: tokens.total_tokens, cost: costUSD, duration }, 'JCL analysis completed');
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
    if (logger) logger.error({ error: error.message, program }, 'JCL analysis failed');
    throw error;
  }
}

module.exports = { analyze };
