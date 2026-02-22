/**
 * Sentineli - Authentication Middleware Tests
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const {
    generateToken,
    verifyToken,
    authenticateToken,
    authenticateApiKey
} = require('../../src/bridge/middleware/auth');

describe('Authentication Middleware', () => {
    const testPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        premium: false
    };

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.API_KEYS = 'key1,key2,key3';
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const token = generateToken(testPayload);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should include payload in token', () => {
            const token = generateToken(testPayload);
            const decoded = verifyToken(token);
            
            expect(decoded.sub).toBe(testPayload.sub);
            expect(decoded.email).toBe(testPayload.email);
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token', () => {
            const token = generateToken(testPayload);
            const decoded = verifyToken(token);
            
            expect(decoded).not.toBeNull();
            expect(decoded.sub).toBe(testPayload.sub);
        });

        it('should reject invalid token', () => {
            const decoded = verifyToken('invalid.token.here');
            
            expect(decoded).toBeNull();
        });

        it('should reject malformed token', () => {
            const decoded = verifyToken('not-even-a-jwt');
            
            expect(decoded).toBeNull();
        });
    });

    describe('authenticateToken middleware', () => {
        it('should accept valid Bearer token', () => {
            const token = generateToken(testPayload);
            const req = {
                headers: { authorization: `Bearer ${token}` },
                ip: '127.0.0.1',
                path: '/test'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            authenticateToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.sub).toBe(testPayload.sub);
        });

        it('should reject request without token', () => {
            const req = {
                headers: {},
                ip: '127.0.0.1',
                path: '/test'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject invalid token', () => {
            const req = {
                headers: { authorization: 'Bearer invalid-token' },
                ip: '127.0.0.1',
                path: '/test'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('authenticateApiKey middleware', () => {
        it('should accept valid API key', () => {
            const req = {
                headers: { 'x-api-key': 'key1' },
                ip: '127.0.0.1',
                path: '/test'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            authenticateApiKey(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.apiKey).toBe('key1');
        });

        it('should reject invalid API key', () => {
            const req = {
                headers: { 'x-api-key': 'invalid-key' },
                ip: '127.0.0.1',
                path: '/test'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            authenticateApiKey(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request without API key', () => {
            const req = {
                headers: {},
                ip: '127.0.0.1',
                path: '/test'
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            authenticateApiKey(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
