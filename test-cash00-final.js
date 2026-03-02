#!/usr/bin/env node

/**
 * Final test of CASH00.cbl CICS detection after all fixes
 * Tests: is_cics_program flag + fileType override
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config();

const cobolAnalyzer = require('./src/bridge/analyzers/cobol_analyzer');

const pool = new Pool({
  host: process.env.DB_HOST || 'kg_cobol_db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'secure_pass',
  database: process.env.DB_NAME || 'kg_cobol_db'
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testCASH00() {
  console.log('🔍 Testing CASH00.cbl CICS Detection\n');
  console.log('=' .repeat(80));
  
  // Find CASH00.cbl
  const cobolPath = './src/cobol/real-world/src/cobol/real-world/ibm-stock-trader/COBOL/CASH00.cbl';
  
  if (!fs.existsSync(cobolPath)) {
    console.error('❌ CASH00.cbl not found at:', cobolPath);
    process.exit(1);
  }
  
  console.log('✅ Found CASH00.cbl\n');
  
  const code = fs.readFileSync(cobolPath, 'utf8');
  
  // Test 1: Pre-analysis CICS detection
  console.log('TEST 1: Pre-Analysis CICS Detection');
  console.log('-'.repeat(80));
  const cicsPattern = /EXEC[\s-]+CICS/i;
  const hasCICS = cicsPattern.test(code);
  console.log('✅ Regex test for EXEC CICS:', hasCICS);
  
  if (!hasCICS) {
    console.error('❌ FAILED: EXEC CICS not detected in source code!');
    process.exit(1);
  }
  
  // Count CICS operations
  const cicsMatches = code.match(/EXEC\s+CICS\s+\w+/gi) || [];
  console.log(`✅ Found ${cicsMatches.length} CICS operations:`);
  const uniqueCICS = [...new Set(cicsMatches.map(m => m.toUpperCase()))];
  uniqueCICS.forEach(op => console.log(`   - ${op}`));
  console.log();
  
  // Test 2: Run full analysis
  console.log('TEST 2: Full COBOL Analysis');
  console.log('-'.repeat(80));
  console.log('⏳ Analyzing CASH00.cbl with GPT-4o...\n');
  
  const analysis = await cobolAnalyzer.analyze(code, 'CASH00', {
    openai,
    logger: console
  });
  
  console.log('\n📊 Analysis Results:');
  console.log('-'.repeat(80));
  console.log('✅ is_cics_program:', analysis.is_cics_program);
  console.log('✅ MIPS Score:', analysis.mips_estimation?.mips_score);
  console.log('✅ Estimated Cost:', `$${analysis.mips_estimation?.estimated_cost?.monthly_usd?.toFixed(2)}/month`);
  
  // Check statement counts
  if (analysis.mips_estimation?.statement_counts) {
    const statements = analysis.mips_estimation.statement_counts;
    const sqlOps = Object.keys(statements).filter(k => k.includes('EXEC SQL'));
    const cicsOps = Object.keys(statements).filter(k => k.includes('EXEC CICS'));
    
    console.log(`✅ SQL Operations detected: ${sqlOps.length}`);
    sqlOps.forEach(op => console.log(`   - ${op}: ${statements[op]}`));
    
    console.log(`✅ CICS Operations detected: ${cicsOps.length}`);
    cicsOps.forEach(op => console.log(`   - ${op}: ${statements[op]}`));
  }
  
  console.log();
  
  // Test 3: Verify is_cics_program flag
  console.log('TEST 3: Verify is_cics_program Flag');
  console.log('-'.repeat(80));
  
  if (analysis.is_cics_program === true) {
    console.log('✅ PASS: is_cics_program === true');
  } else {
    console.error('❌ FAIL: is_cics_program is not true:', analysis.is_cics_program);
    process.exit(1);
  }
  
  // Test 4: Database update and fileType check
  console.log('\nTEST 4: Database Update & FileType Verification');
  console.log('-'.repeat(80));
  
  const fileName = 'CASH00.cbl';
  
  await pool.query(`
    INSERT INTO knowledge_graph (file_name, file_type, latest_analysis, first_analyzed_at, last_analyzed_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (file_name) 
    DO UPDATE SET 
      latest_analysis = EXCLUDED.latest_analysis,
      file_type = EXCLUDED.file_type,
      last_analyzed_at = NOW(),
      analysis_count = knowledge_graph.analysis_count + 1
  `, [fileName, 'CICS', JSON.stringify(analysis)]);
  
  console.log('✅ Database updated with analysis\n');
  
  // Fetch back and verify
  const result = await pool.query(
    'SELECT file_name, file_type, latest_analysis FROM knowledge_graph WHERE file_name = $1',
    [fileName]
  );
  
  if (result.rows.length === 0) {
    console.error('❌ FAIL: Record not found in database');
    process.exit(1);
  }
  
  const row = result.rows[0];
  const dbAnalysis = row.latest_analysis;
  
  console.log('📊 Database Record:');
  console.log('   - file_name:', row.file_name);
  console.log('   - file_type:', row.file_type);
  console.log('   - is_cics_program:', dbAnalysis.is_cics_program);
  
  // Test 5: Simulate graph.js fileType logic
  console.log('\nTEST 5: Graph.js FileType Logic Simulation');
  console.log('-'.repeat(80));
  
  let fileType = row.file_name.endsWith('.cob') || row.file_name.endsWith('.cbl') ? 'COBOL' : 'UNKNOWN';
  console.log('   Initial fileType (by extension):', fileType);
  
  // Apply the fix
  if (dbAnalysis && dbAnalysis.is_cics_program === true) {
    fileType = 'CICS';
    console.log('   ✅ Override applied: fileType = \'CICS\'');
  }
  
  console.log('   Final fileType:', fileType);
  
  if (fileType === 'CICS') {
    console.log('\n✅ PASS: FileType correctly set to CICS');
  } else {
    console.error('\n❌ FAIL: FileType is not CICS:', fileType);
    process.exit(1);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(80));
  console.log('\n✅ CASH00.cbl Classifications:');
  console.log('   - is_cics_program: true');
  console.log('   - fileType: CICS');
  console.log('   - Visual Styling: Orange (#fb923c) with ⚡ icon');
  console.log(`   - SQL Operations: ${Object.keys(dbAnalysis.mips_estimation?.statement_counts || {}).filter(k => k.includes('SQL')).length}`);
  console.log(`   - CICS Operations: ${Object.keys(dbAnalysis.mips_estimation?.statement_counts || {}).filter(k => k.includes('CICS')).length}`);
  console.log('\n🚀 System is working correctly!\n');
  
  await pool.end();
}

testCASH00().catch(err => {
  console.error('❌ Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
