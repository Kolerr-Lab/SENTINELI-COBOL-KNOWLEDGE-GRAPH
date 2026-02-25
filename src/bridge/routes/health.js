/**
 * Health and Metrics Routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { publicLimiter } = require('../middleware/rateLimiting');
const { getMetrics, resetMetrics } = require('../ai_agent');

/**
 * Health check endpoint
 * GET /health
 */
function createHealthRoute(pool, redisClient, redisConnected, NODE_ENV) {
    return asyncHandler(async (req, res) => {
        const health = {
            status: 'ok',
            service: 'sentineli',
            version: require('../../../package.json').version,
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            environment: NODE_ENV
        };

        // Check database
        try {
            await pool.query('SELECT 1');
            health.database = 'healthy';
        } catch (err) {
            health.database = 'unavailable';
        }

        // Check Redis cache
        try {
            if (redisConnected) {
                await redisClient.ping();
                health.cache = 'healthy';
            } else {
                health.cache = 'unavailable';
            }
        } catch (err) {
            health.cache = 'unavailable';
        }

        health.ai = process.env.OPENAI_API_KEY ? 'configured' : 'not_configured';

        res.status(200).json(health);
    });
}

/**
 * Metrics endpoint
 * GET /api/metrics
 */
router.get('/metrics', publicLimiter, asyncHandler(async (req, res) => {
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
            totalCyclomaticComplexity: metrics.totalCyclomaticComplexity,
            averageCyclomaticComplexity: metrics.averageCyclomaticComplexity
        },
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
}));

/**
 * Reset metrics
 * POST /api/metrics/reset
 */
router.post('/metrics/reset', publicLimiter, asyncHandler(async (req, res) => {
    resetMetrics();
    res.json({ success: true, message: 'Metrics reset successfully' });
}));

/**
 * System status endpoint
 * GET /api/system/status
 */
function createSystemStatusRoute() {
    return asyncHandler(async (req, res) => {
        const metrics = getMetrics();
        res.json({
            success: true,
            uptime: Math.floor(process.uptime()),
            system: {
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
                },
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version
            },
            metrics: {
                totalCalls: metrics.totalCalls,
                totalCostUSD: parseFloat(metrics.totalCostUSD.toFixed(6)),
                averageProcessingTimeMs: metrics.averageProcessingTimeMs
            },
            timestamp: new Date().toISOString()
        });
    });
}

module.exports = { router, createHealthRoute, createSystemStatusRoute };
