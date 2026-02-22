/**
 * Prometheus Metrics
 * Track API performance and system health
 */

const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

const cobolExecutionDuration = new client.Histogram({
    name: 'cobol_execution_duration_ms',
    help: 'Duration of COBOL program execution in ms',
    labelNames: ['program', 'status'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

const cobolAnalysisDuration = new client.Histogram({
    name: 'cobol_analysis_duration_ms',
    help: 'Duration of COBOL code analysis in ms',
    labelNames: ['file', 'cached'],
    buckets: [100, 500, 1000, 2000, 5000, 10000]
});

const activeConnections = new client.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
});

const cacheHitRate = new client.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(cobolExecutionDuration);
register.registerMetric(cobolAnalysisDuration);
register.registerMetric(activeConnections);
register.registerMetric(cacheHitRate);

/**
 * Initialize metrics collection
 */
function initMetrics() {
    // Already initialized above
    return register;
}

/**
 * Record a metric
 * @param {string} metricName - Name of the metric
 * @param {number} value - Value to record
 * @param {object} labels - Labels for the metric
 */
function recordMetric(metricName, value, labels = {}) {
    switch (metricName) {
        case 'http_request':
            httpRequestDuration.observe(labels, value);
            break;
        case 'cobol_execution':
            cobolExecutionDuration.observe(labels, value);
            break;
        case 'cobol_analysis':
            cobolAnalysisDuration.observe(labels, value);
            break;
        case 'cache_hit':
            cacheHitRate.inc(labels);
            break;
        default:
            console.warn(`Unknown metric: ${metricName}`);
    }
}

module.exports = {
    register,
    initMetrics,
    recordMetric,
    metrics: {
        httpRequestDuration,
        cobolExecutionDuration,
        cobolAnalysisDuration,
        activeConnections,
        cacheHitRate
    }
};
