import React, { useState, useEffect } from 'react';

const LogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs?limit=50');
        const data = await response.json();
        
        if (data.success) {
          setLogs(data.logs);
          setError(null);
        } else {
          setError(data.message || 'Failed to fetch logs');
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        setError('Backend unavailable');
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchLogs();

    // Then fetch every 3 seconds
    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, []);

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'var(--mainframe-green)';
      case 'error':
        return 'var(--error-red)';
      case 'warning':
        return 'var(--warning-amber)';
      case 'info':
      default:
        return 'var(--modern-blue)';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div>
      <div className="panel-header">═══ SYSTEM LOGS ═══</div>
      
      {loading ? (
        <div className="terminal" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--modern-blue)' }}>Loading logs...</div>
        </div>
      ) : error ? (
        <div className="terminal" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--error-red)' }}>
            <div className="terminal-line">
              <span className="terminal-prompt">ERROR&gt;</span>
              <span className="terminal-output">{error}</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--warning-amber)' }}>
              Check Docker status: docker logs kg_ai_cobol_modernizer
            </div>
          </div>
        </div>
      ) : (
        <div className="terminal" style={{ height: '500px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--modern-blue)' }}>
              <div>No recent activity</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--mainframe-border)' }}>
                System logs will appear here as operations occur
              </div>
            </div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className="terminal-line" 
                style={{ 
                  marginBottom: '0.5rem',
                  borderLeft: `2px solid ${getLogColor(log.type)}`,
                  paddingLeft: '0.5rem'
                }}
              >
                <span style={{ color: 'var(--mainframe-border)', marginRight: '0.5rem' }}>
                  {formatTimestamp(log.timestamp)}
                </span>
                <span 
                  className="terminal-prompt" 
                  style={{ 
                    color: getLogColor(log.type),
                    marginRight: '0.25rem'
                  }}
                >
                  {getLogIcon(log.type)}
                </span>
                <span className="terminal-output" style={{ color: getLogColor(log.type) }}>
                  {log.message}
                </span>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    fontSize: '0.85rem', 
                    color: 'var(--mainframe-border)' 
                  }}>
                    {Object.entries(log.metadata)
                      .filter(([key]) => !['timestamp', 'admin'].includes(key))
                      .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
                      .join(' • ')}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LogsView;
