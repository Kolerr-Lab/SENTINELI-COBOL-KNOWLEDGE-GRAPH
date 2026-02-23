import React, { useEffect, useState } from 'react';

const ActivityPanel = ({ messages }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Keep only last 20 messages
    const relevant = messages
      .filter(msg => ['analysis', 'impact', 'log', 'status'].includes(msg.type))
      .slice(-20)
      .reverse();
    setActivities(relevant);
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp || Date.now()).toLocaleTimeString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'analysis': return '🔍';
      case 'impact': return '⚡';
      case 'log': return '📝';
      case 'status': return '📊';
      case 'error': return '❌';
      default: return '•';
    }
  };

  return (
    <div className="panel activity-panel">
      <div className="panel-header">═══ LIVE ACTIVITY ═══</div>
      
      <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--modern-blue)' }}>
        Real-time system events streaming...
      </div>

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--mainframe-border)' }}>
          Waiting for activity...
        </div>
      ) : (
        activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-time">
              {getActivityIcon(activity.type)} {formatTimestamp(activity.timestamp)}
            </div>
            <div className="activity-message">
              {activity.message || JSON.stringify(activity).substring(0, 100)}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActivityPanel;
