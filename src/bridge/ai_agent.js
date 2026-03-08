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
const axios = require('axios');

// AI Provider Configuration
// currentProvider is mutable so it can be toggled at runtime without restart
let currentProvider = process.env.AI_PROVIDER || 'openai';
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o';
const maxRetries = 3;

// Ollama Configuration
const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.3';

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
    totalCyclomaticComplexity: 0,
    totalLogicDepth: 0,
    totalVariableCount: 0,
    totalDecisionPoints: 0,
    sessionStartTime: new Date().toISOString(),
    lastResetTime: new Date().toISOString()
};

let openaiClient;
let aiProviderInfo = {
    provider: currentProvider,
    model: currentProvider === 'openai' ? model : OLLAMA_MODEL,
    endpoint: currentProvider === 'ollama' ? OLLAMA_ENDPOINT : 'https://api.openai.com',
    status: 'not_initialized'
};

// Initialize OpenAI client (always initialize if API key is present,
// so toggling to openai at runtime works even if startd on ollama)
if (apiKey) {
    openaiClient = new OpenAI({
        apiKey,
        maxRetries: maxRetries,
        timeout: 60000 // 60 seconds
    });
    logger.info({ model }, 'OpenAI client initialized (available for toggling)');
} else {
    logger.warn('OPENAI_API_KEY is missing. OpenAI provider will be unavailable.');
}

// Set initial provider status
if (currentProvider === 'openai') {
    aiProviderInfo.status = openaiClient ? 'configured' : 'not_configured';
    if (openaiClient) {
        logger.info({ model, provider: 'openai' }, 'Active provider: OpenAI');
    }
} else if (currentProvider === 'ollama') {
    aiProviderInfo.status = 'configured';
    logger.info({ model: OLLAMA_MODEL, endpoint: OLLAMA_ENDPOINT, provider: 'ollama' }, 'Active provider: Ollama');
} else {
    aiProviderInfo.status = 'invalid_provider';
    logger.error({ provider: currentProvider }, 'Invalid AI_PROVIDER. Must be "openai" or "ollama"');
}

/**
 * Switch AI provider at runtime (no restart required)
 * @param {string} provider - 'openai' or 'ollama'
 * @returns {{ success: boolean, provider: string, model: string, message: string }}
 */
function setAIProvider(provider) {
    if (provider !== 'openai' && provider !== 'ollama') {
        return { success: false, message: `Invalid provider "${provider}". Must be "openai" or "ollama"` };
    }
    if (provider === 'openai' && !openaiClient) {
        return { success: false, message: 'Cannot switch to OpenAI: OPENAI_API_KEY is not configured' };
    }
    currentProvider = provider;
    aiProviderInfo.provider = provider;
    aiProviderInfo.model = provider === 'openai' ? model : OLLAMA_MODEL;
    aiProviderInfo.endpoint = provider === 'ollama' ? OLLAMA_ENDPOINT : 'https://api.openai.com';
    aiProviderInfo.status = 'configured';
    logger.info({ provider, model: aiProviderInfo.model }, 'AI provider switched at runtime');
    return {
        success: true,
        provider,
        model: aiProviderInfo.model,
        message: `Switched to ${provider} (${aiProviderInfo.model})`
    };
}

/**
 * Get current provider name
 * @returns {string} 'openai' or 'ollama'
 */
function getCurrentProvider() {
    return currentProvider;
}

/**
 * Call Ollama API (OpenAI-compatible chat completions endpoint)
 * @param {Array} messages - Chat messages array
 * @param {object} options - Additional options (temperature, max_tokens, etc.)
 * @returns {Promise<object>} Completion response
 */
