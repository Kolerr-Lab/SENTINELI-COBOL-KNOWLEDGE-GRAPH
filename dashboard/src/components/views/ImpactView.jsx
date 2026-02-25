import React, { useState } from 'react';
import FileUploader from '../FileUploader';

const ImpactView = ({ onImpactAnalysis, messages }) => {
  const [field, setField] = useState('');
  const [newType, setNewType] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadedModules, setLoadedModules] = useState([]);
  const [showUploader, setShowUploader] = useState(false);

  const handleFilesUploaded = (results) => {
    const successful = results.filter(r => r.success);
    setLoadedModules(prev => [...prev, ...successful]);
    setShowUploader(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, newType })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setResult({ error: data.error || data.message || `HTTP ${response.status}` });
      } else {
        setResult(data);
        onImpactAnalysis(field, newType);
      }
    } catch (error) {
      setResult({ error: `Network error: ${error.message}. Check if Bridge service is running.` });
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
      
      {showUploader ? (
        <>
          <FileUploader onFilesUploaded={handleFilesUploaded} />
          <button 
            onClick={() => setShowUploader(false)}
            className="submit-button"
            style={{ marginTop: '1rem', background: 'var(--mainframe-border)' }}
          >
            ✕ CLOSE UPLOADER
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={() => setShowUploader(true)}
            className="submit-button"
            style={{ marginBottom: '1rem' }}
          >
            📁 LOAD COBOL FILES FOR ANALYSIS
          </button>

          {loadedModules.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="panel-header" style={{ fontSize: '0.9rem' }}>
                LOADED MODULES ({loadedModules.length})
              </div>
              <div style={{ 
                background: 'var(--mainframe-dark)', 
                padding: '1rem',
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '0.85rem'
              }}>
                {loadedModules.map((module, idx) => (
                  <div key={idx} style={{ padding: '0.2rem 0', color: 'var(--success-green)' }}>
                    ✓ {module.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
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
                <span className="terminal-prompt">FIELD CHANGED:</span>
                <span style={{ color: 'var(--modern-blue)', fontWeight: 'bold' }}>
                  {result.field}
                </span>
              </div>
              <div className="terminal-line">
                <span className="terminal-prompt">NEW TYPE:</span>
                <span style={{ color: 'var(--modern-blue)' }}>
                  {result.newType}
                </span>
              </div>
              <div className="terminal-line">
                <span className="terminal-prompt">RISK LEVEL:</span>
                <span style={{ color: result.risk === 'HIGH' ? 'var(--error-red)' : result.risk === 'MEDIUM' ? 'var(--warning-amber)' : 'var(--success-green)', fontWeight: 'bold' }}>
                  {result.risk || 'UNKNOWN'}
                </span>
              </div>
              <div className="terminal-line">
                <span className="terminal-prompt">ESTIMATED EFFORT:</span>
                <span style={{ color: 'var(--mainframe-green)' }}>
                  {result.estimatedEffort?.hours || 'N/A'} hours ({result.estimatedEffort?.complexity || 'UNKNOWN'})
                </span>
              </div>
              
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--mainframe-border)', paddingTop: '0.5rem' }}>
                <div className="terminal-line">
                  <span className="terminal-prompt">AFFECTED PROGRAMS ({result.affectedPrograms?.length || 0}):</span>
                </div>
                {Array.isArray(result.affectedPrograms) && result.affectedPrograms.map((prog, idx) => (
                  <div key={idx} className="terminal-line" style={{ paddingLeft: '2rem' }}>
                    <span style={{ color: 'var(--warning-amber)' }}>• {prog}</span>
                  </div>
                ))}
              </div>

              {result.dependencies && result.dependencies.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--mainframe-border)', paddingTop: '0.5rem' }}>
                  <div className="terminal-line">
                    <span className="terminal-prompt">DEPENDENCIES ({result.dependencies.length}):</span>
                  </div>
                  {result.dependencies.map((dep, idx) => (
                    <div key={idx} style={{ paddingLeft: '2rem', marginBottom: '0.5rem' }}>
                      <div className="terminal-line">
                        <span style={{ color: 'var(--modern-blue)' }}>▸ {dep.program}</span>
                        <span style={{ color: 'var(--mainframe-border)', marginLeft: '1rem', fontSize: '0.85rem' }}>({dep.impact})</span>
                      </div>
                      <div style={{ paddingLeft: '1rem', fontSize: '0.85rem', color: 'var(--mainframe-border)' }}>
                        Section: {dep.section}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.testingRequired && result.testingRequired.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--mainframe-border)', paddingTop: '0.5rem' }}>
                  <div className="terminal-line">
                    <span className="terminal-prompt">TESTING REQUIRED ({result.testingRequired.length}):</span>
                  </div>
                  {result.testingRequired.map((test, idx) => (
                    <div key={idx} className="terminal-line" style={{ paddingLeft: '2rem' }}>
                      <span style={{ color: 'var(--success-green)' }}>✓ {test}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImpactView;
