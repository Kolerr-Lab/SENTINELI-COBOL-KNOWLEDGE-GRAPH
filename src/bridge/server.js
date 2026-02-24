/**
 * Sentineli - Production Server
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * Neuro-Symbolic COBOL Modernization Engine
 * 
 * Features:
 * - JWT & API Key Authentication
 * - Rate Limiting (tiered)
 * - Input Validation & Sanitization
 * - Security Headers (Helmet)
 * - Structured Logging (Pino)
 * - Error Handling
 * - Graceful Shutdown
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('redis');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import middleware and utilities
const logger = require('./utils/logger');
const { authenticateEither } = require('./middleware/auth');
const {
    validateCobolExecution,
    validateFileAnalysis,
    validateProgramWhitelist,
    sanitize
} = require('./middleware/validation');
const {
    generalLimiter,
    executionLimiter,
    aiAnalysisLimiter,
    publicLimiter
} = require('./middleware/rateLimiting');
const {
    AppError,
    notFoundHandler,
    errorHandler,
    asyncHandler,
    handleUncaughtException,
    handleUnhandledRejection,
    setupGracefulShutdown
} = require('./middleware/errorHandler');
const { extractSymbolicConstraints, getMetrics, resetMetrics } = require('./ai_agent');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3050;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Handle uncaught exceptions
handleUncaughtException();
handleUnhandledRejection();

logger.info(`Starting Sentineli in ${NODE_ENV} mode`);

// ============================================================================
// DATABASE & CACHE SETUP
// ============================================================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
    logger.error({ error: err }, 'Unexpected database pool error');
});

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger.warn('Redis connection failed - running without cache');
                return false; // Stop retrying
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

let redisConnected = false;

redisClient.on('error', (err) => {
    logger.warn({ error: err.message }, 'Redis unavailable - running without cache');
    redisConnected = false;
});
redisClient.on('connect', () => {
    logger.info('Redis connected');
    redisConnected = true;
});

// Connect to Redis (optional - server will work without it)
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        logger.warn('Redis not available - continuing without cache');
        redisConnected = false;
        logger.error({ error: err }, 'Failed to connect to Redis');
    }
})();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:']
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true
    }
}));

// CORS - Configure allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(logger.requestLogger);

// Sanitization (runs on all requests)
app.use(sanitize);

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', publicLimiter, asyncHandler(async (req, res) => {
    const health = {
        status: 'ok',
        service: 'sentineli',
        version: require('../../package.json').version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: NODE_ENV
    };

    // Check services (non-blocking for demo)
    try {
        await pool.query('SELECT 1');
        health.database = 'healthy';
    } catch (err) {
        health.database = 'unavailable';
        // Don't mark as degraded - server can run without DB for demo
    }

    try {
        if (redisConnected) {
            await redisClient.ping();
            health.cache = 'healthy';
        } else {
            health.cache = 'unavailable';
        }
    } catch (err) {
        health.cache = 'unavailable';
        // Don't mark as degraded - server can run without Redis
    }

    health.ai = process.env.OPENAI_API_KEY ? 'configured' : 'not_configured';

    // Return 200 OK even if dependencies are unavailable (demo mode)
    res.status(200).json(health);
}));

/**
 * Metrics endpoint - Real-time LLM cost and performance tracking
 * GET /api/metrics
 */
app.get('/api/metrics', publicLimiter, asyncHandler(async (req, res) => {
    const metrics = getMetrics();
    res.json({
        success: true,
        metrics: {
            totalCalls: metrics.totalCalls,
            totalProcessingTimeMs: metrics.totalProcessingTimeMs,
            averageProcessingTimeMs: metrics.averageProcessingTimeMs,
            totalInputTokens: metrics.totalInputTokens,
            totalOutputTokens: metrics.totalOutputTokens,
            totalTokens: metrics.totalInputTokens + metrics.totalOutputTokens,
            totalCostUSD: parseFloat(metrics.totalCostUSD.toFixed(6)),
            averageCostPerCall: metrics.averageCostPerCall,
            sessionStartTime: metrics.sessionStartTime,
            lastResetTime: metrics.lastResetTime,
            uptimeMinutes: metrics.uptimeMinutes
        }
    });
}));

/**
 * Reset metrics endpoint
 * POST /api/metrics/reset
 */
app.post('/api/metrics/reset', publicLimiter, asyncHandler(async (req, res) => {
    resetMetrics();
    res.json({
        success: true,
        message: 'Metrics reset successfully'
    });
}));

/**
 * API documentation
 */
app.get('/', publicLimiter, (req, res) => {
    res.json({
        service: 'Sentineli - Neuro-Symbolic COBOL Modernization Engine',
        version: require('../../package.json').version,
        author: 'Ricky Anh Nguyen (OrchesityAI & Kolerr Lab)',
        documentation: '/api/docs',
        endpoints: {
            health: 'GET /health',
            execution: 'POST /api/run/:program (requires auth)',
            analysis: 'POST /api/analyze/:file (requires auth)'
        },
        authentication: {
            jwt: 'Bearer token in Authorization header',
            apiKey: 'X-API-Key header'
        }
    });
});

// ============================================================================
// PROTECTED API ROUTES (Authentication required)
// ============================================================================

/**
 * Execute COBOL Program
 * POST /api/run/:program
 * 
 * Body: { AGE, INCOME, CREDIT_SCORE, DEBT, NAME? }
 * Auth: JWT or API Key required
 * Rate Limit: 50/15min
 */
