/**
 * Database Migration Script
 * Creates and updates database schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
    try {
        console.log('Running database migrations...\n');

        // Migration 1: Create knowledge_graph table
        console.log('Creating knowledge_graph table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS knowledge_graph (
                id SERIAL PRIMARY KEY,
                file_name TEXT UNIQUE NOT NULL,
                analysis JSONB NOT NULL,
                user_id TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ knowledge_graph table created\n');

        // Migration 2: Create executions table
        console.log('Creating executions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS executions (
                id SERIAL PRIMARY KEY,
                program TEXT NOT NULL,
                inputs JSONB,
                outputs TEXT,
                exit_code INTEGER,
                user_id TEXT,
                executed_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ executions table created\n');

        // Migration 3: Create indexes
        console.log('Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_executions_user_id 
            ON executions(user_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_executions_program 
            ON executions(program)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_executions_executed_at 
            ON executions(executed_at DESC)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_knowledge_graph_user_id 
            ON knowledge_graph(user_id)
        `);
        console.log('✓ Indexes created\n');

        // Migration 4: Create users table (for future auth)
        console.log('Creating users table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                roles TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                last_login TIMESTAMP
            )
        `);
        console.log('✓ users table created\n');

        console.log('='.repeat(50));
        console.log('✓ All migrations completed successfully');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
