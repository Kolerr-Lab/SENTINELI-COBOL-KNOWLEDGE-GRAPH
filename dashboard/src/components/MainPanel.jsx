import React from 'react';
import DashboardView from './views/DashboardView';
import AnalyzeView from './views/AnalyzeView';
import ImpactView from './views/ImpactView';
import GraphView from './views/GraphView';
import LogsView from './views/LogsView';
import MetricsView from './views/MetricsView';
import TranslateView from './views/TranslateView';
import ComplianceView from './views/ComplianceView';
import Z3VerifyView from './views/Z3VerifyView';
import SettingsView from './views/SettingsView';

const MainPanel = ({ 
  activeView,
  loadedModules,
  setLoadedModules,
  graphData,
  setGraphData,
  analyzeState,
  setAnalyzeState,
  impactState,
  setImpactState,
  translateState,
  setTranslateState,
  complianceState,
  setComplianceState,
  z3VerifyState,
  setZ3VerifyState
}) => {
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'analyze':
        return (
          <AnalyzeView 
            analyzeState={analyzeState}
            setAnalyzeState={setAnalyzeState}
          />
        );
      case 'translate':
        return (
          <TranslateView 
            translateState={translateState}
            setTranslateState={setTranslateState}
          />
        );
      case 'compliance':
        return (
          <ComplianceView 
            complianceState={complianceState}
            setComplianceState={setComplianceState}
          />
        );
      case 'z3verify':
        return (
          <Z3VerifyView 
            z3VerifyState={z3VerifyState}
            setZ3VerifyState={setZ3VerifyState}
          />
        );
      case 'impact':
        return (
          <ImpactView 
            impactState={impactState}
            setImpactState={setImpactState}
            loadedModules={loadedModules}
            setLoadedModules={setLoadedModules}
          />
        );
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
      case 'settings':
        return <SettingsView />;
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
