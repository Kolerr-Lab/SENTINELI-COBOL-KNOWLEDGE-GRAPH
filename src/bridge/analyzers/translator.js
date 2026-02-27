/**
 * COBOL Translator - AI-Powered Code Translation with Formal Verification
 * 
 * Translates COBOL to modern languages (Python, Java, JavaScript, C#, Go)
 * while maintaining mathematical equivalence verified by Z3 theorem prover.
 * 
 * Features:
 * - GPT-4o powered translation
 * - Preserves business logic structure
 * - Generates idiomatic modern code
 * - Side-by-side comparison output
 * - Integration with Z3 verification
 * 
 * @license MIT
 * @author Kolerr Lab
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o';
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Supported target languages with their characteristics
const SUPPORTED_LANGUAGES = {
    python: {
        name: 'Python',
        version: '3.11+',
        style: 'pythonic, type-hinted',
        frameworks: ['dataclasses for structures', 'typing for type safety']
    },
    java: {
        name: 'Java',
        version: '17+',
        style: 'enterprise-grade, strongly-typed',
        frameworks: ['Spring Boot patterns', 'record classes for DTOs']
    },
    javascript: {
        name: 'JavaScript',
        version: 'ES2022+',
        style: 'functional, immutable',
        frameworks: ['ESM modules', 'JSDoc for types']
    },
    typescript: {
        name: 'TypeScript',
        version: '5.0+',
        style: 'strongly-typed, functional',
        frameworks: ['interfaces for contracts', 'enums for constants']
    },
    csharp: {
        name: 'C#',
        version: '12+',
        style: 'enterprise .NET, LINQ-enabled',
        frameworks: ['.NET 8', 'record types']
    },
    go: {
        name: 'Go',
        version: '1.21+',
        style: 'idiomatic, error-handled',
        frameworks: ['struct types', 'error wrapping']
    }
};

/**
 * Translate COBOL code to target language
 * @param {string} cobolCode - Source COBOL code
 * @param {string} targetLang - Target language (python, java, javascript, typescript, csharp, go)
 * @param {Object} businessRules - Extracted business rules from COBOL analyzer
 * @param {Object} options - Translation options
 * @returns {Promise<Object>} Translation result with verification metadata
 */
