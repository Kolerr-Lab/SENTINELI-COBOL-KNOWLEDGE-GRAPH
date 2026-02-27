/**
 * Blast Radius Analyzer - Change Impact Assessment
 * 
 * Analyzes the "blast radius" of changes to COBOL functions, variables, or data structures.
 * Shows what would break if you modify a given identifier.
 * 
 * Features:
 * - Recursive dependency tracking
 * - MIPS impact calculation
 * - Risk scoring based on dependency depth
 * - Cross-language dependency mapping
 * - Visual graph data for D3.js/vis.js
 * 
 * @license MIT
 * @author Kolerr Lab
 */

const logger = require('../utils/logger');

/**
 * Calculate blast radius for a given identifier
 * @param {string} identifier - Function name, variable, or data structure
 * @param {Object} knowledgeGraph - Full knowledge graph from database
 * @param {Object} options - Analysis options
 * @returns {Object} Blast radius analysis with graph data
 */
function calculateBlastRadius(identifier, knowledgeGraph, options = {}) {
    const startTime = Date.now();
    const maxDepth = options.maxDepth || 5;
    const includeCrossLanguage = options.includeCrossLanguage !== false;
    
    logger.info({ identifier, maxDepth }, 'Calculating blast radius');
    
    // Find the source node
    const sourceNode = findNode(identifier, knowledgeGraph);
    if (!sourceNode) {
        return {
            found: false,
            identifier,
            message: `Identifier '${identifier}' not found in knowledge graph`,
            timestamp: new Date().toISOString()
        };
    }
    
    // Track visited nodes to avoid cycles
    const visited = new Set();
    const impactedNodes = [];
    const edges = [];
    
    // Recursive dependency traversal
    function traverse(nodeId, depth = 0, path = []) {
        if (depth > maxDepth || visited.has(nodeId)) {
            return;
        }
        
        visited.add(nodeId);
        const node = knowledgeGraph.nodes[nodeId];
        
        if (!node) return;
        
        // Add to impacted nodes
        impactedNodes.push({
            id: nodeId,
            name: node.name,
            type: node.type,
            language: node.language || 'COBOL',
            depth: depth,
            path: [...path, nodeId],
            mips: node.mips || 0,
            riskScore: calculateRiskScore(node, depth)
        });
        
        // Find all outgoing dependencies
        const dependencies = findDependencies(nodeId, knowledgeGraph, includeCrossLanguage);
        
        for (const dep of dependencies) {
            // Add edge for visualization
            edges.push({
                source: nodeId,
                target: dep.targetId,
                type: dep.type,
                strength: 1.0 / (depth + 1) // Weaker connections at deeper levels
            });
            
            // Recurse
            traverse(dep.targetId, depth + 1, [...path, nodeId]);
        }
    }
    
    // Start traversal from source
    traverse(sourceNode.id);
    
    // Calculate aggregate metrics
    const totalMIPS = impactedNodes.reduce((sum, n) => sum + (n.mips || 0), 0);
    const totalCost = totalMIPS * 4; // $4/MIPS/month standard
    const maxDepthReached = Math.max(...impactedNodes.map(n => n.depth));
    const riskLevel = calculateOverallRisk(impactedNodes);
    
    // Group by language
    const byLanguage = {};
    for (const node of impactedNodes) {
        const lang = node.language || 'COBOL';
        if (!byLanguage[lang]) {
            byLanguage[lang] = { count: 0, mips: 0 };
        }
        byLanguage[lang].count++;
        byLanguage[lang].mips += node.mips || 0;
    }
    
    // Group by type
    const byType = {};
    for (const node of impactedNodes) {
        const type = node.type || 'unknown';
        if (!byType[type]) {
            byType[type] = { count: 0, mips: 0 };
        }
        byType[type].count++;
        byType[type].mips += node.mips || 0;
    }
    
    const duration = Date.now() - startTime;
    
    return {
        found: true,
        identifier,
        source: {
            id: sourceNode.id,
            name: sourceNode.name,
            type: sourceNode.type,
            language: sourceNode.language || 'COBOL'
        },
        impact: {
            totalNodes: impactedNodes.length,
            totalEdges: edges.length,
            maxDepth: maxDepthReached,
            riskLevel: riskLevel,
            riskScore: calculateNumericRisk(impactedNodes)
        },
        cost: {
            totalMIPS: totalMIPS,
            monthlyCostUSD: totalCost.toFixed(2),
            annualCostUSD: (totalCost * 12).toFixed(2),
            impactedMIPSPercentage: (totalMIPS / getTotalSystemMIPS(knowledgeGraph) * 100).toFixed(2)
        },
        breakdown: {
            byLanguage: byLanguage,
            byType: byType,
            byDepth: groupByDepth(impactedNodes)
        },
        graph: {
            nodes: buildGraphNodes(impactedNodes),
            edges: edges,
            layout: '3d-force-directed'
        },
        highRiskNodes: impactedNodes
            .filter(n => n.riskScore >= 7)
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 10),
        metadata: {
            processingTimeMs: duration,
            timestamp: new Date().toISOString(),
            maxDepth: maxDepth,
            includeCrossLanguage: includeCrossLanguage
        }
    };
}

