/**
 * COBOL Execution & Analysis Routes
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const logger = require('../utils/logger');
const { authenticateEither } = require('../middleware/auth');
const {
    validateCobolExecution,
    validateFileAnalysis,
    validateProgramWhitelist
} = require('../middleware/validation');
const {
    generalLimiter,
    executionLimiter,
    aiAnalysisLimiter
} = require('../middleware/rateLimiting');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { extractSymbolicConstraints } = require('../ai_agent');
const { analyzeByType, detectFileType } = require('../analyzers');

// External dependencies (injected when mounting routes)
let pool, redisClient, redisConnected, openai;

/**
 * Initialize route dependencies
 */
function initCobolRoutes(dependencies) {
    pool = dependencies.pool;
    redisClient = dependencies.redisClient;
    redisConnected = dependencies.redisConnected;
    openai = dependencies.openai;
}

/**
 * Execute COBOL Program
 * POST /api/run/:program
 * 
 * Body: { AGE, INCOME, CREDIT_SCORE, DEBT, NAME? }
 * Auth: JWT or API Key required
 * Rate Limit: 50/15min
 */
router.post(
    '/run/:program',
    generalLimiter,
    executionLimiter,
    authenticateEither,
    validateProgramWhitelist,
    validateCobolExecution,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { program } = req.params;
        const inputs = req.body;

        logger.info({ program, inputs, user: req.user?.sub || 'api_key' }, 'Executing COBOL program');

        // Path to executable
        const execPath = path.join(__dirname, '../../../bin', program);

        if (!fs.existsSync(execPath)) {
            throw new AppError(
                `Program '${program}' not found. Please ensure COBOL source is compiled.`,
                404,
                { program, execPath }
            );
        }

        // Set up environment variables for COBOL program
        const env = { ...process.env, ...inputs };

        // Execute COBOL program
        const child = spawn(execPath, [], { env });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Wait for execution to complete
        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                const duration = Date.now() - startTime;

                if (code !== 0 && stderr) {
                    logger.error({ program, exitCode: code, stderr, duration }, 'COBOL execution failed');
                    reject(new AppError(
                        `COBOL program execution failed with exit code ${code}`,
                        500,
                        { exitCode: code, stderr: stderr.substring(0, 500) }
                    ));
                } else {
                    logger.logCobolExecution(program, inputs, { exitCode: code }, duration);
                    resolve();
                }
            });

            child.on('error', (err) => {
                logger.error({ program, error: err }, 'COBOL execution error');
                reject(new AppError('Failed to execute COBOL program', 500));
            });
        });

        const duration = Date.now() - startTime;

        // Parse output
        const result = {
            program,
            success: true,
            duration,
            stdout: stdout.trim(),
            metadata: {
                executed_at: new Date().toISOString(),
                user: req.user?.sub || 'api_key'
            }
        };

        res.json(result);
    })
);

/**
 * Analyze Mainframe Source Code (Ad-hoc, Multi-Language)
 * POST /api/analyze
 * 
 * Body: { program, code, fileType? }
 * Auth: Optional (public endpoint for demo)
 * Rate Limit: 10/hour (expensive AI calls)
 * 
 * Supported fileTypes: COBOL, JCL, DB2, VSAM, CICS, COPYBOOK
 */
router.post(
    '/analyze',
    generalLimiter,
    aiAnalysisLimiter,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { program, code, fileType: requestedFileType } = req.body;

        if (!program || !code) {
            throw new AppError('Missing required fields: program and code', 400);
        }

        // Auto-detect file type if not provided
        const fileType = requestedFileType || detectFileType(program);

        logger.info({ 
            program, 
            fileType, 
            codeLength: code.length 
        }, 'Multi-language analysis requested');

        try {
            // Use new multi-language analyzer
            const analysis = await analyzeByType(code, fileType, program, {
                openai,
                logger
            });

            // Add program metadata
            analysis.program = program;
            analysis.analyzed_at = new Date().toISOString();

            const duration = Date.now() - startTime;
            
            logger.info({ 
                program, 
                fileType,
                duration,
                cost: analysis.metadata?.cost_usd 
            }, `${fileType} analysis completed`);

            // Normalize schema and check dependencies
            const { normalizeSchema, checkDependencies, storeAnalysis } = require('../utils/dbMetrics');
            let normalizedAnalysis = normalizeSchema(analysis);
            normalizedAnalysis = checkDependencies(normalizedAnalysis, fileType);

            // Store in knowledge graph database
            try {
                const analysisId = await storeAnalysis(pool, program, fileType, normalizedAnalysis);
                logger.info({ program, id: analysisId, fileType }, 'Stored analysis in knowledge graph');
            } catch (err) {
                logger.error({ error: err.message, stack: err.stack, program }, 'Failed to store in knowledge graph');
            }

            res.json({
                success: true,
                ...normalizedAnalysis,
                duration
            });
        } catch (error) {
            logger.error({ 
                program, 
                fileType, 
                error: error.message 
            }, 'Analysis failed');
            
            throw new AppError(
                `${fileType} analysis failed: ${error.message}`,
                500,
                { program, fileType }
            );
        }
    })
);

