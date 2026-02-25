import React from 'react';

const ActivityPanel = () => {
  return (
    <div className="activity-panel">
      <div className="panel-header">═══ SYSTEM ACTIVITY ═══</div>
      <div className="activity-list">
        <div className="activity-item" style={{ color: 'var(--mainframe-border)', padding: '1rem' }}>
          Real-time activity logging disabled. Check Metrics view for system status.
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
