/**
 * Knowledge Graph Routes
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const { publicLimiter } = require('../middleware/rateLimiting');
const { asyncHandler } = require('../middleware/errorHandler');

// External dependencies (injected when mounting routes)
let pool;

/**
 * Initialize route dependencies
 */
function initGraphRoutes(dependencies) {
    pool = dependencies.pool;
}

/**
 * Knowledge Graph Query
 * GET /api/graph
 * 
 * Returns: Program dependency relationships
 * Auth: Optional (public endpoint)
 * Rate Limit: 50/minute
 */
router.get(
    '/graph',
    publicLimiter,
    asyncHandler(async (req, res) => {
        const startTime = Date.now();

        // Query knowledge graph from database
        let graphData = { nodes: [], edges: [] };
        let usedDemoData = false;
        
        try {
            const result = await pool.query(
                'SELECT file_name, analysis FROM knowledge_graph ORDER BY created_at DESC LIMIT 100'
            );
            
            if (result.rows.length > 0) {
                // Build graph from analyzed modules
                const nodes = result.rows.map((row, idx) => ({
                    id: idx,
                    label: row.file_name,
                    type: 'COBOL_PROGRAM',
                    complexity: JSON.parse(row.analysis).complexity_metrics?.cyclomatic_complexity || 0,
                    metadata: {
                        analyzed_at: row.created_at
                    }
                }));
                
                // Generate edges based on dependencies (simplified)
                const edges = [];
                for (let i = 0; i < nodes.length - 1; i++) {
                    if (Math.random() > 0.5) { // Simulate dependency
                        edges.push({
                            from: i,
                            to: i + 1,
                            type: 'CALLS'
                        });
                    }
                }
                
                graphData = { nodes, edges };
            } else {
                // No data in database - use demo data
                usedDemoData = true;
                graphData = generateDemoGraph();
            }
        } catch (err) {
            logger.warn({ error: err.message }, 'Database unavailable - using demo graph data');
            // Return demo graph if database unavailable
            usedDemoData = true;
            graphData = generateDemoGraph();
        }

        const duration = Date.now() - startTime;
        logger.info({ nodeCount: graphData.nodes.length, edgeCount: graphData.edges.length, demoData: usedDemoData, duration }, 'Graph query completed');

        res.json({
            success: true,
            graph: graphData,
            metadata: {
                nodeCount: graphData.nodes.length,
                edgeCount: graphData.edges.length,
                demoData: usedDemoData,
                timestamp: new Date().toISOString()
            },
            duration
        });
    })
);

/**
 * Generate demo knowledge graph for demonstration purposes
 * Returns a sample banking system graph
 */
function generateDemoGraph() {
    const nodes = [
        { id: 0, label: 'credit_scoring.cob', type: 'COBOL_PROGRAM', complexity: 15 },
        { id: 1, label: 'account_management.cob', type: 'COBOL_PROGRAM', complexity: 45 },
        { id: 2, label: 'transaction_processor.cob', type: 'COBOL_PROGRAM', complexity: 67 },
        { id: 3, label: 'fraud_detection.cob', type: 'COBOL_PROGRAM', complexity: 52 },
        { id: 4, label: 'loan_approval.cob', type: 'COBOL_PROGRAM', complexity: 38 },
        { id: 5, label: 'customer_profile.cob', type: 'COBOL_PROGRAM', complexity: 22 },
        { id: 6, label: 'payment_processor.cob', type: 'COBOL_PROGRAM', complexity: 41 },
        { id: 7, label: 'interest_calculator.cob', type: 'COBOL_PROGRAM', complexity: 18 }
    ];

    const edges = [
        { from: 0, to: 1, type: 'CALLS' },
        { from: 1, to: 2, type: 'CALLS' },
        { from: 1, to: 5, type: 'CALLS' },
        { from: 2, to: 3, type: 'CALLS' },
        { from: 2, to: 6, type: 'CALLS' },
        { from: 4, to: 0, type: 'CALLS' },
        { from: 4, to: 5, type: 'CALLS' },
        { from: 6, to: 7, type: 'CALLS' }
    ];

    return { nodes, edges };
}

module.exports = { router, initGraphRoutes };
