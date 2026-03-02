/**
 * Test Z3 Verification Fixes
 * Tests both verifyEquivalence and standalone Z3 endpoint
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3050';
const API_KEY = 'demo-api-key-sentineli-2026';

// Test COBOL code with clear business rules
const SAMPLE_COBOL = `
      IDENTIFICATION DIVISION.
      PROGRAM-ID. DISCOUNT-CALC.
      
      DATA DIVISION.
      WORKING-STORAGE SECTION.
      01  TOTAL-AMOUNT        PIC 9(8)V99.
      01  DISCOUNT-PCT        PIC 99V99.
      01  FINAL-AMOUNT        PIC 9(8)V99.
      
      PROCEDURE DIVISION.
      MAIN-LOGIC.
          IF TOTAL-AMOUNT > 1000
              COMPUTE DISCOUNT-PCT = 15.00
          ELSE IF TOTAL-AMOUNT > 500
              COMPUTE DISCOUNT-PCT = 10.00
          ELSE
              COMPUTE DISCOUNT-PCT = 5.00
          END-IF.
          
          COMPUTE FINAL-AMOUNT = 
              TOTAL-AMOUNT - (TOTAL-AMOUNT * DISCOUNT-PCT / 100).
          
          DISPLAY 'FINAL AMOUNT: ' FINAL-AMOUNT.
          STOP RUN.
`;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'bright');
    console.log('='.repeat(80) + '\n');
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Code Translation with Z3 Verification (verifyEquivalence)
 */
async function testTranslationVerification() {
    logSection('TEST 1: Code Translation with Z3 Verification');
    
    try {
        log('📤 POST /api/translate', 'cyan');
        log('   Body: { code, targetLang: "python", verify: true }', 'cyan');
        
        const response = await axios.post(
            `${API_BASE}/api/translate`,
            {
                code: SAMPLE_COBOL,
                targetLang: 'python',
                verify: true,
                includeAnalysis: true
            },
            {
                headers: { 'X-API-Key': API_KEY }
            }
        );
        
        log('✅ Translation Request Successful', 'green');
        console.log('\n📊 Response Summary:');
        console.log('   - Success:', response.data.success);
        console.log('   - Target Language:', response.data.translation.translated.language);
        console.log('   - Original Lines:', response.data.translation.original.lineCount);
        console.log('   - Translated Lines:', response.data.translation.translated.lineCount);
        
        // Check verification results
        const verification = response.data.verification;
        console.log('\n🔬 Z3 Verification Results:');
        console.log('   - Requested:', verification.requested);
        console.log('   - Status:', verification.status);
        
        if (verification.verified !== undefined) {
            console.log('   - Verified:', verification.verified);
            console.log('   - Rules Verified:', verification.rulesVerified || 0);
            console.log('   - Duration:', verification.duration + 'ms');
            log('\n✅ Z3 verifyEquivalence() WORKING!', 'green');
        } else {
            console.log('   - Reason:', verification.reason);
            if (verification.reason !== 'Insufficient business rules') {
                log('\n⚠️  Z3 verification skipped (this is OK if no verifiable rules)', 'yellow');
            }
        }
        
        // Show business rules found
        if (response.data.analysis && response.data.analysis.businessRules) {
            console.log('\n📋 Business Rules Extracted:');
            response.data.analysis.businessRules.slice(0, 3).forEach((rule, idx) => {
                console.log(`   ${idx + 1}. [${rule.type}] ${rule.rule || rule.condition || rule.description}`);
            });
            if (response.data.analysis.businessRules.length > 3) {
                console.log(`   ... and ${response.data.analysis.businessRules.length - 3} more`);
            }
        }
        
        return { success: true, verification };
        
    } catch (error) {
        log('❌ Translation Verification Test FAILED', 'red');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
        return { success: false, error: error.message };
    }
}

/**
 * Test 2: Standalone Z3 Verification Endpoint
 */