app.post(
    '/api/run/:program',
    generalLimiter,
    executionLimiter,
    authenticateEither,
    validateProgramWhitelist,
    validateCobolExecution,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { program } = req.params;
        const inputs = req.body;

        logger.info({ program, inputs, user: req.user?.sub || 'api_key' }, 'Executing COBOL program');

        // Path to executable
        const execPath = path.join(__dirname, '../../bin', program);

        if (!fs.existsSync(execPath)) {
            throw new AppError(
                `Program '${program}' not found. Please ensure COBOL source is compiled.`,
                404,
                { program, execPath }
            );
        }

        // Set up environment variables for COBOL program
        const env = { ...process.env, ...inputs };

        // Execute COBOL program
        const child = spawn(execPath, [], { env });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Wait for execution to complete
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                const duration = Date.now() - startTime;

                if (code !== 0 && stderr) {
                    logger.error({ program, exitCode: code, stderr, duration }, 'COBOL execution failed');
                    reject(new AppError(
                        `COBOL program execution failed with exit code ${code}`,
                        500,
                        { exitCode: code, stderr: stderr.substring(0, 500) }
                    ));
                } else {
                    logger.logCobolExecution(program, inputs, { exitCode: code }, duration);
                    resolve();
                }
            });

            child.on('error', (err) => {
                logger.error({ program, error: err }, 'COBOL execution error');
                reject(new AppError('Failed to execute COBOL program', 500));
            });
        });

        const duration = Date.now() - startTime;

        // Parse output
        const result = {
            program,
            success: true,
            duration,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            timestamp: new Date().toISOString()
        };

        // Store execution in database for audit trail
        try {
            await pool.query(
                'INSERT INTO execution_log (program, inputs, result, duration, user_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                [program, JSON.stringify(inputs), stdout.trim(), duration, req.user?.sub || 'api_key']
            );
        } catch (err) {
            // Log but don't fail the request if audit logging fails
            logger.warn({ error: err }, 'Failed to log execution to database');
        }

        res.json(result);
    })
);

/**
 * Analyze COBOL Source Code (Ad-hoc)
 * POST /api/analyze
 * 
 * Body: { program, code }
 * Auth: Optional (public endpoint for demo)
 * Rate Limit: 10/hour (expensive AI calls)
 */
app.post(
    '/api/analyze',
    generalLimiter,
    aiAnalysisLimiter,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { program, code } = req.body;

        if (!program || !code) {
            throw new AppError('Missing required fields: program and code', 400);
        }

        logger.info({ program, codeLength: code.length }, 'Ad-hoc AI analysis requested');

        // Perform AI analysis on provided code
        const analysis = await extractSymbolicConstraints(code);
        analysis.program = program;
        analysis.analyzed_at = new Date().toISOString();

        const duration = Date.now() - startTime;
        logger.info({ program, duration }, 'Ad-hoc analysis completed');

        res.json({
            ...analysis,
            duration
        });
    })
);

/**
 * Analyze COBOL Source File with AI
 * POST /api/analyze/:file
 * 
 * Auth: JWT or API Key required
 * Rate Limit: 10/hour (expensive AI calls)
 */
app.post(
    '/api/analyze/:file',
    generalLimiter,
    aiAnalysisLimiter,
    authenticateEither,
    validateFileAnalysis,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { file } = req.params;
        const cacheKey = `analysis:${file}`;

        logger.info({ file, user: req.user?.sub || 'api_key' }, 'AI analysis requested');

        // Check cache first (if Redis is available)
        try {
            if (redisConnected) {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    const duration = Date.now() - startTime;
                    logger.logAiAnalysis(file, true, duration);
                    
                    return res.json({
                        ...JSON.parse(cached),
                        cached: true,
                        duration
                    });
                }
            }
        } catch (err) {
            logger.warn({ error: err }, 'Cache lookup failed');
        }

        // Read source file
        const filePath = path.join(__dirname, '../../src/cobol', file);
        
        if (!fs.existsSync(filePath)) {
            throw new AppError(`Source file '${file}' not found`, 404);
        }

        const sourceCode = fs.readFileSync(filePath, 'utf-8');

        // Perform AI analysis
        const analysis = await extractSymbolicConstraints(sourceCode);
        analysis.file = file;
        analysis.analyzed_at = new Date().toISOString();

        const duration = Date.now() - startTime;
        logger.logAiAnalysis(file, false, duration);

        // Store in database (knowledge graph persistence)
        try {
            await pool.query(
                `CREATE TABLE IF NOT EXISTS knowledge_graph (
                    id SERIAL PRIMARY KEY,
                    file_name TEXT,
                    analysis JSONB,
                    user_id TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )`
            );

            await pool.query(
                'INSERT INTO knowledge_graph (file_name, analysis, user_id) VALUES ($1, $2, $3)',
                [file, JSON.stringify(analysis), req.user?.sub || 'api_key']
            );
        } catch (err) {
            logger.error({ error: err }, 'Failed to persist analysis to database');
        }

        // Cache the result (TTL: 1 hour) if Redis is available
        try {
            if (redisConnected) {
                await redisClient.set(cacheKey, JSON.stringify(analysis), { EX: 3600 });
            }
        } catch (err) {
            logger.warn({ error: err }, 'Failed to cache analysis');
        }

        res.json({
            ...analysis,
            cached: false,
            duration
        });
    })
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
    logger.info(`Sentineli server listening on port ${PORT}`);
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Ready to process COBOL workloads`);
});

// Setup graceful shutdown
setupGracefulShutdown(server, async () => {
    logger.info('Closing database connections...');
    await pool.end();
    
    logger.info('Closing Redis connection...');
    await redisClient.quit();
});

module.exports = app; // Export for testing
