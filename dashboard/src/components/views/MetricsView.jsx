import React, { useState, useEffect } from 'react';

const MetricsView = ({ messages }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/system/status');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading) {
    return <div className="panel-header">⏳ Loading metrics...</div>;
  }

  return (
    <div>
      <div className="panel-header">═══ PERFORMANCE METRICS ═══</div>
      
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">SYSTEM UPTIME</div>
          <div className="metric-value" style={{ fontSize: '1.2rem' }}>
            {metrics ? formatUptime(metrics.uptime) : 'N/A'}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">MEMORY USAGE</div>
          <div className="metric-value" style={{ fontSize: '1.2rem' }}>
            {metrics ? formatBytes(metrics.memory.heapUsed) : 'N/A'}
          </div>
          <div className="metric-change">
            Total: {metrics ? formatBytes(metrics.memory.heapTotal) : 'N/A'}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">ACTIVE CONNECTIONS</div>
          <div className="metric-value">{metrics?.connections || 0}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">RSS MEMORY</div>
          <div className="metric-value" style={{ fontSize: '1.2rem' }}>
            {metrics ? formatBytes(metrics.memory.rss) : 'N/A'}
          </div>
        </div>
      </div>

      <div className="terminal" style={{ marginTop: '1rem', height: '300px' }}>
        <div className="panel-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
          ═══ DETAILED METRICS ═══
        </div>
        
        {metrics && (
          <pre style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(metrics, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--mainframe-dark)', borderLeft: '3px solid var(--success-green)' }}>
        <div style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>✓ SYSTEM HEALTH: OPTIMAL</div>
        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--modern-blue)' }}>
          All subsystems operational • Last updated: {metrics ? new Date(metrics.timestamp).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default MetricsView;
