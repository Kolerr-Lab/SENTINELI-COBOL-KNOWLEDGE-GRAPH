/**
 * Database Metrics Helper
 * Calculates real-time metrics from PostgreSQL database
 * Replaces in-memory metrics tracking
 */

const logger = require('./logger');

/**
 * Get metrics from database (replaces in-memory metrics)
 * @param {Pool} pool - PostgreSQL pool
 * @returns {Promise<Object>} - Calculated metrics from DB
 */
async function getMetricsFromDB(pool) {
    try {
        // Query both knowledge_graph (for aggregated data) and analysis_history (for total analyses)
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM analysis_history) as total_calls,
                COALESCE(SUM((latest_analysis->'metadata'->>'duration_ms')::int), 0) as total_processing_time_ms,
                COALESCE(AVG((latest_analysis->'metadata'->>'duration_ms')::int), 0) as average_processing_time_ms,
                COALESCE(SUM(latest_tokens_used), 0) as total_tokens,
                COALESCE(SUM(total_cost_usd), 0) as total_cost_usd,
                COALESCE(AVG(total_cost_usd / NULLIF(analysis_count, 0)), 0) as average_cost_per_call,
                COALESCE(SUM(cyclomatic_complexity), 0) as total_cyclomatic_complexity,
                COALESCE(AVG(cyclomatic_complexity), 0) as average_cyclomatic_complexity,
                COALESCE(AVG(logic_depth), 0) as average_logic_depth,
                COALESCE(AVG(variable_count), 0) as average_variable_count,
                COALESCE(AVG(decision_points), 0) as average_decision_points,
                MIN(first_analyzed_at) as first_analysis,
                MAX(last_analyzed_at) as last_analysis
            FROM knowledge_graph
        `);

        const row = result.rows[0];

        return {
            totalCalls: parseInt(row.total_calls) || 0,
            totalProcessingTimeMs: parseFloat(row.total_processing_time_ms) || 0,
            averageProcessingTimeMs: parseFloat(row.average_processing_time_ms) || 0,
            totalTokens: parseInt(row.total_tokens) || 0,
            totalCostUSD: parseFloat(row.total_cost_usd) || 0,
            averageCostPerCall: parseFloat(row.average_cost_per_call) || 0,
            totalCyclomaticComplexity: parseInt(row.total_cyclomatic_complexity) || 0,
            averageCyclomaticComplexity: parseFloat(row.average_cyclomatic_complexity) || 0,
            averageLogicDepth: parseFloat(row.average_logic_depth) || 0,
            averageVariableCount: parseFloat(row.average_variable_count) || 0,
            averageDecisionPoints: parseFloat(row.average_decision_points) || 0,
            firstAnalysis: row.first_analysis,
            lastAnalysis: row.last_analysis
        };
    } catch (error) {
        logger.error({ error: error.message, stack: error.stack }, 'Error calculating metrics from DB');
        // Return zero metrics on error
        return {
            totalCalls: 0,
            totalProcessingTimeMs: 0,
            averageProcessingTimeMs: 0,
            totalTokens: 0,
            totalCostUSD: 0,
            averageCostPerCall: 0,
            totalCyclomaticComplexity: 0,
            averageCyclomaticComplexity: 0,
            averageLogicDepth: 0,
            averageVariableCount: 0,
            averageDecisionPoints: 0,
            firstAnalysis: null,
            lastAnalysis: null
        };
    }
}

/**
 * Store analysis result in hybrid schema (knowledge_graph + analysis_history)
 * 
 * DESIGN: Hybrid Schema Pattern
 * 1. knowledge_graph: UPSERT - maintains current state (1 row per file)
 * 2. analysis_history: INSERT - preserves complete audit trail
 * 
 * Benefits:
 * - Fast graph queries (deduplicated automatically)
 * - Full audit trail for compliance and cost tracking
 * - No data loss, enterprise-grade
 * 
 * @param {Pool} pool - PostgreSQL pool
 * @param {string} fileName - Name of analyzed file
 * @param {string} fileType - Type (COBOL, JCL, etc.)  
 * @param {Object} analysis - Full analysis result
 * @returns {Promise<number>} - ID from knowledge_graph table
 */
async function storeAnalysis(pool, fileName, fileType, analysis) {
    const client = await pool.connect();
    
    try {
        const complexity = analysis.complexity_metrics || {};
        const metadata = analysis.metadata || {};
        const currentCost = metadata.cost_usd || 0;

        await client.query('BEGIN');

        // Step 1: Insert into analysis_history (audit trail - always inserts)
        await client.query(
            `INSERT INTO analysis_history 
            (file_name, file_type, analysis, cyclomatic_complexity, logic_depth, 
             variable_count, decision_points, cost_usd, tokens_used, duration_ms, ai_model)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                fileName,
                fileType,
                JSON.stringify(analysis),
                complexity.cyclomatic_complexity || 0,
                complexity.logic_depth || 0,
                complexity.variable_count || 0,
                complexity.decision_points || 0,
                currentCost,
                metadata.tokens_used || 0,
                metadata.duration_ms || 0,
                metadata.model || 'unknown'
            ]
        );

        // Step 2: UPSERT into knowledge_graph (current state)
        const result = await client.query(
            `INSERT INTO knowledge_graph 
            (file_name, file_type, latest_analysis, cyclomatic_complexity, logic_depth, 
             variable_count, decision_points, first_analyzed_at, last_analyzed_at, 
             analysis_count, total_cost_usd, latest_ai_model)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 1, $8, $9)
            ON CONFLICT (file_name) 
            DO UPDATE SET
                file_type = EXCLUDED.file_type,
                latest_analysis = EXCLUDED.latest_analysis,
                cyclomatic_complexity = EXCLUDED.cyclomatic_complexity,
                logic_depth = EXCLUDED.logic_depth,
                variable_count = EXCLUDED.variable_count,
                decision_points = EXCLUDED.decision_points,
                last_analyzed_at = NOW(),
                analysis_count = knowledge_graph.analysis_count + 1,
                total_cost_usd = knowledge_graph.total_cost_usd + EXCLUDED.total_cost_usd,
                latest_ai_model = EXCLUDED.latest_ai_model
            RETURNING id`,
            [
                fileName,
                fileType,
                JSON.stringify(analysis),
                complexity.cyclomatic_complexity || 0,
                complexity.logic_depth || 0,
                complexity.variable_count || 0,
                complexity.decision_points || 0,
                currentCost,
                metadata.model || 'unknown'
            ]
        );

        await client.query('COMMIT');
        return result.rows[0].id;
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({ error: error.message, stack: error.stack }, '[dbMetrics] Error storing analysis in hybrid schema');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Reset all metrics by truncating both knowledge_graph and analysis_history tables
 * @param {Pool} pool - PostgreSQL pool
 */
