import React, { useState, useEffect } from 'react';

const DashboardView = ({ messages }) => {
  const [metrics, setMetrics] = useState({
    totalPrograms: 127,
    analyzedToday: 15,
    activeConnections: 3,
    avgResponseTime: 145
  });

  return (
    <div>
      <div className="panel-header">═══ SYSTEM DASHBOARD ═══</div>
      
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">TOTAL PROGRAMS</div>
          <div className="metric-value">{metrics.totalPrograms}</div>
          <div className="metric-change positive">↑ 12% this week</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">ANALYZED TODAY</div>
          <div className="metric-value">{metrics.analyzedToday}</div>
          <div className="metric-change positive">↑ 8 from yesterday</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">ACTIVE CONNECTIONS</div>
          <div className="metric-value">{metrics.activeConnections}</div>
          <div className="metric-change">Real-time</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">AVG RESPONSE (ms)</div>
          <div className="metric-value">{metrics.avgResponseTime}</div>
          <div className="metric-change positive">↓ 23ms improved</div>
        </div>
      </div>

      <div className="terminal">
        <div className="panel-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
          ═══ SYSTEM CONSOLE ═══
        </div>
        
        {messages.slice(-10).map((msg, idx) => (
          <div key={idx} className="terminal-line">
            <span className="terminal-prompt">SYSTEM&gt;</span>
            <span className="terminal-output">
              [{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}] {msg.message || msg.type}
            </span>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="terminal-line">
            <span className="terminal-prompt">SYSTEM&gt;</span>
            <span className="terminal-output">Awaiting commands...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
