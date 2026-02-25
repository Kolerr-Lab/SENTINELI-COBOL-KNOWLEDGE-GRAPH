import React, { useState, useEffect } from 'react';

const MetricsView = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setError(null);
        const response = await fetch('/api/system/status');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if Bridge returned error state
        if (data.status === 'OFFLINE') {
          setError(data.message || 'Bridge backend is offline');
          setMetrics(null);
        } else {
          setMetrics(data);
          setError(null);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setError(`Failed to fetch metrics: ${error.message}`);
        setMetrics(null);
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
    return (
      <div>
        <div className="panel-header">═══ PERFORMANCE METRICS ═══</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <div>Loading performance metrics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="panel-header">═══ PERFORMANCE METRICS ═══</div>
        <div style={{ 
          padding: '2rem', 
          background: 'var(--mainframe-dark)', 
          borderLeft: '3px solid var(--error-red)',
          marginTop: '1rem'
        }}>
          <div style={{ color: 'var(--error-red)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ✗ ERROR
          </div>
          <div style={{ color: 'var(--mainframe-border)' }}>{error}</div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--modern-blue)' }}>
            💡 Make sure the Bridge backend is running on port 3000
          </div>
        </div>
      </div>
    );
  }

  // Extract memory values (handle both string and number formats)
  const getMemory = (memStr) => {
    if (typeof memStr === 'number') return memStr;
    return memStr || 'N/A';
  };

  const apiCalls = metrics?.metrics?.totalCalls || 0;
  const totalCost = metrics?.metrics?.totalCostUSD || 0;

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
            {metrics ? getMemory(metrics.system?.memory?.used) : 'N/A'}
          </div>
          <div className="metric-change">
            Total: {metrics ? getMemory(metrics.system?.memory?.total) : 'N/A'}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">API CALLS</div>
          <div className="metric-value">{apiCalls}</div>
          <div className="metric-change">Total Cost: ${totalCost.toFixed(4)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">RSS MEMORY</div>
          <div className="metric-value" style={{ fontSize: '1.2rem' }}>
            {metrics ? getMemory(metrics.system?.memory?.rss) : 'N/A'}
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
