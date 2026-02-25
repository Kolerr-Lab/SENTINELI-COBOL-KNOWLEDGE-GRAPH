import React, { useState, useEffect } from 'react';

const Header = ({ connected, bridgeStatus, gatewayStatus }) => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        if (data.success) {
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Fetch metrics immediately and then every 3 seconds
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status) => {
    if (status === 'UP') return 'active';
    if (status === 'DOWN') return 'error';
    return 'warning';
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  return (
    <header className="mainframe-header">
      <div className="header-title">
        ╔═══════════════════════════════════════════════════╗
        <br />
        ║  SENTINELI MAINFRAME CONTROL SYSTEM v1.0         ║
        <br />
        ╚═══════════════════════════════════════════════════╝
      </div>
      
      <div className="header-status">
        <div className="status-indicator">
          <span className={`status-dot ${connected ? 'active' : 'error'}`}></span>
          <span>WEBSOCKET: {connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${getStatusClass(bridgeStatus)}`}></span>
          <span>BRIDGE: {bridgeStatus}</span>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${getStatusClass(gatewayStatus)}`}></span>
          <span>GATEWAY: {gatewayStatus}</span>
        </div>

        {metrics && (
          <>
            <div className="status-indicator" style={{ borderLeft: '1px solid var(--primary-green)', paddingLeft: '1rem' }}>
              <span className="status-dot active"></span>
              <span>
                AI: {metrics.aiModel === 'gpt-4o' ? 'GPT-4o' : 
                     metrics.aiModel === 'gpt-4o-mini' ? 'GPT-4o-mini' :
                     metrics.aiModel?.includes('llama') ? 'Llama 3.3' :
                     metrics.aiModel || 'Unknown'} 
                ({metrics.aiProvider === 'openai' ? 'Cloud' : 'Local'})
              </span>
            </div>
            
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>LLM CALLS: {metrics.totalCalls}</span>
            </div>
            
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>AVG TIME: {formatTime(metrics.averageProcessingTimeMs)}</span>
            </div>
            
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>COST: ${metrics.totalCostUSD.toFixed(6)}</span>
            </div>

            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>AVG COMPLEXITY: {(metrics.averageCyclomaticComplexity || 0).toFixed(1)}</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
