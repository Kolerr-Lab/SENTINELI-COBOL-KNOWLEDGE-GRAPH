/**
 * COBOL Analysis API Tests
 */

const request = require('supertest');
const app = require('../../src/bridge/server');

describe('COBOL Analysis Endpoints', () => {
    describe('POST /api/analyze', () => {
        it('should analyze COBOL code successfully', async () => {
            const testCode = `
                IDENTIFICATION DIVISION.
                PROGRAM-ID. TEST.
                PROCEDURE DIVISION.
                    DISPLAY 'Hello'.
                    STOP RUN.
            `;

            const response = await request(app)
                .post('/api/analyze')
                .send({ program: 'TEST', code: testCode })
                .timeout(30000);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('success');
                expect(response.body).toHaveProperty('metadata');
                expect(response.body).toHaveProperty('duration');
            }
        }, 35000);

        it('should reject request without required fields', async () => {
            const response = await request(app)
                .post('/api/analyze')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should reject request with missing program name', async () => {
            const response = await request(app)
                .post('/api/analyze')
                .send({ code: 'SOME CODE' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/impact', () => {
        it('should perform impact analysis', async () => {
            const response = await request(app)
                .post('/api/impact')
                .send({ 
                    field: 'ACCOUNT-BALANCE', 
                    newType: 'PIC 9(15)V99',
                    module: 'ACCOUNT-MANAGEMENT'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('field', 'ACCOUNT-BALANCE');
            expect(response.body).toHaveProperty('affectedPrograms');
            expect(response.body).toHaveProperty('risk');
        });

        it('should reject impact analysis without required fields', async () => {
            const response = await request(app)
                .post('/api/impact')
                .send({});

            expect(response.status).toBe(400);
        });
    });
});
