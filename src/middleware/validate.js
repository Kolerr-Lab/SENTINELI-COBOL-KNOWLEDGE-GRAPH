/**
 * Request Validation Middleware
 * Uses Joi for schema validation
 */

const Joi = require('joi');
const logger = require('../lib/logger');

/**
 * Validation schemas
 */
const schemas = {
    cobolExecution: Joi.object({
        // Allow any alphanumeric keys for environment variables
        // But validate they don't contain dangerous characters
    }).pattern(
        Joi.string().regex(/^[A-Z_][A-Z0-9_]*$/i),
        Joi.alternatives().try(
            Joi.string().max(1000),
            Joi.number(),
            Joi.boolean()
        )
    ),

    cobolAnalysis: Joi.object({
        file: Joi.string().required()
    }).unknown(true),

    programParam: Joi.object({
        program: Joi.string()
            .alphanum()
            .min(1)
            .max(50)
            .required()
    })
};

/**
 * Generic validation middleware factory
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        const data = req[property];
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn({ errors, path: req.path }, 'Validation failed');

            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid request data',
                details: errors
            });
        }

        // Replace request data with validated value
        req[property] = value;
        next();
    };
}

/**
 * COBOL Execution validation
 */
function cobolExecution(req, res, next) {
    // Validate params
    const paramsValidation = schemas.programParam.validate(req.params);
    if (paramsValidation.error) {
        logger.warn({ error: paramsValidation.error.message }, 'Invalid program parameter');
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid program name'
        });
    }

    // Validate body
    const bodyValidation = schemas.cobolExecution.validate(req.body);
    if (bodyValidation.error) {
        logger.warn({ error: bodyValidation.error.message }, 'Invalid execution inputs');
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid input parameters',
            details: bodyValidation.error.details.map(d => d.message)
        });
    }

    req.params = paramsValidation.value;
    req.body = bodyValidation.value;
    next();
}

/**
 * COBOL Analysis validation
 */
function cobolAnalysis(req, res, next) {
    const { file } = req.params;

    // Validate file name (no path traversal, only .cob files)
    if (!file || !/^[a-zA-Z0-9_-]+\.cob$/.test(file)) {
        logger.warn({ file }, 'Invalid file name');
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid file name. Must be a .cob file with alphanumeric characters only.'
        });
    }

    next();
}

module.exports = {
    validate,
    cobolExecution,
    cobolAnalysis
};
