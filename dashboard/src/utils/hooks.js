/**
 * React hooks for persistent state management
 * Integrates with StateManager for automatic localStorage persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import stateManager from './StateManager';

/**
 * Hook for persistent state that automatically saves to localStorage
 * Similar to useState but persists across sessions
 * 
 * @param {string} namespace - Unique key for this state
 * @param {*} defaultValue - Default value if no saved state exists
 * @param {object} options - Configuration options
 * @returns {[*, function]} - [state, setState] tuple like useState
 */
export function usePersistedState(namespace, defaultValue, options = {}) {
  const {
    ttl = null,              // Time to live in milliseconds
    validate = null,         // Validation function for loaded state
    serialize = true,        // Auto-serialize/deserialize
    debounce = 0,           // Debounce save operations (ms)
    onSaveError = null      // Error handler for save failures
  } = options;

  // Load initial state from localStorage
  const [state, setState] = useState(() => {
    return stateManager.load(namespace, defaultValue, { validate });
  });

  // Debounce timer ref
  const saveTimerRef = useRef(null);
  const pendingStateRef = useRef(null);

  // Save state to localStorage
  const saveState = useCallback((newState) => {
    if (debounce > 0) {
      // Store pending state
      pendingStateRef.current = newState;

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Set new timer
      saveTimerRef.current = setTimeout(() => {
        const success = stateManager.save(namespace, pendingStateRef.current, { ttl });
        if (!success && onSaveError) {
          onSaveError(new Error('Failed to save state'));
        }
        saveTimerRef.current = null;
        pendingStateRef.current = null;
      }, debounce);
    } else {
      // Save immediately
      const success = stateManager.save(namespace, newState, { ttl });
      if (!success && onSaveError) {
        onSaveError(new Error('Failed to save state'));
      }
    }
  }, [namespace, ttl, debounce, onSaveError]);

  // Update state and persist
  const updateState = useCallback((newStateOrUpdater) => {
    setState(prevState => {
      const newState = typeof newStateOrUpdater === 'function' 
        ? newStateOrUpdater(prevState) 
        : newStateOrUpdater;
      
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Subscribe to changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === stateManager.getKey(namespace)) {
        if (e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            setState(data.state);
          } catch (error) {
            console.error('[usePersistedState] Error parsing storage event:', error);
          }
        } else {
          setState(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [namespace, defaultValue]);

  // Cleanup debounced saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // Flush pending state
        if (pendingStateRef.current !== null) {
          stateManager.save(namespace, pendingStateRef.current, { ttl });
        }
      }
    };
  }, [namespace, ttl]);

  return [state, updateState];
}

/**
 * Hook for session-only state (clears on browser close)
 * Uses sessionStorage instead of localStorage
 * 
 * @param {string} namespace - Unique key for this state
 * @param {*} defaultValue - Default value if no saved state exists
 * @returns {[*, function]} - [state, setState] tuple
 */
export function useSessionState(namespace, defaultValue) {
  const key = `sentineli_session_${namespace}`;

  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error('[useSessionState] Error loading state:', error);
      return defaultValue;
    }
  });

  const updateState = useCallback((newStateOrUpdater) => {
    setState(prevState => {
      const newState = typeof newStateOrUpdater === 'function' 
        ? newStateOrUpdater(prevState) 
        : newStateOrUpdater;
      
      try {
        sessionStorage.setItem(key, JSON.stringify(newState));
      } catch (error) {
        console.error('[useSessionState] Error saving state:', error);
      }
      
      return newState;
    });
  }, [key]);

  return [state, updateState];
}

/**
 * Hook for cached data with TTL
 * Useful for API responses that can be cached temporarily
 * 
 * @param {string} namespace - Unique key for this cache
 * @param {number} ttl - Time to live in milliseconds
 * @returns {object} - Cache operations
 */
export function useCache(namespace, ttl = 5 * 60 * 1000) { // Default 5 minutes
  const get = useCallback(() => {
    return stateManager.load(namespace, null, { ttl });
  }, [namespace]);

  const set = useCallback((data) => {
    return stateManager.save(namespace, data, { ttl });
  }, [namespace, ttl]);

  const clear = useCallback(() => {
    return stateManager.remove(namespace);
  }, [namespace]);

  const has = useCallback(() => {
    return stateManager.load(namespace, null, { ttl }) !== null;
  }, [namespace]);

  return { get, set, clear, has };
}

