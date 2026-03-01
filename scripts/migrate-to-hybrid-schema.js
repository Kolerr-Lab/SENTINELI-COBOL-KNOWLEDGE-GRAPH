/**
 * Migration: Hybrid Schema for Knowledge Graph + Audit Trail
 * 
 * DESIGN DECISION:
 * Separate "current state" from "historical audit trail" for better performance
 * and compliance tracking.
 * 
 * TABLES:
 * 1. knowledge_graph - Current analysis state (1 row per file, UNIQUE)
 *    - Used for: Graph visualization, latest analysis queries
 *    - Guarantees: No duplicates, fast lookups
 * 
 * 2. analysis_history - Complete audit trail (all runs preserved)
 *    - Used for: Cost tracking, performance trends, compliance audits
 *    - Guarantees: Never loses data, full historical context
 * 
 * WHY THIS APPROACH:
 * - Graph queries are fast (no deduplication needed)
 * - Audit trail preserved for enterprise compliance
 * - Future-proof for cost/performance analytics
 * - Clean separation of concerns
 * 
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrateToHybridSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting Hybrid Schema Migration...\n');
        
        await client.query('BEGIN');

        // Step 1: Backup existing data
        console.log('📦 Step 1: Backing up existing knowledge_graph data...');
        const existingData = await client.query('SELECT * FROM knowledge_graph ORDER BY created_at');
        console.log(`   ✓ Found ${existingData.rows.length} existing analysis records\n`);

        // Step 2: Create analysis_history table (audit trail)
        console.log('📊 Step 2: Creating analysis_history table (audit trail)...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS analysis_history (
                id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                analysis JSONB NOT NULL,
                cyclomatic_complexity INTEGER,
                logic_depth INTEGER,
                variable_count INTEGER,
                decision_points INTEGER,
                cost_usd DECIMAL(10, 8),
                tokens_used INTEGER,
                duration_ms INTEGER,
                ai_model VARCHAR(100),
                analyzed_at TIMESTAMP DEFAULT NOW()
            );
            
            COMMENT ON TABLE analysis_history IS 'Complete audit trail of all COBOL analysis runs. Preserves every analysis for compliance, cost tracking, and performance trends.';
            COMMENT ON COLUMN analysis_history.file_name IS 'Source file name (can be duplicated across runs)';
            COMMENT ON COLUMN analysis_history.cost_usd IS 'OpenAI API cost for this analysis run';
            COMMENT ON COLUMN analysis_history.analyzed_at IS 'Timestamp when this analysis was performed';
        `);
        console.log('   ✓ analysis_history table created\n');

        // Step 3: Migrate all existing data to analysis_history
        console.log('📥 Step 3: Migrating existing data to analysis_history...');
        if (existingData.rows.length > 0) {
            for (const row of existingData.rows) {
                await client.query(`
                    INSERT INTO analysis_history 
                    (file_name, file_type, analysis, cyclomatic_complexity, logic_depth, 
                     variable_count, decision_points, cost_usd, tokens_used, duration_ms, ai_model, analyzed_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    row.file_name,
                    row.file_type,
                    row.analysis,
                    row.cyclomatic_complexity,
                    row.logic_depth,
                    row.variable_count,
                    row.decision_points,
                    row.cost_usd,
                    row.tokens_used,
                    row.duration_ms,
                    row.ai_model,
                    row.created_at
                ]);
            }
            console.log(`   ✓ Migrated ${existingData.rows.length} records to analysis_history\n`);
        }

        // Step 4: Drop and recreate knowledge_graph with UNIQUE constraint
        console.log('🔧 Step 4: Recreating knowledge_graph with UNIQUE constraint...');
        await client.query('DROP TABLE IF EXISTS knowledge_graph CASCADE');
        
        await client.query(`
            CREATE TABLE knowledge_graph (
                id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) UNIQUE NOT NULL,
                file_type VARCHAR(50),
                latest_analysis JSONB NOT NULL,
                cyclomatic_complexity INTEGER,
                logic_depth INTEGER,
                variable_count INTEGER,
                decision_points INTEGER,
                first_analyzed_at TIMESTAMP,
                last_analyzed_at TIMESTAMP,
                analysis_count INTEGER DEFAULT 1,
                total_cost_usd DECIMAL(10, 8),
                latest_ai_model VARCHAR(100)
            );
            
            COMMENT ON TABLE knowledge_graph IS 'Current state of analyzed files. One row per unique file. Used for graph visualization and latest analysis queries.';
            COMMENT ON COLUMN knowledge_graph.file_name IS 'Source file name (UNIQUE - enforced at database level)';
            COMMENT ON COLUMN knowledge_graph.latest_analysis IS 'Most recent analysis result';
            COMMENT ON COLUMN knowledge_graph.analysis_count IS 'Number of times this file has been analyzed';
            COMMENT ON COLUMN knowledge_graph.total_cost_usd IS 'Cumulative OpenAI API costs for all analyses';
        `);
        console.log('   ✓ knowledge_graph recreated with UNIQUE constraint\n');

        // Step 5: Populate knowledge_graph with latest analysis per file
        console.log('📊 Step 5: Populating knowledge_graph with deduplicated latest analysis...');
        
        // Get latest analysis for each unique file
        const latestAnalyses = await client.query(`
            WITH ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY file_name ORDER BY analyzed_at DESC) as rn
                FROM analysis_history
            )
            SELECT * FROM ranked WHERE rn = 1
        `);

        // Calculate aggregated stats for each file
        const fileStats = await client.query(`
            SELECT 
                file_name,
                COUNT(*) as analysis_count,
                MIN(analyzed_at) as first_analyzed_at,
                MAX(analyzed_at) as last_analyzed_at,
                SUM(cost_usd) as total_cost_usd
            FROM analysis_history
            GROUP BY file_name
        `);

        const statsMap = {};
        fileStats.rows.forEach(stat => {
            statsMap[stat.file_name] = stat;
        });

        // Insert into knowledge_graph
        for (const row of latestAnalyses.rows) {
            const stats = statsMap[row.file_name];
            await client.query(`
                INSERT INTO knowledge_graph 
                (file_name, file_type, latest_analysis, cyclomatic_complexity, logic_depth,
                 variable_count, decision_points, first_analyzed_at, last_analyzed_at, 
                 analysis_count, total_cost_usd, latest_ai_model)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                row.file_name,
                row.file_type,
                row.analysis,
                row.cyclomatic_complexity,
                row.logic_depth,
                row.variable_count,
                row.decision_points,
                stats.first_analyzed_at,
                stats.last_analyzed_at,
                stats.analysis_count,
                stats.total_cost_usd,
                row.ai_model
            ]);
        }
        console.log(`   ✓ Inserted ${latestAnalyses.rows.length} unique files into knowledge_graph\n`);

        // Step 6: Create indexes for performance
        console.log('🚀 Step 6: Creating performance indexes...');
        await client.query(`
            -- knowledge_graph indexes (fast lookups)
            CREATE INDEX IF NOT EXISTS idx_kg_file_type ON knowledge_graph(file_type);
            CREATE INDEX IF NOT EXISTS idx_kg_last_analyzed ON knowledge_graph(last_analyzed_at DESC);
            CREATE INDEX IF NOT EXISTS idx_kg_complexity ON knowledge_graph(cyclomatic_complexity DESC);
            
            -- analysis_history indexes (audit queries)
            CREATE INDEX IF NOT EXISTS idx_ah_file_name ON analysis_history(file_name);
            CREATE INDEX IF NOT EXISTS idx_ah_analyzed_at ON analysis_history(analyzed_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ah_file_type ON analysis_history(file_type);
            CREATE INDEX IF NOT EXISTS idx_ah_ai_model ON analysis_history(ai_model);
        `);
        console.log('   ✓ Indexes created\n');

        await client.query('COMMIT');
        
        console.log('═'.repeat(60));
        console.log('✅ HYBRID SCHEMA MIGRATION COMPLETED SUCCESSFULLY');
        console.log('═'.repeat(60));
        console.log('\n📊 Migration Summary:');
        console.log(`   • Total analyses preserved: ${existingData.rows.length}`);
        console.log(`   • Unique files: ${latestAnalyses.rows.length}`);
        console.log(`   • Duplicates eliminated from graph: ${existingData.rows.length - latestAnalyses.rows.length}`);
        console.log('\n📋 Tables:');
        console.log('   • knowledge_graph: Current state (1 row per file)');
        console.log('   • analysis_history: Complete audit trail (all runs)');
        console.log('\n🎯 Benefits:');
        console.log('   ✓ Fast graph queries (no deduplication needed)');
        console.log('   ✓ Full audit trail for compliance');
        console.log('   ✓ Cost tracking and analytics ready');
        console.log('   ✓ No data loss during migration\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrateToHybridSchema();
