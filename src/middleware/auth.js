/**
 * JWT Authentication Middleware
 * Validates JWT tokens for protected routes
 */

const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_ALGORITHM = 'HS256';

/**
 * Authentication middleware
 * Validates JWT token from Authorization header
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        logger.warn({ path: req.path }, 'Missing authorization header');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authorization header'
        });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        logger.warn({ path: req.path }, 'Invalid authorization format');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authorization format. Use: Bearer <token>'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
        
        // Attach user info to request
        req.user = {
            id: decoded.sub || decoded.userId,
            email: decoded.email,
            roles: decoded.roles || []
        };

        logger.debug({ userId: req.user.id, path: req.path }, 'User authenticated');
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logger.warn({ path: req.path }, 'Token expired');
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            logger.warn({ path: req.path, error: error.message }, 'Invalid token');
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        logger.error({ err: error, path: req.path }, 'Authentication error');
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
}

/**
 * Generate a JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 */
function generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        expiresIn
    });
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't reject if missing
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    try {
        const [scheme, token] = authHeader.split(' ');
        if (scheme === 'Bearer' && token) {
            const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
            req.user = {
                id: decoded.sub || decoded.userId,
                email: decoded.email,
                roles: decoded.roles || []
            };
        }
    } catch (error) {
        // Silently fail, user remains unauthenticated
        logger.debug({ error: error.message }, 'Optional auth failed');
    }

    next();
}

module.exports = authMiddleware;
module.exports.generateToken = generateToken;
module.exports.optionalAuth = optionalAuth;
