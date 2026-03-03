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

// COMMAREA field layout (fixed offsets from COBOL CICS programs)
const COMMAREA_LAYOUT = {
    WS_REQ: { offset: 0, length: 1, type: 'string', cobolType: 'PIC X(1)' },
    WS_NAME: { offset: 1, length: 15, type: 'string', cobolType: 'PIC X(15)' },
    WS_BALANCE: { offset: 16, length: 9, type: 'decimal', decimals: 2, cobolType: 'PIC 9(7)V99' },
    WS_CURRENCY: { offset: 25, length: 8, type: 'string', cobolType: 'PIC X(8)' },
    WS_RETCODE: { offset: 33, length: 10, type: 'string', cobolType: 'PIC X(10)' },
    TOTAL_LENGTH: 43
};

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
 * Detect if COBOL code uses COMMAREA (CICS communication area)
 */
function detectCOMMAREA(cobolCode) {
    const commareaPatterns = [
        /DFHCOMMAREA/i,
        /COMMAREA/i,
        /EIBCALEN/i,
        /WS-COMMAREA/i
    ];
    
    return commareaPatterns.some(pattern => pattern.test(cobolCode));
}

/**
 * Get language-specific COMMAREA parsing template
 */
function getCOMMAREAParsingTemplate(langName) {
    const templates = {
        'Python': `# Gap #1 FIX: Parse COMMAREA input buffer into local variables
def parse_commarea(commarea_bytes):
    """Parse CICS COMMAREA buffer using fixed offsets."""
    ws_req = commarea_bytes[0:1].decode('utf-8')
    ws_name = commarea_bytes[1:16].decode('utf-8').rstrip()
    # PIC 9(7)V99 - implied 2 decimals, divide by 100
    ws_balance_raw = int(commarea_bytes[16:25].decode('utf-8'))
    ws_balance = ws_balance_raw / 100.0
    ws_currency = commarea_bytes[25:33].decode('utf-8').rstrip()
    ws_retcode = commarea_bytes[33:43].decode('utf-8').rstrip()
    return ws_req, ws_name, ws_balance, ws_currency, ws_retcode

# Gap #2 FIX: Serialize results back to COMMAREA before return
def write_commarea(ws_req, ws_name, ws_balance, ws_currency, ws_retcode):
    """Write updated values back to COMMAREA buffer."""
    # Convert balance to implied decimal format (multiply by 100)
    balance_int = int(ws_balance * 100)
    commarea = bytearray(43)
    commarea[0:1] = ws_req.encode('utf-8')
    commarea[1:16] = ws_name.ljust(15).encode('utf-8')
    commarea[16:25] = str(balance_int).zfill(9).encode('utf-8')
    commarea[25:33] = ws_currency.ljust(8).encode('utf-8')
    commarea[33:43] = ws_retcode.ljust(10).encode('utf-8')
    return bytes(commarea)`,
        
        'Java': `// Gap #1 FIX: Parse COMMAREA input buffer into local variables
private static class CommareaData {
    String wsReq;
    String wsName;
    double wsBalance;
    String wsCurrency;
    String wsRetcode;
}

private static CommareaData parseCommarea(byte[] commareaBytes) {
    CommareaData data = new CommareaData();
    data.wsReq = new String(commareaBytes, 0, 1, StandardCharsets.UTF_8);
    data.wsName = new String(commareaBytes, 1, 15, StandardCharsets.UTF_8).trim();
    // PIC 9(7)V99 - implied 2 decimals, divide by 100
    String balanceStr = new String(commareaBytes, 16, 9, StandardCharsets.UTF_8);
    data.wsBalance = Long.parseLong(balanceStr) / 100.0;
    data.wsCurrency = new String(commareaBytes, 25, 8, StandardCharsets.UTF_8).trim();
    data.wsRetcode = new String(commareaBytes, 33, 10, StandardCharsets.UTF_8).trim();
    return data;
}

// Gap #2 FIX: Serialize results back to COMMAREA before return
private static byte[] writeCommarea(String wsReq, String wsName, double wsBalance, 
                                     String wsCurrency, String wsRetcode) {
    byte[] commarea = new byte[43];
    // Convert balance to implied decimal format (multiply by 100)
    long balanceInt = (long)(wsBalance * 100);
    System.arraycopy(wsReq.getBytes(StandardCharsets.UTF_8), 0, commarea, 0, 1);
    System.arraycopy(String.format("%-15s", wsName).getBytes(StandardCharsets.UTF_8), 0, commarea, 1, 15);
    System.arraycopy(String.format("%09d", balanceInt).getBytes(StandardCharsets.UTF_8), 0, commarea, 16, 9);
    System.arraycopy(String.format("%-8s", wsCurrency).getBytes(StandardCharsets.UTF_8), 0, commarea, 25, 8);
    System.arraycopy(String.format("%-10s", wsRetcode).getBytes(StandardCharsets.UTF_8), 0, commarea, 33, 10);
    return commarea;
}`,
        
        'JavaScript': `// Gap #1 FIX: Parse COMMAREA input buffer into local variables
function parseCommarea(commareaBuffer) {
    const wsReq = commareaBuffer.toString('utf8', 0, 1);
    const wsName = commareaBuffer.toString('utf8', 1, 16).trim();
    // PIC 9(7)V99 - implied 2 decimals, divide by 100
    const wsBalanceRaw = parseInt(commareaBuffer.toString('utf8', 16, 25));
    const wsBalance = wsBalanceRaw / 100.0;
    const wsCurrency = commareaBuffer.toString('utf8', 25, 33).trim();
    const wsRetcode = commareaBuffer.toString('utf8', 33, 43).trim();
    return { wsReq, wsName, wsBalance, wsCurrency, wsRetcode };
}

// Gap #2 FIX: Serialize results back to COMMAREA before return
function writeCommarea(wsReq, wsName, wsBalance, wsCurrency, wsRetcode) {
    const commarea = Buffer.alloc(43);
    // Convert balance to implied decimal format (multiply by 100)
    const balanceInt = Math.round(wsBalance * 100);
    commarea.write(wsReq, 0, 1, 'utf8');
    commarea.write(wsName.padEnd(15), 1, 15, 'utf8');
    commarea.write(balanceInt.toString().padStart(9, '0'), 16, 9, 'utf8');
    commarea.write(wsCurrency.padEnd(8), 25, 8, 'utf8');
    commarea.write(wsRetcode.padEnd(10), 33, 10, 'utf8');
    return commarea;
}`,
        
        'TypeScript': `// Gap #1 FIX: Parse COMMAREA input buffer into local variables
interface CommareaData {
    wsReq: string;
    wsName: string;
    wsBalance: number;
    wsCurrency: string;
    wsRetcode: string;
}

function parseCommarea(commareaBuffer: Buffer): CommareaData {
    const wsReq = commareaBuffer.toString('utf8', 0, 1);
    const wsName = commareaBuffer.toString('utf8', 1, 16).trim();
    // PIC 9(7)V99 - implied 2 decimals, divide by 100
    const wsBalanceRaw = parseInt(commareaBuffer.toString('utf8', 16, 25));
    const wsBalance = wsBalanceRaw / 100.0;
    const wsCurrency = commareaBuffer.toString('utf8', 25, 33).trim();
    const wsRetcode = commareaBuffer.toString('utf8', 33, 43).trim();
    return { wsReq, wsName, wsBalance, wsCurrency, wsRetcode };
}

// Gap #2 FIX: Serialize results back to COMMAREA before return
function writeCommarea(wsReq: string, wsName: string, wsBalance: number, 
                       wsCurrency: string, wsRetcode: string): Buffer {
    const commarea = Buffer.alloc(43);
    // Convert balance to implied decimal format (multiply by 100)
    const balanceInt = Math.round(wsBalance * 100);
    commarea.write(wsReq, 0, 1, 'utf8');
    commarea.write(wsName.padEnd(15), 1, 15, 'utf8');
    commarea.write(balanceInt.toString().padStart(9, '0'), 16, 9, 'utf8');
    commarea.write(wsCurrency.padEnd(8), 25, 8, 'utf8');
    commarea.write(wsRetcode.padEnd(10), 33, 10, 'utf8');
    return commarea;
}`,
        
        'C#': `// Gap #1 FIX: Parse COMMAREA input buffer into local variables
public class CommareaData
{
    public string WsReq { get; set; }
    public string WsName { get; set; }
    public double WsBalance { get; set; }
    public string WsCurrency { get; set; }
    public string WsRetcode { get; set; }
}

private static CommareaData ParseCommarea(byte[] commareaBytes)
{
    var data = new CommareaData();
    data.WsReq = Encoding.UTF8.GetString(commareaBytes, 0, 1);
    data.WsName = Encoding.UTF8.GetString(commareaBytes, 1, 15).Trim();
    // PIC 9(7)V99 - implied 2 decimals, divide by 100
    string balanceStr = Encoding.UTF8.GetString(commareaBytes, 16, 9);
    data.WsBalance = long.Parse(balanceStr) / 100.0;
    data.WsCurrency = Encoding.UTF8.GetString(commareaBytes, 25, 8).Trim();
    data.WsRetcode = Encoding.UTF8.GetString(commareaBytes, 33, 10).Trim();
    return data;
}

// Gap #2 FIX: Serialize results back to COMMAREA before return
private static byte[] WriteCommarea(string wsReq, string wsName, double wsBalance,
                                     string wsCurrency, string wsRetcode)
{
    byte[] commarea = new byte[43];
    // Convert balance to implied decimal format (multiply by 100)
    long balanceInt = (long)(wsBalance * 100);
    Array.Copy(Encoding.UTF8.GetBytes(wsReq), 0, commarea, 0, 1);
    Array.Copy(Encoding.UTF8.GetBytes(wsName.PadRight(15)), 0, commarea, 1, 15);
    Array.Copy(Encoding.UTF8.GetBytes(balanceInt.ToString("D9")), 0, commarea, 16, 9);
    Array.Copy(Encoding.UTF8.GetBytes(wsCurrency.PadRight(8)), 0, commarea, 25, 8);
    Array.Copy(Encoding.UTF8.GetBytes(wsRetcode.PadRight(10)), 0, commarea, 33, 10);
    return commarea;
}`,
        
        'Go': `// Gap #1 FIX: Parse COMMAREA input buffer into local variables
type CommareaData struct {
    WsReq      string
    WsName     string
    WsBalance  float64
    WsCurrency string
    WsRetcode  string
}

func parseCommarea(commareaBytes []byte) (*CommareaData, error) {
    if len(commareaBytes) < 43 {
        return nil, fmt.Errorf("COMMAREA buffer too short: %d bytes", len(commareaBytes))
    }
    
    data := &CommareaData{}
    data.WsReq = string(commareaBytes[0:1])
    data.WsName = strings.TrimSpace(string(commareaBytes[1:16]))
    
    // PIC 9(7)V99 - implied 2 decimals, divide by 100
    balanceStr := string(commareaBytes[16:25])
    balanceInt, err := strconv.ParseInt(balanceStr, 10, 64)
    if err != nil {
        return nil, fmt.Errorf("failed to parse balance: %w", err)
    }
    data.WsBalance = float64(balanceInt) / 100.0
    
    data.WsCurrency = strings.TrimSpace(string(commareaBytes[25:33]))
    data.WsRetcode = strings.TrimSpace(string(commareaBytes[33:43]))
    
    return data, nil
}

// Gap #2 FIX: Serialize results back to COMMAREA before return
func writeCommarea(wsReq, wsName string, wsBalance float64, wsCurrency, wsRetcode string) []byte {
    commarea := make([]byte, 43)
    
    // Convert balance to implied decimal format (multiply by 100)
    balanceInt := int64(wsBalance * 100)
    
    copy(commarea[0:1], wsReq)
    copy(commarea[1:16], fmt.Sprintf("%-15s", wsName))
    copy(commarea[16:25], fmt.Sprintf("%09d", balanceInt))
    copy(commarea[25:33], fmt.Sprintf("%-8s", wsCurrency))
    copy(commarea[33:43], fmt.Sprintf("%-10s", wsRetcode))
    
    return commarea
}`
    };
    
    return templates[langName] || '';
}