async function resetAllMetrics(pool) {
    try {
        await pool.query('TRUNCATE knowledge_graph, analysis_history RESTART IDENTITY');
        return { success: true, message: 'All metrics and analyses cleared from both tables' };
    } catch (error) {
        logger.error({ error: error.message, stack: error.stack }, 'Error resetting metrics');
        throw error;
    }
}

/**
 * Normalize schema - handle both old and new formats
 * - propagator_network.edges → propagator_network.dataflows (backwards compatible)
 * - decision_tree.branches[].children → decision_tree.branches[].branches
 * - business_rules (objects) → business_rules (strings)
 * @param {Object} analysis - Analysis result  
 * @returns {Object} - Normalized analysis
 */
function normalizeSchema(analysis) {
    const normalized = { ...analysis };

    // Handle propagator_network: edges → dataflows (backwards compatible)
    if (normalized.propagator_network) {
        // If old schema (edges), keep it but also add dataflows alias
        if (normalized.propagator_network.edges && !normalized.propagator_network.dataflows) {
            normalized.propagator_network.dataflows = normalized.propagator_network.edges;
        }
        // If new schema (dataflows), also keep edges for backwards compatibility
        if (normalized.propagator_network.dataflows && !normalized.propagator_network.edges) {
            normalized.propagator_network.edges = normalized.propagator_network.dataflows;
        }
    }

    // Handle decision_tree: children → branches (recursive)
    if (normalized.decision_tree && normalized.decision_tree.branches) {
        normalized.decision_tree.branches = normalizeBranches(normalized.decision_tree.branches);
    }

    // Handle business_rules: ensure array of strings
    if (normalized.business_rules) {
        if (Array.isArray(normalized.business_rules) && normalized.business_rules.length > 0) {
            if (typeof normalized.business_rules[0] === 'object') {
                // Convert objects to strings
                normalized.business_rules = normalized.business_rules.map(rule => 
                    rule.condition || rule.action || rule.rule_id || JSON.stringify(rule)
                );
            }
        }
    }

    return normalized;
}

