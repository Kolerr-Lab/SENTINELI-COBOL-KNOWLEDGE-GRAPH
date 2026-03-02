import React, { useState, useEffect } from 'react';
import { secureFetch, validateCode, rateLimiter } from '../../utils/security';
import CodeDisplay, { VerificationBadge, LoadingSpinner } from '../CodeDisplay';

const VERIFICATION_TYPES = [
  {
    id: 'program',
    name: 'Program Analysis Verification',
    description: 'Verify business logic, complexity, data flows, and MIPS estimations',
    icon: '📊',
    color: 'var(--primary-green)'
  },
  {
    id: 'loan',
    name: 'Loan Decision Verification',
    description: 'Verify loan approval decision logic matches COBOL execution',
    icon: '💰',
    color: 'var(--modern-blue)'
  },
  {
    id: 'equivalence',
    name: 'Code Translation Equivalence',
    description: 'Verify translated code preserves business logic from original COBOL',
    icon: '⚖️',
    color: '#ffaa00'
  }
];

const Z3VerifyView = () => {
  const [code, setCode] = useState('');
  const [verificationType, setVerificationType] = useState('program');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [z3Info, setZ3Info] = useState(null);

  // Fetch Z3 info on mount
  useEffect(() => {
    const fetchZ3Info = async () => {
      try {
        const data = await secureFetch('/api/z3/info');
        if (data.success) {
          setZ3Info(data);
        }
      } catch (err) {
        console.error('Failed to fetch Z3 info:', err);
      }
    };
    fetchZ3Info();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Client-side validation
      validateCode(code);
      
      // Check rate limit
      rateLimiter.canMakeRequest('/api/z3/verify', 10, 60000);

      // Make API request
      const data = await secureFetch('/api/z3/verify', {
        method: 'POST',
        body: JSON.stringify({
          code,
          verification_type: verificationType,
          options: {}
        })
      });

      setResult(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setError(null);
  };

  const selectedType = VERIFICATION_TYPES.find(t => t.id === verificationType);

  return (
    <div>
      <div className="panel-header">═══ Z3 FORMAL VERIFICATION ═══</div>
      
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid var(--primary-green)',
        marginBottom: '1rem'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>
          🔬 SMT-Based Formal Verification
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--scanline-color)' }}>
          Use the Z3 theorem prover to formally verify COBOL programs. Z3 provides mathematical 
          proofs (SAT/UNSAT) for program correctness, business logic consistency, and code equivalence.
        </div>
        {z3Info && (
          <div style={{ 
            marginTop: '0.75rem',
            padding: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--mainframe-border)',
            fontSize: '0.85rem'
          }}>
            <strong>Z3 Version:</strong> {z3Info.z3?.version} | 
            <strong style={{ marginLeft: '1rem' }}>Solver:</strong> {z3Info.z3?.solver}
          </div>
        )}
      </div>

      <form onSubmit={handleVerify}>
        {/* Verification Type Selection */}
        <div className="form-group">
          <label className="form-label">VERIFICATION TYPE:</label>
          <select
            className="form-input"
            value={verificationType}
            onChange={(e) => setVerificationType(e.target.value)}
            style={{ 
              color: selectedType?.color,
              fontWeight: 'bold'
            }}
          >
            {VERIFICATION_TYPES.map(type => (
              <option
                key={type.id}
                value={type.id}
                style={{ 
                  backgroundColor: '#000',
                  color: type.color
                }}
              >
                {type.icon} {type.name}
              </option>
            ))}
          </select>
          {selectedType && (
            <div style={{ 
              fontSize: '0.8rem', 
              marginTop: '0.5rem', 
              padding: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--mainframe-border)',
              color: 'var(--scanline-color)'
            }}>
              {selectedType.description}
            </div>
          )}
        </div>

        {/* COBOL Code Input */}
        <div className="form-group">
          <label className="form-label">COBOL PROGRAM CODE:</label>
          <textarea
            className="form-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste COBOL code for formal verification..."
            required
            style={{ minHeight: '250px' }}
          />
          <div style={{ 
            fontSize: '0.75rem', 
            marginTop: '0.25rem', 
            color: 'var(--scanline-color)' 
          }}>
            {code.length > 0 && `${code.length} characters, ${code.split('\n').length} lines`}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '⏳ VERIFYING...' : '🔬 RUN Z3 VERIFICATION'}
          </button>
          <button
            type="button"
            className="submit-button"
            onClick={handleClear}
            disabled={loading}
            style={{ backgroundColor: 'var(--error-red)' }}
          >
            🗑️ CLEAR
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="terminal" style={{ marginTop: '1rem' }}>
          <LoadingSpinner message="Running Z3 formal verification..." />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="terminal" style={{ 
          marginTop: '1rem', 
          border: '2px solid var(--error-red)',
          backgroundColor: 'rgba(255, 0, 0, 0.1)'
        }}>
          <div className="panel-header" style={{ borderColor: 'var(--error-red)' }}>
            ═══ ERROR ═══
          </div>
          <div style={{ color: 'var(--error-red)', padding: '1rem' }}>
            ❌ {error}
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && !loading && (
        <div className="terminal" style={{ marginTop: '1rem' }}>
          <div className="panel-header">═══ VERIFICATION RESULTS ═══</div>
          
          {/* Main Verification Status */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <VerificationBadge verification={result.result} />
            {result.result.message && (
              <div style={{ 
                marginTop: '0.75rem', 
                fontSize: '1rem',
                color: 'var(--primary-green)',
                fontWeight: 'bold'
              }}>
                {result.result.message}
              </div>
            )}
          </div>

          {/* Metadata */}
          {result.metadata && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(0, 255, 0, 0.05)',
              border: '1px solid var(--primary-green)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary-green)' }}>
                ⚡ Verification Metrics:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div>⏱️ Processing Time: <strong>{result.metadata.totalProcessingTimeMs}ms</strong></div>
                <div>🔬 Z3 Version: <strong>{result.metadata.z3Version}</strong></div>
                <div>📊 Type: <strong>{result.verification_type.toUpperCase()}</strong></div>
                {result.result.duration && (
                  <div>⚡ Z3 Time: <strong>{result.result.duration}ms</strong></div>
                )}
              </div>
            </div>
          )}

          {/* Program Name */}
          {result.result.programName && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--mainframe-border)'
            }}>
              <strong style={{ color: 'var(--modern-blue)' }}>Program:</strong> {result.result.programName}
            </div>
          )}

          {/* Verification Sections */}
          {result.result.sections && result.result.sections.length > 0 && (
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.75rem',
                color: 'var(--primary-green)',
                fontSize: '1.1rem'
              }}>
                📋 VERIFICATION SECTIONS:
              </div>
              
              {result.result.sections.map((section, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '1rem',
                  padding: '1rem',
                  border: '1px solid var(--mainframe-border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)'
                }}>
                  {/* Section Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid var(--mainframe-border)'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: 'var(--modern-blue)',
                      fontSize: '1rem'
                    }}>
                      {section.name}
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: section.status === 'verified' ? 'rgba(0, 255, 0, 0.2)' : 
                                     section.status === 'failed' ? 'rgba(255, 0, 0, 0.2)' :
                                     'rgba(255, 170, 0, 0.2)',
                      color: section.status === 'verified' ? 'var(--primary-green)' : 
                             section.status === 'failed' ? 'var(--error-red)' : 
                             'var(--warning-yellow)'
                    }}>
                      {section.status?.toUpperCase() || 'N/A'}
                    </div>
                  </div>

                  {/* Section Content */}
                  <div style={{ fontSize: '0.9rem' }}>
                    {/* Rules Count */}
                    {section.rulesCount !== undefined && (
                      <div>📊 Rules: <strong>{section.rulesCount}</strong></div>
                    )}
                    
                    {/* Variables Tracked */}
                    {section.variablesTracked !== undefined && (
                      <div>🔢 Variables: <strong>{section.variablesTracked}</strong></div>
                    )}
                    
                    {/* Conditions */}
                    {section.conditionsFound !== undefined && (
                      <div>⚙️ Conditions: <strong>{section.conditionsFound}</strong></div>
                    )}
                    
                    {/* Complexity */}
                    {section.cyclomaticComplexity !== undefined && (
                      <div>
                        📈 Cyclomatic Complexity: <strong>{section.cyclomaticComplexity}</strong>
                        <span style={{ 
                          marginLeft: '0.5rem',
                          color: section.complexityRating === 'Low' ? 'var(--primary-green)' :
                                 section.complexityRating === 'Moderate' ? 'var(--warning-yellow)' :
                                 'var(--error-red)'
                        }}>
                          ({section.complexityRating})
                        </span>
                      </div>
                    )}
                    
                    {/* MIPS */}
                    {section.totalMIPS !== undefined && (
                      <div>⚡ Total MIPS: <strong>{section.totalMIPS}</strong></div>
                    )}
                    
                    {/* Satisfiability */}
                    {section.satisfiability && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(0, 255, 0, 0.05)',
                        border: '1px solid var(--primary-green)'
                      }}>
                        🔬 Z3 Satisfiability: <strong style={{ color: 'var(--primary-green)' }}>
                          {section.satisfiability}
                        </strong>
                        {section.message && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            {section.message}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Sample Details */}
                    {section.details && (
                      <details style={{ marginTop: '0.75rem' }}>
                        <summary style={{ 
                          cursor: 'pointer', 
                          color: 'var(--primary-green)',
                          fontWeight: 'bold'
                        }}>
                          📋 View Details
                        </summary>
                        <pre style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid var(--mainframe-border)',
                          fontSize: '0.8rem',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {JSON.stringify(section.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Model (for SAT results) */}
          {result.result.model && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                color: 'var(--primary-green)'
              }}>
                🎯 Z3 MODEL (Variable Assignments):
              </div>
              <pre style={{
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--mainframe-border)',
                fontSize: '0.85rem',
                overflow: 'auto'
              }}>
                {JSON.stringify(result.result.model, null, 2)}
              </pre>
            </div>
          )}

          {/* Constraints */}
          {result.result.constraints && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                color: 'var(--primary-green)'
              }}>
                📏 CONSTRAINTS CHECKED:
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--mainframe-border)'
              }}>
                {typeof result.result.constraints === 'object' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {Object.entries(result.result.constraints).map(([key, value]) => (
                      <div key={key}>
                        {key.replace(/_/g, ' ')}: <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>{result.result.constraints}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Z3VerifyView;
