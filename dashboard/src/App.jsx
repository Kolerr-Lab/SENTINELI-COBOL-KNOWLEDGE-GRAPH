import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Header from './components/Header';
import NavigationPanel from './components/NavigationPanel';
import MainPanel from './components/MainPanel';
import ActivityPanel from './components/ActivityPanel';

// WebSocket connects directly to Express server (port 3100)
// Vite dev server is on port 5173 and proxies /api requests to 3100
const WS_URL = 'ws://localhost:3100';

function App() {
  const { messages, connected, sendMessage } = useWebSocket(WS_URL);
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
    // Update system status from messages
    messages.forEach((msg) => {
      if (msg.type === 'connection') {
        console.log('Connected:', msg.message);
      }
    });

    // Fetch health status every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setSystemStatus({
          bridge: data.bridge,
          gateway: data.gateway,
          connections: 0
        });
      } catch (error) {
        console.error('Failed to fetch health:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [messages]);

  const handleAnalyze = (program, code) => {
    sendMessage({
      type: 'analyze',
      payload: { program, code }
    });
  };

  const handleImpactAnalysis = (field, newType) => {
    sendMessage({
      type: 'impact',
      payload: { field, newType }
    });
  };

  return (
    <div className="mainframe-screen">
      <Header 
        connected={connected}
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
          messages={messages}
          onAnalyze={handleAnalyze}
          onImpactAnalysis={handleImpactAnalysis}
          loadedModules={loadedModules}
          setLoadedModules={setLoadedModules}
          graphData={graphData}
          setGraphData={setGraphData}
        />
        
        <ActivityPanel messages={messages} />
      </div>
    </div>
  );
}

export default App;
