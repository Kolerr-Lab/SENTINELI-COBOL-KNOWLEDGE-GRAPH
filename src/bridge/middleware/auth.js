/**
 * Sentineli - Authentication Middleware
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * JWT-based authentication for API endpoints
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-use-env-var';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Generate JWT token for authenticated users
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
        issuer: 'sentineli',
        audience: 'sentineli-api'
    });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'sentineli',
            audience: 'sentineli-api'
        });
    } catch (error) {
        logger.warn({ error: error.message }, 'Token verification failed');
        return null;
    }
}

/**
 * Express middleware for JWT authentication
 * Expects Authorization header: Bearer <token>
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        logger.warn({ ip: req.ip, path: req.path }, 'Authentication attempted without token');
        return res.status(401).json({
            error: 'Authentication required',
            message: 'No token provided. Please include Authorization header with Bearer token.'
        });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
        logger.warn({ ip: req.ip, path: req.path }, 'Authentication failed - invalid token');
        return res.status(403).json({
            error: 'Invalid token',
            message: 'The provided token is invalid or expired.'
        });
    }

    // Attach user info to request
    req.user = decoded;
    logger.debug({ userId: decoded.sub, path: req.path }, 'User authenticated');
    
    next();
}

/**
 * Express middleware for API key authentication (alternative to JWT)
 * Expects X-API-Key header
 */
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKeys = (process.env.API_KEYS || '').split(',').filter(k => k);

    if (!apiKey) {
        logger.warn({ ip: req.ip, path: req.path }, 'API key authentication attempted without key');
        return res.status(401).json({
            error: 'API key required',
            message: 'No API key provided. Please include X-API-Key header.'
        });
    }

    if (!validApiKeys.includes(apiKey)) {
        logger.warn({ ip: req.ip, path: req.path, apiKey: apiKey.substring(0, 8) + '...' }, 'Invalid API key');
        return res.status(403).json({
            error: 'Invalid API key',
            message: 'The provided API key is invalid.'
        });
    }

    // Attach API key info to request
    req.apiKey = apiKey;
    logger.debug({ path: req.path }, 'API key authenticated');
    
    next();
}

/**
 * Middleware that accepts either JWT or API key authentication
 */
function authenticateEither(req, res, next) {
    // Try JWT first
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
            logger.debug({ userId: decoded.sub, path: req.path }, 'User authenticated via JWT');
            return next();
        }
    }

    // Try API key
    const apiKey = req.headers['x-api-key'];
    const validApiKeys = (process.env.API_KEYS || '').split(',').filter(k => k);
    
    if (apiKey && validApiKeys.includes(apiKey)) {
        req.apiKey = apiKey;
        logger.debug({ path: req.path }, 'Authenticated via API key');
        return next();
    }

    // Neither worked
    logger.warn({ ip: req.ip, path: req.path }, 'Authentication failed - no valid credentials');
    return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide either a Bearer token or X-API-Key header.'
    });
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    authenticateApiKey,
    authenticateEither
};
