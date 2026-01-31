const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { extractSymbolicConstraints } = require('./ai_agent');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

// --- 1. Execution Bridge (The "Body") ---
app.post('/run/:program', (req, res) => {
    const programName = req.params.program;
    const inputs = req.body || {}; // JSON inputs to map to ENV vars

    // Construct env with inputs
    const env = { ...process.env, ...inputs };

    // Path to compiled executable (assuming 'bin' folder)
    const executablePath = path.join(__dirname, '../../bin', programName);

    // Check if executable exists
    if (!fs.existsSync(executablePath)) {
        // Just try compiling on the fly for demo purposes?
        // Or assume it's pre-compiled. Let's return error for now.
        return res.status(404).json({ error: `Program ${programName} not compiled/found.` });
    }

    console.log(`Executing ${programName} with inputs:`, inputs);

    const child = spawn(executablePath, [], { env });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    child.on('close', (code) => {
        console.log(`Command exited with code ${code}`);
        res.json({
            program: programName,
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim()
        });
    });
});

const { Pool } = require('pg');
const { createClient } = require('redis');

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Redis Connection
const redisClient = createClient({
    url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

// --- 2. Symbolic Extraction (The "Brain") ---
app.post('/analyze/:file', async (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, '../../src', fileName);
    const cacheKey = `analysis:${fileName}`;

    // 1. Check Cache
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(`Cache Hit for ${fileName}`);
            return res.json(JSON.parse(cached));
        }
    } catch (err) {
        console.error("Redis Error:", err);
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File ${fileName} not found.` });
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    try {
        // 2. Perform AI Analysis
        const analysis = await extractSymbolicConstraints(sourceCode);

        // 3. Save to DB (Knowledge Graph Persistence)
        // Ensure table exists (simple migration for MVP)
        await pool.query(`CREATE TABLE IF NOT EXISTS knowledge_graph (
            id SERIAL PRIMARY KEY,
            file_name TEXT, 
            analysis JSONB, 
            created_at TIMESTAMP DEFAULT NOW()
        )`);

        await pool.query('INSERT INTO knowledge_graph (file_name, analysis) VALUES ($1, $2)',
            [fileName, analysis]);

        // 4. Update Cache (TTL 1 hour)
        await redisClient.set(cacheKey, JSON.stringify(analysis), { EX: 3600 });

        res.json(analysis);
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', engine: 'GnuCOBOL + Node.js Bridge' });
});

app.listen(PORT, () => {
    console.log(`Knowledge Graph-AI/ML Cobol Modernizer running on port ${PORT}`);
});
