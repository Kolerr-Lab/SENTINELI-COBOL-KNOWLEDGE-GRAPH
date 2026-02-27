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
            // Debug: Check pool connection
            logger.info('=== GRAPH: Attempting database query ===');
            logger.info({ poolExists: !!pool }, 'Pool status');
            
            const result = await pool.query(
                'SELECT file_name, analysis FROM knowledge_graph ORDER BY created_at DESC LIMIT 100'
            );
            
            logger.info({ rowCount: result.rows.length, firstFile: result.rows[0]?.file_name }, 'Database query results');
            
            if (result.rows.length > 0) {
                // Build graph from analyzed modules
                logger.info('Building nodes from database results');
                let successCount = 0;
                let failCount = 0;
                
                const nodes = result.rows.map((row, idx) => {
                    try {
                        // row.analysis is already parsed (JSONB column)
                        const analysis = row.analysis;
                        
                        // Check if analysis exists
                        if (!analysis) {
                            logger.warn({ file: row.file_name }, 'Analysis object is null/undefined');
                            failCount++;
                            return null;
                        }
                        
                        const fileType = row.file_name.endsWith('.cob') || row.file_name.endsWith('.cbl') ? 'COBOL' :
                                        row.file_name.endsWith('.jcl') ? 'JCL' :
                                        row.file_name.endsWith('.asm') ? 'ASSEMBLER' :
                                        row.file_name.endsWith('.rpg') || row.file_name.endsWith('.rpgle') ? 'RPG' :
                                        row.file_name.endsWith('.rexx') ? 'REXX' :
                                        row.file_name.endsWith('.pli') ? 'PL/I' : 'UNKNOWN';
                        
                        successCount++;
                        return {
                            id: idx,
                            label: row.file_name,
                            type: 'PROGRAM',
                            fileType: fileType,
                            complexity: analysis.complexity_metrics?.cyclomatic_complexity || 0,
                            metadata: {
                                analyzed_at: row.created_at,
                                logic_depth: analysis.complexity_metrics?.logic_depth || 0,
                                variable_count: analysis.complexity_metrics?.variable_count || 0,
                                decision_points: analysis.complexity_metrics?.decision_points || 0
                            }
                        };
                    } catch (parseError) {
                        logger.error({ file: row.file_name, error: parseError.message, stack: parseError.stack }, 'Failed to parse analysis for node');
                        failCount++;
                        return null; // Return null for failed nodes
                    }
                }).filter(node => node !== null); // Filter out failed nodes
                
                logger.info({ totalNodes: nodes.length, successCount, failCount }, 'Nodes built');
                
                // Generate edges from analysis dataflows (new format) or edges (old format - backwards compatible)
                const edges = [];
                result.rows.forEach((row, fromIdx) => {
                    // row.analysis is already parsed (JSONB column)
                    const analysis = row.analysis;
                    const propagator = analysis.propagator_network;
                    
                    // Check for dataflows (new format) or edges (old format)
                    const dataflows = propagator?.dataflows || propagator?.edges || [];
                    
                    // Build internal dataflow edges
                    dataflows.forEach((flow) => {
                        const source = flow.source || flow.from;
                        const target = flow.target || flow.to;
                        const operation = flow.operation || flow.type || 'DATAFLOW';
                        
                        if (source && target) {
                            edges.push({
                                from: fromIdx,
                                to: fromIdx, // Internal dataflow within same module
                                type: operation,
                                metadata: {
                                    internal: true,
                                    source,
                                    target
                                }
                            });
                        }
                    });
                    
                    // Build external dependency edges
                    const deps = analysis.dependencies || {};
                    
                    // CALL statements -> program dependencies
                    if (deps.called_programs && deps.called_programs.length > 0) {
                        deps.called_programs.forEach(calledProg => {
                            const toIdx = result.rows.findIndex(r => 
                                r.file_name.toUpperCase().includes(calledProg.toUpperCase())
                            );
                            if (toIdx >= 0 && toIdx !== fromIdx) {
                                edges.push({
                                    from: fromIdx,
                                    to: toIdx,
                                    type: 'CALLS',
                                    metadata: { program: calledProg }
                                });
                            }
                        });
                    }
                    
                    // Add edges for copybooks (if present in graph)
                    if (deps.copybooks && deps.copybooks.length > 0) {
                        deps.copybooks.forEach(copybook => {
                            const toIdx = result.rows.findIndex(r => 
                                r.file_name.toUpperCase().includes(copybook.toUpperCase())
                            );
                            if (toIdx >= 0 && toIdx !== fromIdx) {
                                edges.push({
                                    from: fromIdx,
                                    to: toIdx,
                                    type: 'INCLUDES',
                                    metadata: { copybook }
                                });
                            }
                        });
                    }
                });
                
                graphData = { nodes, edges };
                logger.info({ nodeCount: nodes.length, edgeCount: edges.length, demoData: false }, 'Graph data built from database');
            } else {
                // No data in database - use demo data
                logger.warn('No rows in database - using demo data');
                usedDemoData = true;
                graphData = generateDemoGraph();
            }
        } catch (err) {
            logger.error({ error: err.message, stack: err.stack }, 'DATABASE ERROR - falling back to demo graph');
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
 * Returns a sample banking system graph with multi-language support
 */
function generateDemoGraph() {
    const nodes = [
        { id: 0, label: 'BATCH001.jcl', type: 'JCL', fileType: 'JCL', complexity: 8 },
        { id: 1, label: 'credit_scoring.cob', type: 'COBOL_PROGRAM', fileType: 'COBOL', complexity: 15 },
        { id: 2, label: 'CUSTOMER.db2', type: 'DATABASE', fileType: 'DB2', complexity: 25 },
        { id: 3, label: 'account_management.cob', type: 'COBOL_PROGRAM', fileType: 'COBOL', complexity: 45 },
        { id: 4, label: 'ACCTFILE.vsam', type: 'VSAM_FILE', fileType: 'VSAM', complexity: 5 },
        { id: 5, label: 'transaction_processor.cob', type: 'COBOL_PROGRAM', fileType: 'COBOL', complexity: 67 },
        { id: 6, label: 'TXN001.cics', type: 'CICS_TRANSACTION', fileType: 'CICS', complexity: 38 },
        { id: 7, label: 'fraud_detection.cob', type: 'COBOL_PROGRAM', fileType: 'COBOL', complexity: 52 },
        { id: 8, label: 'CUSTOMER-RECORD.cpy', type: 'COPYBOOK', fileType: 'COPYBOOK', complexity: 3 },
        { id: 9, label: 'loan_approval.cob', type: 'COBOL_PROGRAM', fileType: 'COBOL', complexity: 38 },
        { id: 10, label: 'payment_processor.cob', type: 'COBOL_PROGRAM', fileType: 'COBOL', complexity: 41 }
    ];

    const edges = [
        // JCL orchestrates the batch process
        { from: 0, to: 1, type: 'EXECUTES' },
        { from: 0, to: 3, type: 'EXECUTES' },
        
        // COBOL programs query databases
        { from: 1, to: 2, type: 'QUERIES' },
        { from: 3, to: 2, type: 'QUERIES' },
        { from: 3, to: 4, type: 'READS' },
        
        // Program calls and dependencies
        { from: 3, to: 5, type: 'CALLS' },
        { from: 5, to: 7, type: 'CALLS' },
        
        // CICS transaction handling
        { from: 6, to: 5, type: 'INVOKES' },
        { from: 6, to: 9, type: 'INVOKES' },
        
        // Copybook usage
        { from: 1, to: 8, type: 'INCLUDES' },
        { from: 3, to: 8, type: 'INCLUDES' },
        { from: 9, to: 8, type: 'INCLUDES' },
        
        // Payment flow
        { from: 9, to: 10, type: 'CALLS' }
    ];

    return { nodes, edges };
}

module.exports = { router, initGraphRoutes };
