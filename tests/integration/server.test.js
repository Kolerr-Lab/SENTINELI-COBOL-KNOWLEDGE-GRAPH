/**
 * Sentineli - Server Tests
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const request = require('supertest');
const { generateToken } = require('../../src/bridge/middleware/auth');

// Mock dependencies
jest.mock('../../src/bridge/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    requestLogger: (req, res, next) => next(),
    logCobolExecution: jest.fn(),
    logAiAnalysis: jest.fn()
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3051';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key';
process.env.API_KEYS = 'test-api-key-123,test-api-key-456';

describe('Sentineli API Server', () => {
    let app;
    let validToken;

    beforeAll(() => {
        // Import app after mocks are set up
        app = require('../../src/bridge/server-new');
        
        // Generate valid JWT token for tests
        validToken = generateToken({
            sub: 'test-user-123',
            email: 'test@example.com',
            premium: false
        });
    });

    describe('Public Endpoints', () => {
        describe('GET /', () => {
            it('should return API information', async () => {
                const res = await request(app).get('/');
                
                expect(res.status).toBe(200);
                expect(res.body.service).toContain('Sentineli');
                expect(res.body.version).toBeDefined();
                expect(res.body.author).toContain('Ricky Anh Nguyen');
            });
        });

        describe('GET /health', () => {
            it('should return health status', async () => {
                const res = await request(app).get('/health');
                
                expect(res.status).toBeOneOf([200, 503]);
                expect(res.body.status).toBeDefined();
                expect(res.body.service).toBe('sentineli');
                expect(res.body.uptime).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Authentication', () => {
        describe('POST /api/run/main without auth', () => {
            it('should return 401 unauthorized', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBe(401);
                expect(res.body.error).toContain('Authentication');
            });
        });

        describe('POST /api/run/main with valid JWT', () => {
            it('should accept valid JWT token', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .set('Authorization', `Bearer ${validToken}`)
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                // May fail if COBOL not compiled, but should not be auth error
                expect(res.status).not.toBe(401);
                expect(res.status).not.toBe(403);
            });
        });

        describe('POST /api/run/main with valid API key', () => {
            it('should accept valid API key', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .set('X-API-Key', 'test-api-key-123')
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).not.toBe(401);
                expect(res.status).not.toBe(403);
            });
        });

        describe('POST /api/run/main with invalid token', () => {
            it('should reject invalid JWT token', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .set('Authorization', 'Bearer invalid-token-xyz')
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBeOneOf([401, 403]);
            });
        });
    });

    describe('Input Validation', () => {
        describe('POST /api/run/main with invalid inputs', () => {
            it('should reject missing AGE', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .set('X-API-Key', 'test-api-key-123')
                    .send({
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBe(400);
                expect(res.body.error).toContain('Validation');
            });

            it('should reject invalid AGE format', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .set('X-API-Key', 'test-api-key-123')
                    .send({
                        AGE: 'twenty-five', // Should be numeric string
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBe(400);
            });

            it('should reject missing CREDIT_SCORE', async () => {
                const res = await request(app)
                    .post('/api/run/main')
                    .set('X-API-Key', 'test-api-key-123')
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBe(400);
            });
        });
    });

    describe('Program Whitelist', () => {
        describe('POST /api/run/unauthorized-program', () => {
            it('should reject unauthorized programs', async () => {
                const res = await request(app)
                    .post('/api/run/malicious')
                    .set('X-API-Key', 'test-api-key-123')
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBe(403);
                expect(res.body.error).toContain('Unauthorized');
            });
        });

        describe('POST /api/run/../etc/passwd', () => {
            it('should reject path traversal attempts', async () => {
                const res = await request(app)
                    .post('/api/run/../etc/passwd')
                    .set('X-API-Key', 'test-api-key-123')
                    .send({
                        AGE: '25',
                        INCOME: '50000',
                        CREDIT_SCORE: '720',
                        DEBT: '10000'
                    });
                
                expect(res.status).toBe(403);
            });
        });
    });

    describe('404 Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/nonexistent-route');
            
            expect(res.status).toBe(404);
            expect(res.body.error).toBeDefined();
        });
    });
});

// Custom matcher for status codes
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        return {
            pass,
            message: () =>
                pass
                    ? `expected ${received} not to be one of ${expected.join(', ')}`
                    : `expected ${received} to be one of ${expected.join(', ')}`
        };
    }
});
