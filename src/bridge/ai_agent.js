/**
 * AI Agent - Neuro-Symbolic Code Analysis
 * 
 * Uses OpenAI GPT-4o to analyze COBOL code and extract:
 * - Propagator networks (variable dependencies)
 * - Decision logic flows
 * - Business rule descriptions
 * 
 * @license MIT
 * @author Kolerr Lab
 */

const OpenAI = require('openai');
const logger = require('./utils/logger');

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o';
const maxRetries = 3;

// GPT-4o Pricing (per million tokens)
const PRICING = {
    'gpt-4o': {
        input: 2.50,   // $2.50 per 1M input tokens
        output: 10.00  // $10.00 per 1M output tokens
    },
    'gpt-4o-mini': {
        input: 0.15,   // $0.15 per 1M input tokens
        output: 0.60   // $0.60 per 1M output tokens
    }
};

// Global metrics tracking
const metrics = {
    totalCalls: 0,
    totalProcessingTimeMs: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUSD: 0.0,
    sessionStartTime: new Date().toISOString(),
    lastResetTime: new Date().toISOString()
};

let openai;

if (apiKey) {
    openai = new OpenAI({ 
        apiKey,
        maxRetries: maxRetries,
        timeout: 60000 // 60 seconds
    });
    logger.info({ model }, 'OpenAI client initialized');
} else {
    logger.warn('OPENAI_API_KEY is missing. AI features will be disabled.');
}

/**
 * Calculate cost from token usage
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {string} modelName - Model name (e.g., 'gpt-4o')
 * @returns {number} Cost in USD
 */
function calculateCost(inputTokens, outputTokens, modelName) {
    const pricing = PRICING[modelName] || PRICING['gpt-4o'];
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
}

/**
 * Get current metrics
 * @returns {object} Metrics object
 */
function getMetrics() {
    const uptimeMs = Date.now() - new Date(metrics.sessionStartTime).getTime();
    return {
        ...metrics,
        uptimeMs,
        uptimeMinutes: Math.floor(uptimeMs / 60000),
        averageProcessingTimeMs: metrics.totalCalls > 0 
            ? Math.round(metrics.totalProcessingTimeMs / metrics.totalCalls) 
            : 0,
        averageCostPerCall: metrics.totalCalls > 0
            ? (metrics.totalCostUSD / metrics.totalCalls).toFixed(4)
            : '0.0000'
    };
}

/**
 * Reset metrics
 */
function resetMetrics() {
    metrics.totalCalls = 0;
    metrics.totalProcessingTimeMs = 0;
    metrics.totalInputTokens = 0;
    metrics.totalOutputTokens = 0;
    metrics.totalCostUSD = 0.0;
    metrics.lastResetTime = new Date().toISOString();
    logger.info('Metrics reset');
}

/**
 * Neuro-Symbolic Agent (Sussman-Kolmogorov Architecture)
 * 
 * Extracts symbolic constraints from COBOL code:
 * 1. Propagator Networks: Variable dependencies and data flows
 * 2. Kolmogorov Complexity: Minimal description of logic
 * 3. Decision Tree: Business rule structure
 * 
 * @param {string} sourceCode - COBOL source code to analyze
 * @returns {Promise<object>} Analysis result
 */
