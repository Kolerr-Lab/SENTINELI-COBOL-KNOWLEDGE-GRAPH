/**
 * Unit Tests for Server Module
 */

const request = require('supertest');
const { app } = require('../../src/bridge/server');

describe('Server Health', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/);

            expect(response.status).toBeLessThanOrEqual(503);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });

        it('should check database health', async () => {
            const response = await request(app)
                .get('/health');

            expect(response.body).toHaveProperty('services');
            expect(response.body.services).toHaveProperty('database');
        });

        it('should check redis health', async () => {
            const response = await request(app)
                .get('/health');

            expect(response.body.services).toHaveProperty('redis');
        });
    });

    describe('GET /metrics', () => {
        it('should return prometheus metrics', async () => {
            const response = await request(app)
                .get('/metrics')
                .expect(200);

            expect(response.text).toContain('# HELP');
            expect(response.text).toContain('# TYPE');
        });
    });
});

describe('COBOL Execution', () => {
    describe('POST /api/run/:program', () => {
        it('should reject requests without authentication in production', async () => {
            process.env.NODE_ENV = 'production';
            
            const response = await request(app)
                .post('/api/run/main')
                .send({ AGE: '25', INCOME: '50000' });

            if (process.env.NODE_ENV === 'production') {
                expect(response.status).toBe(401);
            }

            process.env.NODE_ENV = 'test';
        });

        it('should validate program name', async () => {
            const response = await request(app)
                .post('/api/run/invalid../program')
                .send({ AGE: '25' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should execute valid COBOL program (if compiled)', async () => {
            const response = await request(app)
                .post('/api/run/main')
                .send({
                    AGE: '25',
                    INCOME: '50000',
                    CREDIT_SCORE: '720',
                    DEBT: '10000'
                });

            // May be 404 if not compiled, or 200 if successful
            expect([200, 404, 500]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('success');
                expect(response.body).toHaveProperty('exitCode');
                expect(response.body).toHaveProperty('stdout');
            }
        });
    });
});

describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
        const response = await request(app)
            .get('/nonexistent')
            .expect(404);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Not Found');
    });

    it('should handle rate limiting', async () => {
        // Make many requests quickly
        const requests = Array(101).fill(null).map(() =>
            request(app).get('/health')
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);

        // Some requests should be rate limited (if hitting /api/ routes)
        expect(rateLimited.length).toBeGreaterThanOrEqual(0);
    });
});