async function translateCode(cobolCode, targetLang = 'python', businessRules = null, options = {}) {
    const startTime = Date.now();
    
    // Validate inputs
    if (!cobolCode || typeof cobolCode !== 'string') {
        throw new Error('Invalid COBOL code provided');
    }
    
    if (!SUPPORTED_LANGUAGES[targetLang.toLowerCase()]) {
        throw new Error(`Unsupported target language: ${targetLang}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
    }
    
    if (!openai) {
        throw new Error('OpenAI API key not configured. Translation requires GPT-4o.');
    }
    
    const langConfig = SUPPORTED_LANGUAGES[targetLang.toLowerCase()];
    
    logger.info({ 
        targetLang: langConfig.name, 
        cobolLength: cobolCode.length,
        hasBusinessRules: !!businessRules 
    }, 'Starting COBOL translation');
    
    try {
        // Build translation prompt
        const prompt = buildTranslationPrompt(cobolCode, langConfig, businessRules, options);
        
        // Call GPT-4o for translation
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert COBOL modernization engineer with 20+ years of mainframe experience. 
Your task is to translate COBOL code to modern languages while:
1. Preserving EXACT business logic (no assumptions)
2. Maintaining mathematical equivalence
3. Writing idiomatic, production-ready code
4. Adding comprehensive comments explaining COBOL→Modern mappings
5. Handling edge cases (null values, overflow, precision)

CRITICAL: The translated code must be formally verifiable - every conditional, calculation, and data transformation must match COBOL behavior precisely.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.1, // Low temperature for deterministic output
            max_tokens: 4000,
            top_p: 0.95
        });
        
        const translatedCode = response.choices[0].message.content;
        const processingTime = Date.now() - startTime;
        
        // Extract code from markdown if wrapped
        const cleanedCode = extractCodeFromMarkdown(translatedCode, targetLang);
        
        // Build result
        const result = {
            success: true,
            original: {
                language: 'COBOL',
                code: cobolCode,
                lines: cobolCode.split('\n').length
            },
            translated: {
                language: langConfig.name,
                code: cleanedCode,
                lines: cleanedCode.split('\n').length,
                version: langConfig.version
            },
            metadata: {
                model: model,
                processingTimeMs: processingTime,
                tokensUsed: {
                    input: response.usage.prompt_tokens,
                    output: response.usage.completion_tokens,
                    total: response.usage.total_tokens
                },
                estimatedCost: calculateCost(response.usage),
                timestamp: new Date().toISOString()
            },
            businessRules: businessRules || null,
            verificationReady: true // Ready for Z3 verification
        };
        
        logger.info({ 
            targetLang: langConfig.name,
            processingTime,
            tokensUsed: response.usage.total_tokens,
            linesTranslated: result.original.lines
        }, 'Translation completed successfully');
        
        return result;
        
    } catch (error) {
        logger.error({ 
            error: error.message, 
            targetLang: langConfig.name 
        }, 'Translation failed');
        
        throw new Error(`Translation failed: ${error.message}`);
    }
}

/**
 * Build comprehensive translation prompt
 */
function buildTranslationPrompt(cobolCode, langConfig, businessRules, options) {
    let prompt = `# COBOL to ${langConfig.name} Translation Task

## Source COBOL Code:
\`\`\`cobol
${cobolCode}
\`\`\`

## Target Language: ${langConfig.name} (${langConfig.version})
Style: ${langConfig.style}
Frameworks: ${langConfig.frameworks.join(', ')}
`;

    if (businessRules && businessRules.length > 0) {
        prompt += `\n## Extracted Business Rules (must be preserved):
${businessRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}
`;
    }

    prompt += `\n## Translation Requirements:

1. **Preserve Exact Logic:**
   - Every IF/ELSE condition must map 1:1
   - Numeric precision must match COBOL (use Decimal/BigDecimal if needed)
   - String handling must preserve COBOL's fixed-length semantics where critical
   
2. **Code Quality:**
   - Write production-ready, idiomatic ${langConfig.name}
   - Add docstrings/comments explaining COBOL→${langConfig.name} mappings
   - Use modern language features (${langConfig.version})
   - Handle errors gracefully
   
3. **Data Type Mappings:**
   - COBOL PIC 9(n) → Appropriate numeric type with same precision
   - COBOL PIC X(n) → String type
   - COBOL 88-levels → Enums or constants
   - COBOL COMP-3 → Decimal type
   
4. **Output Format:**
   - Return ONLY the translated code
   - Include inline comments for complex mappings
   - Add a header comment explaining the translation
   
5. **Verification Readiness:**
   - Structure code so business logic is easily extractable for Z3 verification
   - Keep conditionals simple and explicit
   - Avoid unnecessary language-specific abstractions that obscure logic

Generate the ${langConfig.name} code now:`;

    return prompt;
}

/**
 * Extract code from markdown code blocks
 */
function extractCodeFromMarkdown(text, targetLang) {
    // Try to extract from code block with language specifier
    const langPattern = new RegExp(`\`\`\`${targetLang}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
    let match = text.match(langPattern);
    
    if (match) {
        return match[1].trim();
    }
    
    // Try generic code block
    const genericPattern = /```\s*\n([\s\S]*?)\n```/;
    match = text.match(genericPattern);
    
    if (match) {
        return match[1].trim();
    }
    
    // Return as-is if no code block found
    return text.trim();
}

/**
 * Calculate API cost based on token usage
 */
function calculateCost(usage) {
    const pricing = {
        'gpt-4o': { input: 2.50, output: 10.00 },
        'gpt-4o-mini': { input: 0.15, output: 0.60 }
    };
    
    const modelPricing = pricing[model] || pricing['gpt-4o'];
    const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output;
    
    return {
        input: inputCost.toFixed(6),
        output: outputCost.toFixed(6),
        total: (inputCost + outputCost).toFixed(6),
        currency: 'USD'
    };
}

/**
 * Batch translate multiple COBOL files
 */
async function translateBatch(files, targetLang, options = {}) {
    const results = [];
    
    for (const file of files) {
        try {
            const result = await translateCode(file.code, targetLang, file.businessRules, options);
            results.push({
                filename: file.name,
                success: true,
                result
            });
        } catch (error) {
            results.push({
                filename: file.name,
                success: false,
                error: error.message
            });
        }
    }
    
    return {
        total: files.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

/**
 * Get list of supported target languages
 */
function getSupportedLanguages() {
    return Object.entries(SUPPORTED_LANGUAGES).map(([key, config]) => ({
        id: key,
        name: config.name,
        version: config.version,
        style: config.style
    }));
}

module.exports = {
    translateCode,
    translateBatch,
    getSupportedLanguages,
    SUPPORTED_LANGUAGES
};