async function extractSymbolicConstraints(sourceCode) {
    if (!openai) {
        logger.error('AI analysis requested but OpenAI client not initialized');
        return {
            error: 'AI service unavailable',
            message: 'OpenAI API key not configured',
            propagator_network: { nodes: [], edges: [] },
            minimal_description: 'Analysis unavailable',
            kolmogorov_score: '0.0'
        };
    }

    const prompt = `
ROLE: You are a Symbolic Logic Compiler based on Gerald Sussman's propagator model (1975) and Kolmogorov complexity theory.

TASK: Analyze the following COBOL code and extract its symbolic structure.

INPUT COBOL:
\`\`\`cobol
${sourceCode}
\`\`\`

OUTPUT REQUIREMENTS:
1. **Propagator Network**: Map all variables as nodes and logic statements as directed edges
2. **Kolmogorov Minimal Description**: Express the logic in the shortest possible form
3. **Decision Tree**: Hierarchical structure of business rules
4. **Complexity Score**: Estimate based on cyclomatic complexity and logic depth

OUTPUT FORMAT (JSON only, no markdown):
{
    "propagator_network": {
        "nodes": [
            {
                "id": "variable_name",
                "type": "input|state|output",
                "domain": "data type or range",
                "description": "purpose of variable"
            }
        ],
        "edges": [
            {
                "from": "source_variable",
                "to": "target_variable",
                "condition": "logical condition",
                "effect": "transformation or assignment",
                "causality_weight": 0.0-1.0,
                "line_number": integer
            }
        ]
    },
    "decision_tree": {
        "root": "initial condition",
        "branches": [
            {
                "condition": "test expression",
                "result": "outcome",
                "children": []
            }
        ]
    },
    "minimal_description": "Shortest possible description of the logic",
    "kolmogorov_score": "0.0-1.0 (higher = more compressible/simpler logic)",
    "complexity_metrics": {
        "cyclomatic_complexity": integer,
        "logic_depth": integer,
        "variable_count": integer,
        "decision_points": integer
    },
    "business_rules": [
        {
            "rule_id": "unique_identifier",
            "condition": "when this happens",
            "action": "do this",
            "priority": integer
        }
    ]
}
`;

    try {
        logger.info('Sending COBOL code to AI for analysis');
        
        const startTime = Date.now();
        
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a specialized symbolic logic analyzer. Output ONLY valid JSON, no markdown formatting, no code blocks, no explanations."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: model,
            response_format: { type: "json_object" },
            temperature: 0.0, // Deterministic for consistency
            max_tokens: 4000
        });

        const duration = Date.now() - startTime;
        logger.info({ duration, model }, 'AI analysis completed');

        const result = completion.choices[0].message.content;
        const analysis = JSON.parse(result);

        // Extract usage data from OpenAI response
        const usage = completion.usage || {};
        const inputTokens = usage.prompt_tokens || 0;
        const outputTokens = usage.completion_tokens || 0;
        const totalTokens = usage.total_tokens || 0;
        const cost = calculateCost(inputTokens, outputTokens, model);

        // Update global metrics
        metrics.totalCalls += 1;
        metrics.totalProcessingTimeMs += duration;
        metrics.totalInputTokens += inputTokens;
        metrics.totalOutputTokens += outputTokens;
        metrics.totalCostUSD += cost;

        logger.info({ 
            inputTokens, 
            outputTokens, 
            totalTokens, 
            cost: cost.toFixed(6),
            totalCost: metrics.totalCostUSD.toFixed(6)
        }, 'OpenAI API usage tracked');

        // Add metadata
        analysis.metadata = {
            model: model,
            analyzed_at: new Date().toISOString(),
            duration_ms: duration,
            tokens_used: totalTokens,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_usd: parseFloat(cost.toFixed(6))
        };

        return analysis;

    } catch (error) {
        logger.error({ err: error }, 'AI analysis failed');

        // Provide fallback structure
        return {
            error: 'Analysis failed',
            message: error.message,
            propagator_network: { nodes: [], edges: [] },
            decision_tree: { root: null, branches: [] },
            minimal_description: 'Analysis failed due to error',
            kolmogorov_score: '0.0',
            complexity_metrics: {
                cyclomatic_complexity: 0,
                logic_depth: 0,
                variable_count: 0,
                decision_points: 0
            },
            business_rules: []
        };
    }
}

/**
 * Explain a specific COBOL code section
 * @param {string} codeSection - Code section to explain
 * @returns {Promise<string>} Plain English explanation
 */
async function explainCode(codeSection) {
    if (!openai) {
        return 'AI service unavailable';
    }

    try {
        const startTime = Date.now();
        
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a COBOL expert. Explain code sections clearly in plain English."
                },
                {
                    role: "user",
                    content: `Explain this COBOL code:\n\n${codeSection}`
                }
            ],
            model: model,
            temperature: 0.3,
            max_tokens: 500
        });

        const duration = Date.now() - startTime;
        
        // Track metrics
        const usage = completion.usage || {};
        const inputTokens = usage.prompt_tokens || 0;
        const outputTokens = usage.completion_tokens || 0;
        const cost = calculateCost(inputTokens, outputTokens, model);
        
        metrics.totalCalls += 1;
        metrics.totalProcessingTimeMs += duration;
        metrics.totalInputTokens += inputTokens;
        metrics.totalOutputTokens += outputTokens;
        metrics.totalCostUSD += cost;

        return completion.choices[0].message.content;

    } catch (error) {
        logger.error({ err: error }, 'Code explanation failed');
        return 'Unable to generate explanation';
    }
}

/**
 * Check if AI service is available
 * @returns {boolean} True if OpenAI client is configured
 */
function isAIAvailable() {
    return openai !== null && openai !== undefined;
}

module.exports = {
    extractSymbolicConstraints,
    explainCode,
    isAIAvailable,
    getMetrics,
    resetMetrics
};
