/**
 * Sentineli - Input Validation Middleware
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 * 
 * Joi-based input validation for API endpoints
 */

const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Schema for executing COBOL programs
 * Made flexible to support different COBOL programs with varying fields
 */
const executeCobolSchema = Joi.object({
    // Common fields
    NAME: Joi.string().max(100).optional(),
    AGE: Joi.string().pattern(/^\d{1,3}$/).optional(),
    INCOME: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1,10}$/),
        Joi.number()
    ).optional(),
    CREDIT_SCORE: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1,3}$/),
        Joi.number()
    ).optional(),
    DEBT: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1,10}$/),
        Joi.number()
    ).optional(),
    
    // Loan approval specific fields
    LOAN_AMOUNT: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1,10}$/),
        Joi.number()
    ).optional(),
    COLLATERAL: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1,10}$/),
        Joi.number()
    ).optional(),
    EMPLOYMENT_YEARS: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1,2}$/),
        Joi.number()
    ).optional(),
    BANKRUPTCIES: Joi.alternatives().try(
        Joi.string().pattern(/^\d{1}$/),
        Joi.number()
    ).optional()
}).unknown(true); // Allow unknown fields for flexibility

/**
 * Schema for analyzing COBOL source files
 */
const analyzeFileSchema = Joi.object({
    file: Joi.string().pattern(/^[a-zA-Z0-9_-]+\.cob$/).required()
        .messages({
            'string.pattern.base': 'File must be a .cob filename without path traversal',
            'any.required': 'File parameter is required'
        }),
    cacheStrategy: Joi.string().valid('use', 'bypass', 'refresh').optional(),
    options: Joi.object({
        includeMetrics: Joi.boolean().optional(),
        depth: Joi.string().valid('shallow', 'deep').optional()
    }).optional()
});

/**
 * Program whitelist - only these COBOL programs can be executed
 */
const ALLOWED_PROGRAMS = [
    'main',
    'calculator',
    'validator',
    'processor',
    'loan_approval'
];

/**
 * Validate program name against whitelist
 */
function validateProgramName(programName) {
    if (!ALLOWED_PROGRAMS.includes(programName)) {
        return {
            valid: false,
            error: `Program '${programName}' is not in the allowed list. Allowed: ${ALLOWED_PROGRAMS.join(', ')}`
        };
    }
    
    // Additional security: no path traversal
    if (programName.includes('/') || programName.includes('\\') || programName.includes('..')) {
        return {
            valid: false,
            error: 'Invalid program name - path traversal detected'
        };
    }
    
    return { valid: true };
}

/**
 * Express middleware factory for request validation
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - Where to get data from ('body', 'params', 'query')
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const data = req[source];
        
        const { error, value } = schema.validate(data, {
            abortEarly: false, // Get all errors, not just first
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn({ 
                ip: req.ip, 
                path: req.path, 
                errors 
            }, 'Validation failed');

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        // Replace request data with validated & sanitized data
        req[source] = value;
        next();
    };
}

/**
 * Middleware to validate COBOL execution requests
 */
const validateCobolExecution = validate(executeCobolSchema, 'body');

/**
 * Middleware to validate file analysis requests
 */
const validateFileAnalysis = (req, res, next) => {
    const fileName = req.params.file;
    
    const { error } = Joi.string()
        .pattern(/^[a-zA-Z0-9_-]+\.cob$/)
        .required()
        .validate(fileName);

    if (error) {
        logger.warn({ ip: req.ip, fileName }, 'Invalid file name');
        return res.status(400).json({
            error: 'Invalid file name',
            message: 'File must be a .cob filename without path traversal'
        });
    }

    next();
};

/**
 * Middleware to validate program name against whitelist
 */
const validateProgramWhitelist = (req, res, next) => {
    const programName = req.params.program;
    const result = validateProgramName(programName);

    if (!result.valid) {
        logger.warn({ 
            ip: req.ip, 
            programName,
            error: result.error 
        }, 'Unauthorized program access attempt');
        
        return res.status(403).json({
            error: 'Unauthorized program',
            message: result.error
        });
    }

    next();
};

/**
 * Generic sanitization middleware - removes potentially dangerous characters
 */
function sanitize(req, res, next) {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        // Remove control characters and potential injection attempts
        return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                  .replace(/[<>'"]/g, '')
                  .trim();
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
}

module.exports = {
    validate,
    validateCobolExecution,
    validateFileAnalysis,
    validateProgramWhitelist,
    validateProgramName,
    sanitize,
    schemas: {
        executeCobolSchema,
        analyzeFileSchema
    },
    ALLOWED_PROGRAMS
};
