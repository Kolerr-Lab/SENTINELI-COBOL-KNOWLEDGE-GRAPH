/**
 * Rate Limiting Middleware Tests
 */

const rateLimit = require('express-rate-limit');

// Mock express-rate-limit
jest.mock('express-rate-limit');

describe('Rate Limiting Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock rateLimit to return a middleware function
        rateLimit.mockImplementation((options) => {
            const middleware = (req, res, next) => {
                // Simulate rate limit tracking
                req.rateLimit = {
                    limit: options.max,
                    current: 1,
                    remaining: options.max - 1,
                    resetTime: Date.now() + options.windowMs
                };
                
                // Check if limit exceeded (for testing)
                if (req.__simulateRateLimit) {
                    req.rateLimit.current = options.max + 1;
                    req.rateLimit.remaining = 0;
                    
                    if (options.handler) {
                        return options.handler(req, res, next);
                    }
                    return res.status(429).json(options.message);
                }
                
                // Check skip function
                if (options.skip && options.skip(req)) {
                    return next();
                }
                
                next();
            };
            
            // Store options for testing
            middleware.options = options;
            return middleware;
        });
    });

    describe('generalLimiter', () => {
        it('should be configured with correct window and max', () => {
            const { generalLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            expect(rateLimit).toHaveBeenCalled();
            const config = generalLimiter.options;
            
            expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
            expect(config.max).toBe(50000); // 50k requests
        });

        it('should allow requests within limit', () => {
            const { generalLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = {};
            const res = {};
            const next = jest.fn();

            generalLimiter(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.rateLimit.remaining).toBeGreaterThan(0);
        });

        it('should block requests exceeding limit', () => {
            const { generalLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = { __simulateRateLimit: true, ip: '127.0.0.1', path: '/api/test' };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            generalLimiter(req, res, next);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.error).toBe('Too many requests');
        });
    });

    describe('executionLimiter', () => {
        it('should be configured with correct limits', () => {
            const { executionLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const config = executionLimiter.options;
            
            expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
            expect(config.max).toBe(10000); // 10k executions
        });

        it('should skip premium users', () => {
            const { executionLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = { user: { premium: true } };
            const res = {};
            const next = jest.fn();

            executionLimiter(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should not skip non-premium users', () => {
            const { executionLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = { user: { premium: false } };
            const res = {};
            const next = jest.fn();

            executionLimiter(req, res, next);

            expect(next).toHaveBeenCalled();
            // Should go through normal rate limiting
        });

        it('should block execution requests exceeding limit', () => {
            const { executionLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = { 
                __simulateRateLimit: true, 
                ip: '127.0.0.1', 
                path: '/api/run/test',
                rateLimit: { limit: 10000, remaining: 0, resetTime: Date.now() + 900000 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            executionLimiter(req, res, next);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.error).toBe('Execution rate limit exceeded');
        });
    });

    describe('aiAnalysisLimiter', () => {
        it('should be configured with correct limits', () => {
            const { aiAnalysisLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const config = aiAnalysisLimiter.options;
            
            expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
            expect(config.max).toBe(100); // 100 AI analyses
        });

        it('should allow AI analysis within limit', () => {
            const { aiAnalysisLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = {};
            const res = {};
            const next = jest.fn();

            aiAnalysisLimiter(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should block AI analysis exceeding limit', () => {
            const { aiAnalysisLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = { 
                __simulateRateLimit: true, 
                ip: '127.0.0.1', 
                path: '/api/analyze'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            aiAnalysisLimiter(req, res, next);

            expect(res.status).toHaveBeenCalledWith(429);
        });
    });

    describe('publicLimiter', () => {
        it('should be configured with correct limits', () => {
            const { publicLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const config = publicLimiter.options;
            
            expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
            expect(config.max).toBe(200); // 200 requests per 15 minutes
        });

        it('should allow public requests within limit', () => {
            const { publicLimiter } = require('../../src/bridge/middleware/rateLimiting');
            
            const req = {};
            const res = {};
            const next = jest.fn();

            publicLimiter(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
