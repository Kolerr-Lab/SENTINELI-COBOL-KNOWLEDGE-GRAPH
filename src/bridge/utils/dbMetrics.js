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
        const result = await pool.query(`
            SELECT
                COUNT(*) as total_calls,
                COALESCE(SUM((analysis->'metadata'->>'duration_ms')::int), 0) as total_processing_time_ms,
                COALESCE(AVG((analysis->'metadata'->>'duration_ms')::int), 0) as average_processing_time_ms,
                COALESCE(SUM((analysis->'metadata'->>'tokens_used')::int), 0) as total_tokens,
                COALESCE(SUM((analysis->'metadata'->>'cost_usd')::numeric), 0) as total_cost_usd,
                COALESCE(AVG((analysis->'metadata'->>'cost_usd')::numeric), 0) as average_cost_per_call,
                COALESCE(SUM((analysis->'complexity_metrics'->>'cyclomatic_complexity')::int), 0) as total_cyclomatic_complexity,
                COALESCE(AVG((analysis->'complexity_metrics'->>'cyclomatic_complexity')::numeric), 0) as average_cyclomatic_complexity,
                COALESCE(AVG((analysis->'complexity_metrics'->>'logic_depth')::numeric), 0) as average_logic_depth,
                COALESCE(AVG((analysis->'complexity_metrics'->>'variable_count')::numeric), 0) as average_variable_count,
                COALESCE(AVG((analysis->'complexity_metrics'->>'decision_points')::numeric), 0) as average_decision_points,
                MIN(created_at) as first_analysis,
                MAX(created_at) as last_analysis
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
 * Store analysis result in database (never overwrites, always inserts)
 * @param {Pool} pool - PostgreSQL pool
 * @param {string} fileName - Name of analyzed file
 * @param {string} fileType - Type (COBOL, JCL, etc.)  
 * @param {Object} analysis - Full analysis result
 * @returns {Promise<number>} - ID of inserted row
 */
async function storeAnalysis(pool, fileName, fileType, analysis) {
    try {
        const complexity = analysis.complexity_metrics || {};
        const metadata = analysis.metadata || {};

        const result = await pool.query(
            `INSERT INTO knowledge_graph 
            (file_name, file_type, analysis, cyclomatic_complexity, logic_depth, 
             variable_count, decision_points, cost_usd, tokens_used, duration_ms, ai_model)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id`,
            [
                fileName,
                fileType,
                JSON.stringify(analysis),
                complexity.cyclomatic_complexity || 0,
                complexity.logic_depth || 0,
                complexity.variable_count || 0,
                complexity.decision_points || 0,
                metadata.cost_usd || 0,
                metadata.tokens_used || 0,
                metadata.duration_ms || 0,
                metadata.model || 'unknown'
            ]
        );

        return result.rows[0].id;
    } catch (error) {
        logger.error({ error: error.message, stack: error.stack }, '[dbMetrics] Error storing analysis');
        throw error;
    }
}

/**
 * Reset all metrics by truncating the knowledge_graph table
 * @param {Pool} pool - PostgreSQL pool
 */
async function resetAllMetrics(pool) {
    try {
        await pool.query('TRUNCATE knowledge_graph RESTART IDENTITY');
        return { success: true, message: 'All metrics and analyses cleared' };
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
 * @returns {Object} - Analysis with warnings added
 */
function checkDependencies(analysis, fileType) {
    const warnings = [];

    // Check for missing embedded SQL detection in COBOL files 
    if (fileType === 'COBOL') {
        const deps = analysis.dependencies || {};
        if (!deps.databases || deps.databases.length === 0) {
            warnings.push({
                type: 'MISSING_DB_DETECTION',
                message: 'Embedded SQL may not be detected - dependencies.databases is empty',
                severity: 'warning'
            });
        }
    }

    if (warnings.length > 0) {
        analysis.warnings = warnings;
    }

    return analysis;
}

module.exports = {
    getMetricsFromDB,
    storeAnalysis,
    resetAllMetrics,
    normalizeSchema,
    checkDependencies
};
