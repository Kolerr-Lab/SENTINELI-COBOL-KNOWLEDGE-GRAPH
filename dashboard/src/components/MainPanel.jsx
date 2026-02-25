import React from 'react';
import DashboardView from './views/DashboardView';
import AnalyzeView from './views/AnalyzeView';
import ImpactView from './views/ImpactView';
import GraphView from './views/GraphView';
import LogsView from './views/LogsView';
import MetricsView from './views/MetricsView';

const MainPanel = ({ 
  activeView, 
  messages, 
  onAnalyze, 
  onImpactAnalysis,
  loadedModules,
  setLoadedModules,
  graphData,
  setGraphData
}) => {
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView messages={messages} />;
      case 'analyze':
        return <AnalyzeView onAnalyze={onAnalyze} messages={messages} />;
      case 'impact':
        return <ImpactView onImpactAnalysis={onImpactAnalysis} messages={messages} />;
      case 'graph':
        return (
          <GraphView 
            messages={messages}
            loadedModules={loadedModules}
            setLoadedModules={setLoadedModules}
            graphData={graphData}
            setGraphData={setGraphData}
          />
        );
      case 'logs':
        return <LogsView messages={messages} />;
      case 'metrics':
        return <MetricsView messages={messages} />;
      default:
        return <DashboardView messages={messages} />;
    }
  };

  return (
    <div className="panel main-panel">
      {renderView()}
    </div>
  );
};

export default MainPanel;
