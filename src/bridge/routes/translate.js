/**
 * COBOL Translation Routes - AI-Powered Code Modernization
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const activityLogger = require('../utils/activityLogger');
const { authenticateEither } = require('../middleware/auth');
const { generalLimiter, aiAnalysisLimiter } = require('../middleware/rateLimiting');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { translateCode, translateBatch, getSupportedLanguages } = require('../analyzers/translator');
const { analyzeByType } = require('../analyzers');
const { verifyEquivalence } = require('../verifier/z3_verifier');

// External dependencies
let redisClient, redisConnected, openai;

/**
 * Initialize route dependencies
 */
function initTranslateRoutes(dependencies) {
    redisClient = dependencies.redisClient;
    redisConnected = dependencies.redisConnected;
    openai = dependencies.openai;
}

/**
 * Get Supported Translation Languages
 * GET /api/translate/languages
 * 
 * Returns list of supported target languages
 * Rate Limit: 100/15min
 */
router.get(
    '/languages',
    generalLimiter,
    asyncHandler(async (req, res) => {
        const languages = getSupportedLanguages();
        
        res.json({
            success: true,
            count: languages.length,
            languages,
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * Translate COBOL Code with Verification
 * POST /api/translate
 * 
 * Body: {
 *   code: string (COBOL source code),
 *   targetLang: string (python|java|javascript|typescript|csharp|go),
 *   verify: boolean (optional, default true - run Z3 verification),
 *   includeAnalysis: boolean (optional, default true - include COBOL analysis)
 * }
 * 
 * Auth: JWT or API Key required
 * Rate Limit: 20/15min (AI-heavy operation)
 */
router.post(
    '/',
    generalLimiter,
    aiAnalysisLimiter,
    authenticateEither,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { code, targetLang, verify = true, includeAnalysis = true } = req.body;
        
        // Validation
        if (!code || typeof code !== 'string') {
            throw new AppError('Missing or invalid "code" field in request body', 400);
        }
        
        if (!targetLang) {
            throw new AppError('Missing "targetLang" field. Supported: python, java, javascript, typescript, csharp, go', 400);
        }
        
        logger.info({ 
            targetLang, 
            codeLength: code.length,
            verify,
            user: req.user?.sub || 'api_key'
        }, 'Starting COBOL translation');
        
        // Log activity
        activityLogger.log({
            action: 'translate_cobol',
            targetLang,
            codeLength: code.length,
            user: req.user?.sub || 'api_key',
            ip: req.ip
        });
        
        try {
            let cobolAnalysis = null;
            let businessRules = null;
            
            // Step 1: Analyze COBOL code (extract business rules)
            if (includeAnalysis) {
                logger.info('Analyzing COBOL code...');
                cobolAnalysis = await analyzeByType(code, 'COBOL', 'UNKNOWN', {
                    extractBusinessRules: true,
                    calculateMIPS: true,
                    openai,
                    logger
                });
                businessRules = cobolAnalysis.business_rules;
            }
            
            // Step 2: Translate to target language
            logger.info({ targetLang }, 'Translating code...');
            const translation = await translateCode(code, targetLang, businessRules);
            
            // Step 3: Verify equivalence with Z3 (if requested)
            let verification = null;
            if (verify && businessRules && businessRules.length > 0) {
                logger.info('Running Z3 formal verification...');
                try {
                    verification = await verifyEquivalence(
                        code,
                        translation.translated.code,
                        targetLang,
                        businessRules
                    );
                } catch (verifyError) {
                    logger.warn({ error: verifyError.message }, 'Verification failed - non-blocking');
                    verification = {
                        success: false,
                        error: verifyError.message,
                        skipped: true
                    };
                }
            }
            
            const totalTime = Date.now() - startTime;
            
            // Build response
            const response = {
                success: true,
                translation: {
                    original: translation.original,
                    translated: translation.translated,
                    sideBySide: generateSideBySide(
                        translation.original.code,
                        translation.translated.code
                    )
                },
                verification: verification || {
                    requested: verify,
                    status: verify ? 'skipped' : 'not_requested',
                    reason: !verify ? 'Verification not requested' : 'Insufficient business rules'
                },
                analysis: includeAnalysis ? {
                    businessRules: businessRules,
                    mips: cobolAnalysis?.mips_estimation,
                    complexity: cobolAnalysis?.complexity_metrics
                } : null,
                metadata: {
                    ...translation.metadata,
                    totalProcessingTimeMs: totalTime,
                    verificationIncluded: !!verification?.success
                },
                timestamp: new Date().toISOString()
            };
            
            logger.info({ 
                targetLang,
                totalTime,
                verified: !!verification?.success,
                tokensUsed: translation.metadata.tokensUsed.total
            }, 'Translation completed successfully');
            
            res.json(response);
            
        } catch (error) {
            logger.error({ 
                error: error.message,
                targetLang,
                codeLength: code.length
            }, 'Translation failed');
            
            throw new AppError(`Translation failed: ${error.message}`, 500, {
                targetLang,
                originalError: error.message
            });
        }
    })
);

/**
 * Batch Translate Multiple Files
 * POST /api/translate/batch
 * 
 * Body: {
 *   files: Array<{ name: string, code: string, businessRules?: string[] }>,
 *   targetLang: string,
 *   verify: boolean (optional)
 * }
 * 
 * Auth: JWT or API Key required
 * Rate Limit: 5/15min (heavy operation)
 */
router.post(
    '/batch',
    generalLimiter,
    authenticateEither,
    asyncHandler(async (req, res) => {
        const { files, targetLang, verify = false } = req.body;
        
        if (!files || !Array.isArray(files) || files.length === 0) {
            throw new AppError('Missing or invalid "files" array in request body', 400);
        }
        
        if (files.length > 10) {
            throw new AppError('Maximum 10 files per batch request', 400);
        }
        
        logger.info({ 
            fileCount: files.length,
            targetLang,
            user: req.user?.sub || 'api_key'
        }, 'Starting batch translation');
        
        const result = await translateBatch(files, targetLang, { verify });
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * Generate side-by-side comparison view
 */
function generateSideBySide(originalCode, translatedCode) {
    const originalLines = originalCode.split('\n');
    const translatedLines = translatedCode.split('\n');
    
    const maxLines = Math.max(originalLines.length, translatedLines.length);
    const sideBySide = [];
    
    for (let i = 0; i < maxLines; i++) {
        sideBySide.push({
            lineNumber: i + 1,
            original: originalLines[i] || '',
            translated: translatedLines[i] || ''
        });
    }
    
    return sideBySide;
}

module.exports = { router, initTranslateRoutes };
