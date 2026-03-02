import { useState, useEffect } from 'react';
import Header from './components/Header';
import NavigationPanel from './components/NavigationPanel';
import MainPanel from './components/MainPanel';
import ActivityPanel from './components/ActivityPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { usePersistedState, useSessionState } from './utils/hooks';

function App() {
  // ===== PERSISTENT STATE (survives page refresh) =====
  
  // Active view - remember which tab user was on
  const [activeView, setActiveView] = usePersistedState('active_view', 'dashboard');
  
  // System status - session only (don't persist health checks)
  const [systemStatus, setSystemStatus] = useSessionState('system_status', {
    bridge: 'UNKNOWN',
    gateway: 'UNKNOWN',
    connections: 0
  });
  
  // Loaded modules - persist to avoid re-loading
  const [loadedModules, setLoadedModules] = usePersistedState('loaded_modules', [], {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    validate: (state) => Array.isArray(state)
  });
  
  // Graph data - persist to avoid re-generating
  const [graphData, setGraphData] = usePersistedState('graph_data', { nodes: [], edges: [] }, {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    validate: (state) => state && Array.isArray(state.nodes) && Array.isArray(state.edges)
  });
  
  // Analyze view state - persist form inputs
  const [analyzeState, setAnalyzeState] = usePersistedState('analyze_state', {
    program: '',
    code: '',
    fileType: 'COBOL',
    result: null,
    loading: false
  }, {
    debounce: 500, // Debounce saves for better performance
    validate: (state) => state && typeof state === 'object'
  });
  
  // Impact view state - persist form inputs
  const [impactState, setImpactState] = usePersistedState('impact_state', {
    field: '',
    newType: '',
    result: null,
    loading: false,
    showUploader: false
  }, {
    debounce: 500,
    validate: (state) => state && typeof state === 'object'
  });

  // Translate view state - persist form inputs and results
  const [translateState, setTranslateState] = usePersistedState('translate_state', {
    cobolCode: '',
    targetLanguage: 'python',
    useVerification: true,
    includeAnalysis: true,
    result: null,
    loading: false
  }, {
    debounce: 500,
    ttl: 60 * 60 * 1000, // 1 hour for results
    validate: (state) => state && typeof state === 'object'
  });

  // Compliance view state - persist form inputs and results
  const [complianceState, setComplianceState] = usePersistedState('compliance_state', {
    reportType: '',
    cobolCode: '',
    useVerification: true,
    format: 'html',
    result: null,
    loading: false
  }, {
    debounce: 500,
    ttl: 60 * 60 * 1000, // 1 hour for results
    validate: (state) => state && typeof state === 'object'
  });

  // Z3 Verify view state - persist form inputs and results
  const [z3VerifyState, setZ3VerifyState] = usePersistedState('z3_verify_state', {
    verificationType: 'program',
    cobolCode: '',
    result: null,
    z3Info: null,
    loading: false
  }, {
    debounce: 500,
    ttl: 60 * 60 * 1000, // 1 hour for results
    validate: (state) => state && typeof state === 'object'
  });

  useEffect(() => {
    // Fetch health status immediately then every 5 seconds
    const checkHealth = async () => {
      try {
        // Check bridge health
        const bridgeResponse = await fetch('/health');
        const bridgeData = await bridgeResponse.json();
        const bridgeStatus = bridgeData.status === 'ok' ? 'UP' : 'DOWN';
        
        // Check gateway health
        let gatewayStatus = 'DOWN';
        try {
          const gatewayResponse = await fetch('/gateway/health');
          const gatewayData = await gatewayResponse.json();
          gatewayStatus = gatewayData.status === 'ok' ? 'UP' : 'DOWN';
        } catch (gatewayError) {
          console.warn('Gateway health check failed:', gatewayError);
          gatewayStatus = 'DOWN';
        }
        
        setSystemStatus({
          bridge: bridgeStatus,
          gateway: gatewayStatus,
          connections: 0
        });
      } catch (error) {
        console.error('Failed to fetch health:', error);
        setSystemStatus({
          bridge: 'DOWN',
          gateway: 'DOWN',
          connections: 0
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);

    return () => clearInterval(interval);
  }, []);

  // Log state persistence status on mount
  useEffect(() => {
    console.log('[App] Persistent state management enabled');
    console.log('[App] All state will persist across page refreshes');
    
    // Import StateManager for debugging
    import('./utils/StateManager').then(({ default: stateManager }) => {
      const stats = stateManager.getStorageStats();
      if (stats) {
        console.log(`[App] Storage usage: ${stats.totalSizeKB}KB across ${stats.count} entries`);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <div className="mainframe-screen">
        <Header 
          connected={true}
          bridgeStatus={systemStatus.bridge}
          gatewayStatus={systemStatus.gateway}
        />
        
        <div className="dashboard-container">
          <NavigationPanel 
            activeView={activeView}
            setActiveView={setActiveView}
          />
          
          <MainPanel 
            activeView={activeView}
            loadedModules={loadedModules}
            setLoadedModules={setLoadedModules}
            graphData={graphData}
            setGraphData={setGraphData}
            analyzeState={analyzeState}
            setAnalyzeState={setAnalyzeState}
            impactState={impactState}
            setImpactState={setImpactState}
            translateState={translateState}
            setTranslateState={setTranslateState}
            complianceState={complianceState}
            setComplianceState={setComplianceState}
            z3VerifyState={z3VerifyState}
            setZ3VerifyState={setZ3VerifyState}
          />
          
          <ActivityPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
