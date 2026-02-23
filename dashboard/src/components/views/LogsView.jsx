import React, { useEffect, useState } from 'react';

const LogsView = ({ messages }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const logMessages = messages.filter(msg => 
      msg.type === 'log' || msg.type === 'status' || msg.type === 'error'
    );
    
    if (filter === 'ALL') {
      setLogs(logMessages);
    } else {
      setLogs(logMessages.filter(msg => msg.level === filter));
    }
  }, [messages, filter]);

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'var(--error-red)';
      case 'WARN': return 'var(--warning-amber)';
      case 'INFO': return 'var(--modern-blue)';
      default: return 'var(--mainframe-green)';
    }
  };

  return (
    <div>
      <div className="panel-header">═══ SYSTEM LOGS ═══</div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {['ALL', 'ERROR', 'WARN', 'INFO'].map((level) => (
          <button
            key={level}
            className="nav-button"
            style={{ 
              padding: '0.5rem 1rem',
              background: filter === level ? 'var(--mainframe-green)' : 'transparent'
            }}
            onClick={() => setFilter(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="terminal" style={{ height: '500px' }}>
        {logs.length === 0 ? (
          <div className="terminal-line">
            <span className="terminal-prompt">SYSTEM&gt;</span>
            <span className="terminal-output">No logs available...</span>
          </div>
        ) : (
          logs.slice().reverse().map((log, idx) => (
            <div key={idx} className="terminal-line">
              <span className="terminal-prompt" style={{ color: getLogColor(log.level) }}>
                [{log.level || 'INFO'}]
              </span>
              <span className="terminal-output">
                {new Date(log.timestamp || Date.now()).toLocaleString()} - {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--modern-blue)' }}>
        Showing {logs.length} log entries • Auto-refresh enabled
      </div>
    </div>
  );
};

export default LogsView;
