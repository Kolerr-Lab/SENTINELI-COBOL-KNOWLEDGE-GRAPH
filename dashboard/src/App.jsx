import { useState, useEffect } from 'react';
import Header from './components/Header';
import NavigationPanel from './components/NavigationPanel';
import MainPanel from './components/MainPanel';
import ActivityPanel from './components/ActivityPanel';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState({
    bridge: 'UNKNOWN',
    gateway: 'UNKNOWN',
    connections: 0
  });
  
  // Lift state to App level to persist across tab switches
  const [loadedModules, setLoadedModules] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  
  // Analyze view state
  const [analyzeState, setAnalyzeState] = useState({
    program: '',
    code: '',
    fileType: 'COBOL',
    result: null,
    loading: false
  });
  
  // Impact view state (uses shared loadedModules)
  const [impactState, setImpactState] = useState({
    field: '',
    newType: '',
    result: null,
    loading: false,
    showUploader: false
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

  return (
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
        />
        
        <ActivityPanel />
      </div>
    </div>
  );
}

export default App;
