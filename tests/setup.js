/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent'; // Suppress logs during tests

// Mock logger to avoid console spam
jest.mock('../src/bridge/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    requestLogger: (req, res, next) => next(),
    logCobolExecution: jest.fn(),
    logAiAnalysis: jest.fn(),
    logSecurityEvent: jest.fn()
}));

// Increase timeout for integration tests
jest.setTimeout(10000);
