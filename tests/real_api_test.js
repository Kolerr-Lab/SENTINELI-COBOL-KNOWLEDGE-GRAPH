/**
 * REAL API TEST - Uses Actual OpenAI API
 * 
 * This test makes real API calls to OpenAI and costs real money.
 * Loads API key from .env file using dotenv (best practice).
 */

// Load environment variables from .env file (BEST PRACTICE)
require('dotenv').config();

const OpenAI = require('openai');

async function testRealAPI() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║         REAL API TEST - ACTUAL OPENAI CALLS                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ ERROR: OPENAI_API_KEY not set!');
        console.log('\nSet it with:');
        console.log('  PowerShell: $env:OPENAI_API_KEY = "your-key-here"');
        console.log('  Bash:       export OPENAI_API_KEY="your-key-here"\n');
        process.exit(1);
    }
    
    console.log('✅ API Key detected');
    console.log(`   Prefix: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
    console.log(`   Length: ${process.env.OPENAI_API_KEY.length} characters\n`);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('🧪 Test 1: Simple COBOL Analysis\n');
    console.log('📄 COBOL Code Sample:');
    
    const cobolCode = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. SIMPLE-CALC.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-NUM1         PIC 9(3) VALUE 100.
       01  WS-NUM2         PIC 9(3) VALUE 50.
       01  WS-RESULT       PIC 9(4).
       
       PROCEDURE DIVISION.
           COMPUTE WS-RESULT = WS-NUM1 + WS-NUM2.
           DISPLAY "RESULT=" WS-RESULT.
           STOP RUN.
    `;
    
    console.log(cobolCode);
    console.log('\n⏳ Calling OpenAI GPT-4o...\n');
    
    const startTime = Date.now();
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a COBOL expert. Analyze COBOL code and explain business logic concisely.'
                },
                {
                    role: 'user',
                    content: `Analyze this COBOL code and explain what it does:\n\n${cobolCode}`
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        
        const duration = Date.now() - startTime;
        
        console.log('✅ SUCCESS! API Response Received\n');
        console.log('📊 Metrics:');
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Model: ${response.model}`);
        console.log(`   Prompt tokens: ${response.usage.prompt_tokens}`);
        console.log(`   Completion tokens: ${response.usage.completion_tokens}`);
        console.log(`   Total tokens: ${response.usage.total_tokens}`);
        
        // Calculate cost (GPT-4o pricing as of 2024)
        const inputCost = (response.usage.prompt_tokens / 1000000) * 2.50;  // $2.50 per 1M input tokens
        const outputCost = (response.usage.completion_tokens / 1000000) * 10.00;  // $10 per 1M output tokens
        const totalCost = inputCost + outputCost;
        
        console.log(`   Cost: $${totalCost.toFixed(6)}\n`);
        
        console.log('🤖 AI Analysis:');
        console.log('─'.repeat(70));
        console.log(response.choices[0].message.content);
        console.log('─'.repeat(70));
        
        console.log('\n🎉 Real API Test Complete!');
        console.log(`💰 Total Cost: $${totalCost.toFixed(6)}`);
        
        return {
            success: true,
            duration,
            tokens: response.usage.total_tokens,
            cost: totalCost,
            analysis: response.choices[0].message.content
        };
        
    } catch (error) {
        console.error('\n❌ API Call Failed!');
        console.error(`   Error: ${error.message}`);
        
        if (error.status === 401) {
            console.error('\n⚠️  Authentication Error: Invalid API key');
        } else if (error.status === 429) {
            console.error('\n⚠️  Rate Limit: Too many requests or quota exceeded');
        } else if (error.status === 500) {
            console.error('\n⚠️  OpenAI Server Error: Try again later');
        }
        
        throw error;
    }
}

// Run test
if (require.main === module) {
    testRealAPI()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('\n💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testRealAPI };
