import React, { useState, useEffect } from 'react';

const FILE_TYPES = [
  { value: 'COBOL', label: 'COBOL', extensions: ['.cbl', '.cob', '.cobol'], color: '#00ff00' },
  { value: 'JCL', label: 'JCL (Job Control Language)', extensions: ['.jcl'], color: '#00ffff' },
  { value: 'DB2', label: 'DB2 (SQL + Embedded)', extensions: ['.db2', '.sql'], color: '#ffff00' },
  { value: 'VSAM', label: 'VSAM', extensions: ['.vsam'], color: '#ff00ff' },
  { value: 'CICS', label: 'CICS', extensions: ['.cics'], color: '#ff8800' },
  { value: 'COPYBOOK', label: 'Copybook', extensions: ['.cpy', '.copy'], color: '#00ff88' }
];

const AnalyzeView = ({ analyzeState, setAnalyzeState }) => {
  // Destructure state for easier access
  const { program, code, fileType, result, loading } = analyzeState;
  
  // Helper to update state
  const updateState = (updates) => {
    setAnalyzeState(prev => ({ ...prev, ...updates }));
  };

  // Auto-detect file type based on program name/extension
  useEffect(() => {
    if (program) {
      const lowerProgram = program.toLowerCase();
      for (const type of FILE_TYPES) {
        if (type.extensions.some(ext => lowerProgram.endsWith(ext))) {
          updateState({ fileType: type.value });
          break;
        }
      }
    }
  }, [program]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateState({ loading: true, result: null });
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, code, fileType })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        updateState({ result: { error: data.error || data.message || `HTTP ${response.status}` }, loading: false });
      } else {
        updateState({ result: data, loading: false });
      }
    } catch (error) {
      updateState({ 
        result: { error: `Network error: ${error.message}. Check if Bridge service is running.` },
        loading: false 
      });
    }
  };

  const selectedType = FILE_TYPES.find(t => t.value === fileType);

  return (
    <div>
      <div className="panel-header">═══ MAINFRAME SOURCE ANALYSIS ═══</div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">PROGRAM NAME:</label>
          <input
            type="text"
            className="form-input"
            value={program}
            onChange={(e) => updateState({ program: e.target.value })}
            placeholder="e.g., INVMAINT.cbl or JOB001.jcl"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">FILE TYPE:</label>
          <select
            className="form-input"
            value={fileType}
            onChange={(e) => updateState({ fileType: e.target.value })}
            style={{ 
              color: selectedType?.color || 'var(--primary-green)',
              fontWeight: 'bold'
            }}
          >
            {FILE_TYPES.map(type => (
              <option 
                key={type.value} 
                value={type.value}
                style={{ 
                  backgroundColor: '#000',
                  color: type.color 
                }}
              >
                {type.label}
              </option>
            ))}
          </select>
          <div style={{ 
            fontSize: '0.75rem', 
            marginTop: '0.25rem', 
            color: 'var(--scanline-color)',
            fontStyle: 'italic'
          }}>
            Auto-detected from extension: {selectedType?.extensions.join(', ')}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">SOURCE CODE ({fileType}):</label>
          <textarea
            className="form-textarea"
            value={code}
            onChange={(e) => updateState({ code: e.target.value })}
            placeholder={`Paste your ${fileType} source code here...`}
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
                    <div style={{ color: selectedType?.color }}>
                      📝 File Type: <strong>{result.fileType || fileType}</strong>
                    </div>
                    <div>⏱️ Processing Time: <strong>{result.metadata.duration_ms}ms</strong></div>
                    <div>💰 Cost: <strong>${result.metadata.cost_usd ? result.metadata.cost_usd.toFixed(6) : '0.000000'}</strong></div>
                    <div>📥 Input Tokens: <strong>{result.metadata.input_tokens || 0}</strong></div>
                    <div>📤 Output Tokens: <strong>{result.metadata.output_tokens || 0}</strong></div>
                    <div>📊 Total Tokens: <strong>{result.metadata.tokens_used || 0}</strong></div>
                    <div>🤖 Model: <strong>{result.metadata.model || 'N/A'}</strong></div>
                    {result.complexity_metrics && (
                      <div>🔢 Cyclomatic Complexity: <strong>{result.complexity_metrics.cyclomatic_complexity || 0}</strong></div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings Section */}
              {result.warnings && result.warnings.length > 0 && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  border: '1px solid var(--warning-amber)',
                  backgroundColor: 'rgba(255, 170, 0, 0.1)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--warning-amber)' }}>
                    ⚠️ Warnings:
                  </div>
                  {result.warnings.map((warning, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      • {warning.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Dependencies Section */}
              {result.dependencies && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--modern-blue)' }}>
                    📦 Dependencies:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                    {result.dependencies.called_programs && result.dependencies.called_programs.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--primary-green)' }}>Called Programs:</span>
                        <div style={{ marginLeft: '1rem' }}>
                          {result.dependencies.called_programs.map((prog, idx) => (
                            <div key={idx}>→ {prog}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.dependencies.copybooks && result.dependencies.copybooks.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--primary-green)' }}>Copybooks:</span>
                        <div style={{ marginLeft: '1rem' }}>
                          {result.dependencies.copybooks.map((cb, idx) => (
                            <div key={idx}>→ {cb}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.dependencies.files && result.dependencies.files.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--primary-green)' }}>Files:</span>
                        <div style={{ marginLeft: '1rem' }}>
                          {result.dependencies.files.map((file, idx) => (
                            <div key={idx}>→ {file}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.dependencies.databases && result.dependencies.databases.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--primary-green)' }}>Databases:</span>
                        <div style={{ marginLeft: '1rem' }}>
                          {result.dependencies.databases.map((db, idx) => (
                            <div key={idx}>→ {db}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Rules */}
              {result.business_rules && result.business_rules.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--modern-blue)' }}>
                    📋 Business Rules:
                  </div>
                  {result.business_rules.map((rule, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '0.2rem', color: 'var(--primary-green)' }}>
                      {idx + 1}. {rule}
                    </div>
                  ))}
                </div>
              )}

              {/* Complexity Metrics */}
              {result.complexity_metrics && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--modern-blue)' }}>
                    📊 Complexity Metrics:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>Cyclomatic: <strong>{result.complexity_metrics.cyclomatic_complexity || 0}</strong></div>
                    <div>Logic Depth: <strong>{result.complexity_metrics.logic_depth || 0}</strong></div>
                    <div>Variables: <strong>{result.complexity_metrics.variable_count || 0}</strong></div>
                    <div>Decisions: <strong>{result.complexity_metrics.decision_points || 0}</strong></div>
                  </div>
                </div>
              )}

              {/* Full JSON (collapsed by default) */}
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  color: 'var(--modern-blue)',
                  marginBottom: '0.5rem'
                }}>
                  🔍 View Complete JSON
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzeView;
