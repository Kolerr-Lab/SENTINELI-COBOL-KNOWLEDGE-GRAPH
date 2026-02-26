import React, { useState, useEffect } from 'react';

const ActivityPanel = () => {
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Initial load
    fetchMetrics();
    
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        
        // Create activity items from metrics
        const newActivities = [];
        
        if (data.requests) {
          const recentCount = data.requests.total || 0;
          newActivities.push({
            type: 'info',
            message: `${recentCount} total API requests`,
            timestamp: new Date().toLocaleTimeString()
          });
        }
        
        if (data.llm && data.llm.total_calls > 0) {
          newActivities.push({
            type: 'success',
            message: `${data.llm.total_calls} AI analysis calls`,
            timestamp: new Date().toLocaleTimeString()
          });
        }
        
        if (data.errors && data.errors.length > 0) {
          newActivities.push({
            type: 'error',
            message: `${data.errors.length} errors detected`,
            timestamp: new Date().toLocaleTimeString()
          });
        }
        
        // Keep only last 10 activities
        setActivities(prev => [...newActivities, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'success': return 'var(--success-green)';
      case 'error': return 'var(--error-red)';
      case 'warning': return 'var(--warning-amber)';
      default: return 'var(--info-blue)';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return '●';
    }
  };

  return (
    <div className="activity-panel">
      <div className="panel-header">═══ SYSTEM ACTIVITY ═══</div>
      <div className="activity-list">
        {metrics && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '0.5rem',
            background: 'var(--mainframe-dark)',
            borderLeft: '3px solid var(--success-green)'
          }}>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--success-green)' }}>
              <strong>SYSTEM STATUS: ONLINE</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--mainframe-border)' }}>
              <div>Bridge: UP</div>
              <div>Database: UP</div>
              {metrics.llm && (
                <div>AI Calls: {metrics.llm.total_calls || 0}</div>
              )}
            </div>
          </div>
        )}
        
        {activities.length === 0 ? (
          <div className="activity-item" style={{ 
            color: 'var(--mainframe-border)', 
            padding: '1rem',
            textAlign: 'center'
          }}>
            Waiting for system activity...
          </div>
        ) : (
          activities.map((activity, idx) => (
            <div 
              key={idx} 
              className="activity-item"
              style={{
                padding: '0.5rem 0.75rem',
                borderLeft: `3px solid ${getActivityColor(activity.type)}`,
                marginBottom: '0.25rem',
                background: 'rgba(0, 255, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: getActivityColor(activity.type), fontWeight: 'bold' }}>
                  {getActivityIcon(activity.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success-green)' }}>
                    {activity.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mainframe-border)', marginTop: '0.25rem' }}>
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
