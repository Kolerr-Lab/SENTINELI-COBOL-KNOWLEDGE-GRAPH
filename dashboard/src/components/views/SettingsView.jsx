import React, { useState, useEffect } from 'react';
import stateManager from '../../utils/StateManager';
import { getApiKey, clearApiKey } from '../../utils/security';

const SettingsView = () => {
  const [storageStats, setStorageStats] = useState(null);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [exportData, setExportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error' | 'info'

  // Load storage stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const stats = stateManager.getStorageStats();
    setStorageStats(stats);
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleClearNamespace = () => {
    if (!selectedNamespace) {
      showMessage('Please select a namespace to clear', 'error');
      return;
    }

    if (confirm(`Are you sure you want to clear "${selectedNamespace}"? This action cannot be undone.`)) {
      const success = stateManager.remove(selectedNamespace);
      if (success) {
        showMessage(`Successfully cleared "${selectedNamespace}"`, 'success');
        loadStats();
        setSelectedNamespace('');
      } else {
        showMessage('Failed to clear namespace', 'error');
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL persistent state? This will reset the entire application. This action cannot be undone.')) {
      const success = stateManager.clearAll();
      if (success) {
        showMessage('Successfully cleared all persistent state', 'success');
        loadStats();
        
        // Also clear API key
        clearApiKey();
        
        // Reload page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showMessage('Failed to clear all state', 'error');
      }
    }
  };

  const handleClearExpired = () => {
    stateManager.clearExpired();
    showMessage('Cleared all expired state entries', 'success');
    loadStats();
  };

  const handleExport = () => {
    const data = stateManager.exportAll();
    if (data) {
      setExportData(data);
      showMessage('State exported successfully. Copy the JSON below or download the file.', 'success');
    } else {
      showMessage('Failed to export state', 'error');
    }
  };

  const handleDownloadExport = () => {
    if (!exportData) return;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentineli-state-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('Backup file downloaded', 'success');
  };

  const handleImport = () => {
    if (!importFile) {
      showMessage('Please select a file to import', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (confirm('This will replace all current state with the imported data. Continue?')) {
          const success = stateManager.importAll(data, { replace: true });
          if (success) {
            showMessage('State imported successfully. Reloading...', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            showMessage('Failed to import state', 'error');
          }
        }
      } catch (error) {
        showMessage(`Invalid backup file: ${error.message}`, 'error');
      }
    };
    reader.readAsText(importFile);
  };

  const handleClearAPIKey = () => {
    if (confirm('Clear API key from session storage?')) {
      clearApiKey();
      showMessage('API key cleared', 'success');
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>⚙️ SYSTEM SETTINGS</h2>
        <div className="view-subtitle">Manage persistent state and application preferences</div>
      </div>

      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      {/* Storage Statistics */}
      <div className="settings-section">
        <h3>📊 Storage Statistics</h3>
        {storageStats ? (
          <div className="storage-stats">
            <div className="stat-item">
              <span className="stat-label">Total Size:</span>
              <span className="stat-value">{storageStats.totalSizeKB} KB ({storageStats.totalSizeMB} MB)</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Entries:</span>
              <span className="stat-value">{storageStats.count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">API Key Status:</span>
              <span className="stat-value">{getApiKey() ? '✅ Set' : '❌ Not Set'}</span>
            </div>

            <div className="storage-entries">
              <h4>State Namespaces:</h4>
              <ul>
                {storageStats.entries.map(entry => (
                  <li key={entry.key}>
                    <span className="entry-key">{entry.key}</span>
                    <span className="entry-size">{entry.sizeKB} KB</span>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={loadStats} className="submit-button" style={{ marginTop: '1rem' }}>
              🔄 Refresh Stats
            </button>
          </div>
        ) : (
          <div>Loading storage statistics...</div>
        )}
      </div>

      {/* Clear State */}
      <div className="settings-section">
        <h3>🗑️ Clear State</h3>
        
        <div className="form-group">
          <label>Clear Specific Namespace:</label>
          <select 
            value={selectedNamespace} 
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="form-select"
          >
            <option value="">-- Select Namespace --</option>
            {storageStats?.entries.map(entry => (
              <option key={entry.key} value={entry.key}>{entry.key}</option>
            ))}
          </select>
          <button 
            onClick={handleClearNamespace}
            disabled={!selectedNamespace}
            className="submit-button"
            style={{ marginTop: '0.5rem' }}
          >
            Clear Selected
          </button>
        </div>

        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button onClick={handleClearExpired} className="submit-button">
            🧹 Clear Expired
          </button>
          <button onClick={handleClearAPIKey} className="submit-button">
            🔑 Clear API Key
          </button>
          <button 
            onClick={handleClearAll} 
            className="submit-button danger-button"
          >
            ⚠️ Clear All State
          </button>
        </div>
      </div>

      {/* Export State */}
      <div className="settings-section">
        <h3>💾 Export State Backup</h3>
        <p>Export all persistent state for backup or migration purposes.</p>
        
        <button onClick={handleExport} className="submit-button">
          📤 Export State
        </button>

        {exportData && (
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleDownloadExport} className="submit-button">
              ⬇️ Download Backup File
            </button>
            <div className="code-display" style={{ marginTop: '1rem', maxHeight: '300px', overflow: 'auto' }}>
              <pre>{JSON.stringify(exportData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Import State */}
      <div className="settings-section">
        <h3>📥 Import State Backup</h3>
        <p style={{ color: 'var(--warning-amber)' }}>
          ⚠️ Warning: Importing will replace all current state. Make sure to export current state first!
        </p>
        
        <div className="form-group">
          <label>Select Backup File:</label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files[0])}
            style={{ marginTop: '0.5rem' }}
          />
        </div>

        <button 
          onClick={handleImport}
          disabled={!importFile}
          className="submit-button"
          style={{ marginTop: '0.5rem' }}
        >
          📥 Import & Restore
        </button>
      </div>

      {/* Information */}
      <div className="settings-section">
        <h3>ℹ️ About Persistent State</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Active View:</strong> Remembers which tab you were viewing</li>
          <li><strong>Form Inputs:</strong> All code inputs and settings are saved as you type</li>
          <li><strong>Results Cache:</strong> API responses cached for 1 hour to reduce API calls</li>
          <li><strong>Graph Data:</strong> Knowledge graph and loaded modules cached for 24 hours</li>
          <li><strong>Auto-save:</strong> Changes are saved automatically with 500ms debounce</li>
          <li><strong>Cross-tab Sync:</strong> State updates sync across browser tabs</li>
          <li><strong>TTL Expiration:</strong> Old data automatically expires based on TTL settings</li>
          <li><strong>Storage Limit:</strong> LocalStorage has ~5-10MB limit per domain</li>
        </ul>

        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--mainframe-panel)', borderRadius: '4px' }}>
          <strong>Best Practices:</strong>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Export state backups regularly if you have important data</li>
            <li>Clear expired state periodically to free up space</li>
            <li>Use "Clear All State" if you experience any state-related issues</li>
            <li>Private browsing mode will not persist state beyond the session</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
