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
            <>
              {result.metadata && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  border: '1px solid var(--primary-green)',
                  backgroundColor: 'rgba(0, 255, 0, 0.05)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary-green)' }}>
                    ⚡ Performance Metrics:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>⏱️ Processing Time: <strong>{result.metadata.duration_ms}ms</strong></div>
                    <div>💰 Cost: <strong>${result.metadata.cost_usd ? result.metadata.cost_usd.toFixed(6) : '0.000000'}</strong></div>
                    <div>📥 Input Tokens: <strong>{result.metadata.input_tokens || 0}</strong></div>
                    <div>📤 Output Tokens: <strong>{result.metadata.output_tokens || 0}</strong></div>
                    <div>📊 Total Tokens: <strong>{result.metadata.tokens_used || 0}</strong></div>
                    <div>🤖 Model: <strong>{result.metadata.model || 'N/A'}</strong></div>
                  </div>
                </div>
              )}
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzeView;