async function callOllamaAPI(messages, options = {}) {
    const url = `${OLLAMA_ENDPOINT}/v1/chat/completions`;
    
    const requestBody = {
        model: OLLAMA_MODEL,
        messages: messages,
        temperature: options.temperature || 0.0,
        max_tokens: options.max_tokens || 4000,
        stream: false
    };

    // Enable JSON mode for Ollama when callers request json_object format
    if (options.response_format && options.response_format.type === 'json_object') {
        requestBody.format = 'json';
    }

    try {
        const response = await axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000 // 2 minutes for local LLM
        });

        // Ollama returns OpenAI-compatible format
        return response.data;
    } catch (error) {
        logger.error({ 
            err: error, 
            endpoint: OLLAMA_ENDPOINT, 
            model: OLLAMA_MODEL 
        }, 'Ollama API call failed');
        
        throw new Error(`Ollama API Error: ${error.message}. Ensure Ollama is running at ${OLLAMA_ENDPOINT}`);
    }
}

/**
 * Unified AI completion call - routes to OpenAI or Ollama based on provider
 * @param {Array} messages - Chat messages array  
 * @param {object} options - Additional options
 * @returns {Promise<object>} Completion response
 */
async function createChatCompletion(messages, options = {}) {
    if (currentProvider === 'openai') {
        if (!openaiClient) {
            throw new Error('OpenAI client not configured. Set OPENAI_API_KEY in .env');
        }
        
        return await openaiClient.chat.completions.create({
            messages,
            model: model,
            response_format: options.response_format,
            temperature: options.temperature || 0.0,
            max_tokens: options.max_tokens || 4000
        });
    } else if (currentProvider === 'ollama') {
        return await callOllamaAPI(messages, options);
    } else {
        throw new Error(`Invalid AI provider: ${currentProvider}. Must be "openai" or "ollama"`);
    }
}

/**
 * Calculate cost from token usage
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {string} modelName - Model name (e.g., 'gpt-4o')
 * @returns {number} Cost in USD
 */
