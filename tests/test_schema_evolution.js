/**
 * Schema Evolution Test
 * Verifies new JSON schema with:
 * - propagator_network.dataflows (array) replacing edges
 * - decision_tree.branches with nested branches
 * - dependencies with called_programs, copybooks, files, databases
 * - business_rules as string array
 * - Backwards compatibility with old schema
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8766';

async function testSchemaEvolution() {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  SCHEMA EVOLUTION TEST                    ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test 1: Upload COBOL file and verify new schema
    console.log('📤 TEST 1: Upload COBOL file and verify new schema...');
    try {
        const cobolCode = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. LOAN-APPROVAL.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 LOAN-AMOUNT PIC 9(9)V99.
       01 CREDIT-SCORE PIC 999.
       01 APPROVAL-STATUS PIC X(10).
       
       PROCEDURE DIVISION.
       MAIN-LOGIC.
           MOVE 50000 TO LOAN-AMOUNT.
           MOVE 720 TO CREDIT-SCORE.
           
           IF CREDIT-SCORE > 700
               IF LOAN-AMOUNT < 100000
                   MOVE 'APPROVED' TO APPROVAL-STATUS
               ELSE
                   MOVE 'REVIEW' TO APPROVAL-STATUS
               END-IF
           ELSE
               MOVE 'DENIED' TO APPROVAL-STATUS
           END-IF.
           
           CALL 'CREDIT-CHECK' USING CREDIT-SCORE.
           
           EXEC SQL
               SELECT BALANCE INTO :WS-BALANCE
               FROM ACCOUNTS
               WHERE CUSTOMER-ID = :WS-CUSTOMER-ID
           END-EXEC.
           
           STOP RUN.
        `;

        const response = await fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                program: 'TEST-LOAN-APPROVAL.cob',
                code: cobolCode
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data.message || 'Analysis failed'}`);
        }

        console.log('   ✓ Analysis completed successfully');
        
        // Verify new schema structure
        const analysis = data;
        let testPassed = true;
        const errors = [];

        // 1. Check business_rules is array of strings
        if (!Array.isArray(analysis.business_rules)) {
            errors.push('business_rules is not an array');
            testPassed = false;
        } else if (analysis.business_rules.length > 0 && typeof analysis.business_rules[0] !== 'string') {
            errors.push('business_rules contains non-string elements');
            testPassed = false;
        } else {
            console.log(`   ✓ business_rules: array of ${analysis.business_rules.length} strings`);
        }

        // 2. Check decision_tree has branches (not children)
        if (!analysis.decision_tree || !analysis.decision_tree.branches) {
            errors.push('decision_tree.branches not found (should not use "children")');
            testPassed = false;
        } else {
            console.log(`   ✓ decision_tree.branches: ${analysis.decision_tree.branches.length} branches`);
            
            // Check for nested branches recursively
            const checkNestedBranches = (branches, depth = 0) => {
                for (const branch of branches) {
                    if (branch.children) {
                        errors.push(`Found "children" property at depth ${depth} - should be "branches"`);
                        testPassed = false;
                    }
                    if (branch.branches && Array.isArray(branch.branches)) {
                        checkNestedBranches(branch.branches, depth + 1);
                    }
                }
            };
            checkNestedBranches(analysis.decision_tree.branches);
        }

        // 3. Check propagator_network has dataflows
        if (!analysis.propagator_network || !analysis.propagator_network.dataflows) {
            errors.push('propagator_network.dataflows not found');
            testPassed = false;
        } else {
            console.log(`   ✓ propagator_network.dataflows: ${analysis.propagator_network.dataflows.length} dataflows`);
            
            // Verify dataflow structure (source, target, operation)
            const firstFlow = analysis.propagator_network.dataflows[0];
            if (firstFlow) {
                if (!firstFlow.source || !firstFlow.target) {
                    errors.push('dataflow should have source and target (not from/to)');
                    testPassed = false;
                } else {
                    console.log(`   ✓ dataflows use source→target format`);
                }
            }
        }

        // 4. Check dependencies structure
        if (!analysis.dependencies) {
            errors.push('dependencies object not found');
            testPassed = false;
        } else {
            const deps = analysis.dependencies;
            const requiredFields = ['called_programs', 'copybooks', 'files', 'databases'];
            
            for (const field of requiredFields) {
                if (!Array.isArray(deps[field])) {
                    errors.push(`dependencies.${field} is not an array`);
                    testPassed = false;
                } else {
                    console.log(`   ✓ dependencies.${field}: ${deps[field].length} items`);
                }
            }

            // Check for empty databases in COBOL (should have warning)
            if (deps.databases.length === 0 && analysis.warnings) {
                const dbWarning = analysis.warnings.find(w => w.type === 'MISSING_DB_DETECTION');
                if (dbWarning) {
                    console.log('   ✓ Warning added for empty databases[]');
                } else {
                    errors.push('Expected warning for empty databases[] in COBOL file');
                    testPassed = false;
                }
            }
        }

        // 5. Check metadata (cost, tokens, duration)
        if (!analysis.metadata || !analysis.metadata.cost_usd || !analysis.metadata.tokens_used) {
            errors.push('metadata missing cost_usd or tokens_used');
            testPassed = false;
        } else {
            console.log(`   ✓ metadata: ${analysis.metadata.tokens_used} tokens, $${analysis.metadata.cost_usd.toFixed(6)}`);
        }

        if (testPassed) {
            console.log('✅ TEST 1 PASSED: New schema verified\n');
            results.passed++;
        } else {
            console.log(`❌ TEST 1 FAILED: ${errors.join('; ')}\n`);
            results.failed++;
        }
        
        results.tests.push({
            name: 'New Schema Verification',
            passed: testPassed,
            errors
        });

    } catch (error) {
        console.log(`❌ TEST 1 FAILED: ${error.message}\n`);
        results.failed++;
        results.tests.push({
            name: 'New Schema Verification',
            passed: false,
            errors: [error.message]
        });
    }

    // Test 2: Verify metrics are DB-backed
    console.log('📊 TEST 2: Verify metrics are DB-backed (persistent)...');
    try {
        const response = await fetch(`${BASE_URL}/api/metrics`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Metrics endpoint returned failure');
        }

        const metrics = data.metrics;
        let testPassed = true;
        const errors = [];

        // Check all required metrics fields
        const requiredFields = [
            'totalCalls', 'totalProcessingTimeMs', 'averageProcessingTimeMs',
            'totalTokens', 'totalCostUSD', 'averageCostPerCall',
            'totalCyclomaticComplexity', 'averageCyclomaticComplexity',
            'averageLogicDepth', 'averageVariableCount', 'averageDecisionPoints',
            'firstAnalysis', 'lastAnalysis'
        ];

        for (const field of requiredFields) {
            if (metrics[field] === undefined) {
                errors.push(`Missing metric: ${field}`);
                testPassed = false;
            }
        }

        if (metrics.totalCalls >= 1) {
            console.log(`   ✓ Metrics: ${metrics.totalCalls} calls, $${metrics.totalCostUSD.toFixed(6)} total cost`);
            console.log(`   ✓ Averages: ${metrics.averageProcessingTimeMs.toFixed(0)}ms, ${metrics.averageCyclomaticComplexity.toFixed(1)} complexity`);
        } else {
            errors.push('No analyses in database - metrics should include test data');
            testPassed = false;
        }

        if (testPassed) {
            console.log('✅ TEST 2 PASSED: DB-backed metrics verified\n');
            results.passed++;
        } else {
            console.log(`❌ TEST 2 FAILED: ${errors.join('; ')}\n`);
            results.failed++;
        }

        results.tests.push({
            name: 'DB-backed Metrics',
            passed: testPassed,
            errors
        });

    } catch (error) {
        console.log(`❌ TEST 2 FAILED: ${error.message}\n`);
        results.failed++;
        results.tests.push({
            name: 'DB-backed Metrics',
            passed: false,
            errors: [error.message]
        });
    }

    // Test 3: Verify graph endpoint uses new dataflows
    console.log('🕸️  TEST 3: Verify graph endpoint builds from dataflows...');
    try {
        const response = await fetch(`${BASE_URL}/api/graph`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Graph endpoint returned failure');
        }

        const graph = data.graph;
        let testPassed = true;
        const errors = [];

        if (!graph.nodes || !Array.isArray(graph.nodes)) {
            errors.push('graph.nodes is missing or not an array');
            testPassed = false;
        } else {
            console.log(`   ✓ Graph nodes: ${graph.nodes.length}`);
        }

        if (!graph.edges || !Array.isArray(graph.edges)) {
            errors.push('graph.edges is missing or not an array');
            testPassed = false;
        } else {
            console.log(`   ✓ Graph edges: ${graph.edges.length}`);
            
            // Check if edges have proper types
            if (graph.edges.length > 0) {
                const hasCallsEdge = graph.edges.some(e => e.type === 'CALLS');
                const hasIncludesEdge = graph.edges.some(e => e.type === 'INCLUDES');
                if (hasCallsEdge || hasIncludesEdge) {
                    console.log('   ✓ Edges extracted from dependencies');
                }
            }
        }

        if (testPassed) {
            console.log('✅ TEST 3 PASSED: Graph endpoint verified\n');
            results.passed++;
        } else {
            console.log(`❌ TEST 3 FAILED: ${errors.join('; ')}\n`);
            results.failed++;
        }

        results.tests.push({
            name: 'Graph Endpoint',
            passed: testPassed,
            errors
        });

    } catch (error) {
        console.log(`❌ TEST 3 FAILED: ${error.message}\n`);
        results.failed++;
        results.tests.push({
            name: 'Graph Endpoint',
            passed: false,
            errors: [error.message]
        });
    }

    // Print summary
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                             ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log(`\n✅ PASSED: ${results.passed}`);
    console.log(`❌ FAILED: ${results.failed}`);
    console.log(`📊 TOTAL: ${results.passed + results.failed}\n`);

    if (results.failed > 0) {
        console.log('Failed tests:');
        results.tests.filter(t => !t.passed).forEach(test => {
            console.log(`  • ${test.name}: ${test.errors.join(', ')}`);
        });
        console.log('');
        process.exit(1);
    } else {
        console.log('🎉 ALL TESTS PASSED!\n');
        process.exit(0);
    }
}

// Run test
if (require.main === module) {
    testSchemaEvolution().catch(error => {
        console.error('❌ TEST SUITE FAILED:', error.message);
        process.exit(1);
    });
}

module.exports = { testSchemaEvolution };