/**
 * Find node by identifier
 */
function findNode(identifier, knowledgeGraph) {
    if (!knowledgeGraph || !knowledgeGraph.nodes) {
        return null;
    }
    
    // Try exact match first
    for (const [nodeId, node] of Object.entries(knowledgeGraph.nodes)) {
        if (node.name === identifier || nodeId === identifier) {
            return { ...node, id: nodeId };
        }
    }
    
    // Try case-insensitive match
    const lowerIdentifier = identifier.toLowerCase();
    for (const [nodeId, node] of Object.entries(knowledgeGraph.nodes)) {
        if (node.name.toLowerCase() === lowerIdentifier) {
            return { ...node, id: nodeId };
        }
    }
    
    return null;
}

/**
 * Find all dependencies of a node
 */
function findDependencies(nodeId, knowledgeGraph, includeCrossLanguage) {
    const dependencies = [];
    
    if (!knowledgeGraph.edges) {
        return dependencies;
    }
    
    for (const edge of knowledgeGraph.edges) {
        if (edge.source === nodeId) {
            const targetNode = knowledgeGraph.nodes[edge.target];
            
            // Check cross-language filter
            if (!includeCrossLanguage && targetNode) {
                const sourceNode = knowledgeGraph.nodes[nodeId];
                if (sourceNode.language !== targetNode.language) {
                    continue;
                }
            }
            
            dependencies.push({
                targetId: edge.target,
                type: edge.type || 'calls',
                strength: edge.strength || 1.0
            });
        }
    }
    
    return dependencies;
}

/**
 * Calculate risk score for a node
 */
function calculateRiskScore(node, depth) {
    let score = 5; // Base score
    
    // Type-based risk
    const highRiskTypes = ['procedure', 'function', 'database-operation', 'transaction'];
    if (highRiskTypes.includes(node.type)) {
        score += 2;
    }
    
    // MIPS-based risk (higher MIPS = critical component)
    if (node.mips > 1000) {
        score += 2;
    } else if (node.mips > 500) {
        score += 1;
    }
    
    // Depth penalty (deeper = less direct impact)
    score -= depth * 0.5;
    
    return Math.max(1, Math.min(10, score));
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(impactedNodes) {
    if (impactedNodes.length === 0) return 'NONE';
    
    const avgRisk = impactedNodes.reduce((sum, n) => sum + n.riskScore, 0) / impactedNodes.length;
    const count = impactedNodes.length;
    
    if (count > 50 || avgRisk >= 8) return 'CRITICAL';
    if (count > 20 || avgRisk >= 6) return 'HIGH';
    if (count > 10 || avgRisk >= 4) return 'MEDIUM';
    return 'LOW';
}

/**
 * Calculate numeric risk score
 */
function calculateNumericRisk(impactedNodes) {
    if (impactedNodes.length === 0) return 0;
    return (impactedNodes.reduce((sum, n) => sum + n.riskScore, 0) / impactedNodes.length).toFixed(2);
}

/**
 * Get total system MIPS
 */
function getTotalSystemMIPS(knowledgeGraph) {
    if (!knowledgeGraph || !knowledgeGraph.nodes) {
        return 10000; // Default estimate
    }
    
    return Object.values(knowledgeGraph.nodes)
        .reduce((sum, node) => sum + (node.mips || 0), 0) || 10000;
}

/**
 * Group nodes by depth
 */
function groupByDepth(impactedNodes) {
    const byDepth = {};
    
    for (const node of impactedNodes) {
        const depth = node.depth;
        if (!byDepth[depth]) {
            byDepth[depth] = { count: 0, mips: 0, nodes: [] };
        }
        byDepth[depth].count++;
        byDepth[depth].mips += node.mips || 0;
        byDepth[depth].nodes.push(node.name);
    }
    
    return byDepth;
}

/**
 * Build graph nodes for visualization
 */
function buildGraphNodes(impactedNodes) {
    return impactedNodes.map(node => ({
        id: node.id,
        label: node.name,
        type: node.type,
        language: node.language,
        depth: node.depth,
        mips: node.mips || 0,
        riskScore: node.riskScore,
        color: getNodeColor(node),
        size: getNodeSize(node),
        group: node.language || 'COBOL'
    }));
}

/**
 * Get node color based on language and risk
 */
function getNodeColor(node) {
    const languageColors = {
        'COBOL': '#0066cc',
        'JCL': '#00cc66',
        'DB2': '#cc00cc',
        'VSAM': '#cc6600',
        'CICS': '#00cccc',
        'COPYBOOK': '#cccc00'
    };
    
    const baseColor = languageColors[node.language] || '#666666';
    
    // Modify opacity/saturation based on risk
    if (node.riskScore >= 8) {
        return '#ff0000'; // High risk = red
    } else if (node.riskScore >= 6) {
        return '#ff9900'; // Medium risk = orange
    }
    
    return baseColor;
}

/**
 * Get node size based on MIPS
 */
function getNodeSize(node) {
    const mips = node.mips || 0;
    
    if (mips > 1000) return 30;
    if (mips > 500) return 20;
    if (mips > 100) return 15;
    return 10;
}

module.exports = {
    calculateBlastRadius
};
