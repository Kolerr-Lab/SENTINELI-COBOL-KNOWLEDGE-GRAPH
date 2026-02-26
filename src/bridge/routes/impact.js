/**
 * Impact Analysis Routes
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const { generalLimiter } = require('../middleware/rateLimiting');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

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

module.exports = router;