/**
 * Analyze COBOL Source File with AI
 * POST /api/analyze/:file
 * 
 * Auth: JWT or API Key required
 * Rate Limit: 10/hour (expensive AI calls)
 */
router.post(
    '/analyze/:file',
    generalLimiter,
    aiAnalysisLimiter,
    authenticateEither,
    validateFileAnalysis,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { file } = req.params;
        const cacheKey = `analysis:${file}`;

        logger.info({ file, user: req.user?.sub || 'api_key' }, 'AI analysis requested');

        // Check cache first (if Redis is available)
        try {
            if (redisConnected) {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    const duration = Date.now() - startTime;
                    logger.logAiAnalysis(file, true, duration);
                    
                    // Return cached result
                    const cachedData = JSON.parse(cached);

                    return res.json({
                        ...cachedData,
                        cached: true,
                        duration
                    });
                }
            }
        } catch (err) {
            logger.warn({ error: err }, 'Redis cache check failed');
        }

        // Read COBOL file
        const filePath = path.join(__dirname, '../../../src/cobol', file);
        
        if (!fs.existsSync(filePath)) {
            throw new AppError(
                `File '${file}' not found in COBOL directory`,
                404,
                { file, filePath }
            );
        }

        const code = fs.readFileSync(filePath, 'utf-8');
        logger.info({ file, codeLength: code.length }, 'Read COBOL source');

        // Perform AI symbolic analysis
        const analysis = await extractSymbolicConstraints(code);
        analysis.file = file;
        analysis.analyzed_at = new Date().toISOString();
        analysis.ai_model = process.env.OPENAI_MODEL || 'gpt-4o';

        const duration = Date.now() - startTime;
        logger.logAiAnalysis(file, false, duration);

        // Normalize schema (backwards compatible)
        const { normalizeSchema, checkDependencies, storeAnalysis } = require('../utils/dbMetrics');
        let normalizedAnalysis = normalizeSchema(analysis);
        
        // Check dependencies and add warnings
        const fileType = file.endsWith('.cob') || file.endsWith('.cbl') ? 'COBOL' :
                        file.endsWith('.jcl') ? 'JCL' :
                        file.endsWith('.asm') ? 'ASSEMBLER' :
                        file.endsWith('.rpg') || file.endsWith('.rpgle') ? 'RPG' :
                        file.endsWith('.rexx') ? 'REXX' :
                        file.endsWith('.pli') ? 'PL/I' : 'UNKNOWN';
        
        normalizedAnalysis = checkDependencies(normalizedAnalysis, fileType);

        // Store in knowledge graph database (never overwrites - always inserts new row)
        try {
            const analysisId = await storeAnalysis(pool, file, fileType, normalizedAnalysis);
            logger.info({ file, id: analysisId, fileType }, 'Stored analysis in knowledge graph');
        } catch (err) {
            logger.error({ error: err.message, stack: err.stack, file }, 'Failed to store in knowledge graph');
        }

        // Cache result
        try {
            if (redisConnected) {
                await redisClient.setEx(cacheKey, 3600, JSON.stringify(normalizedAnalysis)); // 1 hour TTL
                logger.info({ file }, 'Cached analysis result');
            }
        } catch (err) {
            logger.warn({ error: err }, 'Redis caching failed');
        }

        res.json({
            ...normalizedAnalysis,
            duration,
            cached: false
        });
    })
);

module.exports = { router, initCobolRoutes };
