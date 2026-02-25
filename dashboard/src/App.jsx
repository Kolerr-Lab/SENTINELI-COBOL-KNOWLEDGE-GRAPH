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
  
  // Lift graph state to App level to persist across tab switches
  const [loadedModules, setLoadedModules] = useState([]);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    // Fetch health status immediately then every 5 seconds
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setSystemStatus({
          bridge: (data.bridge && data.bridge !== 'DOWN') || data.status === 'ok' ? 'UP' : 'DOWN',
          gateway: (data.gateway && data.gateway !== 'DOWN') || data.gateway === 'UP' ? 'UP' : 'UNKNOWN',
          connections: 0
        });
      } catch (error) {
        console.error('Failed to fetch health:', error);
        setSystemStatus(prev => ({ ...prev, bridge: 'DOWN' }));
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
        />
        
        <ActivityPanel />
      </div>
    </div>
  );
}

export default App;
