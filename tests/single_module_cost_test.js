/**
 * Single Module Real API Cost Test - Show exact costs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ANSI Color Helpers
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    success: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
    warning: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`,
    info: (text) => `\x1b[1m\x1b[36m${text}\x1b[0m`,
    metric: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m`,
    header: (text) => `\x1b[1m\x1b[35m${text}\x1b[0m`,
    dim: (text) => `\x1b[2m${text}\x1b[0m`,
    highlight: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`
};

async function testSingleModule() {
    console.log('\n' + c.bright + c.magenta + '╔══════════════════════════════════════════════════════════════╗' + c.reset);
    console.log(c.bright + c.magenta + '║     ' + c.header('SINGLE MODULE REAL API COST TEST') + '                        ║' + c.reset);
    console.log(c.bright + c.magenta + '╚══════════════════════════════════════════════════════════════╝' + c.reset + '\n');
    
    // Read loan_approval.cob
    const cobolPath = path.join(__dirname, '../src/cobol/loan_approval.cob');
    const cobolSource = fs.readFileSync(cobolPath, 'utf-8');
    
    console.log(c.info('📄 Module: ') + c.highlight('loan_approval.cob'));
    console.log(`   ${c.dim('LOC:')} ${c.metric(cobolSource.split('\n').length)}`);
    console.log(`   ${c.dim('Size:')} ${c.metric((cobolSource.length / 1024).toFixed(2) + ' KB')}\n`);
    
    console.log(c.info('⏳ Calling OpenAI GPT-4o...') + '\n');
    
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are a COBOL expert analyzing enterprise banking systems. Extract key business rules, risk logic, and decision flows. Be concise (max 200 words).'
            },
            {
                role: 'user',
                content: `Analyze this loan_approval COBOL module (258 LOC):\n\nPurpose: Commercial loan underwriting with Z3-verified business rules\n\n${cobolSource}\n\nExtract: 1) Key business rules, 2) Decision logic, 3) Risk factors`
            }
        ],
        temperature: 0.3,
        max_tokens: 300
    });
    
    const duration = Date.now() - startTime;
    
    console.log(c.success('✅ API Response Received') + '\n');
    console.log(c.info('📊 REAL METRICS:'));
    console.log(`   ${c.dim('Duration:')} ${c.metric(duration + 'ms')}`);
    console.log(`   ${c.dim('Model:')} ${c.highlight(response.model)}`);
    console.log(`   ${c.dim('Prompt tokens:')} ${c.metric(response.usage.prompt_tokens.toLocaleString())}`);
    console.log(`   ${c.dim('Completion tokens:')} ${c.metric(response.usage.completion_tokens.toLocaleString())}`);
    console.log(`   ${c.dim('Total tokens:')} ${c.metric(response.usage.total_tokens.toLocaleString())}`);
    
    // Calculate REAL cost with actual GPT-4o pricing
    const inputCost = (response.usage.prompt_tokens / 1000000) * 2.50;
    const outputCost = (response.usage.completion_tokens / 1000000) * 10.00;
    const totalCost = inputCost + outputCost;
    
    console.log(`\n${c.info('💰 REAL COST:')}`);
    console.log(`   ${c.dim('Input cost:')} ${c.success('$' + inputCost.toFixed(6))} ${c.dim('(' + response.usage.prompt_tokens.toLocaleString() + ' tokens @ $2.50/1M)')}`);
    console.log(`   ${c.dim('Output cost:')} ${c.success('$' + outputCost.toFixed(6))} ${c.dim('(' + response.usage.completion_tokens.toLocaleString() + ' tokens @ $10/1M)')}`);
    console.log(`   ${c.dim('Total:')} ${c.highlight('$' + totalCost.toFixed(6))}`);
    
    console.log(`\n${c.header('🤖 AI ANALYSIS:')}`);
    console.log(c.cyan + '─'.repeat(70) + c.reset);
    
    // Format the AI response with colors
    const analysis = response.choices[0].message.content;
    const formattedAnalysis = analysis
        .split('\n')
        .map(line => {
            // Highlight section headers (1), 2), 3))
            if (line.match(/^\d+\)\s*\*\*/)) {
                return c.highlight(line);
            }
            // Highlight bullet points and key terms
            if (line.trim().startsWith('-')) {
                return c.bright + c.white + line + c.reset;
            }
            // Regular text
            return c.white + line + c.reset;
        })
        .join('\n');
    
    console.log(formattedAnalysis);
    console.log(c.cyan + '─'.repeat(70) + c.reset);
    
    console.log(`\n${c.info('🎯 For 4-module batch with 50% cache hit:')}`);
    console.log(`   ${c.dim('Fresh API calls:')} ${c.metric('2 modules')}`);
    console.log(`   ${c.dim('Estimated total cost:')} ${c.success('~$' + (totalCost * 3).toFixed(4))} ${c.dim('(2 fresh + 1 full analysis)')}`);
    
    return {
        tokens: response.usage.total_tokens,
        cost: totalCost,
        analysis: response.choices[0].message.content
    };
}

testSingleModule()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });
