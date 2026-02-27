/**
 * Compliance Report Routes
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const activityLogger = require('../utils/activityLogger');
const { authenticateEither } = require('../middleware/auth');
const { generalLimiter, aiAnalysisLimiter } = require('../middleware/rateLimiting');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateComplianceReport } = require('../analyzers/compliance_report');
const { analyzeByType } = require('../analyzers');
const { verifyLoanDecision } = require('../verifier/z3_verifier');

/**
 * Generate Compliance Report
 * POST /api/reports/compliance/:type
 * 
 * Generate regulatory compliance report (SOX, Basel III, OCC, SEC, Banking)
 * 
 * Params: type - Report type (sox, basel, occ, sec, banking)
 * Body: {
 *   code: string (COBOL source code),
 *   includeVerification: boolean (optional, default true),
 *   format: string (optional, 'html' or 'pdf', default 'html')
 * }
 * 
 * Auth: JWT or API Key required
 * Rate Limit: 10/15min (heavy operation)
 */
router.post(
    '/compliance/:type',
    generalLimiter,
    aiAnalysisLimiter,
    authenticateEither,
    asyncHandler(async (req, res) => {
        const { type } = req.params;
        const { code, includeVerification = true, format = 'html' } = req.body;
        
        const validTypes = ['sox', 'basel', 'occ', 'sec', 'banking'];
        if (!validTypes.includes(type)) {
            throw new AppError(
                `Invalid report type: ${type}. Supported: ${validTypes.join(', ')}`,
                400
            );
        }
        
        if (!code) {
            throw new AppError('Missing required field: code', 400);
        }
        
        logger.info({ 
            type, 
            codeLength: code.length,
            includeVerification,
            user: req.user?.sub || 'api_key'
        }, 'Generating compliance report');
        
        activityLogger.log({
            action: 'generate_compliance_report',
            reportType: type,
            user: req.user?.sub || 'api_key',
            ip: req.ip
        });
        
        try {
            // Step 1: Analyze COBOL code
            logger.info('Analyzing COBOL code...');
            const analysisResults = await analyzeByType(code, 'cobol', {
                extractBusinessRules: true,
                calculateMIPS: true,
                calculateComplexity: true
            });
            
            // Step 2: Run Z3 verification (if requested)
            let verificationResults = null;
            if (includeVerification && analysisResults.business_rules && analysisResults.business_rules.length > 0) {
                logger.info('Running Z3 formal verification...');
                try {
                    // Create sample data for verification
                    const sampleData = {
                        CREDIT_SCORE: 750,
                        INCOME: 75000,
                        LOAN_AMOUNT: 100000,
                        DEBT: 10000
                    };
                    
                    const cobolResult = { DECISION: 'APPROVED' };
                    const aiAnalysis = { rules: analysisResults.business_rules };
                    
                    verificationResults = await verifyLoanDecision(cobolResult, aiAnalysis, sampleData);
                } catch (verifyError) {
                    logger.warn({ error: verifyError.message }, 'Verification failed - continuing with report');
                    verificationResults = {
                        proven: false,
                        error: verifyError.message
                    };
                }
            } else {
                verificationResults = {
                    proven: false,
                    message: 'Verification not requested or insufficient business rules'
                };
            }
            
            // Step 3: Generate compliance report
            logger.info({ type }, 'Generating report...');
            const report = await generateComplianceReport(
                type,
                analysisResults,
                verificationResults,
                { format }
            );
            
            logger.info({ 
                type,
                reportId: report.metadata.reportId,
                processingTime: report.report.processingTime
            }, 'Compliance report generated successfully');
            
            res.json({
                success: true,
                ...report,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error({ 
                error: error.message,
                type,
                codeLength: code.length
            }, 'Compliance report generation failed');
            
            throw new AppError(`Report generation failed: ${error.message}`, 500, {
                reportType: type,
                originalError: error.message
            });
        }
    })
);

/**
 * Get Available Report Types
 * GET /api/reports/types
 * 
 * Returns list of available compliance report types
 * Rate Limit: 100/15min
 */
router.get(
    '/types',
    generalLimiter,
    asyncHandler(async (req, res) => {
        const reportTypes = [
            {
                id: 'sox',
                name: 'SOX 404 - Internal Controls Assessment',
                description: 'Sarbanes-Oxley Act Section 404 compliance report',
                regulations: ['SOX 404', 'PCAOB AS 2201', 'SEC Rule 13a-15']
            },
            {
                id: 'basel',
                name: 'Basel III - Capital & Risk Management',
                description: 'Basel III regulatory capital and operational risk compliance',
                regulations: ['Basel III Framework', 'Operational Risk Management', 'Capital Requirements']
            },
            {
                id: 'occ',
                name: 'OCC - Federal Banking Examination',
                description: 'Office of the Comptroller of the Currency compliance report',
                regulations: ['12 CFR Part 30', 'OCC Bulletin 2021-3', '12 CFR Part 364']
            },
            {
                id: 'sec',
                name: 'SEC - Financial Reporting Controls',
                description: 'Securities and Exchange Commission compliance report',
                regulations: ['Exchange Act Rule 13a-15', 'SOX Section 302', 'SEC Release 33-8810']
            },
            {
                id: 'banking',
                name: 'General Banking Regulatory Compliance',
                description: 'Comprehensive banking system compliance assessment',
                regulations: ['Federal Reserve Regulation H', 'FDIC Part 364', 'FFIEC IT Handbook', 'GLBA']
            }
        ];
        
        res.json({
            success: true,
            count: reportTypes.length,
            reportTypes,
            timestamp: new Date().toISOString()
        });
    })
);

module.exports = router;
