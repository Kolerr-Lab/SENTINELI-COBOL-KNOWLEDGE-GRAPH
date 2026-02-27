/**
 * Impact Analysis Routes
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const { generalLimiter } = require('../middleware/rateLimiting');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { calculateBlastRadius } = require('../analyzers/blast_radius');

/**
 * Impact Analysis Endpoint
 * POST /api/impact
 * 
 * Analyzes impact of changing a field across the codebase
 * 
 * Body: { field, newType, [module] }
 * Auth: Optional (public endpoint for demo)
 * Rate Limit: 20/hour
 */
router.post(
    '/impact',
    generalLimiter,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();
        const { field, newType, module, loadedModules } = req.body;

        if (!field || !newType) {
            throw new AppError('Missing required fields: field and newType', 400);
        }

        logger.info({ field, newType, module, loadedModulesCount: loadedModules?.length || 0 }, 'Impact analysis requested');

        // Convert loadedModules to array if it's an object (handle JSON parsing edge case)
        let modulesArray = [];
        if (loadedModules) {
            if (Array.isArray(loadedModules)) {
                modulesArray = loadedModules;
            } else if (typeof loadedModules === 'object') {
                // Convert object with numeric keys to array
                modulesArray = Object.values(loadedModules);
            }
        }

        // Determine affected programs from loaded modules or use defaults
        let affectedPrograms = ['ACCOUNT-MANAGEMENT', 'TRANSACTION-PROCESSOR', 'FRAUD-DETECTION'];
        
        if (modulesArray.length > 0) {
            // Use the loaded modules as the affected programs
            affectedPrograms = modulesArray.map(m => m.program || m.name);
            logger.info({ affectedPrograms, count: modulesArray.length }, 'Using uploaded modules for impact analysis');
        } else if (module) {
            affectedPrograms = [module];
        }

        // Calculate risk based on number of affected modules
        const moduleCount = affectedPrograms.length;
        const risk = moduleCount > 5 ? 'HIGH' : moduleCount > 2 ? 'MEDIUM' : 'LOW';
        const hours = Math.ceil(moduleCount * 2.5); // 2.5 hours per module

        // Simulate impact analysis (in production, this would query knowledge graph database)
        // This analyzes how changing a field affects downstream programs
        const impactAnalysis = {
            field,
            newType,
            affectedPrograms: affectedPrograms,
            affectedProgramsCount: affectedPrograms.length,
            risk: risk,
            estimatedEffort: {
                hours: hours,
                complexity: risk === 'HIGH' ? 'COMPLEX' : risk === 'MEDIUM' ? 'MODERATE' : 'SIMPLE'
            },
            dependencies: affectedPrograms.slice(0, 3).map((prog, idx) => ({
                program: prog,
                section: idx === 0 ? 'WORKING-STORAGE' : idx === 1 ? 'PROCEDURE DIVISION' : 'DATA VALIDATION',
                impact: idx === 0 ? 'DIRECT' : 'INDIRECT',
                changes: idx === 0 
                    ? [`Change ${field} from current to ${newType}`]
                    : idx === 1
                    ? ['Update calculations using this field']
                    : ['Validate new data type constraints']
            })),
            testingRequired: [
                'Unit tests for field validation',
                'Integration tests for dependent modules',
                'Regression tests for system workflows'
            ],
            timestamp: new Date().toISOString()
        };

        const duration = Date.now() - startTime;
        logger.info({ field, duration }, 'Impact analysis completed');

        res.json({
            success: true,
            ...impactAnalysis,
            duration
        });
    })
);

/**
 * Blast Radius Analysis Endpoint
 * GET /api/impact/blast-radius/:identifier
 * 
 * Analyzes the "blast radius" of changes to a specific function, variable, or data structure.
 * Shows all downstream dependencies, MIPS impact, cost implications, and risk assessment.
 * 
 * Params: identifier - Function name, variable, or data structure
 * Query: maxDepth (optional, default 5), includeCrossLanguage (optional, default true)
 * Auth: Optional (public endpoint for demo)
 * Rate Limit: 20/hour
 */
router.get(
    '/impact/blast-radius/:identifier',
    generalLimiter,
    asyncHandler(async (req, res) => {
        const { identifier } = req.params;
        const maxDepth = parseInt(req.query.maxDepth) || 5;
        const includeCrossLanguage = req.query.includeCrossLanguage !== 'false';
        
        if (!identifier) {
            throw new AppError('Missing required parameter: identifier', 400);
        }
        
        logger.info({ identifier, maxDepth, includeCrossLanguage }, 'Blast radius analysis requested');
        
        // For demo purposes, create a sample knowledge graph
        // In production, this would come from the actual database
        const sampleKnowledgeGraph = buildSampleKnowledgeGraph();
        
        // Calculate blast radius
        const result = calculateBlastRadius(identifier, sampleKnowledgeGraph, {
            maxDepth,
            includeCrossLanguage
        });
        
        if (!result.found) {
            return res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: result.message,
                availableIdentifiers: Object.keys(sampleKnowledgeGraph.nodes).slice(0, 20),
                timestamp: result.timestamp
            });
        }
        
        res.json({
            success: true,
            ...result
        });
    })
);

