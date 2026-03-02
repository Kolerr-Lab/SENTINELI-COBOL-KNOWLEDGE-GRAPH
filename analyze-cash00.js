#!/usr/bin/env node

/**
 * Standalone script to re-analyze CASH00.cbl with fixed analyzers
 * Run: node analyze-cash00.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const OpenAI = require('openai');
const pino = require('pino');

const logger = pino({ level: 'info' });

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not set in .env file');
    process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'sentineli',
    password: process.env.PGPASSWORD || 'postgres',
    port: process.env.PGPORT || 5432
});

// Import analyzers
const cobolAnalyzer = require('./src/bridge/analyzers/cobol_analyzer');
const { detectFileType } = require('./src/bridge/analyzers');

async function analyzeCASH00() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Re-analyzing CASH00.cbl with Fixed Analyzers                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const filePath = 'src/cobol/real-world/ibm-stock-trader/COBOL/CASH00.cbl';
    const fullPath = path.join(__dirname, filePath);

    // Read file
    console.log(`📂 Reading: ${filePath}`);
    const code = fs.readFileSync(fullPath, 'utf8');
    console.log(`✅ File loaded: ${code.length} bytes\n`);

    // Detect file type
    const fileType = detectFileType(filePath);
    console.log(`🔍 Detected file type: ${fileType}\n`);

    // Analyze with COBOL analyzer
    console.log('⚙️  Running COBOL analysis...\n');
    const startTime = Date.now();

    try {
        const analysis = await cobolAnalyzer.analyze(code, 'CASH00', {
            openai,
            logger
        });

        const duration = Date.now() - startTime;

        console.log('✅ Analysis completed!\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📊 RESULTS SUMMARY:');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // MIPS Stats
        console.log('💰 MIPS Estimation:');
        console.log(`   Score: ${analysis.mips_estimation.mips_score}`);
        console.log(`   Estimated MIPS: ${analysis.mips_estimation.estimated_mips}`);
        console.log(`   Monthly Cost: $${analysis.mips_estimation.estimated_cost.monthly_usd}\n`);

        // Statement breakdown
        if (analysis.mips_estimation.statements) {
            const sqlStatements = Object.entries(analysis.mips_estimation.statements)
                .filter(([key]) => key.includes('EXEC SQL'));
            
            console.log('🗄️  SQL Operations Detected:');
            if (sqlStatements.length > 0) {
                sqlStatements.forEach(([type, count]) => {
                    console.log(`   ${type}: ${count}`);
                });
                const totalSQL = sqlStatements.reduce((sum, [, count]) => sum + count, 0);
                console.log(`   ─────────────────────────────`);
                console.log(`   TOTAL SQL OPS: ${totalSQL}\n`);
            } else {
                console.log('   None detected\n');
            }

            const cicsStatements = Object.entries(analysis.mips_estimation.statements)
                .filter(([key]) => key.includes('EXEC CICS') || key.includes('CICS '));
            
            console.log('⚡ CICS Operations Detected:');
            if (cicsStatements.length > 0) {
                cicsStatements.forEach(([type, count]) => {
                    console.log(`   ${type}: ${count}`);
                });
                console.log('   → fileType should be: CICS\n');
            } else {
                console.log('   None detected\n');
            }
        }

        // Called programs
        if (analysis.dependencies && analysis.dependencies.called_programs) {
            console.log('🔗 Called Programs (CALL + EXEC CICS LINK/XCTL):');
            if (analysis.dependencies.called_programs.length > 0) {
                analysis.dependencies.called_programs.forEach(prog => {
                    console.log(`   - ${prog}`);
                });
                console.log('');
            } else {
                console.log('   None detected\n');
            }
        }

        // Database tables
        if (analysis.dependencies && analysis.dependencies.databases) {
            console.log('🗄️  Database Tables:');
            if (analysis.dependencies.databases.length > 0) {
                analysis.dependencies.databases.forEach(table => {
                    console.log(`   - ${table}`);
                });
                console.log('');
            } else {
                console.log('   None detected\n');
            }
        }

        // API metrics
        console.log('📈 API Metrics:');
        console.log(`   Model: ${analysis.metadata.model}`);
        console.log(`   Tokens: ${analysis.metadata.tokens_used}`);
        console.log(`   Cost: $${analysis.metadata.cost_usd.toFixed(4)}`);
        console.log(`   Duration: ${duration}ms\n`);

        // Store in database
        console.log('💾 Updating database...');
        await pool.query(
            `INSERT INTO knowledge_graph (file_name, latest_analysis, last_analyzed_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (file_name) 
             DO UPDATE SET latest_analysis = $2, last_analyzed_at = NOW()`,
            [filePath, JSON.stringify(analysis)]
        );
        console.log('✅ Database updated!\n');

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎉 Re-analysis complete! All fixes applied.');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run analysis
analyzeCASH00().catch(console.error);
