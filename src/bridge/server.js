/**
 * Sentineli - Production Server
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * Neuro-Symbolic Mainframe Modernization Platform
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
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('redis');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import middleware and utilities
const logger = require('./utils/logger');
const { sanitize } = require('./middleware/validation');
const { publicLimiter } = require('./middleware/rateLimiting');
const {
    notFoundHandler,
    errorHandler,
    asyncHandler,
    handleUncaughtException,
    handleUnhandledRejection,
    setupGracefulShutdown
} = require('./middleware/errorHandler');
const { getMetrics, resetMetrics, getProviderInfo, openai } = require('./ai_agent');

// Import route modules
const { router: cobolRouter, initCobolRoutes } = require('./routes/cobol');
const impactRouter = require('./routes/impact');
const { router: graphRouter, initGraphRoutes } = require('./routes/graph');

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

    // Get AI provider information
    const providerInfo = getProviderInfo();
    health.ai = {
        status: providerInfo.status,
        provider: providerInfo.provider,
        model: providerInfo.model,
        endpoint: providerInfo.provider === 'ollama' ? providerInfo.endpoint : undefined
    };

    // Return 200 OK even if dependencies are unavailable (demo mode)
    res.status(200).json(health);
}));

/**
 * Metrics endpoint - Real-time LLM cost and performance tracking
 * GET /api/metrics
 */
app.get('/api/metrics', publicLimiter, asyncHandler(async (req, res) => {
    const metrics = getMetrics();
    const providerInfo = getProviderInfo();
    
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
            totalCyclomaticComplexity: metrics.totalCyclomaticComplexity,
            averageCyclomaticComplexity: metrics.averageCyclomaticComplexity,
            averageLogicDepth: metrics.averageLogicDepth,
            averageVariableCount: metrics.averageVariableCount,
            averageDecisionPoints: metrics.averageDecisionPoints,
            sessionStartTime: metrics.sessionStartTime,
            lastResetTime: metrics.lastResetTime,
            uptimeMinutes: metrics.uptimeMinutes,
            // AI Provider info
            aiProvider: providerInfo.provider,
            aiModel: providerInfo.model
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
        service: 'Sentineli - Neuro-Symbolic Mainframe Modernization Platform',
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
// MODULAR API ROUTES
// ============================================================================

// Initialize route dependencies
initCobolRoutes({ pool, redisClient, redisConnected, openai });
initGraphRoutes({ pool });

// Mount route modules
app.use('/api', cobolRouter);  // /api/run/:program, /api/analyze, /api/analyze/:file
app.use('/api', impactRouter);  // /api/impact
app.use('/api', graphRouter);   // /api/graph

// ============================================================================
// PROTECTED API ROUTES (Authentication required)
// ============================================================================

/**
 * System Status & Performance Metrics
 * GET /api/system/status
 * 
 * Returns: System health, performance metrics, resource usage
 * Auth: Optional (public endpoint)
 * Rate Limit: 100/minute
 */
app.get(
    '/api/system/status',
    publicLimiter,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();

        // Get system metrics
        const systemMetrics = {
            uptime: process.uptime(),
            memory: {
                total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB'
            },
            cpu: {
                user: process.cpuUsage().user / 1000000,
                system: process.cpuUsage().system / 1000000
            },
            environment: NODE_ENV,
            version: process.version,
            platform: process.platform
        };

        // Get database status
        let dbStatus = 'UNKNOWN';
        try {
            const result = await pool.query('SELECT NOW()');
            dbStatus = result.rows.length > 0 ? 'CONNECTED' : 'ERROR';
        } catch (err) {
            dbStatus = 'DISCONNECTED';
        }

        // Get Redis status
        const redisStatus = redisConnected ? 'CONNECTED' : 'DISCONNECTED';

        // Get AI agent metrics
        const aiMetrics = getMetrics();

        const duration = Date.now() - startTime;

        res.json({
            status: 'OPERATIONAL',
            timestamp: new Date().toISOString(),
            uptime: systemMetrics.uptime,
            system: systemMetrics,
            services: {
                database: dbStatus,
                redis: redisStatus,
                ai: process.env.OPENAI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED'
            },
            metrics: aiMetrics,
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