/**
 * Build sample knowledge graph for demonstration
 * In production, this would be fetched from PostgreSQL knowledge_graph table
 */
function buildSampleKnowledgeGraph() {
    return {
        nodes: {
            'CALCULATE-INTEREST': {
                name: 'CALCULATE-INTEREST',
                type: 'procedure',
                language: 'COBOL',
                mips: 850
            },
            'PROCESS-LOAN': {
                name: 'PROCESS-LOAN',
                type: 'procedure',
                language: 'COBOL',
                mips: 1200
            },
            'UPDATE-ACCOUNT': {
                name: 'UPDATE-ACCOUNT',
                type: 'procedure',
                language: 'COBOL',
                mips: 600
            },
            'LOAN-BATCH-JOB': {
                name: 'LOAN-BATCH-JOB',
                type: 'job',
                language: 'JCL',
                mips: 2500
            },
            'ACCOUNT-TABLE': {
                name: 'ACCOUNT-TABLE',
                type: 'database-table',
                language: 'DB2',
                mips: 450
            },
            'TRANSACTION-FILE': {
                name: 'TRANSACTION-FILE',
                type: 'file',
                language: 'VSAM',
                mips: 300
            },
            'CALCULATE-DTI': {
                name: 'CALCULATE-DTI',
                type: 'procedure',
                language: 'COBOL',
                mips: 400
            },
            'VALIDATE-INPUT': {
                name: 'VALIDATE-INPUT',
                type: 'procedure',
                language: 'COBOL',
                mips: 200
            },
            'FRAUD-CHECK': {
                name: 'FRAUD-CHECK',
                type: 'transaction',
                language: 'CICS',
                mips: 900
            },
            'CREDIT-SCORE-SERVICE': {
                name: 'CREDIT-SCORE-SERVICE',
                type: 'service',
                language: 'COBOL',
                mips: 1500
            },
            'RISK-ASSESSMENT': {
                name: 'RISK-ASSESSMENT',
                type: 'procedure',
                language: 'COBOL',
                mips: 1100
            },
            'APPROVAL-WORKFLOW': {
                name: 'APPROVAL-WORKFLOW',
                type: 'procedure',
                language: 'COBOL',
                mips: 750
            }
        },
        edges: [
            // CALCULATE-INTEREST dependencies
            { source: 'CALCULATE-INTEREST', target: 'PROCESS-LOAN', type: 'called-by' },
            { source: 'CALCULATE-INTEREST', target: 'LOAN-BATCH-JOB', type: 'called-by' },
            { source: 'CALCULATE-INTEREST', target: 'CALCULATE-DTI', type: 'calls' },
            
            // PROCESS-LOAN dependencies
            { source: 'PROCESS-LOAN', target: 'UPDATE-ACCOUNT', type: 'calls' },
            { source: 'PROCESS-LOAN', target: 'VALIDATE-INPUT', type: 'calls' },
            { source: 'PROCESS-LOAN', target: 'ACCOUNT-TABLE', type: 'reads' },
            { source: 'PROCESS-LOAN', target: 'RISK-ASSESSMENT', type: 'calls' },
            
            // UPDATE-ACCOUNT dependencies
            { source: 'UPDATE-ACCOUNT', target: 'ACCOUNT-TABLE', type: 'writes' },
            { source: 'UPDATE-ACCOUNT', target: 'TRANSACTION-FILE', type: 'writes' },
            
            // LOAN-BATCH-JOB dependencies
            { source: 'LOAN-BATCH-JOB', target: 'FRAUD-CHECK', type: 'calls' },
            { source: 'LOAN-BATCH-JOB', target: 'CREDIT-SCORE-SERVICE', type: 'calls' },
            
            // RISK-ASSESSMENT dependencies
            { source: 'RISK-ASSESSMENT', target: 'CREDIT-SCORE-SERVICE', type: 'calls' },
            { source: 'RISK-ASSESSMENT', target: 'APPROVAL-WORKFLOW', type: 'triggers' },
            
            // APPROVAL-WORKFLOW dependencies
            { source: 'APPROVAL-WORKFLOW', target: 'UPDATE-ACCOUNT', type: 'calls' },
            { source: 'APPROVAL-WORKFLOW', target: 'FRAUD-CHECK', type: 'calls' }
        ]
    };
}

module.exports = router;
