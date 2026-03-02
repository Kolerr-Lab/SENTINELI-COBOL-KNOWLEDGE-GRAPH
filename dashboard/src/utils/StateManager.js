/**
 * Production-grade persistent state management
 * Handles localStorage persistence, migrations, error recovery
 */

const STATE_VERSION = 1;
const STATE_KEY_PREFIX = 'sentineli_';

class StateManager {
  constructor() {
    this.listeners = new Map();
    this.migrationHandlers = new Map();
  }

  /**
   * Get the full storage key for a state namespace
   */
  getKey(namespace) {
    return `${STATE_KEY_PREFIX}${namespace}`;
  }

  /**
   * Save state to localStorage with error handling
   */
  save(namespace, state, options = {}) {
    const { ttl = null, compress = false } = options;

    try {
      const data = {
        version: STATE_VERSION,
        timestamp: Date.now(),
        ttl,
        state: compress ? this.compress(state) : state
      };

      const serialized = JSON.stringify(data);
      
      // Check localStorage quota
      if (serialized.length > 5 * 1024 * 1024) { // 5MB warning
        console.warn(`[StateManager] Large state detected for ${namespace}: ${(serialized.length / 1024 / 1024).toFixed(2)}MB`);
      }

      localStorage.setItem(this.getKey(namespace), serialized);
      
      // Notify listeners
      this.notifyListeners(namespace, state);
      
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('[StateManager] LocalStorage quota exceeded. Clearing old data...');
        this.clearExpired();
        
        // Retry once after clearing
        try {
          localStorage.setItem(this.getKey(namespace), JSON.stringify({
            version: STATE_VERSION,
            timestamp: Date.now(),
            ttl,
            state
          }));
          return true;
        } catch (retryError) {
          console.error('[StateManager] Failed to save state after clearing:', retryError);
          return false;
        }
      } else {
        console.error(`[StateManager] Error saving state for ${namespace}:`, error);
        return false;
      }
    }
  }

  /**
   * Load state from localStorage with validation
   */
  load(namespace, defaultState = null, options = {}) {
    const { migrate = true, validate = null } = options;

    try {
      const key = this.getKey(namespace);
      const serialized = localStorage.getItem(key);

      if (!serialized) {
        return defaultState;
      }

      const data = JSON.parse(serialized);

      // Check TTL expiration
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        console.log(`[StateManager] State expired for ${namespace}`);
        localStorage.removeItem(key);
        return defaultState;
      }

      // Handle version migrations
      let state = data.state;
      if (migrate && data.version < STATE_VERSION) {
        state = this.migrate(namespace, state, data.version, STATE_VERSION);
      }

      // Validate state structure
      if (validate && !validate(state)) {
        console.warn(`[StateManager] Invalid state structure for ${namespace}, using default`);
        return defaultState;
      }

      return state;
    } catch (error) {
      console.error(`[StateManager] Error loading state for ${namespace}:`, error);
      
      // Attempt to clear corrupted data
      try {
        localStorage.removeItem(this.getKey(namespace));
      } catch (clearError) {
        console.error('[StateManager] Failed to clear corrupted state:', clearError);
      }
      
      return defaultState;
    }
  }

  /**
   * Remove state from localStorage
   */
  remove(namespace) {
    try {
      localStorage.removeItem(this.getKey(namespace));
      this.notifyListeners(namespace, null);
      return true;
    } catch (error) {
      console.error(`[StateManager] Error removing state for ${namespace}:`, error);
      return false;
    }
  }

  /**
   * Clear all SENTINELI state
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STATE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      
      // Notify all listeners
      this.listeners.forEach((callbacks, namespace) => {
        this.notifyListeners(namespace, null);
      });
      
      return true;
    } catch (error) {
      console.error('[StateManager] Error clearing all state:', error);
      return false;
    }
  }

  /**
   * Clear expired state entries
   */
  clearExpired() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(STATE_KEY_PREFIX)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.ttl && now - data.timestamp > data.ttl) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('[StateManager] Error clearing expired state:', error);
    }
  }

  /**
   * Register a migration handler for version upgrades
   */
  registerMigration(namespace, fromVersion, toVersion, handler) {
    const key = `${namespace}_${fromVersion}_${toVersion}`;
    this.migrationHandlers.set(key, handler);
  }

  /**
   * Migrate state from one version to another
   */
  migrate(namespace, state, fromVersion, toVersion) {
    console.log(`[StateManager] Migrating ${namespace} from v${fromVersion} to v${toVersion}`);
    
    let currentState = state;
    for (let v = fromVersion; v < toVersion; v++) {
      const key = `${namespace}_${v}_${v + 1}`;
      const handler = this.migrationHandlers.get(key);
      
      if (handler) {
        currentState = handler(currentState);
      }
    }
    
    return currentState;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(namespace, callback) {
    if (!this.listeners.has(namespace)) {
      this.listeners.set(namespace, new Set());
    }
    
    this.listeners.get(namespace).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(namespace);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners(namespace, state) {
    const callbacks = this.listeners.get(namespace);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('[StateManager] Error in listener callback:', error);
        }
      });
    }
  }

  /**
   * Simple compression for large state objects (optional)
   */
  compress(state) {
    // For now, just return state as-is
    // Could implement LZ-string or similar compression if needed
    return state;
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats() {
    try {
      const keys = Object.keys(localStorage);
      const sentineliKeys = keys.filter(k => k.startsWith(STATE_KEY_PREFIX));
      
      let totalSize = 0;
      const entries = sentineliKeys.map(key => {
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        totalSize += size;
        
        return {
          key: key.replace(STATE_KEY_PREFIX, ''),
          size,
          sizeKB: (size / 1024).toFixed(2)
        };
      });

      return {
        entries,
        totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        count: entries.length
      };
    } catch (error) {
      console.error('[StateManager] Error getting storage stats:', error);
      return null;
    }
  }

  /**
   * Export all state for backup
   */
  exportAll() {
    try {
      const keys = Object.keys(localStorage);
      const state = {};
      
      keys.forEach(key => {
        if (key.startsWith(STATE_KEY_PREFIX)) {
          const namespace = key.replace(STATE_KEY_PREFIX, '');
          state[namespace] = this.load(namespace);
        }
      });
      
      return {
        version: STATE_VERSION,
        timestamp: Date.now(),
        state
      };
    } catch (error) {
      console.error('[StateManager] Error exporting state:', error);
      return null;
    }
  }

  /**
   * Import state from backup
   */
  importAll(backup, options = {}) {
    const { replace = false } = options;
    
    try {
      if (!backup || !backup.state) {
        throw new Error('Invalid backup format');
      }

      if (replace) {
        this.clearAll();
      }

      Object.entries(backup.state).forEach(([namespace, state]) => {
        if (state !== null) {
          this.save(namespace, state);
        }
      });

      return true;
    } catch (error) {
      console.error('[StateManager] Error importing state:', error);
      return false;
    }
  }
}

// Singleton instance
const stateManager = new StateManager();

// Clear expired state on initialization
stateManager.clearExpired();

export default stateManager;
