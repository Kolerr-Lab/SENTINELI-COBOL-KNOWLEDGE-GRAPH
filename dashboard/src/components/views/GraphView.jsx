import React from 'react';

const GraphView = ({ messages }) => {
  return (
    <div>
      <div className="panel-header">═══ KNOWLEDGE GRAPH VISUALIZATION ═══</div>
      
      <div style={{ background: 'var(--mainframe-dark)', padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--modern-blue)' }}>
        <strong style={{ color: 'var(--modern-blue)' }}>ℹ INFO:</strong> Interactive knowledge graph of COBOL program dependencies and relationships.
      </div>

      <div className="graph-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: '1rem',
          color: 'var(--mainframe-border)'
        }}>
          <div style={{ fontSize: '3rem' }}>🕸️</div>
          <div style={{ fontSize: '1.2rem' }}>KNOWLEDGE GRAPH</div>
          <div style={{ fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
            Real-time visualization of program dependencies, data flows, and system relationships.
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--modern-blue)' }}>
            Graph rendering requires analyzed programs. Run analysis first.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div className="panel-header" style={{ fontSize: '0.9rem' }}>GRAPH STATISTICS</div>
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">NODES</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>247</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">EDGES</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>589</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">CLUSTERS</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>12</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;
