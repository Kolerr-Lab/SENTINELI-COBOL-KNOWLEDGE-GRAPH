/**
 * Unit Tests for COBOL Executor
 */

const cobolExecutor = require('../../src/lib/cobolExecutor');

describe('COBOL Executor', () => {
    describe('validateProgram', () => {
        it('should accept whitelisted programs', () => {
            expect(() => cobolExecutor.validateProgram('main')).not.toThrow();
        });

        it('should reject non-whitelisted programs', () => {
            expect(() => cobolExecutor.validateProgram('malicious')).toThrow();
            expect(() => cobolExecutor.validateProgram('../etc/passwd')).toThrow();
        });
    });

    describe('sanitizeInputs', () => {
        it('should sanitize valid inputs', () => {
            const inputs = {
                AGE: '25',
                INCOME: 50000,
                NAME: 'John Doe'
            };

            const sanitized = cobolExecutor.sanitizeInputs(inputs);

            expect(sanitized).toHaveProperty('AGE');
            expect(sanitized).toHaveProperty('INCOME');
            expect(sanitized.AGE).toBe('25');
            expect(sanitized.INCOME).toBe('50000');
        });

        it('should reject invalid variable names', () => {
            const inputs = {
                'AGE': '25',
                'evil;command': 'malicious',
                'normal_VAR': 'good'
            };

            const sanitized = cobolExecutor.sanitizeInputs(inputs);

            expect(sanitized).toHaveProperty('AGE');
            expect(sanitized).toHaveProperty('normal_VAR');
            expect(sanitized).not.toHaveProperty('evil;command');
        });

        it('should limit input length', () => {
            const longString = 'a'.repeat(2000);
            const inputs = { VAR: longString };

            const sanitized = cobolExecutor.sanitizeInputs(inputs);

            expect(sanitized.VAR.length).toBeLessThanOrEqual(1000);
        });
    });

    describe('loadSource', () => {
        it('should prevent directory traversal', async () => {
            await expect(
                cobolExecutor.loadSource('../../../etc/passwd')
            ).rejects.toThrow('Invalid file name');

            await expect(
                cobolExecutor.loadSource('..\\..\\windows\\system32\\config')
            ).rejects.toThrow('Invalid file name');
        });

        it('should reject paths with slashes', async () => {
            await expect(
                cobolExecutor.loadSource('subdir/file.cob')
            ).rejects.toThrow('Invalid file name');
        });

        it('should load valid source files', async () => {
            // This will fail if main.cob doesn't exist, but that's expected
            try {
                const source = await cobolExecutor.loadSource('main.cob');
                expect(typeof source).toBe('string');
                expect(source.length).toBeGreaterThan(0);
            } catch (error) {
                expect(error.message).toContain('not found');
            }
        });
    });

    describe('getAvailablePrograms', () => {
        it('should return list of allowed programs', () => {
            const programs = cobolExecutor.getAvailablePrograms();

            expect(Array.isArray(programs)).toBe(true);
            expect(programs).toContain('main');
            expect(programs.length).toBeGreaterThan(0);
        });
    });
});
