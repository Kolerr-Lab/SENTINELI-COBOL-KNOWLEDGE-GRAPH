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

        // Add metadata
        analysis.metadata = {
            model: model,
            analyzed_at: new Date().toISOString(),
            duration_ms: duration,
            tokens_used: completion.usage?.total_tokens || 0
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
    isAIAvailable
};
