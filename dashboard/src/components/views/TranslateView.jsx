import React, { useState, useEffect } from 'react';
import { secureFetch, validateCode, validateProgramName, rateLimiter } from '../../utils/security';
import CodeDisplay, { VerificationBadge, LoadingSpinner } from '../CodeDisplay';

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍', color: '#3776ab' },
  { value: 'java', label: 'Java', icon: '☕', color: '#007396' },
  { value: 'javascript', label: 'JavaScript', icon: '📜', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', icon: '📘', color: '#3178c6' },
  { value: 'csharp', label: 'C#', icon: '#️⃣', color: '#239120' },
  { value: 'go', label: 'Go', icon: '🔷', color: '#00add8' }
];

const TranslateView = ({ translateState, setTranslateState }) => {
  // Use persistent state from props
  const code = translateState?.cobolCode || '';
  const targetLang = translateState?.targetLanguage || 'python';
  const verify = translateState?.useVerification ?? true;
  const includeAnalysis = translateState?.includeAnalysis ?? true;
  const loading = translateState?.loading || false;
  const result = translateState?.result || null;

  const [error, setError] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Update persistent state helper
  const updateState = (updates) => {
    setTranslateState(prev => ({ ...prev, ...updates }));
  };

  const setCode = (value) => updateState({ cobolCode: value });
  const setTargetLang = (value) => updateState({ targetLanguage: value });
  const setVerify = (value) => updateState({ useVerification: value });
  const setIncludeAnalysis = (value) => updateState({ includeAnalysis: value });
  const setLoading = (value) => updateState({ loading: value });
  const setResult = (value) => updateState({ result: value });

  // Fetch available languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await secureFetch('/api/translate/languages');
        if (data.success) {
          setAvailableLanguages(data.languages);
        }
      } catch (err) {
        console.error('Failed to fetch languages:', err);
        // Use default languages if fetch fails
        setAvailableLanguages(SUPPORTED_LANGUAGES.map(l => l.value));
      }
    };
    fetchLanguages();
  }, []);

  const handleTranslate = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Client-side validation
      validateCode(code);
      
      // Check rate limit
      rateLimiter.canMakeRequest('/api/translate', 10, 60000);

      // Make API request
      const data = await secureFetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          targetLang,
          verify,
          includeAnalysis
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

  const handleCopyTranslated = () => {
    if (result?.translation?.translated?.code) {
      navigator.clipboard.writeText(result.translation.translated.code);
      alert('✅ Translated code copied to clipboard!');
    }
  };

  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.value === targetLang);

  return (
    <div>
      <div className="panel-header">═══ CODE TRANSLATION WITH Z3 VERIFICATION ═══</div>
      
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid var(--primary-green)',
        marginBottom: '1rem'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>
          🚀 AI-Powered Code Modernization
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--scanline-color)' }}>
          Translate COBOL to modern languages with formal verification. The Z3 theorem prover ensures 
          business logic preservation during translation.
        </div>
      </div>

      <form onSubmit={handleTranslate}>
        {/* COBOL Code Input */}
        <div className="form-group">
          <label className="form-label">COBOL SOURCE CODE:</label>
          <textarea
            className="form-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your COBOL source code here..."
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

        {/* Target Language Selection */}
        <div className="form-group">
          <label className="form-label">TARGET LANGUAGE:</label>
          <select
            className="form-select"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option
                key={lang.value}
                value={lang.value}
                disabled={availableLanguages.length > 0 && !availableLanguages.includes(lang.value)}
              >
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
          {selectedLang && (
            <div style={{ 
              fontSize: '0.75rem', 
              marginTop: '0.25rem',
              color: selectedLang.color,
              fontWeight: 'bold'
            }}>
              Selected: {selectedLang.icon} {selectedLang.label}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="form-group" style={{ display: 'flex', gap: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={verify}
              onChange={(e) => setVerify(e.target.checked)}
              style={{ marginRight: '0.5rem', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--primary-green)' }}>
              ✅ Enable Z3 Formal Verification
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeAnalysis}
              onChange={(e) => setIncludeAnalysis(e.target.checked)}
              style={{ marginRight: '0.5rem', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--primary-green)' }}>
              📊 Include Source Analysis
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '⏳ TRANSLATING...' : '▶ TRANSLATE CODE'}
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
          <LoadingSpinner message={`Translating to ${selectedLang?.label}...`} />
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
          <div className="panel-header">═══ TRANSLATION RESULTS ═══</div>
          
          {/* Metadata */}
          {result.metadata && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(0, 255, 0, 0.05)',
              border: '1px solid var(--primary-green)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ⚡ Translation Metrics:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div>⏱️ Processing Time: <strong>{result.metadata.totalProcessingTimeMs}ms</strong></div>
                <div>🔢 Tokens Used: <strong>{result.metadata.tokensUsed?.total || 'N/A'}</strong></div>
                {result.metadata.verificationIncluded !== undefined && (
                  <div>
                    🔬 Verification: <strong>{result.metadata.verificationIncluded ? 'Included' : 'Not Included'}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Z3 Verification Status */}
          {result.verification && (
            <div style={{ marginBottom: '1rem' }}>
              <VerificationBadge verification={result.verification} />
              {result.verification.message && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  color: 'var(--scanline-color)',
                  fontSize: '0.9rem'
                }}>
                  {result.verification.message}
                </div>
              )}
            </div>
          )}

          {/* Original Code */}
          {result.translation?.original && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                color: 'var(--primary-green)'
              }}>
                📄 ORIGINAL CODE (COBOL):
              </div>
              <CodeDisplay
                code={result.translation.original.code}
                language="cobol"
                maxHeight="300px"
              />
            </div>
          )}

          {/* Translated Code */}
          {result.translation?.translated && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontWeight: 'bold', color: selectedLang?.color }}>
                  {selectedLang?.icon} TRANSLATED CODE ({selectedLang?.label?.toUpperCase()}):
                </div>
                <button
                  className="submit-button"
                  onClick={handleCopyTranslated}
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--modern-blue)'
                  }}
                >
                  📋 COPY
                </button>
              </div>
              <CodeDisplay
                code={result.translation.translated.code}
                language={targetLang}
                maxHeight="400px"
              />
            </div>
          )}

          {/* Business Rules Analysis */}
          {result.analysis?.businessRules && result.analysis.businessRules.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                color: 'var(--primary-green)'
              }}>
                📋 EXTRACTED BUSINESS RULES ({result.analysis.businessRules.length}):
              </div>
              <div style={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid var(--mainframe-border)',
                padding: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)'
              }}>
                {result.analysis.businessRules.map((rule, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: idx < result.analysis.businessRules.length - 1 ? '1px solid var(--mainframe-border)' : 'none'
                  }}>
                    <div style={{ color: 'var(--modern-blue)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {rule.type || 'Rule'} {idx + 1}:
                    </div>
                    <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {rule.rule || rule.condition || rule.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslateView;
