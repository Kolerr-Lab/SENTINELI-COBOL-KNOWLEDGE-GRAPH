import React, { useState } from 'react';

const AnalyzeView = ({ onAnalyze, messages }) => {
  const [program, setProgram] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, code })
      });
      
      const data = await response.json();
      setResult(data);
      onAnalyze(program, code);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="panel-header">═══ COBOL PROGRAM ANALYSIS ═══</div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">PROGRAM NAME:</label>
          <input
            type="text"
            className="form-input"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g., INVMAINT"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">COBOL SOURCE CODE:</label>
          <textarea
            className="form-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your COBOL code here..."
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '⏳ ANALYZING...' : '▶ RUN ANALYSIS'}
        </button>
      </form>

      {result && (
        <div className="terminal" style={{ marginTop: '1rem', height: 'auto', minHeight: '200px' }}>
          <div className="panel-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
            ═══ ANALYSIS RESULTS ═══
          </div>
          
          {result.error ? (
            <div style={{ color: 'var(--error-red)' }}>
              ERROR: {result.error}
            </div>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzeView;
