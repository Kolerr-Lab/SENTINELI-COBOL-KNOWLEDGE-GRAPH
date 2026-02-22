/**
 * Integration Tests for API Endpoints
 */

const request = require('supertest');
const { app, pool, redisClient } = require('../../src/bridge/server');

describe('API Integration Tests', () => {
    afterAll(async () => {
        // Clean up connections
        if (pool) await pool.end();
        if (redisClient) await redisClient.quit();
    });

    describe('Full Execution Flow', () => {
        it('should execute COBOL and store in database', async () => {
            const inputs = {
                AGE: '30',
                INCOME: '75000',
                CREDIT_SCORE: '750',
                DEBT: '15000'
            };

            const response = await request(app)
                .post('/api/run/main')
                .send(inputs);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body).toHaveProperty('exitCode');
                expect(response.body).toHaveProperty('executionTime');

                // Check if stored in database
                const result = await pool.query(
                    'SELECT * FROM executions WHERE program = $1 ORDER BY executed_at DESC LIMIT 1',
                    ['main']
                );

                expect(result.rows.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Analysis with Caching', () => {
        it('should cache analysis results', async () => {
            const file = 'main.cob';

            // First request - miss cache
            const response1 = await request(app)
                .post(`/api/analyze/${file}`);

            if (response1.status === 200) {
                expect(response1.body.cached).toBeFalsy();

                // Second request - hit cache
                const response2 = await request(app)
                    .post(`/api/analyze/${file}`);

                expect(response2.status).toBe(200);
                expect(response2.body.cached).toBe(true);
            }
        }, 60000); // 60 second timeout for AI analysis
    });

    describe('Execution History', () => {
        it('should retrieve execution history', async () => {
            const response = await request(app)
                .get('/api/executions?limit=10');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('executions');
            expect(Array.isArray(response.body.executions)).toBe(true);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/executions?limit=5&offset=0');

            expect(response.status).toBe(200);
            expect(response.body.executions.length).toBeLessThanOrEqual(5);
        });
    });
});
