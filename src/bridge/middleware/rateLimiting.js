/**
 * Sentineli - Rate Limiting Middleware
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * Rate limiting configuration for different endpoints
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter - applies to all routes
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the 100 requests in 15 minutes limit. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn({ 
            ip: req.ip, 
            path: req.path 
        }, 'Rate limit exceeded - general limiter');
        
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Strict rate limiter for COBOL execution (resource-intensive)
 */
const executionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 COBOL executions per windowMs
    message: {
        error: 'Execution rate limit exceeded',
        message: 'You have exceeded the 50 COBOL executions in 15 minutes limit.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({ 
            ip: req.ip, 
            path: req.path,
            remaining: req.rateLimit.remaining 
        }, 'Rate limit exceeded - execution limiter');
        
        res.status(429).json({
            error: 'Execution rate limit exceeded',
            message: 'You have exceeded the COBOL execution rate limit. Please try again later.',
            limit: req.rateLimit.limit,
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    },
    // Skip rate limiting for authenticated users with valid tokens
    skip: (req) => {
        return req.user && req.user.premium === true;
    }
});

/**
 * Very strict rate limiter for AI analysis (expensive API calls)
 */
const aiAnalysisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 AI analyses per hour
    message: {
        error: 'AI analysis rate limit exceeded',
        message: 'You have exceeded the 10 AI analyses per hour limit.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({ 
            ip: req.ip, 
            path: req.path,
            user: req.user?.sub 
        }, 'Rate limit exceeded - AI analysis limiter');
        
        res.status(429).json({
            error: 'AI analysis rate limit exceeded',
            message: 'You have exceeded the AI analysis rate limit. Our AI features are resource-intensive. Please try again later.',
            limit: req.rateLimit.limit,
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    },
    // More generous limits for premium users
    skip: (req) => {
        return req.user && req.user.premium === true;
    }
});

/**
 * Moderate rate limiter for public endpoints
 */
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Higher limit for public endpoints
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.info({ ip: req.ip, path: req.path }, 'Public rate limit exceeded');
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please slow down your requests.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Create a custom rate limiter with specific options
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
function createCustomLimiter(options) {
    const defaults = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn({ ip: req.ip, path: req.path }, 'Custom rate limit exceeded');
            res.status(429).json({
                error: 'Rate limit exceeded',
                message: options.message || 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
            });
        }
    };

    return rateLimit({ ...defaults, ...options });
}

module.exports = {
    generalLimiter,
    executionLimiter,
    aiAnalysisLimiter,
    publicLimiter,
    createCustomLimiter
};
