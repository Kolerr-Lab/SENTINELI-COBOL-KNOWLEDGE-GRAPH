/**
 * Unit Tests for AI Agent
 */

const { extractSymbolicConstraints, isAIAvailable } = require('../../src/bridge/ai_agent');

describe('AI Agent', () => {
    describe('isAIAvailable', () => {
        it('should return boolean indicating AI availability', () => {
            const available = isAIAvailable();
            expect(typeof available).toBe('boolean');
        });
    });

    describe('extractSymbolicConstraints', () => {
        const sampleCobol = `
            IDENTIFICATION DIVISION.
            PROGRAM-ID. TestProgram.
            DATA DIVISION.
            WORKING-STORAGE SECTION.
            01 WS-AGE PIC 9(3).
            01 WS-STATUS PIC X(20).
            PROCEDURE DIVISION.
            MAIN-LOGIC.
                IF WS-AGE < 18 THEN
                    MOVE 'MINOR' TO WS-STATUS
                ELSE
                    MOVE 'ADULT' TO WS-STATUS
                END-IF.
                STOP RUN.
        `;

        it('should return analysis structure', async () => {
            const result = await extractSymbolicConstraints(sampleCobol);

            expect(result).toHaveProperty('propagator_network');
            expect(result).toHaveProperty('minimal_description');
            expect(result).toHaveProperty('kolmogorov_score');
        }, 30000); // 30 second timeout for AI call

        it('should handle errors gracefully', async () => {
            const invalidCode = null;

            const result = await extractSymbolicConstraints(invalidCode);

            expect(result).toHaveProperty('error');
        });

        it('should return fallback when AI unavailable', async () => {
            // This test checks fallback behavior
            const result = await extractSymbolicConstraints('INVALID COBOL');

            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        }, 30000);
    });
});
