/**
 * Global Error Handler Middleware
 * Centralized error handling with proper logging and responses
 */

const logger = require('../lib/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
    let error = err;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        error = new ValidationError(err.message);
    } else if (err.name === 'UnauthorizedError') {
        error = new UnauthorizedError(err.message);
    } else if (!err.isOperational) {
        // Unknown/programming errors - don't leak details
        error = new AppError('Internal Server Error', 500, false);
    }

    const statusCode = error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log error
    if (statusCode >= 500) {
        logger.error({
            err: err,
            path: req.path,
            method: req.method,
            statusCode,
            user: req.user?.id
        }, 'Server error');
    } else {
        logger.warn({
            message: error.message,
            path: req.path,
            method: req.method,
            statusCode,
            user: req.user?.id
        }, 'Client error');
    }

    // Build error response
    const response = {
        error: error.message || 'Internal Server Error',
        statusCode
    };

    // Add stack trace in development
    if (!isProduction && err.stack) {
        response.stack = err.stack;
    }

    // Add request ID if available
    if (req.id) {
        response.requestId = req.id;
    }

    res.status(statusCode).json(response);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.asyncHandler = asyncHandler;
