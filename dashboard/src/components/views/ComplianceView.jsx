import React, { useState, useEffect } from 'react';
import { secureFetch, validateCode, rateLimiter } from '../../utils/security';
import CodeDisplay, { VerificationBadge, LoadingSpinner } from '../CodeDisplay';

const ComplianceView = ({ complianceState, setComplianceState }) => {
  // Use persistent state from props
  const code = complianceState?.cobolCode || '';
  const reportType = complianceState?.reportType || 'sox';
  const includeVerification = complianceState?.useVerification ?? true;
  const format = complianceState?.format || 'html';
  const loading = complianceState?.loading || false;
  const result = complianceState?.result || null;

  const [error, setError] = useState(null);
  const [reportTypes, setReportTypes] = useState([]);

  // Update persistent state helper
  const updateState = (updates) => {
    setComplianceState(prev => ({ ...prev, ...updates }));
  };

  const setCode = (value) => updateState({ cobolCode: value });
  const setReportType = (value) => updateState({ reportType: value });
  const setIncludeVerification = (value) => updateState({ useVerification: value });
  const setFormat = (value) => updateState({ format: value });
  const setLoading = (value) => updateState({ loading: value });
  const setResult = (value) => updateState({ result: value });

  // Fetch available report types on mount
  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        const data = await secureFetch('/api/reports/types');
        if (data.success) {
          setReportTypes(data.reportTypes);
        }
      } catch (err) {
        console.error('Failed to fetch report types:', err);
      }
    };
    fetchReportTypes();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Client-side validation
      validateCode(code);
      
      // Check rate limit
      rateLimiter.canMakeRequest('/api/reports', 5, 60000);

      // Make API request
      const data = await secureFetch(`/api/reports/compliance/${reportType}`, {
        method: 'POST',
        body: JSON.stringify({
          code,
          includeVerification,
          format
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

  const handleDownloadReport = () => {
    if (!result) return;
    
    // Create a blob and download
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${reportType}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedReportType = reportTypes.find(r => r.id === reportType);

  return (
    <div>
      <div className="panel-header">═══ REGULATORY COMPLIANCE REPORTS ═══</div>
      
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid var(--primary-green)',
        marginBottom: '1rem'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>
          📊 Enterprise Compliance Reporting
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--scanline-color)' }}>
          Generate comprehensive regulatory compliance reports (SOX 404, Basel III, OCC, SEC, Banking) 
          with formal Z3 verification for audit-ready documentation.
        </div>
      </div>

      <form onSubmit={handleGenerateReport}>
        {/* Report Type Selection */}
        <div className="form-group">
          <label className="form-label">REGULATORY STANDARD:</label>
          <select
            className="form-input"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            {reportTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {selectedReportType && (
            <div style={{ 
              fontSize: '0.8rem', 
              marginTop: '0.5rem', 
              padding: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--mainframe-border)'
            }}>
              <div style={{ color: 'var(--modern-blue)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {selectedReportType.description}
              </div>
              <div style={{ color: 'var(--scanline-color)', fontSize: '0.75rem' }}>
                📋 Regulations: {selectedReportType.regulations?.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* COBOL Code Input */}
        <div className="form-group">
          <label className="form-label">COBOL PROGRAM SOURCE:</label>
          <textarea
            className="form-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste COBOL program code for compliance analysis..."
            required
            style={{ minHeight: '200px' }}
          />
          <div style={{ 
            fontSize: '0.75rem', 
            marginTop: '0.25rem', 
            color: 'var(--scanline-color)' 
          }}>
            {code.length > 0 && `${code.length} characters, ${code.split('\n').length} lines`}
          </div>
        </div>

        {/* Options */}
        <div className="form-group" style={{ display: 'flex', gap: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeVerification}
              onChange={(e) => setIncludeVerification(e.target.checked)}
              style={{ marginRight: '0.5rem', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--primary-green)' }}>
              ✅ Include Z3 Formal Verification
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary-green)' }}>Format:</span>
            <select
              className="form-input"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
            >
              <option value="html">HTML</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '⏳ GENERATING...' : '📊 GENERATE REPORT'}
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
          <LoadingSpinner message={`Generating ${selectedReportType?.name || 'compliance'} report...`} />
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
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>═══ COMPLIANCE REPORT ═══</span>
            <button
              className="submit-button"
              onClick={handleDownloadReport}
              style={{ 
                fontSize: '0.8rem', 
                padding: '0.25rem 0.75rem',
                backgroundColor: 'var(--modern-blue)'
              }}
            >
              💾 DOWNLOAD
            </button>
          </div>
          
          {/* Report Metadata */}
          {result.metadata && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(0, 255, 0, 0.05)',
              border: '1px solid var(--primary-green)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary-green)' }}>
                📄 Report Information:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                {result.metadata.reportId && (
                  <div>📋 Report ID: <strong>{result.metadata.reportId}</strong></div>
                )}
                {result.metadata.generatedAt && (
                  <div>🕐 Generated: <strong>{new Date(result.metadata.generatedAt).toLocaleString()}</strong></div>
                )}
                {result.metadata.format && (
                  <div>📝 Format: <strong>{result.metadata.format.toUpperCase()}</strong></div>
                )}
              </div>
            </div>
          )}

          {/* Report Title */}
          {result.report && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                color: 'var(--primary-green)',
                marginBottom: '0.5rem',
                textAlign: 'center',
                padding: '1rem',
                border: '2px solid var(--primary-green)',
                backgroundColor: 'rgba(0, 255, 0, 0.05)'
              }}>
                {result.report.title || selectedReportType?.name}
              </div>
            </div>
          )}

          {/* Report Sections */}
          {result.report?.sections && result.report.sections.length > 0 && (
            <div>
              {result.report.sections.map((section, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  border: '1px solid var(--mainframe-border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: 'var(--modern-blue)',
                    marginBottom: '0.75rem',
                    fontSize: '1.1rem',
                    borderBottom: '1px solid var(--mainframe-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    {section.title || section.name}
                  </div>
                  
                  {/* Section Content */}
                  {typeof section.content === 'string' ? (
                    <div style={{ 
                      fontSize: '0.9rem', 
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {section.content}
                    </div>
                  ) : typeof section.content === 'object' ? (
                    <div>
                      {/* Z3 Verification Results */}
                      {section.content.proven !== undefined && (
                        <div style={{ marginBottom: '1rem' }}>
                          <VerificationBadge verification={section.content} />
                          {section.content.message && (
                            <div style={{ 
                              marginTop: '0.5rem', 
                              fontSize: '0.9rem',
                              color: 'var(--scanline-color)'
                            }}>
                              {section.content.message}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Other structured content */}
                      <pre style={{ 
                        fontSize: '0.85rem', 
                        overflow: 'auto',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        padding: '0.75rem',
                        border: '1px solid var(--mainframe-border)'
                      }}>
                        {JSON.stringify(section.content, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                  
                  {/* Section Details */}
                  {section.details && typeof section.details === 'object' && (
                    <div style={{ 
                      marginTop: '0.75rem',
                      fontSize: '0.85rem',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(0, 255, 0, 0.05)',
                      border: '1px solid var(--primary-green)'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(section.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Section Status */}
                  {section.status && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: section.status === 'verified' ? 'var(--primary-green)' : 
                             section.status === 'failed' ? 'var(--error-red)' : 
                             'var(--warning-yellow)'
                    }}>
                      Status: {section.status.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Processing metrics */}
          {result.report?.processingTime && (
            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(0, 255, 0, 0.05)',
              border: '1px solid var(--primary-green)',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}>
              ⏱️ Report generated in <strong>{result.report.processingTime}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplianceView;
