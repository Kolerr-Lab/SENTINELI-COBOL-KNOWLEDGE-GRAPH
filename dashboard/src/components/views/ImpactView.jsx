import React, { useState } from 'react';

const ImpactView = ({ onImpactAnalysis, messages }) => {
  const [field, setField] = useState('');
  const [newType, setNewType] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, newType })
      });
      
      const data = await response.json();
      setResult(data);
      onImpactAnalysis(field, newType);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="panel-header">═══ IMPACT ANALYSIS ═══</div>
      
      <div style={{ background: 'var(--mainframe-dark)', padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--warning-amber)' }}>
        <strong style={{ color: 'var(--warning-amber)' }}>⚠ WARNING:</strong> Impact analysis will trace all dependencies and affected systems.
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">FIELD/VARIABLE NAME:</label>
          <input
            type="text"
            className="form-input"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g., WS-ACCOUNT-BALANCE"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">NEW DATA TYPE:</label>
          <input
            type="text"
            className="form-input"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="e.g., PIC 9(15)V99"
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '⏳ ANALYZING IMPACT...' : '⚡ RUN IMPACT ANALYSIS'}
        </button>
      </form>

      {result && (
        <div className="terminal" style={{ marginTop: '1rem', height: 'auto', minHeight: '200px' }}>
          <div className="panel-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
            ═══ IMPACT REPORT ═══
          </div>
          
          {result.error ? (
            <div style={{ color: 'var(--error-red)' }}>
              ERROR: {result.error}
            </div>
          ) : (
            <div>
              <div className="terminal-line">
                <span className="terminal-prompt">AFFECTED PROGRAMS:</span>
                <span style={{ color: 'var(--warning-amber)', fontWeight: 'bold' }}>
                  {result.affectedPrograms || 'N/A'}
                </span>
              </div>
              <div className="terminal-line">
                <span className="terminal-prompt">RISK LEVEL:</span>
                <span style={{ color: result.risk === 'HIGH' ? 'var(--error-red)' : 'var(--success-green)' }}>
                  {result.risk || 'UNKNOWN'}
                </span>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginTop: '1rem' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImpactView;
