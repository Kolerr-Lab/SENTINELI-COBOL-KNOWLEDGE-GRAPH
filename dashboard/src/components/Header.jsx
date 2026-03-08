import React, { useState, useEffect } from 'react';

const Header = ({ connected, bridgeStatus, gatewayStatus }) => {
  const [metrics, setMetrics] = useState(null);
  const [providers, setProviders] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState(null);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/config/ai-provider');
      const data = await response.json();
      if (data.success) setProviders(data.providers);
    } catch (error) {
      console.error('Failed to fetch provider info:', error);
    }
  };

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

  useEffect(() => {
    fetchProviders();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchProviders();
      fetchMetrics();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleProvider = async () => {
    if (switching || !providers) return;
    const next = providers.active.provider === 'openai' ? 'ollama' : 'openai';
    setSwitching(true);
    setSwitchMsg(null);
    try {
      const res = await fetch('/api/config/ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: next })
      });
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers);
        setSwitchMsg({ ok: true, text: `Switched to ${next.toUpperCase()}` });
      } else {
        setSwitchMsg({ ok: false, text: data.message || 'Switch failed' });
      }
    } catch (e) {
      setSwitchMsg({ ok: false, text: 'Network error' });
    } finally {
      setSwitching(false);
      setTimeout(() => setSwitchMsg(null), 3000);
    }
  };

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

        {providers && (
          <div className="ai-toggle-wrap">
            <span className={`ai-toggle-label ${providers.active.provider === 'openai' ? 'ai-toggle-label--on' : ''}`}>OPENAI</span>
            <button
              className={`ai-toggle${providers.active.provider === 'ollama' ? ' ai-toggle--ollama' : ''}${switching ? ' ai-toggle--busy' : ''}`}
              onClick={handleToggleProvider}
              disabled={switching}
              aria-label={`Switch to ${providers.active.provider === 'openai' ? 'Ollama' : 'OpenAI'}`}
              title={`Active: ${providers.active.provider.toUpperCase()} (${providers.active.model}) — click to switch`}
            >
              <span className="ai-toggle-knob" />
            </button>
            <span className={`ai-toggle-label ${providers.active.provider === 'ollama' ? 'ai-toggle-label--on' : ''}`}>OLLAMA</span>
            {switchMsg && (
              <span className={`ai-toggle-msg ${switchMsg.ok ? 'ai-toggle-msg--ok' : 'ai-toggle-msg--err'}`}>
                {switchMsg.text}
              </span>
            )}
          </div>
        )}

        {metrics && (
          <>
            <div className="status-indicator" style={{ borderLeft: '1px solid var(--primary-green)', paddingLeft: '1rem' }}>
              <span className="status-dot active"></span>
              <span>LLM CALLS: {metrics.totalCalls || 0}</span>
            </div>
            
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>AVG TIME: {formatTime(metrics.averageProcessingTimeMs || 0)}</span>
            </div>
            
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>COST: ${(metrics.totalCostUSD || 0).toFixed(6)}</span>
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