/**
 * Recursively normalize branches (children → branches)
 */
function normalizeBranches(branches) {
    return branches.map(branch => {
        const normalized = { ...branch };
        
        // If old schema (children), rename to branches
        if (normalized.children && !normalized.branches) {
            normalized.branches = normalized.children;
            delete normalized.children;
        }
        
        // Recurse into nested branches
        if (normalized.branches && Array.isArray(normalized.branches)) {
            normalized.branches = normalizeBranches(normalized.branches);
        }
        
        return normalized;
    });
}

/**
 * Check dependencies and add warnings
 * @param {Object} analysis - Analysis result
 * @param {string} fileType - File type (COBOL, JCL, etc.)
 * @param {string} code - Source code (optional, for validation)
 * @returns {Object} - Analysis with warnings added
 */
function checkDependencies(analysis, fileType, code = '') {
    const warnings = [];

    // Check for missing embedded SQL detection in COBOL files 
    if (fileType === 'COBOL' && code) {
        // Only warn if code contains EXEC SQL but no databases detected
        const hasExecSQL = code.includes('EXEC SQL') || code.includes('EXEC-SQL');
        const deps = analysis.dependencies || {};
        
        if (hasExecSQL && (!deps.databases || deps.databases.length === 0)) {
            warnings.push({
                type: 'MISSING_DB_DETECTION',
                message: 'Embedded SQL found but no database tables detected - may need manual review',
                severity: 'warning'
            });
        }
    }

    if (warnings.length > 0) {
        analysis.warnings = warnings;
    }

    return analysis;
}

/**
 * Simplify analysis for clean visualization (Mermaid diagrams)
 * Removes verbose metadata while preserving core structure
 * 
 * @param {Object} analysis - Full analysis with rich metadata
 * @returns {Object} - Simplified analysis optimized for visualization
 */
function simplifyForVisualization(analysis) {
    const simplified = { ...analysis };

    // Simplify propagator_network: strip nodes array and detailed edge metadata
    if (simplified.propagator_network) {
        const pn = simplified.propagator_network;
        
        // Convert rich edges/dataflows to simple format
        const simpleFlows = [];
        const flows = pn.dataflows || pn.edges || [];
        
        flows.forEach(flow => {
            simpleFlows.push({
                source: flow.source || flow.from,
                target: flow.target || flow.to,
                operation: flow.operation || flow.effect || 'COMPUTE'
            });
        });
        
        simplified.propagator_network = {
            dataflows: simpleFlows,
            edges: simpleFlows // backwards compatible alias
        };
    }

    // Simplify decision_tree: keep structure but remove verbose descriptions
    if (simplified.decision_tree && simplified.decision_tree.branches) {
        simplified.decision_tree.branches = simplifyBranches(simplified.decision_tree.branches);
    }

    return simplified;
}

/**
 * Recursively simplify decision tree branches
 */
function simplifyBranches(branches) {
    return branches.map(branch => {
        const simple = {
            condition: branch.condition,
            action: branch.action || branch.result || ''
        };
        
        if (branch.branches && branch.branches.length > 0) {
            simple.branches = simplifyBranches(branch.branches);
        } else {
            simple.branches = [];
        }
        
        return simple;
    });
}

module.exports = {
    getMetricsFromDB,
    storeAnalysis,
    resetAllMetrics,
    normalizeSchema,
    checkDependencies,
    simplifyForVisualization
};
