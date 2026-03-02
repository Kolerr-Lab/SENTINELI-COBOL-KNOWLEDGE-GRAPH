import React from 'react';

/**
 * Syntax-highlighted code display component
 * Simple syntax highlighting for COBOL and other languages
 */
const CodeDisplay = ({ code, language = 'cobol', lineNumbers = true, maxHeight ='400px' }) => {
  if (!code) return null;
  
  const lines = code.split('\n');
  
  // Simple syntax highlighting patterns
  const highlightLine = (line, lang) => {
    if (lang.toLowerCase() === 'cobol') {
      // COBOL-specific highlighting
      return line
        .replace(/\b(IDENTIFICATION|DIVISION|PROGRAM-ID|DATA|WORKING-STORAGE|PROCEDURE|SECTION|PERFORM|IF|ELSE|END-IF|MOVE|TO|COMPUTE|DISPLAY|STOP|RUN|ACCEPT|ADD|SUBTRACT|MULTIPLY|DIVIDE|BY|GIVING|VALUE|PIC|PICTURE)\b/g, 
          '<span style="color: var(--primary-green); font-weight: bold;">$1</span>')
        .replace(/("[^"]*")/g, '<span style="color: var(--modern-blue);">$1</span>')
        .replace(/('[^']*')/g, '<span style="color: var(--modern-blue);">$1</span>')
        .replace(/\b(\d+)\b/g, '<span style="color: #ffaa00;">$1</span>')
        .replace(/(\*>.*$)/g, '<span style="color: #666; font-style: italic;">$1</span>');
    } else if (lang.toLowerCase() === 'python') {
      // Python-specific highlighting
      return line
        .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await)\b/g,
          '<span style="color: var(--primary-green); font-weight: bold;">$1</span>')
        .replace(/("[^"]*"|'[^']*')/g, '<span style="color: var(--modern-blue);">$1</span>')
        .replace(/(#.*$)/g, '<span style="color: #666; font-style: italic;">$1</span>');
    } else if (lang.toLowerCase() === 'java') {
      // Java-specific highlighting
      return line
        .replace(/\b(public|private|protected|class|interface|extends|implements|return|if|else|for|while|new|this|static|final|void|int|String|boolean)\b/g,
          '<span style="color: var(--primary-green); font-weight: bold;">$1</span>')
        .replace(/("[^"]*")/g, '<span style="color: var(--modern-blue);">$1</span>')
        .replace(/(\/\/.*$)/g, '<span style="color: #666; font-style: italic;">$1</span>');
    }
    return line;
  };
  
  return (
    <div style={{
      border: '1px solid var(--mainframe-border)',
      borderRadius: '4px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      overflow: 'auto',
      maxHeight,
      fontFamily: 'Courier New, monospace',
      fontSize: '0.85rem'
    }}>
      <div style={{
        display: 'flex',
        padding: '0.5rem',
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
        borderBottom: '1px solid var(--mainframe-border)'
      }}>
        <span style={{ 
          color: 'var(--primary-green)', 
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          {language}
        </span>
        <span style={{ 
          marginLeft: 'auto', 
          color: 'var(--scanline-color)',
          fontSize: '0.8rem'
        }}>
          {lines.length} lines
        </span>
      </div>
      
      <div style={{ display: 'flex' }}>
        {lineNumbers && (
          <div style={{
            padding: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            color: 'var(--scanline-color)',
            textAlign: 'right',
            userSelect: 'none',
            borderRight: '1px solid var(--mainframe-border)',
            minWidth: '3rem'
          }}>
            {lines.map((_, index) => (
              <div key={index} style={{ lineHeight: '1.5' }}>
                {index + 1}
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          padding: '0.5rem',
          flex: 1,
          color: 'var(--primary-green)',
          whiteSpace: 'pre',
          overflow: 'auto'
        }}>
          {lines.map((line, index) => (
            <div 
              key={index} 
              style={{ lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ 
                __html: highlightLine(line, language) || '&nbsp;' 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Z3 Verification Badge Component
 * Shows verification status with appropriate styling
 */
export const VerificationBadge = ({ verification }) => {
  if (!verification) return null;
  
  const getStatus = () => {
    if (verification.verified === true || verification.proven === true) {
      return { icon: '✅', label: 'VERIFIED', color: 'var(--primary-green)' };
    } else if (verification.verified === false || verification.proven === false) {
      return { icon: '❌', label: 'FAILED', color: 'var(--error-red)' };
    } else if (verification.status === 'skipped') {
      return { icon: '⏭️', label: 'SKIPPED', color: 'var(--warning-yellow)' };
    } else {
      return { icon: '⏳', label: 'PENDING', color: 'var(--modern-blue)' };
    }
  };
  
  const status = getStatus();
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      border: `2px solid ${status.color}`,
      borderRadius: '4px',
      fontWeight: 'bold'
    }}>
      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
        {status.icon}
      </span>
      <span style={{ color: status.color }}>
        Z3 {status.label}
      </span>
      {verification.duration && (
        <span style={{ 
          marginLeft: '1rem', 
          color: 'var(--scanline-color)',
          fontSize: '0.9rem',
          fontWeight: 'normal'
        }}>
          ({verification.duration}ms)
        </span>
      )}
    </div>
  );
};

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = ({ message = 'Processing...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: 'var(--primary-green)'
  }}>
    <div style={{
      border: '4px solid rgba(0, 255, 0, 0.1)',
      borderTop: '4px solid var(--primary-green)',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    }} />
    <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
      {message}
    </div>
  </div>
);

export default CodeDisplay;
