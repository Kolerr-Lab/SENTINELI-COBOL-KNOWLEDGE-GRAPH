import React from 'react';

const NavigationPanel = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', label: '📊 SYSTEM DASHBOARD', icon: '█' },
    { id: 'analyze', label: '🔍 COBOL ANALYSIS', icon: '█' },
    { id: 'impact', label: '⚡ IMPACT ANALYSIS', icon: '█' },
    { id: 'graph', label: '🕸️ KNOWLEDGE GRAPH', icon: '█' },
    { id: 'logs', label: '📜 SYSTEM LOGS', icon: '█' },
    { id: 'metrics', label: '📈 PERFORMANCE', icon: '█' }
  ];

  return (
    <div className="panel nav-panel">
      <div className="panel-header">═══ NAVIGATION ═══</div>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-button ${activeView === item.id ? 'active' : ''}`}
          onClick={() => setActiveView(item.id)}
        >
          {item.icon} {item.label}
        </button>
      ))}
      
      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--mainframe-border)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--modern-blue)' }}>
          <div>SYSTEM TIME:</div>
          <div style={{ color: 'var(--mainframe-green)', fontWeight: '600' }}>
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;
