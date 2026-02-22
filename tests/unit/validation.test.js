/**
 * Sentineli - Validation Middleware Tests
 * Copyright (c) 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab
 */

const {
    validateProgramName,
    ALLOWED_PROGRAMS
} = require('../../src/bridge/middleware/validation');

describe('Validation Middleware', () => {
    describe('validateProgramName', () => {
        it('should allow whitelisted programs', () => {
            ALLOWED_PROGRAMS.forEach(program => {
                const result = validateProgramName(program);
                expect(result.valid).toBe(true);
            });
        });

        it('should reject non-whitelisted programs', () => {
            const result = validateProgramName('malicious');
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('not in the allowed list');
        });

        it('should reject path traversal attempts', () => {
            const attempts = [
                '../etc/passwd',
                '..\\windows\\system32',
                'main/../../../etc/passwd',
                'main/./shadow'
            ];

            attempts.forEach(attempt => {
                const result = validateProgramName(attempt);
                expect(result.valid).toBe(false);
            });
        });

        it('should reject programs with slashes', () => {
            const result = validateProgramName('bin/main');
            
            expect(result.valid).toBe(false);
        });

        it('should reject programs with backslashes', () => {
            const result = validateProgramName('bin\\main');
            
            expect(result.valid).toBe(false);
        });
    });
});
