/**
 * Sentineli - Structured Logger
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * Pino-based structured logging
 */

const pino = require('pino');

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    
    // Pretty print in development
    transport: isDevelopment ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false
        }
    } : undefined,

    // Base fields to include in every log
    base: {
        app: 'sentineli',
        env: process.env.NODE_ENV || 'development',
        version: require('../../../package.json').version
    },

    // Serialize errors properly
    serializers: {
        error: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res
    },

    // Timestamp format
    timestamp: () => `,"time":"${new Date().toISOString()}"`
});

/**
 * Express middleware for request logging
 */
function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.sub
        };

        if (res.statusCode >= 500) {
            logger.error(logData, 'Request failed');
        } else if (res.statusCode >= 400) {
            logger.warn(logData, 'Request error');
        } else {
            logger.info(logData, 'Request completed');
        }
    });

    next();
}

/**
 * Log COBOL execution events
 */
function logCobolExecution(programName, inputs, result, duration) {
    logger.info({
        program: programName,
        inputs,
        exitCode: result.exitCode,
        duration,
        success: result.exitCode === 0
    }, 'COBOL program executed');
}

/**
 * Log AI analysis events
 */
function logAiAnalysis(fileName, cached, duration) {
    logger.info({
        file: fileName,
        cached,
        duration,
        cost: cached ? 0 : 'api_call'
    }, 'AI analysis completed');
}

/**
 * Log security events
 */
function logSecurityEvent(event, details) {
    logger.warn({
        event,
        ...details,
        severity: 'security'
    }, `Security event: ${event}`);
}

module.exports = logger;
module.exports.requestLogger = requestLogger;
module.exports.logCobolExecution = logCobolExecution;
module.exports.logAiAnalysis = logAiAnalysis;
module.exports.logSecurityEvent = logSecurityEvent;
