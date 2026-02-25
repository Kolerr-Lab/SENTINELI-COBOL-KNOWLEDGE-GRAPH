import React from 'react';
import DashboardView from './views/DashboardView';
import AnalyzeView from './views/AnalyzeView';
import ImpactView from './views/ImpactView';
import GraphView from './views/GraphView';
import LogsView from './views/LogsView';
import MetricsView from './views/MetricsView';

const MainPanel = ({ 
  activeView,
  loadedModules,
  setLoadedModules,
  graphData,
  setGraphData
}) => {
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'analyze':
        return <AnalyzeView />;
      case 'impact':
        return <ImpactView />;
      case 'graph':
        return (
          <GraphView 
            loadedModules={loadedModules}
            setLoadedModules={setLoadedModules}
            graphData={graphData}
            setGraphData={setGraphData}
          />
        );
      case 'logs':
        return <LogsView />;
      case 'metrics':
        return <MetricsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="panel main-panel">
      {renderView()}
    </div>
  );
};

export default MainPanel;