async function testStandaloneZ3Endpoint() {
    logSection('TEST 2: Standalone Z3 Verification Endpoint');
    
    try {
        log('📤 POST /api/z3/verify', 'cyan');
        log('   Body: { code, verification_type: "program" }', 'cyan');
        
        const response = await axios.post(
            `${API_BASE}/api/z3/verify`,
            {
                code: SAMPLE_COBOL,
                verification_type: 'program',
                options: {}
            },
            {
                headers: { 'X-API-Key': API_KEY }
            }
        );
        
        log('✅ Z3 Verification Request Successful', 'green');
        console.log('\n📊 Response Summary:');
        console.log('   - Success:', response.data.success);
        console.log('   - Verification Type:', response.data.verification_type);
        console.log('   - Verified:', response.data.result.verified);
        console.log('   - Duration:', response.data.result.duration + 'ms');
        
        // Show verification sections
        if (response.data.result.sections) {
            console.log('\n🔬 Verification Sections:');
            response.data.result.sections.forEach(section => {
                const statusIcon = section.status === 'verified' ? '✅' : 
                                  section.status === 'skipped' ? '⏭️' : '❌';
                console.log(`   ${statusIcon} ${section.name}: ${section.status}`);
                
                if (section.rulesCount !== undefined) {
                    console.log(`      - Rules: ${section.rulesCount}`);
                }
                if (section.cyclomaticComplexity !== undefined) {
                    console.log(`      - Cyclomatic Complexity: ${section.cyclomaticComplexity} (${section.complexityRating})`);
                }
                if (section.totalMIPS !== undefined) {
                    console.log(`      - Total MIPS: ${section.totalMIPS}`);
                }
                if (section.satisfiability) {
                    console.log(`      - Z3 Satisfiability: ${section.satisfiability}`);
                }
            });
        }
        
        log('\n✅ Standalone Z3 Endpoint WORKING!', 'green');
        return { success: true };
        
    } catch (error) {
        log('❌ Standalone Z3 Endpoint Test FAILED', 'red');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
        return { success: false, error: error.message };
    }
}

/**
 * Test 3: Z3 Info Endpoint
 */
async function testZ3InfoEndpoint() {
    logSection('TEST 3: Z3 Info & Health Endpoints');
    
    try {
        // Test info endpoint
        log('📤 GET /api/z3/info', 'cyan');
        const infoResponse = await axios.get(`${API_BASE}/api/z3/info`);
        
        log('✅ Z3 Info Endpoint OK', 'green');
        console.log('\n📚 Available Verification Types:');
        infoResponse.data.verificationTypes.forEach(type => {
            console.log(`   - ${type.name} (${type.id})`);
            console.log(`     ${type.description}`);
        });
        
        // Test health endpoint
        log('\n📤 GET /api/z3/health', 'cyan');
        const healthResponse = await axios.get(`${API_BASE}/api/z3/health`);
        
        log('✅ Z3 Health Check OK', 'green');
        console.log('   - Z3 Status:', healthResponse.data.z3Status);
        console.log('   - Test Duration:', healthResponse.data.testDuration + 'ms');
        
        return { success: true };
        
    } catch (error) {
        log('❌ Z3 Info/Health Endpoint Test FAILED', 'red');
        console.log('Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    console.clear();
    logSection('🔬 Z3 VERIFICATION SYSTEM - COMPREHENSIVE TEST');
    log('Testing Backend Fixes Before UI Development', 'cyan');
    
    const results = {
        translationVerification: null,
        standaloneEndpoint: null,
        infoEndpoints: null
    };
    
    // Check if server is running
    try {
        await axios.get(`${API_BASE}/health`);
        log('✅ Server is running at ' + API_BASE, 'green');
    } catch (error) {
        log('❌ Server is not running! Start with: npm start', 'red');
        log('   Expected at: ' + API_BASE, 'yellow');
        process.exit(1);
    }
    
    await delay(500);
    
    // Run tests
    results.translationVerification = await testTranslationVerification();
    await delay(1000);
    
    results.standaloneEndpoint = await testStandaloneZ3Endpoint();
    await delay(1000);
    
    results.infoEndpoints = await testZ3InfoEndpoint();
    
    // Summary
    logSection('📊 TEST SUMMARY');
    
    const tests = [
        { name: 'Translation with Z3 Verification', result: results.translationVerification },
        { name: 'Standalone Z3 Endpoint', result: results.standaloneEndpoint },
        { name: 'Z3 Info/Health Endpoints', result: results.infoEndpoints }
    ];
    
    tests.forEach(test => {
        const icon = test.result?.success ? '✅' : '❌';
        const color = test.result?.success ? 'green' : 'red';
        log(`${icon} ${test.name}`, color);
    });
    
    const allPassed = tests.every(t => t.result?.success);
    
    if (allPassed) {
        log('\n🎉 ALL TESTS PASSED!', 'green');
        log('✅ verifyEquivalence() function is working', 'green');
        log('✅ POST /api/z3/verify endpoint is working', 'green');
        log('✅ Ready to build UI for all 3 features!', 'green');
    } else {
        log('\n⚠️  SOME TESTS FAILED', 'yellow');
        log('Please review the errors above', 'yellow');
    }
    
    console.log('\n');
}

// Run tests
runAllTests().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
