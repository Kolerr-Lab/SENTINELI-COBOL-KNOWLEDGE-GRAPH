/**
 * Sentineli - Error Handler Middleware
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * Centralized error handling
 */

const logger = require('../utils/logger');

/**
 * Custom error class with HTTP status code
 */
class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Distinguishes operational errors from programming errors
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle 404 - Resource not found
 */
function notFoundHandler(req, res, next) {
    const error = new AppError(
        `Cannot ${req.method} ${req.path}`,
        404,
        { method: req.method, path: req.path }
    );
    next(error);
}

/**
 * Global error handler - must be last middleware
 */
function errorHandler(err, req, res, next) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Default to 500 if no status code
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    logger.error({
        error: {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode
        },
        req: {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userId: req.user?.sub
        }
    }, 'Error occurred');

    // Prepare error response
    const errorResponse = {
        error: err.message || 'Internal server error',
        statusCode: err.statusCode
    };

    // Add details in development
    if (isDevelopment) {
        errorResponse.stack = err.stack;
        errorResponse.details = err.details;
    }

    // Add details for operational errors even in production
    if (err.isOperational && err.details) {
        errorResponse.details = err.details;
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        errorResponse.error = 'Validation failed';
        errorResponse.details = err.details;
        err.statusCode = 400;
    }

    if (err.name === 'UnauthorizedError') {
        errorResponse.error = 'Unauthorized access';
        err.statusCode = 401;
    }

    if (err.name === 'JsonWebTokenError') {
        errorResponse.error = 'Invalid token';
        err.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        errorResponse.error = 'Token expired';
        err.statusCode = 401;
    }

    // PostgreSQL errors
    if (err.code && err.code.startsWith('22')) { // Data exception
        errorResponse.error = 'Database data error';
        err.statusCode = 400;
    }

    if (err.code === '23505') { // Unique violation
        errorResponse.error = 'Duplicate entry';
        err.statusCode = 409;
    }

    // Don't leak internal errors in production
    if (!isDevelopment && err.statusCode === 500) {
        errorResponse.error = 'An unexpected error occurred';
        delete errorResponse.stack;
        delete errorResponse.details;
    }

    res.status(err.statusCode).json(errorResponse);
}

/**
 * Async error wrapper - catches promise rejections
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException() {
    process.on('uncaughtException', (err) => {
        logger.fatal({ error: err }, 'UNCAUGHT EXCEPTION! Shutting down...');
        process.exit(1);
    });
}

/**
 * Handle unhandled rejections
 */
function handleUnhandledRejection() {
    process.on('unhandledRejection', (err) => {
        logger.fatal({ error: err }, 'UNHANDLED REJECTION! Shutting down...');
        process.exit(1);
    });
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server, cleanup = async () => {}) {
    const shutdown = async (signal) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);

        // Stop accepting new connections
        server.close(async () => {
            logger.info('HTTP server closed');

            try {
                // Cleanup resources (database, redis, etc.)
                await cleanup();
                logger.info('Cleanup completed');
                process.exit(0);
            } catch (err) {
                logger.error({ error: err }, 'Error during cleanup');
                process.exit(1);
            }
        });

        // Force shutdown after timeout
        setTimeout(() => {
            logger.error('Forced shutdown due to timeout');
            process.exit(1);
        }, 30000); // 30 seconds
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
    AppError,
    notFoundHandler,
    errorHandler,
    asyncHandler,
    handleUncaughtException,
    handleUnhandledRejection,
    setupGracefulShutdown
};
