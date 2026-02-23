import React from 'react';

const Header = ({ connected, bridgeStatus, gatewayStatus }) => {
  const getStatusClass = (status) => {
    if (status === 'UP') return 'active';
    if (status === 'DOWN') return 'error';
    return 'warning';
  };

  return (
    <header className="mainframe-header">
      <div className="header-title">
        ╔═══════════════════════════════════════════════════╗
        <br />
        ║  SENTINELI MAINFRAME CONTROL SYSTEM v1.0         ║
        <br />
        ╚═══════════════════════════════════════════════════╝
      </div>
      
      <div className="header-status">
        <div className="status-indicator">
          <span className={`status-dot ${connected ? 'active' : 'error'}`}></span>
          <span>WEBSOCKET: {connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${getStatusClass(bridgeStatus)}`}></span>
          <span>BRIDGE: {bridgeStatus}</span>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${getStatusClass(gatewayStatus)}`}></span>
          <span>GATEWAY: {gatewayStatus}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
