/**
 * CICS Transaction Analyzer
 * Extracts transaction flow, BMS maps, and terminal I/O patterns
 */

async function analyze(code, program, options = {}) {
  const { openai, logger } = options;
  
  if (!openai) {
    throw new Error('OpenAI client required for CICS analysis');
  }

  const prompt = `Analyze this CICS transaction code and extract:
1. Transaction flow (screens, commands)
2. BMS map usage (SEND MAP, RECEIVE MAP)
3. File/DB operations (READ, WRITE, REWRITE)
4. Program control (LINK, XCTL, RETURN)
5. Error handling (HANDLE CONDITION, RESP)

CICS Source:
${code}

Return JSON with this exact schema:
{
  "business_rules": ["Transaction processes customer inquiry", "SEND MAP displays data to terminal"],
  "decision_tree": { 
    "root": "CICS Transaction Flow",
    "branches": [
      { "condition": "EIBCALEN = 0", "action": "Initial entry", "branches": [] },
      { "condition": "EIBAID = ENTER", "action": "Process input", "branches": [] }
    ]
  },
  "propagator_network": { 
    "dataflows": [
      { "source": "TERMINAL", "target": "COMMAREA", "operation": "RECEIVE" },
      { "source": "FILE", "target": "WORKING-STORAGE", "operation": "READ" },
      { "source": "MAP", "target": "TERMINAL", "operation": "SEND" }
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
    "copybooks": ["MAP1", "MAP2"],
    "files": ["FILE1", "QUEUE1"],
    "databases": []
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a CICS expert specializing in online transaction processing analysis.' },
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
      logger.info({ program, fileType: 'CICS', tokens: tokens.total_tokens, cost: costUSD, duration }, 'CICS analysis completed');
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
    if (logger) logger.error({ error: error.message, program }, 'CICS analysis failed');
    throw error;
  }
}

module.exports = { analyze };