/**
 * Build comprehensive translation prompt
 */
function buildTranslationPrompt(cobolCode, langConfig, businessRules, options) {
    const hasCOMMAREA = detectCOMMAREA(cobolCode);
    
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

    // Add COMMAREA-specific instructions if detected
    if (hasCOMMAREA) {
        const commareaTemplate = getCOMMAREAParsingTemplate(langConfig.name);
        prompt += `\n## 🚨 CRITICAL: COMMAREA HANDLING REQUIRED

This COBOL program uses CICS COMMAREA (communication area) with fixed-offset binary layout.
You MUST implement BOTH gaps:

### COMMAREA Layout (Fixed Offsets - DO NOT CHANGE):
- WS-REQ:      offset 0,  length 1   (PIC X(1))      - Operation code
- WS-NAME:     offset 1,  length 15  (PIC X(15))     - Customer name
- WS-BALANCE:  offset 16, length 9   (PIC 9(7)V99)   - Balance (implied 2 decimals)
- WS-CURRENCY: offset 25, length 8   (PIC X(8))      - Currency code
- WS-RETCODE:  offset 33, length 10  (PIC X(10))     - Return code
- TOTAL:       43 bytes

### Gap #1 - Parse COMMAREA at Entry Point:
At the START of your main function/method, parse the incoming COMMAREA bytes into local variables:
\`\`\`${langConfig.name.toLowerCase()}
${commareaTemplate.split('\n\n')[0]}
\`\`\`

### Gap #2 - Write Back Results Before Return:
AFTER the EVALUATE/switch operations complete and BEFORE returning to caller, serialize the updated 
wsBalance, wsCurrency, wsRetcode back into the COMMAREA buffer:
\`\`\`${langConfig.name.toLowerCase()}
${commareaTemplate.split('\n\n')[1] || ''}
\`\`\`

### COBOL Reference Code:
The original COBOL does this:
\`\`\`cobol
// Entry: Parse input
MOVE DFHCOMMAREA(1:EIBCALEN) TO WS-COMMAREA
MOVE WS-BALANCE TO BALANCE
MOVE WS-NAME TO CUST-NAME-TEXT

// ... operations (Add/Read/Update/Delete/Credit/Debit) ...

// Exit: Write back results
MOVE BALANCE TO WS-BALANCE
MOVE CURRENCYC TO WS-CURRENCY  
MOVE SQLCODE TO WS-RETCODE
MOVE WS-COMMAREA TO DFHCOMMAREA(1:EIBCALEN)
\`\`\`

Your translation MUST replicate this exact entry/exit pattern using the buffer parsing functions above.
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
