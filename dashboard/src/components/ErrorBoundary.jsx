import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // You could also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="terminal" style={{
          margin: '2rem',
          padding: '2rem',
          border: '2px solid var(--error-red)',
          backgroundColor: 'rgba(255, 0, 0, 0.1)'
        }}>
          <div className="panel-header" style={{
            color: 'var(--error-red)',
            borderColor: 'var(--error-red)'
          }}>
            ═══ SYSTEM ERROR ═══
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: 'var(--error-red)', fontWeight: 'bold' }}>
              ⚠️ An unexpected error occurred:
            </p>
            
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--error-red)',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {this.state.error && this.state.error.toString()}
            </div>
            
            {this.state.errorInfo && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{
                  cursor: 'pointer',
                  color: 'var(--primary-green)',
                  padding: '0.5rem'
                }}>
                  📋 Stack Trace (Click to expand)
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid var(--mainframe-border)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{ marginTop: '1.5rem' }}>
              <button
                className="submit-button"
                onClick={this.handleReset}
                style={{
                  backgroundColor: 'var(--primary-green)',
                  color: '#000'
                }}
              >
                🔄 Try Again
              </button>
              
              <button
                className="submit-button"
                onClick={() => window.location.reload()}
                style={{
                  marginLeft: '1rem',
                  backgroundColor: 'var(--modern-blue)'
                }}
              >
                ↻ Reload Page
              </button>
            </div>
            
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(0, 255, 0, 0.05)',
              border: '1px solid var(--primary-green)'
            }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                <strong style={{ color: 'var(--primary-green)' }}>Troubleshooting:</strong>
              </p>
              <ul style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <li>Check if all required services are running</li>
                <li>Verify your API key is valid</li>
                <li>Check the browser console for additional details</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
