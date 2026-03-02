/**
 * Z3 Formal Verification Routes
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const activityLogger = require('../utils/activityLogger');
const { authenticateEither } = require('../middleware/auth');
const { generalLimiter, aiAnalysisLimiter } = require('../middleware/rateLimiting');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { verifyLoanDecision, verifyProgramAnalysis, verifyEquivalence } = require('../verifier/z3_verifier');
const { analyzeByType } = require('../analyzers');

// External dependencies
let openai;

/**
 * Initialize route dependencies
 */
function initZ3Routes(dependencies) {
    openai = dependencies.openai;
}

/**
 * Verify COBOL Program Analysis with Z3
 * POST /api/z3/verify
 * 
 * Performs formal verification of COBOL program analysis using Z3 theorem prover.
 * Can verify business logic, complexity metrics, data flows, and more.
 * 
 * Body: {
 *   code: string (COBOL source code) - Required if no analysis provided,
 *   analysis: object (Pre-computed analysis) - Optional, will analyze if not provided,
 *   verification_type: string (program|loan|equivalence) - Default: program,
 *   options: object (Verification options) - Optional
 * }
 * 
 * Auth: JWT or API Key required
 * Rate Limit: 20/15min
 */
router.post(
    '/verify',
    generalLimiter,
    aiAnalysisLimiter,
    authenticateEither,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { 
            code, 
            analysis: providedAnalysis, 
            verification_type = 'program',
            options = {}
        } = req.body;
        
        logger.info({ 
            verification_type,
            hasCode: !!code,
            hasAnalysis: !!providedAnalysis,
            user: req.user?.sub || 'api_key'
        }, 'Starting Z3 formal verification');
        
        activityLogger.log({
            action: 'z3_verify',
            verificationType: verification_type,
            user: req.user?.sub || 'api_key',
            ip: req.ip
        });
        
        try {
            let analysis = providedAnalysis;
            
            // If no analysis provided, analyze the code first
            if (!analysis && code) {
                logger.info('No analysis provided - analyzing COBOL code first...');
                analysis = await analyzeByType(code, 'COBOL', 'UNKNOWN', {
                    extractBusinessRules: true,
                    calculateMIPS: true,
                    calculateComplexity: true,
                    openai,
                    logger
                });
            }
            
            if (!analysis) {
                throw new AppError('Either "code" or "analysis" must be provided', 400);
            }
            
            let verificationResult;
            
            // Route to appropriate verification function
            switch (verification_type) {
                case 'program':
                    logger.info('Performing program analysis verification...');
                    verificationResult = await verifyProgramAnalysis(analysis, options);
                    break;
                    
                case 'loan':
                    logger.info('Performing loan decision verification...');
                    // For loan verification, we need specific data
                    const inputData = options.inputData || {
                        CREDIT_SCORE: 750,
                        INCOME: 75000,
                        LOAN_AMOUNT: 100000,
                        DEBT: 10000,
                        COLLATERAL: 0,
                        EMPLOYMENT_YEARS: 5,
                        BANKRUPTCIES: 0
                    };
                    
                    const cobolResult = options.cobolResult || { DECISION: 'APPROVED' };
                    const aiAnalysis = { rules: analysis.business_rules || [] };
                    
                    verificationResult = await verifyLoanDecision(cobolResult, aiAnalysis, inputData);
                    break;
                    
                case 'equivalence':
                    logger.info('Performing code equivalence verification...');
                    if (!options.translatedCode || !options.targetLang) {
                        throw new AppError('Equivalence verification requires "translatedCode" and "targetLang" in options', 400);
                    }
                    
                    verificationResult = await verifyEquivalence(
                        code || '',
                        options.translatedCode,
                        options.targetLang,
                        analysis.business_rules || []
                    );
                    break;
                    
                default:
                    throw new AppError(
                        `Invalid verification_type: ${verification_type}. Supported: program, loan, equivalence`,
                        400
                    );
            }
            
            const totalTime = Date.now() - startTime;
            
            logger.info({ 
                verification_type,
                verified: verificationResult.verified || verificationResult.proven,
                duration: verificationResult.duration || totalTime
            }, 'Z3 verification completed');
            
            res.json({
                success: true,
                verification_type,
                result: verificationResult,
                metadata: {
                    totalProcessingTimeMs: totalTime,
                    z3Version: '4.12.0',
                    analysisProvided: !!providedAnalysis
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error({ 
                error: error.message,
                verification_type
            }, 'Z3 verification failed');
            
            throw new AppError(`Z3 verification failed: ${error.message}`, 500, {
                verificationType: verification_type,
                originalError: error.message
            });
        }
    })
);

/**
 * Get Z3 Verifier Information
 * GET /api/z3/info
 * 
 * Returns information about available Z3 verification capabilities
 * Rate Limit: 100/15min
 */
router.get(
    '/info',
    generalLimiter,
    asyncHandler(async (req, res) => {
        res.json({
            success: true,
            z3: {
                version: '4.12.0',
                solver: 'SMT (Satisfiability Modulo Theories)',
                capabilities: [
                    'Integer arithmetic',
                    'Real arithmetic',
                    'Boolean logic',
                    'Bit-vectors',
                    'Arrays',
                    'Quantifiers'
                ]
            },
            verificationTypes: [
                {
                    id: 'program',
                    name: 'Program Analysis Verification',
                    description: 'Verify business logic, complexity, data flows, and MIPS estimations',
                    inputRequired: ['code OR analysis'],
                    outputSections: [
                        'Business Logic Verification',
                        'Complexity Analysis',
                        'Performance Estimation',
                        'Data Flow Analysis',
                        'Z3 Satisfiability Check'
                    ]
                },
                {
                    id: 'loan',
                    name: 'Loan Decision Verification',
                    description: 'Verify loan approval decision logic matches COBOL execution',
                    inputRequired: ['analysis', 'options.inputData', 'options.cobolResult'],
                    businessRules: [
                        'DTI Calculation',
                        'LTV Calculation',
                        'Credit Score Tiers',
                        'Income Requirements',
                        'Bankruptcy Rules',
                        'Manual Review Triggers'
                    ]
                },
                {
                    id: 'equivalence',
                    name: 'Code Translation Equivalence',
                    description: 'Verify translated code preserves business logic from original COBOL',
                    inputRequired: ['code', 'options.translatedCode', 'options.targetLang'],
                    supportedLanguages: ['python', 'java', 'javascript', 'typescript', 'csharp', 'go']
                }
            ],
            usage: {
                endpoint: 'POST /api/z3/verify',
                auth: 'JWT or API Key required',
                rateLimit: '20 requests per 15 minutes'
            },
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * Quick Health Check for Z3 Solver
 * GET /api/z3/health
 * 
 * Performs a simple Z3 satisfiability check to verify the solver is working
 * Rate Limit: 100/15min
 */
router.get(
    '/health',
    generalLimiter,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        
        try {
            // Perform a simple test verification
            const testAnalysis = {
                program_name: 'HealthCheck',
                business_rules: [
                    { type: 'conditional', rule: 'IF X > 0 THEN Y = X + 1' }
                ],
                complexity_metrics: {
                    cyclomatic_complexity: 5
                }
            };
            
            const result = await verifyProgramAnalysis(testAnalysis);
            const duration = Date.now() - startTime;
            
            res.json({
                success: true,
                z3Status: result.verified ? 'operational' : 'degraded',
                message: result.verified 
                    ? 'Z3 solver is fully operational'
                    : 'Z3 solver returned inconclusive results',
                testDuration: duration,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(503).json({
                success: false,
                z3Status: 'unavailable',
                message: 'Z3 solver is not responding',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    })
);

module.exports = { router, initZ3Routes };