function calculateCost(inputTokens, outputTokens, modelName) {
    // Ollama is free (local inference)
    if (currentProvider === 'ollama') {
        return 0.0;
    }
    
    const pricing = PRICING[modelName] || PRICING['gpt-4o'];
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
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
    if (!isAIAvailable()) {
        logger.error({ provider: currentProvider }, 'AI analysis requested but provider not available');
        return {
            error: 'AI service unavailable',
            message: currentProvider === 'openai' ? 'OpenAI API key not configured' : `Ollama not reachable at ${OLLAMA_ENDPOINT}`,
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
        logger.info({ provider: AI_PROVIDER, model: aiProviderInfo.model }, 'Sending COBOL code to AI for analysis');
        
        const startTime = Date.now();
        
        const completion = await createChatCompletion([
            {
                role: "system",
                content: "You are a specialized symbolic logic analyzer. Output ONLY valid JSON, no markdown formatting, no code blocks, no explanations."
            },
            {
                role: "user",
                content: prompt
            }
        ], {
            response_format: { type: "json_object" },
            temperature: 0.0,
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

        // Extract complexity metrics from analysis
        const complexityMetrics = analysis.complexity_metrics || {};
        const cyclomaticComplexity = complexityMetrics.cyclomatic_complexity || 0;
        const logicDepth = complexityMetrics.logic_depth || 0;
        const variableCount = complexityMetrics.variable_count || 0;
        const decisionPoints = complexityMetrics.decision_points || 0;

        // Update global metrics
        metrics.totalCalls += 1;
        metrics.totalProcessingTimeMs += duration;
        metrics.totalInputTokens += inputTokens;
        metrics.totalOutputTokens += outputTokens;
        metrics.totalCostUSD += cost;
        metrics.totalCyclomaticComplexity += cyclomaticComplexity;
        metrics.totalLogicDepth += logicDepth;
        metrics.totalVariableCount += variableCount;
        metrics.totalDecisionPoints += decisionPoints;

        logger.info({ 
            inputTokens, 
            outputTokens, 
            totalTokens, 
            cost: cost.toFixed(6),
            totalCost: metrics.totalCostUSD.toFixed(6),
            cyclomaticComplexity
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
    if (!isAIAvailable()) {
        return 'AI service unavailable';
    }

    try {
        const startTime = Date.now();
        
        const completion = await createChatCompletion([
            {
                role: "system",
                content: "You are a COBOL expert. Explain code sections clearly in plain English."
            },
            {
                role: "user",
                content: `Explain this COBOL code:\n\n${codeSection}`
            }
        ], {
            temperature: 0.3,
            max_tokens: 500
        });

        const duration = Date.now() - startTime;
        
        // Track metrics (explainCode doesn't analyze structure, so no LOC/complexity)
        const usage = completion.usage || {};
        const inputTokens = usage.prompt_tokens || 0;
        const outputTokens = usage.completion_tokens || 0;
        const cost = calculateCost(inputTokens, outputTokens, model);
        
        metrics.totalCalls += 1;
        metrics.totalProcessingTimeMs += duration;
        metrics.totalInputTokens += inputTokens;
        metrics.totalOutputTokens += outputTokens;
        metrics.totalCostUSD += cost;
        // Note: explainCode doesn't count LOC/complexity since it's not a full analysis

        logger.info({ inputTokens, outputTokens, cost: cost.toFixed(6) }, 'explainCode metrics tracked');

        return completion.choices[0].message.content;

    } catch (error) {
        logger.error({ err: error }, 'Code explanation failed');
        return 'Unable to generate explanation';
    }
}

/**
 * Check if AI service is available
 * @returns {boolean} True if AI provider is configured
 */
function isAIAvailable() {
    if (currentProvider === 'openai') {
        return openaiClient !== null && openaiClient !== undefined;
    } else if (currentProvider === 'ollama') {
        return aiProviderInfo.status === 'configured';
    }
    return false;
}

/**
 * Check Ollama connectivity
 * @returns {Promise<string>} Status: 'active', 'waiting_config', 'disconnected'
 */
async function checkOllamaStatus() {
    // If OLLAMA_ENDPOINT not set, show "Waiting for config"
    if (!process.env.OLLAMA_ENDPOINT) {
        return 'waiting_config';
    }

    try {
        const response = await axios.get(`${OLLAMA_ENDPOINT}/api/tags`, {
            timeout: 2000 // 2 second timeout for status check
        });
        return response.status === 200 ? 'active' : 'disconnected';
    } catch (error) {
        return 'disconnected';
    }
}

/**
 * Get AI provider information (both OpenAI and Ollama status)
 * @returns {Promise<object>} Provider info for both providers
 */
async function getProviderInfo() {
    const ollamaStatus = await checkOllamaStatus();
    
    return {
        active: {
            provider: currentProvider,
            model: aiProviderInfo.model,
            endpoint: aiProviderInfo.endpoint,
            status: aiProviderInfo.status
        },
        openai: {
            configured: !!apiKey && !!openaiClient,
            model: model,
            status: (apiKey && openaiClient) ? 'configured' : 'not_configured'
        },
        ollama: {
            endpoint: process.env.OLLAMA_ENDPOINT || null,
            model: OLLAMA_MODEL,
            status: ollamaStatus
        }
    };
}

/**
 * Adapter proxy — exposes the same openai.chat.completions.create() interface
 * that all analyzers expect, but routes to the current provider internally.
 * This object reference stays stable across the app lifetime, so toggling
 * currentProvider is immediately reflected in all consumers.
 */
const aiClientProxy = {
    chat: {
        completions: {
            create: async (params) => {
                const { messages, ...options } = params;
                return createChatCompletion(messages, options);
            }
        }
    }
};

module.exports = {
    extractSymbolicConstraints,
    explainCode,
    isAIAvailable,
    getProviderInfo,
    setAIProvider,
    getCurrentProvider,
    openai: aiClientProxy  // Proxy routes to current provider; all analyzers work unchanged
};
