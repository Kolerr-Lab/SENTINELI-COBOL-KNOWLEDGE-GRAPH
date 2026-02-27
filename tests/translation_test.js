/**
 * Translation Feature Test
 * Tests the COBOL→Python/Java translation with Z3 verification
 */

const axios = require('axios');

const API_URL = 'http://localhost:8766/api/translate';
const API_KEY = process.env.API_KEY || 'sentinel-c0b0l-m0d3rn1z3-k3y';

// Sample COBOL code to translate
const SAMPLE_COBOL = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. AGE-CHECK.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 AGE                 PIC 9(3).
       01 INCOME              PIC 9(8).
       01 RESULT              PIC X(10).
       
       PROCEDURE DIVISION.
           IF AGE < 21 THEN
               MOVE "REJECT" TO RESULT
           ELSE
               IF INCOME > 50000 THEN
                   MOVE "APPROVE" TO RESULT
               ELSE
                   MOVE "REVIEW" TO RESULT
               END-IF
           END-IF
           DISPLAY RESULT.
           STOP RUN.`;

async function testTranslation(targetLang = 'python') {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄  TESTING COBOL → ${targetLang.toUpperCase()} TRANSLATION`);
    console.log('='.repeat(70));
    
    const startTime = Date.now();
    
    try {
        const response = await axios.post(API_URL, {
            code: SAMPLE_COBOL,
            targetLang: targetLang,
            verify: true,
            includeAnalysis: true
        }, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const duration = Date.now() - startTime;
        const result = response.data;
        
        console.log(`\n✅ Translation completed in ${duration}ms\n`);
        
        // Display original COBOL
        console.log('📝 ORIGINAL COBOL:');
        console.log('-'.repeat(70));
        console.log(result.translation.original.code);
        console.log(`\n   Lines: ${result.translation.original.lines}`);
        
        // Display translated code
        console.log(`\n🎯 TRANSLATED ${targetLang.toUpperCase()}:`);
        console.log('-'.repeat(70));
        console.log(result.translation.translated.code);
        console.log(`\n   Lines: ${result.translation.translated.lines}`);
        console.log(`   Version: ${result.translation.translated.version}`);
        
        // Display verification status
        console.log('\n🔐 Z3 FORMAL VERIFICATION:');
        console.log('-'.repeat(70));
        if (result.verification.proven) {
            console.log(`   ✅ Status: ${result.verification.status}`);
            console.log(`   ✅ Satisfiability: ${result.verification.satisfiability}`);
            console.log(`   ✅ ${result.verification.message}`);
            if (result.verification.details) {
                console.log(`   ✅ Rules Verified: ${result.verification.details.rulesVerified}`);
            }
        } else {
            console.log(`   ⚠️  Status: ${result.verification.status}`);
            console.log(`   ⚠️  ${result.verification.message}`);
            if (result.verification.reason) {
                console.log(`   ℹ️  Reason: ${result.verification.reason}`);
            }
        }
        
        // Display analysis
        if (result.analysis) {
            console.log('\n📊 COBOL ANALYSIS:');
            console.log('-'.repeat(70));
            if (result.analysis.businessRules) {
                console.log(`   Business Rules: ${result.analysis.businessRules.length}`);
                result.analysis.businessRules.forEach((rule, i) => {
                    console.log(`      ${i + 1}. ${rule}`);
                });
            }
            if (result.analysis.mips) {
                console.log(`   MIPS: ${result.analysis.mips.total_mips} units`);
                console.log(`   Cost: $${result.analysis.mips.cost_monthly}/month`);
            }
        }
        
        // Display metadata
        console.log('\n📈 METADATA:');
        console.log('-'.repeat(70));
        console.log(`   Model: ${result.metadata.model}`);
        console.log(`   Tokens Used: ${result.metadata.tokensUsed.total}`);
        console.log(`   Cost: $${result.metadata.estimatedCost.total}`);
        console.log(`   Processing Time: ${result.metadata.totalProcessingTimeMs}ms`);
        console.log(`   Verification: ${result.metadata.verificationIncluded ? 'Included' : 'Not Included'}`);
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ TEST PASSED');
        console.log('='.repeat(70) + '\n');
        
        return result;
        
    } catch (error) {
        console.error('\n❌ Translation failed:', error.response?.data || error.message);
        console.error('='.repeat(70) + '\n');
        throw error;
    }
}

async function testMultipleLanguages() {
    console.log('\n🌍  TESTING MULTIPLE TARGET LANGUAGES\n');
    
    const languages = ['python', 'java', 'typescript'];
    
    for (const lang of languages) {
        try {
            await testTranslation(lang);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
        } catch (error) {
            console.error(`Failed to translate to ${lang}`);
        }
    }
}

async function testSupportedLanguages() {
    console.log('\n📋  TESTING SUPPORTED LANGUAGES ENDPOINT\n');
    
    try {
        const response = await axios.get('http://localhost:8766/api/translate/languages', {
            headers: {
                'X-API-Key': API_KEY
            }
        });
        
        console.log('Supported Languages:');
        response.data.languages.forEach(lang => {
            console.log(`   • ${lang.name} (${lang.version}) - ${lang.style}`);
        });
        console.log(`\nTotal: ${response.data.count} languages\n`);
        
    } catch (error) {
        console.error('❌ Failed to get supported languages:', error.message);
    }
}

// Run tests
(async () => {
    try {
        // Test 1: Get supported languages
        await testSupportedLanguages();
        
        // Test 2: Python translation (default)
        await testTranslation('python');
        
        // Optional: Test multiple languages (uncomment to run)
        // await testMultipleLanguages();
        
    } catch (error) {
        console.error('Test suite failed:', error.message);
        process.exit(1);
    }
})();
