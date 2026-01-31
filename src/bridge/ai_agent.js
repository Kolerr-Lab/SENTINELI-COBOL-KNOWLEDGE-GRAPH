const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
let openai;

if (apiKey) {
    openai = new OpenAI({ apiKey });
} else {
    console.warn("⚠️  WARNING: OPENAI_API_KEY is missing. AI features will fail.");
}

/**
 * Neuro-Symbolic Agent (Sussman-Kolmogorov Arch)
 * 1. Extracts "Propagators" (Dependency Chains)
 * 2. Minimizes Entropy (Shortest Description)
 */
async function extractSymbolicConstraints(sourceCode) {
    const prompt = `
    ROLE: Symbolic Logic Compiler (Sussman 1975) & Information Theorist (Kolmogorov).
    
    GOAL:
    1. Parse the COBOL code into a "Propagator Network". Identify every variable as a Node and every logic statement as a Directional Edge.
    2. Apply "Kolmogorov Complexity Reduction": The explanation must be the *shortest possible string* that perfectly describes the decision logic. Remove all "chatty" or redundant text.

    INPUT COBOL:
    ${sourceCode}

    OUTPUT FORMAT (JSON ONLY):
    {
        "propagator_network": {
            "nodes": [
                { "id": "WS-AGE", "type": "input", "domain": "0-99" },
                { "id": "WS-STATUS", "type": "state", "domain": "APPROVED|REJECTED" }
            ],
            "edges": [
                { 
                    "from": "WS-AGE", 
                    "to": "WS-STATUS", 
                    "condition": "AGE < 18", 
                    "effect": "SET STATUS = 'REJECTED'",
                    "causality_weight": 1.0 
                }
            ]
        },
        "minimal_description": "STATUS := (AGE < 18) ? 'REJECTED' : ((INCOME < 20000) ? 'REJECTED' : 'APPROVED')",
        "kolmogorov_score": "0.85 (High Compression)"
    }
    `;

    try {
        if (!openai) {
            return {
                propagator_network: { nodes: [], edges: [] },
                minimal_description: "System Error: OpenAI API Key missing. Cannot analyze code.",
                kolmogorov_score: "0.0"
            };
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a specialized Symbolic Engine. Output strictly JSON." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
            temperature: 0.0 // Deterministic output for symbolic logic
        });

        const result = completion.choices[0].message.content;
        return JSON.parse(result);

    } catch (error) {
        console.error("Symbolic Extraction Error:", error);
        return {
            error: "Neural-Symbolic Bridge Failure",
            details: error.message
        };
    }
}

module.exports = { extractSymbolicConstraints };
