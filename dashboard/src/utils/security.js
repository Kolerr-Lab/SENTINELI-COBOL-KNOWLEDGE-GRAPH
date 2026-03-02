/**
 * Security Utilities for Sentineli Dashboard
 * Handles authentication, input sanitization, and secure API communication
 */

// API Base URL - configurable for different environments
const API_BASE = import.meta.env.VITE_API_BASE || '';

// API Key management - stored securely in session storage (not localStorage for better security)
const API_KEY_STORAGE_KEY = 'sentineli_api_key';

/**
 * Get stored API key
 */
export const getApiKey = () => {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY) || 
         import.meta.env.VITE_API_KEY || 
         'demo-api-key-sentineli-2026';
};

/**
 * Store API key securely
 */
export const setApiKey = (key) => {
  if (!key) throw new Error('API key cannot be empty');
  sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
};

/**
 * Clear API key
 */
export const clearApiKey = () => {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
};

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Validate and sanitize file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return '';
  // Allow alphanumeric, dots, hyphens, underscores
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Secure fetch wrapper with authentication and error handling
 */
export const secureFetch = async (endpoint, options = {}) => {
  const apiKey = getApiKey();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...options.headers
  };
  
  const config = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      throw new Error(`Rate limit exceeded. Please retry after ${retryAfter} seconds.`);
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your API key.');
    }
    
    // Handle forbidden
    if (response.status === 403) {
      throw new Error('Access forbidden. You do not have permission for this action.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check if the API server is running.');
    }
    throw error;
  }
};

/**
 * Validate COBOL code input
 * Basic validation to prevent malicious input
 */
export const validateCode = (code) => {
  if (!code || typeof code !== 'string') {
    throw new Error('Code must be a non-empty string');
  }
  
  if (code.length > 1000000) { // 1MB limit
    throw new Error('Code exceeds maximum size of 1MB');
  }
  
  return true;
};

/**
 * Validate program name
 */
export const validateProgramName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Program name must be a non-empty string');
  }
  
  if (name.length > 255) {
    throw new Error('Program name exceeds maximum length of 255 characters');
  }
  
  // Basic pattern - alphanumeric, dots, hyphens, underscores
  const pattern = /^[a-zA-Z0-9._-]+$/;
  if (!pattern.test(name)) {
    throw new Error('Program name contains invalid characters. Use only letters, numbers, dots, hyphens, and underscores.');
  }
  
  return true;
};

/**
 * Escape HTML for safe display
 */
export const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

/**
 * Rate limit tracker for client-side throttling
 */
class RateLimitTracker {
  constructor() {
    this.requests = new Map();
  }
  
  canMakeRequest(endpoint, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Filter out requests outside the time window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = Math.ceil((windowMs - (now - oldestRequest)) / 1000);
      throw new Error(`Rate limit: Please wait ${waitTime} seconds before trying again.`);
    }
    
    recentRequests.push(now);
    this.requests.set(endpoint, recentRequests);
    return true;
  }
  
  reset(endpoint) {
    this.requests.delete(endpoint);
  }
}

export const rateLimiter = new RateLimitTracker();

/**
 * Content Security Policy helper
 */
export const getCSPDirectives = () => {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"], // Note: Remove unsafe-inline in production
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'http://localhost:3050', 'ws://localhost:*'],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  };
};

export default {
  getApiKey,
  setApiKey,
  clearApiKey,
  sanitizeInput,
  sanitizeFileName,
  secureFetch,
  validateCode,
  validateProgramName,
  escapeHtml,
  safeJsonParse,
  rateLimiter
};