/**
 * Hook for array-based state with common operations
 * Automatically persists array changes
 * 
 * @param {string} namespace - Unique key for this state
 * @param {array} defaultValue - Default array value
 * @param {object} options - Configuration options
 * @returns {object} - Array state and operations
 */
export function usePersistedArray(namespace, defaultValue = [], options = {}) {
  const [array, setArray] = usePersistedState(namespace, defaultValue, options);

  const push = useCallback((item) => {
    setArray(prev => [...prev, item]);
  }, [setArray]);

  const remove = useCallback((indexOrPredicate) => {
    setArray(prev => {
      if (typeof indexOrPredicate === 'number') {
        return prev.filter((_, i) => i !== indexOrPredicate);
      } else if (typeof indexOrPredicate === 'function') {
        return prev.filter((item, i) => !indexOrPredicate(item, i));
      }
      return prev;
    });
  }, [setArray]);

  const update = useCallback((index, updater) => {
    setArray(prev => prev.map((item, i) => {
      if (i === index) {
        return typeof updater === 'function' ? updater(item) : updater;
      }
      return item;
    }));
  }, [setArray]);

  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const insertAt = useCallback((index, item) => {
    setArray(prev => [
      ...prev.slice(0, index),
      item,
      ...prev.slice(index)
    ]);
  }, [setArray]);

  return {
    array,
    setArray,
    push,
    remove,
    update,
    clear,
    insertAt,
    length: array.length
  };
}

/**
 * Hook for object-based state with common operations
 * Automatically persists object changes
 * 
 * @param {string} namespace - Unique key for this state
 * @param {object} defaultValue - Default object value
 * @param {object} options - Configuration options
 * @returns {object} - Object state and operations
 */
export function usePersistedObject(namespace, defaultValue = {}, options = {}) {
  const [obj, setObj] = usePersistedState(namespace, defaultValue, options);

  const set = useCallback((key, value) => {
    setObj(prev => ({ ...prev, [key]: value }));
  }, [setObj]);

  const merge = useCallback((updates) => {
    setObj(prev => ({ ...prev, ...updates }));
  }, [setObj]);

  const remove = useCallback((key) => {
    setObj(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [setObj]);

  const clear = useCallback(() => {
    setObj({});
  }, [setObj]);

  const has = useCallback((key) => {
    return key in obj;
  }, [obj]);

  return {
    obj,
    setObj,
    set,
    merge,
    remove,
    clear,
    has,
    keys: Object.keys(obj),
    values: Object.values(obj),
    entries: Object.entries(obj)
  };
}

/**
 * Hook for loading state with automatic persistence
 * Tracks loading, error, and data states
 * 
 * @param {string} namespace - Unique key for this state
 * @param {object} options - Configuration options
 * @returns {object} - Async state and operations
 */
export function usePersistedAsync(namespace, options = {}) {
  const { ttl = null } = options;

  const [state, setState] = usePersistedState(namespace, {
    loading: false,
    error: null,
    data: null
  }, { ttl });

  const setLoading = useCallback((loading) => {
    setState(prev => ({ ...prev, loading }));
  }, [setState]);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, [setState]);

  const setData = useCallback((data) => {
    setState(prev => ({ ...prev, data, error: null, loading: false }));
  }, [setState]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, [setState]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset
  };
}

/**
 * Hook for feature flags and user preferences
 * Persists user settings across sessions
 * 
 * @param {string} feature - Feature name
 * @param {boolean} defaultValue - Default enabled state
 * @returns {[boolean, function]} - [isEnabled, toggle] tuple
 */
export function useFeatureFlag(feature, defaultValue = false) {
  const [flags, setFlags] = usePersistedState('feature_flags', {});

  const isEnabled = flags[feature] ?? defaultValue;

  const toggle = useCallback(() => {
    setFlags(prev => ({
      ...prev,
      [feature]: !(prev[feature] ?? defaultValue)
    }));
  }, [feature, defaultValue, setFlags]);

  const setEnabled = useCallback((enabled) => {
    setFlags(prev => ({
      ...prev,
      [feature]: enabled
    }));
  }, [feature, setFlags]);

  return [isEnabled, toggle, setEnabled];
}

export default {
  usePersistedState,
  useSessionState,
  useCache,
  usePersistedArray,
  usePersistedObject,
  usePersistedAsync,
  useFeatureFlag
};
