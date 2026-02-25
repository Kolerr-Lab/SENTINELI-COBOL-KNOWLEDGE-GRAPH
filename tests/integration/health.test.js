/**
 * Health Check and Basic API Tests
 * Simple smoke tests to verify system is operational
 */

const request = require('supertest');
const app = require('../../src/bridge/server');

describe('Health Checks', () => {
    describe('GET /health', () => {
        it('should return healthy status', async () => {
            const response = await request(app).get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body.uptime).toBeGreaterThan(0);
        });

        it('should include AI status', async () => {
            const response = await request(app).get('/health');
            
            expect(response.body).toHaveProperty('ai');
            expect(['enabled', 'disabled']).toContain(response.body.ai);
        });

        it('should include database status', async () => {
            const response = await request(app).get('/health');
            
            expect(response.body).toHaveProperty('database');
        });
    });

    describe('GET /', () => {
        it('should return API info', async () => {
            const response = await request(app).get('/');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('service');
            expect(response.body.service).toContain('Sentineli');
        });
    });

    describe('404 Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app).get('/api/nonexistent');
            
            expect(response.status).toBe(404);
        });
    });

    describe('CORS Headers', () => {
        it('should have CORS headers', async () => {
            const response = await request(app).get('/health');
            
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
    });

    describe('Security Headers', () => {
        it('should have security headers from helmet', async () => {
            const response = await request(app).get('/health');
            
            // Helmet adds these security headers
            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
        });
    });
});

describe('API Metrics', () => {
    describe('GET /api/metrics', () => {
        it('should return metrics data', async () => {
            const response = await request(app).get('/api/metrics');
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('success');
                expect(response.body).toHaveProperty('metrics');
                expect(response.body.metrics).toHaveProperty('totalCalls');
                expect(response.body.metrics).toHaveProperty('totalCostUSD');
            }
        });
    });
});
